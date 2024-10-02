import { Address } from '@ton/core';

export type Attribute = {
    trait_type: string;
    value: string;
};

export type OnchainNftContent = {
    name: string,
    description: string,
    attributes: Attribute[],
    image: string,
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
    content: string | null;
    rank: number | null;
    tier: string | null;
}

export type NftItemContractData = {
    isInited: boolean;
    index: number;
    collectionAddress: Address | null;
    ownerAddress: Address | null;
    content: string | null;
    rank: number | null;
    tier: string | null;
}