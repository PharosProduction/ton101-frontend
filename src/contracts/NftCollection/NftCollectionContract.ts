import {
    Address,
    beginCell,
    Builder,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    DictionaryValue,
    Sender,
    SendMode, Slice, toNano
} from '@ton/core';
import {MintParams, NftCollectionConfig, NftCollectionData} from './NftCollectionTypes';
import { NftCollectionOpCodes } from './NftCollectionOpCodes';
import { decodeOffChainContent, encodeOffChainContent, toOffChainTextCell } from '../utils/offchainEncoding';

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    // const commonContent = beginCell();
    // commonContent.storeBuffer(Buffer.from(config.content.commonContent));
    // const commonContentCell = commonContent.asCell();

    // if (isOffchain) {
    const collectionContentCell = encodeOffChainContent(config.content.collectionContent)
    const commonContentCell = toOffChainTextCell(config.content.commonContent)

    const contentCell = beginCell()
        .storeUint(1, 8)
        .storeRef(collectionContentCell)
        .storeRef(commonContentCell)
        .endCell();
    // } else {
    //   const collectionContentCell = buildCollectionContentCell(config.content.collectionContent as OnchainCollectionContent);
    //   const commonContentCell = buildCollectionContentCell(config.content.collectionContent as OnchainCollectionContent);
    //
    //   contentCell = beginCell()
    //     .storeUint(0, 8)
    //     .storeRef(collectionContentCell)
    //     .storeRef(commonContentCell)
    //     .endCell();
    // }

    const royaltyParamsCell = beginCell()
        .storeUint(config.royaltyParams.royaltyFactor, 16)
        .storeUint(config.royaltyParams.royaltyBase, 16)
        .storeAddress(config.royaltyParams.royaltyAddress)
        .endCell();

    return beginCell()
        .storeAddress(config.ownerAddress)
        .storeUint(config.nextItemIndex, 64)
        .storeRef(contentCell)
        .storeRef(config.nftItemCode)
        .storeRef(royaltyParamsCell)
        .endCell();
}

export function createMintBody(queryId: number, nftBalance: number, nftContent: string): Cell {
    const body = beginCell();
    body.storeUint(NftCollectionOpCodes.deployNft, 32);
    body.storeUint(BigInt(queryId), 64);
    body.storeCoins(toNano(nftBalance.toString()));
    body.storeRef(encodeOffChainContent(nftContent));

    return body.endCell();
}

class CollectionMintNftItemInputDictionaryValue implements DictionaryValue<MintParams> {
    serialize(src: MintParams, cell: Builder): void {
        cell.storeCoins(src.nftBalance);
        cell.storeRef(encodeOffChainContent(src.nftContent!)); // TODO: onchain
    }

    parse(cell: Slice): MintParams {
        const queryId = cell.loadUint(64);
        const amount = cell.loadCoins();

        // const content = cell.loadRef().beginParse(); //decodeOffChainContent(nftItemContent.loadRef())!;
        // const aaa = content.loadStringTail();
        // console.log("aaa:", aaa);
        // const bbb = content.loadStringTail();
        // console.log("bbb:", aaa);
        // const ccc = content.loadStringTail();
        // console.log("ccc:", aaa);
        // const ddd = content.loadStringTail();
        // console.log("ddd:", aaa);

        // const onChainContent: OnchainNftContent = {
        //   name: "a",
        //   description: "b",
        //   attributes: [],
        //   image: "c",
        //   video: "d",
        //   animation_url: "d",
        //   rank: "72",
        //   tier: "platinum",
        //   blockchain: "ton",
        //   wallet: itemOwnerAddress,
        //   version: "1.0.0"
        // };

        return {
            queryId,
            nftBalance: amount,
            nftContent: "eee"
        }
    }
}

