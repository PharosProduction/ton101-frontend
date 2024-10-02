import {
    Address,
    beginCell,
    Cell,
    Contract, contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    toNano
} from '@ton/core';
import {MintParams, NftCollectionConfig, NftCollectionData} from './NftCollectionTypes';
import { NftCollectionOpCodes } from './NftCollectionOpCodes';
import {decodeOffChainContent, encodeOffChainContent, toOffChainTextCell} from '../utils/offchainEncoding';
import {createComment, sendInternal} from '../utils/utils';
import { BatchMintParams } from './BatchMintParams.ts';
import {OFFCHAIN_CONTENT_PREFIX} from "../utils/constants.ts";

export class NftCollectionContract implements Contract {

    // Constructor

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {
    }

    // Factories

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const collectionContentCell = encodeOffChainContent(config.content.collectionContent);
        const commonContentCell = toOffChainTextCell(config.content.commonContent);

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

        const data = beginCell()
            .storeAddress(config.ownerAddress)
            .storeUint(config.nextItemIndex, 64)
            .storeRef(contentCell)
            .storeRef(config.nftItemCode)
            .storeRef(royaltyParamsCell)
            .endCell();

        const init = { code, data };
        const address = contractAddress(workchain, init);

        return new NftCollectionContract(address, init);
    }

    // Public

    async sendDeploy(provider: ContractProvider, via: Sender, deposit: number): Promise<void> {
        return sendInternal(provider, via, deposit, beginCell().endCell());
    }

    async sendDeployNft(provider: ContractProvider, via: Sender, deposit: number, nftBalance: number, nftContent: string, rank: number, tier: string, comment: string | null): Promise<void> {
        const queryId = Math.floor(Math.random() * 1000);

        const body = beginCell();
        body.storeUint(NftCollectionOpCodes.deployNft, 32);
        body.storeUint(BigInt(queryId), 64);
        body.storeCoins(toNano(nftBalance.toString())); // nft balance
        body.storeRef(encodeOffChainContent(nftContent));
        body.storeUint(rank, 32)
        body.storeRef(beginCell().storeStringTail(tier).endCell())
        createComment(comment, body);

        try {
            return sendInternal(provider, via, deposit, body.endCell());
        } catch (err) {
            console.log("ERR sendDeployNft:", err);
            return Promise.reject(err);
        }
    }

    async sendBatchDeployNft(provider: ContractProvider, via: Sender, deposit: number, nftBalance: number, nftContents: string[], nftRanks: number[], nftTiers: string[], comment: string): Promise<void> {
        const contentDict = Dictionary.empty<number, MintParams>(Dictionary.Keys.Uint(64), new BatchMintParams());
        const queryId = Math.floor(Math.random() * 1000);

        nftContents.forEach((nftContent, idx) => {
            const nftRank = nftRanks[idx];
            const nftTier = nftTiers[idx];
            const mintParams: MintParams = { nftBalance, nftContent, nftRank, nftTier };
            contentDict.set(idx, mintParams);
        });

        const dictCell = beginCell()
            .storeDictDirect(contentDict)
            .endCell();

        const body = beginCell()
            .storeUint(NftCollectionOpCodes.batchDeployNft, 32)
            .storeUint(queryId, 64)
            .storeRef(dictCell);
        createComment(comment, body);

        return sendInternal(provider, via, deposit, body.endCell());
    }

    async sendChangeOwner(provider: ContractProvider, via: Sender, deposit: number, newOwner: Address): Promise<void> {
        const queryId = Math.floor(Math.random() * 1000);

        const body = beginCell()
            .storeUint(NftCollectionOpCodes.changeOwner, 32)
            .storeUint(queryId, 64)
            .storeAddress(newOwner);

        return sendInternal(provider, via, deposit, body.endCell());
    }

    async sendChangeContent(provider: ContractProvider, via: Sender, deposit: number, content: Cell): Promise<void> {
        const queryId = Math.floor(Math.random() * 1000);

        const body = beginCell()
            .storeUint(NftCollectionOpCodes.changeContent, 32)
            .storeUint(queryId, 64)
            .storeRef(content);

        return sendInternal(provider, via, deposit, body.endCell());
    }

    async sendEditNft(provider: ContractProvider, via: Sender, deposit: number, nftIndex: number, content: string, comment: string | null): Promise<void> {
        const queryId = Math.floor(Math.random() * 1000);

        const body = beginCell()
            .storeUint(NftCollectionOpCodes.editNft, 32)
            .storeUint(queryId, 64)
            .storeUint(nftIndex, 64)
            .storeRef(encodeOffChainContent(content));
        createComment(comment, body);

        return sendInternal(provider, via, deposit, body.endCell());
    }

    async sendTransferNft(provider: ContractProvider, via: Sender, deposit: number, nftIndex: number, newOwner: Address, comment: string | null): Promise<void> {
        const queryId = Math.floor(Math.random() * 1000);

        const body = beginCell()
            .storeUint(NftCollectionOpCodes.transferNft, 32)
            .storeUint(queryId, 64)
            .storeUint(nftIndex, 64)
            .storeAddress(newOwner) // new owner
            .storeMaybeRef(null) // this nft don't use custom_payload
            .storeCoins(toNano('0.02')) // forward_amount
            .storeMaybeRef(null); // forward_payload
        createComment(comment, body);

        return sendInternal(provider, via, deposit, body.endCell());
    }

    async sendRoyaltyParams(provider: ContractProvider, via: Sender, deposit: number): Promise<void> {
        const queryId = Math.floor(Math.random() * 1000);

        const body = beginCell()
            .storeUint(NftCollectionOpCodes.getRoyaltyParams, 32)
            .storeUint(queryId, 64)
            .endCell();

        return sendInternal(provider, via, deposit, body);
    }

    async getCollectionData(provider: ContractProvider): Promise<NftCollectionData> {
        const { stack } = await provider.get('get_collection_data', []);
        const nextItemIndex = stack.readNumber();
        const content = decodeOffChainContent(stack.readCellOpt());
        const ownerAddress = stack.readAddress().toString();

        return { nextItemIndex, content, ownerAddress };
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
    }

    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get('balance', []);
        return {
            balance: stack.readNumber()
        };
    }
}