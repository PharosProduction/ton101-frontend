import { Address, Cell } from '@ton/core';

type Attribute = {
    trait_type: string;
    value: string;
};

export type RoyaltyParamsConfig = {
    royaltyFactor: number;
    royaltyBase: number;
    royaltyAddress: Address;
}

export type OnchainCollectionContent = {
    name: string,
    description: string,
    image: string,
    cover_image: string,
    external_link: string,
    social_links: string[]
    attributes: Attribute[],
}

export type CollectionContent = {
    collectionContent: string;
    commonContent: string;
}

export type NftCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex: number;
    content: CollectionContent;
    nftItemCode: Cell;
    royaltyParams: RoyaltyParamsConfig;
}

export type MintParams = {
    nftBalance: number,
    nftContent: string | null,
    nftRank: number | null,
    nftTier: string | null
}

export type NftCollectionData = {
    nextItemIndex: number;
    ownerAddress: string | null;
    content: string | null;
}