export class NftCollectionContract implements Contract {

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);

        return new NftCollectionContract(address, init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint): Promise<void> {
        return await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    async sendRoyaltyParams(provider: ContractProvider, via: Sender, value: bigint): Promise<void> {
        const body = beginCell()
            .storeUint(NftCollectionOpCodes.getRoyaltyParams, 32)
            .storeUint(100, 64) // queryid
            .endCell();

        return await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendDeployNft(provider: ContractProvider, via: Sender, content: string, queryId: number): Promise<void> {
        const value = 0.05;
        const sendMode = SendMode.PAY_GAS_SEPARATELY;
        const body = createMintBody(queryId, 0.05, content);
        const args = {value: toNano(value), sendMode, body};

        return provider.internal(via, args);
    }

    async sendBatchDeployNft(provider: ContractProvider, via: Sender, value: bigint, mintParams: MintParams[]): Promise<void> {
        const contentDict = Dictionary.empty<number, MintParams>(Dictionary.Keys.Uint(64), new CollectionMintNftItemInputDictionaryValue());

        mintParams.forEach((mintParam, idx) => {
            contentDict.set(idx, mintParam);
        });

        const dictCell = beginCell()
            .storeDictDirect(contentDict)
            .endCell();

        const body = beginCell()
            .storeUint(NftCollectionOpCodes.batchDeployNft, 32)
            .storeUint(100, 64) // queryid
            .storeRef(dictCell)
            .endCell();

        return await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendChangeOwner(provider: ContractProvider, via: Sender, value: bigint, newOwner: Address): Promise<void> {
        const body = beginCell()
            .storeUint(NftCollectionOpCodes.changeOwner, 32)
            .storeUint(100, 64) // queryid
            .storeAddress(newOwner)
            .endCell();

        return await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendChangeContent(provider: ContractProvider, via: Sender, value: bigint, content: Cell): Promise<void> {
        const body = beginCell()
            .storeUint(NftCollectionOpCodes.changeContent, 32)
            .storeUint(100, 64) // queryid
            .storeRef(content)
            .endCell();

        return await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendEditNft(provider: ContractProvider, via: Sender, value: bigint, nftIndex: number, content: string): Promise<void> {
        const body = beginCell()
            .storeUint(NftCollectionOpCodes.editNft, 32)
            .storeUint(100, 64) // queryid
            .storeUint(nftIndex, 64)
            .storeRef(encodeOffChainContent(content))
            .endCell();

        return await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendTransferNft(provider: ContractProvider, via: Sender, value: bigint, nftIndex: number, newOwner: Address): Promise<void> {
        const body = beginCell()
            .storeUint(NftCollectionOpCodes.transferNft, 32)
            .storeUint(100, 64) // queryid
            .storeUint(nftIndex, 64)
            .storeAddress(newOwner) // new owner
            .storeMaybeRef(null) // this nft don't use custom_payload
            .storeCoins(toNano("0.05")) // forward_amount
            .storeMaybeRef(beginCell().storeBuffer(Buffer.from("Ludo NFT for you")).asCell()) // this nft don't use forward_payload
            .endCell();

        return await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async getCollectionData(provider: ContractProvider): Promise<NftCollectionData> {
        const { stack } = await provider.get('get_collection_data', []);
        const nextItemIndex = stack.readNumber();

        const contentCell = stack.readCellOpt();
        // const contentCell = stack.readCellOpt()?.beginParse();
        // const offchainContent = decodeOffChainContent(contentCell?.loadRef());

        // let collectionContent = null;
        // if (contentCell !== null && contentCell !== undefined) {
        //   const collectionContentCell = contentCell!.loadRef();
        //
        //   if (collectionContentCell !== null && collectionContentCell !== undefined) {
        // const parseContent = collectionContentCell!.beginParse().skip(8);
        // const contentDict = parseContent.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        //
        // const nameCell = contentDict.get(toSha256('name'))?.beginParse().skip(8);
        // const name = nameCell?.loadStringTail();
        //
        // const descriptionCell = contentDict.get(toSha256('description'))?.beginParse().skip(8);
        // const description = descriptionCell?.loadStringTail();
        //
        // const imageCell = contentDict.get(toSha256('image'))?.beginParse().skip(8);
        // const image = imageCell?.loadStringTail();
        //
        // collectionContent = { name, description, image };
        // }
        // }

        // const commonContentCell = contentCell?.loadRef();
        // const commonContent = null; //decodeOffChainContent(commonContentCell);

        const ownerAddress = stack.readAddress().toString();
        return {
            nextItemIndex,
            ownerAddress,
            content: decodeOffChainContent(contentCell)
            // content: { collectionContent, commonContent }
        };
    }

    async getNextItemIndex(provider: ContractProvider): Promise<number> {
        const { stack } = await provider.get('get_next_item_index', []);
        return stack.readNumber();
    }

    async getNftAddressByIndex(provider: ContractProvider, index: number): Promise<Address> {
        const { stack } = await provider.get('get_nft_address_by_index', [
            { type: 'int', value: BigInt(index) }
        ]);
        return stack.readAddress();
    }

    async getRoyaltyParams(provider: ContractProvider) {
        const { stack } = await provider.get('royalty_params', []);

        return {
            royaltyFactor: stack.readNumber(),
            royaltyBase: stack.readNumber(),
            royaltyAddress: stack.readAddress()
        };
    }

    // метод используется эксплорерами для отображения контента нфт
    // не работает ни в каком виде, кроме прямого возврата individual_nft_content
    async getNftContent(provider: ContractProvider, index: number, nftContent: string) {
        const { stack } = await provider.get('get_nft_content', [
            { type: 'int', value: BigInt(index) },
            { type: 'cell', cell: encodeOffChainContent(nftContent) }
        ]);
        return decodeOffChainContent(stack.readCell());

        // const commonNftContent = cs.loadBuffer(cs.remainingBits / 8).slice(1).toString();
        // const individualNftContent = decodeOffChainContent(cs.loadRef());

        // return individualNftContent;
    }

    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get('balance', []);
        return {
            balance: stack.readNumber()
        };
    }
}