import {useTonClient} from "./useTonClient";
import {useEffect, useState} from "react";
import {Address, Dictionary, OpenedContract, toNano} from "@ton/core";
import {useAsyncInitialize} from "./useAsyncInitialize";
import {useTonConnect} from "./useTonConnect";
import {NftCollectionContract} from "../contracts/NftCollection/NftCollectionContract.ts";
import {txValue} from "../contracts/utils/constants.ts";
import {MintParams} from "../contracts/NftCollection/NftCollectionTypes.ts";

const nftCollectionContractAddress = "kQBKninDkvnCsdM33_nHuMORlpw0uk_JuKZz6B13pSCjP9Id";

export type NftCollectionData = {
    nextItemIndex: number;
    ownerAddress: string;
    content: string;
}

type Tier = "bronze" | "silver" | "gold";

interface Dictionary {
    [key: string]: string;
}

const bronzeTier: Dictionary = {
    "rank_52": "bafkreiblgiaqf37n2kme76km3637irvy5fjzftgi3vcxpjnhchcj5ogote"
}
const silverTier: Dictionary = {
    rank_7: "bafkreiezxqfi3snzoitqlgmuigvnaoxhcgjcixxts2dvtjkw7cs73xmlhy",
    rank_58: "bafkreifnmdb7wld6x56vjutnu44ritqyzpfyv5z3jqxoizieszkzmxx4ci"
};
const goldTier: Dictionary = {
    rank_15: "bafkreifi5ouoec2puflpmtrql5sabmoej65xxia2mi53djymuo2eloxrbq",
    rank_83: "bafkreidylqapqlhiwmgiwklihogwgzmmuxsi54xmljdm2x72ap3zlfp5ve"
}
const ipfsUrls: Record<Tier, Dictionary> = {
    "bronze": bronzeTier,
    "silver": silverTier,
    "gold": goldTier
}

const tiers: Tier[] = ["bronze", "silver", "gold"];

export function useNftCollectionContract() {
    const client = useTonClient();
    const {sender} = useTonConnect();

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
            if (!nftCollectionContract) return;

            const {nextItemIndex, ownerAddress, content} = await nftCollectionContract.getCollectionData();
            setContractData({nextItemIndex, ownerAddress, content});

            const {balance} = await nftCollectionContract.getBalance();
            setBalance(balance);

            await sleep(5000);

            getValue();
        }

        getValue();
    }, [nftCollectionContract]);

    return {
        contract_address: nftCollectionContract?.address.toString(),
        contract_balance: balance,
        ...contractData,
        sendDeployNft: async () => {
            const tier: Tier = tiers[Math.floor(Math.random() * tiers.length)];
            console.log("TIER:", tier)
            const tierUrls = ipfsUrls[tier];
            const keys: string[] = Object.keys(tierUrls);
            const key: string = keys[Math.floor(Math.random() * keys.length)];
            const rank = Number(key.split("_")[1]);
            console.log("RANK:", rank)
            const url = `https://ipfs.io/ipfs/${tierUrls[key]}`;
            console.log("URL:", url)

            console.log("SENDER:", sender.address)

            const mintParams: MintParams = {
                queryId: 101,
                itemOwnerAddress: sender.address!,
                amount: txValue,
                content: url
            };
            console.log("PARAMS:", mintParams)

            return nftCollectionContract?.sendDeployNft(sender, toNano(txValue), mintParams);
        }
    };
}