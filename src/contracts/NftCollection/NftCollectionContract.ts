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
    SendMode, Slice
} from '@ton/core';
import { MintParams, NftCollectionConfig } from './NftCollectionTypes';
import { NftCollectionOpCodes } from './NftCollectionOpCodes';
import {decodeOffChainContent, encodeOffChainContent, toOffChainTextCell} from '../utils/offchainEncoding';
import { txValue } from '../utils/constants';

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    const collectionContentCell = encodeOffChainContent(config.content.collectionContent)
    const commonContentCell = toOffChainTextCell(config.content.commonContent)

    const contentCell = beginCell()
        .storeUint(1, 8)
        .storeRef(collectionContentCell)
        .storeRef(commonContentCell)
        .endCell();

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

export function createMintBody(params: MintParams): Cell {
    const body = beginCell();
    body.storeUint(NftCollectionOpCodes.deployNft, 32);
    body.storeUint(params.queryId || 0, 64);
    body.storeCoins(params.amount);
    body.storeRef(encodeOffChainContent(params.content));

    return body.endCell();
}

class CollectionMintNftItemInputDictionaryValue implements DictionaryValue<MintParams> {
    serialize(src: MintParams, cell: Builder): void {
        cell.storeCoins(src.amount);
        cell.storeRef(encodeOffChainContent(src.content));
    }

    parse(cell: Slice): MintParams {
        const queryId = cell.loadUint(64);
        const amount = cell.loadCoins();

        // const nftItemContent = cell.loadRef().beginParse();
        // const content = cell.loadRef().beginParse(); //decodeOffChainContent(nftItemContent.loadRef())!;

        return {
            queryId,
            amount,
            content: "eee"
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

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    async sendRoyaltyParams(provider: ContractProvider, via: Sender, value: bigint) {
        const body = beginCell()
            .storeUint(NftCollectionOpCodes.getRoyaltyParams, 32)
            .storeUint(100, 64) // queryid
            .endCell();

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendDeployNft(provider: ContractProvider, via: Sender, value: bigint, mintParams: MintParams) {
        console.log("SENDER ADDRESS ACTION:", via.address)
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: createMintBody(mintParams)
        });
    }

    async sendBatchDeployNft(provider: ContractProvider, via: Sender, value: bigint, mintParams: MintParams[]) {
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

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendChangeOwner(provider: ContractProvider, via: Sender, value: bigint, newOwner: Address) {
        const body = beginCell()
            .storeUint(NftCollectionOpCodes.changeOwner, 32)
            .storeUint(100, 64) // queryid
            .storeAddress(newOwner)
            .endCell();

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendTransferNft(provider: ContractProvider, via: Sender, value: bigint, nftIndex: number, newOwner: Address) {
        const body = beginCell()
            .storeUint(NftCollectionOpCodes.transferNft, 32)
            .storeUint(100, 64) // queryid
            .storeUint(nftIndex, 64)
            .storeAddress(newOwner) // new owner
            .storeAddress(newOwner) // response destination
            .storeMaybeRef(null) // this nft don't use custom_payload
            .storeCoins(txValue) // forward_amount
            .storeMaybeRef(null) // this nft don't use forward_payload
            .endCell();

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendIncrementItemCounter(provider: ContractProvider, via: Sender, value: bigint) {
        const body = beginCell()
            .storeUint(NftCollectionOpCodes.incrementItemCounter, 32)
            .storeUint(100, 64) // queryid
            .endCell();

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async getCollectionData(provider: ContractProvider) {
        const { stack } = await provider.get('get_collection_data', []);
        const nextItemIndex = stack.readNumber();
        const content = decodeOffChainContent(stack.readCell())!;
        const ownerAddress = stack.readAddress().toString();

        return {nextItemIndex, ownerAddress, content};
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

    async getNftAddressByIndexAndCode(provider: ContractProvider, index: number, code: Cell): Promise<Address> {
        const { stack } = await provider.get('get_nft_address_by_index_and_code', [
            { type: 'int', value: BigInt(index) },
            { type: 'cell', cell: code }
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