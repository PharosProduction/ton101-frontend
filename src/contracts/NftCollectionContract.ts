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
import { decodeOffChainContent, encodeOffChainContent } from './utils';
import { OpCodes } from './OpCodes';

export type RoyaltyParamsConfig = {
    royaltyFactor: number;
    royaltyBase: number;
    royaltyAddress: Address;
}

export type Content = {
    collectionContent: string;
    commonContent: string;
}

export type NftCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex: number;
    content: Content;
    nftItemCode: Cell;
    royaltyParams: RoyaltyParamsConfig;
}

export type MintParams = {
    queryId: number | null,
    itemOwnerAddress: Address,
    amount: bigint,
    commonContentUrl: string
}

export type BatchMintParams = {
    itemOwnerAddress: Address,
    amount: bigint,
    commonContentUrl: string
}

const OFFCHAIN_CONTENT_PREFIX = 0x01;

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    const collectionContentCell = encodeOffChainContent(config.content.collectionContent);

    const commonContent = beginCell();
    commonContent.storeBuffer(Buffer.from(config.content.commonContent));
    const commonContentCell = commonContent.asCell();

    const contentCell = beginCell()
        .storeUint(OFFCHAIN_CONTENT_PREFIX, 8)
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
    const nftItemContent = beginCell();
    nftItemContent.storeAddress(params.itemOwnerAddress);

    const nftContent = encodeOffChainContent(params.commonContentUrl);
    nftItemContent.storeRef(nftContent);
    const content = nftItemContent.endCell();

    const body = beginCell();
    body.storeUint(OpCodes.deployNft, 32);
    body.storeUint(params.queryId || 0, 64);
    body.storeCoins(params.amount);
    body.storeRef(content);

    return body.endCell();
}

class CollectionMintNftItemInputDictionaryValue implements DictionaryValue<BatchMintParams> {
    serialize(src: BatchMintParams, cell: Builder): void {
        const nftItemContent = beginCell();
        nftItemContent.storeAddress(src.itemOwnerAddress);

        const nftContent = encodeOffChainContent(src.commonContentUrl);
        nftItemContent.storeRef(nftContent);
        const content = nftItemContent.endCell();

        cell.storeCoins(src.amount);
        cell.storeRef(content);
    }

    parse(cell: Slice): BatchMintParams {
        const amount = cell.loadCoins();

        const nftItemContent = cell.loadRef().beginParse();
        const itemOwnerAddress = nftItemContent.loadAddress();
        const commonContentUrl = decodeOffChainContent(nftItemContent.loadRef())!;

        return {
            itemOwnerAddress,
            amount,
            commonContentUrl
        };
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

    async sendRoyaltyParams(provider: ContractProvider, sender: Sender, value: bigint) {
        const body = beginCell()
            .storeUint(OpCodes.getRoyaltyParams, 32)
            .storeUint(100, 64) // queryid
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendDeployNft(provider: ContractProvider, sender: Sender, value: bigint, mintParams: MintParams) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: createMintBody(mintParams)
        });
    }

    async sendBatchDeployNft(provider: ContractProvider, sender: Sender, value: bigint, mintParams: BatchMintParams[]) {
        const contentDict = Dictionary.empty<number, BatchMintParams>(Dictionary.Keys.Uint(64), new CollectionMintNftItemInputDictionaryValue());

        mintParams.forEach((mintParam, idx) => {
            contentDict.set(idx, mintParam);
        });

        const dictCell = beginCell()
            .storeDictDirect(contentDict)
            .endCell();

        const body = beginCell()
            .storeUint(OpCodes.batchDeployNft, 32)
            .storeUint(100, 64) // queryid
            .storeRef(dictCell)
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendChangeOwner(provider: ContractProvider, sender: Sender, value: bigint, newOwner: Address) {
        const body = beginCell()
            .storeUint(OpCodes.changeOwner, 32)
            .storeUint(100, 64) // queryid
            .storeAddress(newOwner)
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async getCollectionData(provider: ContractProvider) {
        const { stack } = await provider.get('get_collection_data', []);

        return {
            nextItemIndex: stack.readNumber(),
            content: decodeOffChainContent(stack.readCell()),
            ownerAddress: stack.readAddress().toString()
        };
    }

    async getNftAddressByIndex(provider: ContractProvider, index: bigint) {
        const { stack } = await provider.get('get_nft_address_by_index', [
            { type: 'int', value: index }
        ]);
        return stack.readAddress();
    }

    async getNftAddressByIndexAndCode(provider: ContractProvider, index: bigint, code: Cell) {
        const { stack } = await provider.get('get_nft_address_by_index_and_code', [
            { type: 'int', value: index },
            { type: 'cell', cell: code }
        ]);
        return stack.readAddress();
    }

    async getRoyaltyParams(provider: ContractProvider) {
        const { stack } = await provider.get('get_royalty_params', []);

        return {
            royaltyFactor: stack.readNumber(),
            royaltyBase: stack.readNumber(),
            royaltyAddress: stack.readAddress()
        };
    }

    async getNftContent(provider: ContractProvider, nftContent: string, index: bigint) {
        const { stack } = await provider.get('get_nft_content', [
            { type: 'int', value: index },
            { type: 'cell', cell: encodeOffChainContent(nftContent) }
        ]);

        const cs = stack.readCell().beginParse();
        const commonNftContent = cs.loadBuffer(cs.remainingBits / 8).slice(1).toString();
        const individualNftContent = decodeOffChainContent(cs.loadRef());

        return { commonNftContent, individualNftContent };
    }

    async getBalance(provider: ContractProvider) {
        const {stack} = await provider.get("balance", []);
        return {
            balance: stack.readNumber()
        };
    }
}