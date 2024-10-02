export const nftCollectionContractAddress = "EQCvUNiULQAy4yz76Ulxv-7eiflYFSL1NscIIgPxjE8yxFqI";

interface MintDictionary {
    [key: string]: string;
}

export const basicTier: MintDictionary = {
    rank_9: "bafkreicy4enjdngneu57x2rp2dnppwqxmmftdz5d5tf7bi777wi4ikcsrq"
}

export const bronzeTier: MintDictionary = {
    rank_52: "bafkreiblgiaqf37n2kme76km3637irvy5fjzftgi3vcxpjnhchcj5ogote"
}

export const silverTier: MintDictionary = {
    rank_7: "bafkreiezxqfi3snzoitqlgmuigvnaoxhcgjcixxts2dvtjkw7cs73xmlhy",
    rank_58: "bafkreifnmdb7wld6x56vjutnu44ritqyzpfyv5z3jqxoizieszkzmxx4ci"
};

export const goldTier: MintDictionary = {
    rank_15: "bafkreifi5ouoec2puflpmtrql5sabmoej65xxia2mi53djymuo2eloxrbq",
    rank_83: "bafkreidylqapqlhiwmgiwklihogwgzmmuxsi54xmljdm2x72ap3zlfp5ve"
}

export type Tier = "basic" | "bronze" | "silver" | "gold";

export const ipfsUrls: Record<Tier, MintDictionary> = {
    "basic": basicTier,
    "bronze": bronzeTier,
    "silver": silverTier,
    "gold": goldTier
}

export const tiers: Tier[] = ["basic", "bronze", "silver", "gold"];