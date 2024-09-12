import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';
import { decodeOffChainContent, encodeOffChainContent } from './utils';
import { OpCodes } from './OpCodes';

export type NftItemConfig = {
    index: bigint;
    collectionAddress: Address;
    ownerAddress: Address;
    content: string;
}

export type NftItemNotInitedContractConfig = {
    index: bigint;
    collectionAddress: Address;
}

export function nftItemNotInitedConfigToCell(config: NftItemNotInitedContractConfig): Cell {
    return beginCell()
        .storeUint(config.index, 64)
        .storeAddress(config.collectionAddress)
        .endCell();
}

export function nftItemConfigToCell(config: NftItemConfig): Cell {
    const content = encodeOffChainContent(config.content);

    return beginCell()
        .storeUint(config.index, 64)
        .storeAddress(config.collectionAddress)
        .storeAddress(config.ownerAddress)
        .storeRef(content)
        .endCell();
}

export class NftItemContract implements Contract {

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {
    }

    static createNotInitedInitAndAddressFromConfig(config: NftItemNotInitedContractConfig, code: Cell, workchain = 0) {
        const data = nftItemNotInitedConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);

        return {init, address};
    }

    static createInitAndAddressFromConfig(config: NftItemConfig, code: Cell, workchain = 0) {
        const data = nftItemConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);

        return {init, address};
    }

    static createNotInitedFromConfig(config: NftItemNotInitedContractConfig, code: Cell) {
        const {init, address} = NftItemContract.createNotInitedInitAndAddressFromConfig(config, code);
        return new NftItemContract(address, init);
    }

    static createFromConfig(config: NftItemConfig, code: Cell) {
        const {init, address} = NftItemContract.createInitAndAddressFromConfig(config, code);
        return new NftItemContract(address, init);
    }

    async sendDeployNotInited(provider: ContractProvider, via: Sender, value: bigint, body: Cell) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    async sendTransfer(provider: ContractProvider, sender: Sender, value: bigint, newOwner: Address) {
        const body = beginCell()
            .storeUint(OpCodes.transfer, 32)
            .storeUint(100, 64) // queryid
            .storeAddress(newOwner) // new owner
            .storeAddress(newOwner) // response destination
            .storeMaybeRef(null) // this nft don't use custom_payload
            .storeCoins(toNano("0.001")) // forward_amount
            .storeMaybeRef(null) // this nft don't use forward_payload
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async sendGetStaticData(provider: ContractProvider, sender: Sender, value: bigint) {
        const body = beginCell()
            .storeUint(OpCodes.getStaticData, 32)
            .storeUint(100, 64) // queryid
            .storeCoins(toNano("0.2"))
            .endCell();

        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    }

    async getNftData(provider: ContractProvider) {
        const {stack} = await provider.get("get_nft_data", []);

        return {
            isInited: stack.readNumber(),
            index: stack.readNumber(),
            collectionAddress: stack.readAddress(),
            ownerAddress: stack.readAddressOpt()?.toString(),
            content: decodeOffChainContent(stack.readCellOpt())
        };
    }

    async getBalance(provider: ContractProvider) {
        const {stack} = await provider.get("balance", []);
        return {
            balance: stack.readNumber()
        };
    }
}