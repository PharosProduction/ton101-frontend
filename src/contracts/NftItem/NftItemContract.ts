import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, toNano } from '@ton/core';
import { NftItemOpCodes } from './NftItemOpCodes.ts';
import {NftItemConfig, NftItemContractData} from './NftItemTypes';
import { nftIndexZero, nftIsInited } from './NftItemValues';
import { decodeOffChainContent, encodeOffChainContent } from '../utils/offchainEncoding';
import { sendInternal } from '../utils/utils';

export class NftItemContract implements Contract {

    // Constructors

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {
    }

    // Factories

    static createContractNotInited(index: number, collectionAddress: Address | null, code: Cell): NftItemContract {
        const { address, init } = this.createStateNotInited(index, collectionAddress, code);
        return new NftItemContract(address, init);
    }

    static createContract(config: NftItemConfig, code: Cell): NftItemContract {
        const { init, address } = this.createState(config, code);
        return new NftItemContract(address, init);
    }

    static createContractNoCollection(config: NftItemConfig, code: Cell): NftItemContract {
        const { init, address } = this.createStateNoCollection(config, code);
        return new NftItemContract(address, init);
    }

    // Methods

    async sendDeployNotInited(provider: ContractProvider, via: Sender, deposit: number, body: Cell): Promise<void> {
        return sendInternal(provider, via, deposit, body);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, deposit: number): Promise<void> {
        return sendInternal(provider, via, deposit, null);
    }

    async sendTransfer(provider: ContractProvider, via: Sender, deposit: number, newOwner: Address, fwdAmount: number): Promise<void> {
        const queryId = Math.floor(Math.random() * 1000);

        const body = beginCell()
            .storeUint(NftItemOpCodes.transfer, 32)
            .storeUint(queryId, 64)
            .storeAddress(newOwner) // new owner
            .storeMaybeRef(null) // this nft don't use custom_payload
            .storeCoins(toNano(fwdAmount.toString())) // forward_amount
            .storeMaybeRef(null); // this nft don't use forward_payload

        return sendInternal(provider, via, deposit, body.endCell());
    }

    async sendEditContent(provider: ContractProvider, via: Sender, deposit: number, newContent: string): Promise<void> {
        const queryId = Math.floor(Math.random() * 1000);

        const body = beginCell()
            .storeUint(NftItemOpCodes.editContent, 32)
            .storeUint(queryId, 64)
            .storeRef(encodeOffChainContent(newContent));

        return sendInternal(provider, via, deposit, body.endCell());
    }

    async sendGetStaticData(provider: ContractProvider, via: Sender, deposit: number): Promise<void> {
        const queryId = Math.floor(Math.random() * 1000);

        const body = beginCell()
            .storeUint(NftItemOpCodes.getStaticData, 32)
            .storeUint(queryId, 64)
            .storeCoins(toNano('0.2'))

        return sendInternal(provider, via, deposit, body.endCell());
    }

    public async getNftData(provider: ContractProvider): Promise<NftItemContractData> {
        const { stack } = await provider.get('get_nft_data', []);
        const isInited = stack.readNumber() === nftIsInited;
        const index = stack.readNumber();
        const collectionAddress = stack.readAddressOpt();
        const ownerAddress = stack.readAddressOpt();
        const content = decodeOffChainContent(stack.readCellOpt());
        const rank = stack.readNumberOpt()
        const tier = stack.readStringOpt();

        return {
            isInited,
            index,
            collectionAddress,
            ownerAddress,
            content,
            rank,
            tier
        };
    }

    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get('balance', []);
        return {
            balance: stack.readNumber()
        };
    }

    // Private

    private static createStateNotInited(index: number, collectionAddress: Address | null, code: Cell, workchain = 0) {
        const data: Cell = this.createDataNotInited(index, collectionAddress);
        const init = { code, data };
        const address: Address = contractAddress(workchain, init);

        return { address, init };
    }

    private static createState(config: NftItemConfig, code: Cell, workchain = 0) {
        const data: Cell = this.createData(config);
        const init = { code, data };
        const address: Address = contractAddress(workchain, init);

        return { address, init };
    }

    private static createStateNoCollection(config: NftItemConfig, code: Cell, workchain = 0) {
        const data: Cell = this.createDataNoCollection(config);
        const init = { code, data };
        const address: Address = contractAddress(workchain, init);

        return { address, init };
    }

    private static createData(config: NftItemConfig): Cell {
        return beginCell()
            .storeUint(config.index!, 64)
            .storeAddress(config.collectionAddress)
            .storeAddress(config.ownerAddress)
            .storeRef(encodeOffChainContent(config.content))
            .storeUint(config.rank!, 32)
            .storeRef(beginCell()
                .storeStringTail(config.tier!)
                .endCell())
            .endCell();
    }

    private static createDataNoCollection(config: NftItemConfig): Cell {
        return beginCell()
            .storeUint(nftIndexZero, 64)
            .storeAddress(null) // collectionAddress
            .storeAddress(config.ownerAddress)
            .storeRef(encodeOffChainContent(config.content))
            .storeRef(beginCell()
                .storeStringTail(config.tier!)
                .endCell())
            .endCell();
    }

    private static createDataNotInited(index: number, collectionAddress: Address | null): Cell {
        return beginCell()
            .storeUint(index, 64)
            .storeAddress(collectionAddress)
            .endCell();
    }
}