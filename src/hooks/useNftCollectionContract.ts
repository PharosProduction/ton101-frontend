import {useTonClient} from "./useTonClient.ts";
import {useTonConnect} from "./useTonConnect.ts";
import {useEffect, useState} from "react";
import {Address, OpenedContract} from "@ton/core";
import {useAsyncInitialize} from "./useAsyncInitialize";
import {NftCollectionContract} from "../contracts/NftCollection/NftCollectionContract.ts";
import {txValue} from "../contracts/utils/constants.ts";
import {MintParams} from "../contracts/NftCollection/NftCollectionTypes.ts";

const nftCollectionContractAddress = "EQBihH2fLMBSb5KBV6iwM7C-zEtIfmj1H6BdKNTzqKIb1dyA";

export type NftCollectionData = {
    nextItemIndex: number;
    ownerAddress: string;
    content: string;
}

type Tier = "basic" | "bronze" | "silver" | "gold";

interface MintDictionary {
    [key: string]: string;
}

const basicTier: MintDictionary = {
    rank_9: "bafkreicy4enjdngneu57x2rp2dnppwqxmmftdz5d5tf7bi777wi4ikcsrq"
}
const bronzeTier: MintDictionary = {
    rank_52: "bafkreiblgiaqf37n2kme76km3637irvy5fjzftgi3vcxpjnhchcj5ogote"
}
const silverTier: MintDictionary = {
    rank_7: "bafkreiezxqfi3snzoitqlgmuigvnaoxhcgjcixxts2dvtjkw7cs73xmlhy",
    rank_58: "bafkreifnmdb7wld6x56vjutnu44ritqyzpfyv5z3jqxoizieszkzmxx4ci"
};
const goldTier: MintDictionary = {
    rank_15: "bafkreifi5ouoec2puflpmtrql5sabmoej65xxia2mi53djymuo2eloxrbq",
    rank_83: "bafkreidylqapqlhiwmgiwklihogwgzmmuxsi54xmljdm2x72ap3zlfp5ve"
}
const ipfsUrls: Record<Tier, MintDictionary> = {
    "basic": basicTier,
    "bronze": bronzeTier,
    "silver": silverTier,
    "gold": goldTier
}

const tiers: Tier[] = ["basic", "bronze", "silver", "gold"];

export function useNftCollectionContract() {
    const client = useTonClient();
    const {sender, connected} = useTonConnect();
    console.log("ADDRESS TON CONNECT UI:", sender.address, connected)

    const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

    const [contractData, setContractData] = useState<null | NftCollectionData>();
    const [balance, setBalance] = useState<null | number>(0);

    const nftCollectionContract = useAsyncInitialize(async () => {
        if (!client) return;

        const contract = new NftCollectionContract(
            Address.parse(nftCollectionContractAddress)
        );
        return client.open(contract) as OpenedContract<NftCollectionContract>;
    }, [client]);

    useEffect(() => {
        async function getValue() {
            console.log("CONTRACT:", nftCollectionContract?.address.toString());
            if (!nftCollectionContract || !connected) return;

            const {nextItemIndex, ownerAddress, content} = await nftCollectionContract.getCollectionData();
            setContractData({nextItemIndex, ownerAddress, content});
            console.log("SET CONTRACT DATA", {nextItemIndex, ownerAddress, content})

            const {balance} = await nftCollectionContract.getBalance();
            setBalance(balance);
            console.log("SET BALANCE", balance)

            await sleep(5000);

            console.log("GET VALUE 2")
            getValue();
        }

        console.log("GET VALUE 1")
        getValue();
    }, [nftCollectionContract]);

    console.log("SENDER 1:", sender.address)

    return {
        contract_address: nftCollectionContract?.address.toString(),
        contract_balance: balance,
        ...contractData,
        sendDeployNft: async () => {
            const tier: Tier = tiers[Math.floor(Math.random() * tiers.length)];
            const tierUrls = ipfsUrls[tier];
            const keys: string[] = Object.keys(tierUrls);
            const key: string = keys[Math.floor(Math.random() * keys.length)];
            // const rank = Number(key.split("_")[1]);
            const url = `https://ipfs.io/ipfs/${tierUrls[key]}`;

            const mintParams: MintParams = {
                queryId: 101,
                amount: txValue,
                content: url
            };
            console.log("PARAMS:", mintParams)

            return nftCollectionContract?.sendDeployNft(sender, txValue, mintParams);
        }
    };
}