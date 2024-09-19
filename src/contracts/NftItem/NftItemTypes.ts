import { Address, StateInit } from '@ton/core';

export type ContractInit = {
    init: StateInit,
    address: Address
}

type Attribute = {
    trait_type: string;
    value: string;
};

export type OnchainNftContent = {
    name: string,
    description: string,
    attributes: Attribute[],
    image: string,
    video: string,
    animationUrl: string,
    rank: string,
    tier: string,
    blockchain: string,
    wallet: Address,
    version: string
}

export type NftItemConfig = {
    index: number | null;
    collectionAddress: Address | null;
    ownerAddress: Address;
    onchainContent: OnchainNftContent | null;
    offchainContent: string | null;
}

export type NftItemContractData = {
    isInited: boolean;
    itemIndex: number;
    collectionAddress: Address | null;
    ownerAddress: Address | null;
    content: NftItemContractContent | null;
}

export type NftItemContractContent = {

}