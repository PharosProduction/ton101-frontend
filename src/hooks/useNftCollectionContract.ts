import {useTonClient} from "./useTonClient.ts";
import {useTonConnect} from "./useTonConnect.ts";
import {useEffect, useState} from "react";
import {address, Address, fromNano, OpenedContract, toNano} from "@ton/core";
import {useAsyncInitialize} from "./useAsyncInitialize";
import {NftCollectionContract} from "../contracts/NftCollection/NftCollectionContract.ts";
import {txValue} from "../contracts/utils/constants.ts";
import {NftCollectionData} from "../contracts/NftCollection/NftCollectionTypes.ts";
import {OnchainNftContent} from "../contracts/NftItem/NftItemTypes.ts";
import {offchainNftContent} from "../contracts/NftItem/NftItemValues.ts";
import {delay} from "@ton/ton/dist/utils/time";
import {decodeOffChainContent} from "../contracts/utils/offchainEncoding.ts";

const nftCollectionContractAddress = "EQA08blEwfXWOdFpdXakO5uHyzvNNwlHJ0OupvcROXGd9hJV";

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

export function onchainNftContent(walletAddress: string): OnchainNftContent {
    return {
        name: "ONCHAIN Ludo Rank",
        description: `ONCHAIN NFT rank 9 for ${walletAddress}`,
        attributes: [
            {"trait_type":"Rank Value", "value": "9"},
            {"trait_type":"Address", "value": `${walletAddress}`},
            {"trait_type":"Tier", "value":"Basic"},
            {"trait_type":"Referral Code", "value": ""},
            {"trait_type":"Chain Type", "value":"ETH"},
            {"trait_type":"Chain ID", "value":"80002"},
            {"trait_type":"Timestamp", "value":"1726555332"},
            {"trait_type":"ONCHAIN", "value":"true"}
        ],
        image: "https://ipfs.io/ipfs/bafkreievmuqppi4f2ngtfrribtss2ktrfvwptg6tsglhqqmqwaj3g6gyky",
        animationUrl: "https://ipfs.io/ipfs/bafybeigan74kdpcaboylgfc44kvqmbzqljlcwtbixitgpwx3bkwmserjpa",
        rank: "9",
        tier: "basic",
        blockchain: "ton",
        wallet: address(walletAddress),
        version: "1.0.0"
    }
}

const tiers: Tier[] = ["basic", "bronze", "silver", "gold"];

const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

const replacer = (key: string, value: any) => {
    return typeof value === 'bigint' ? value.toString() : value;
}

export function useNftCollectionContract() {
    const client = useTonClient();
    const {sender, connected} = useTonConnect();

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
            if (!nftCollectionContract || !connected) return;

            const {nextItemIndex, ownerAddress, content} = await nftCollectionContract.getCollectionData();
            setContractData({nextItemIndex, ownerAddress, content});

            const {balance} = await nftCollectionContract.getBalance();
            setBalance(balance);

            await sleep(5000);
            getValue();
        }

        getValue();
    }, [nftCollectionContract]);

    useEffect(() => {
        async function getRecentTransactions(address: Address, lastLt: bigint): Promise<bigint> {
            if (!nftCollectionContract || !connected || !client) return lastLt;

            const transactions = await client.getTransactions(address, {limit: 10});

            if (transactions.length > 0) {
                for (const tx of transactions) {
                    // Compare with last known lt to avoid reprocessing older transactions
                    if (BigInt(tx.lt) > lastLt) {
                        // console.log('New Transaction:', JSON.stringify(tx, replacer, 2));
                        console.log('Transaction LT:', tx.lt);         // Logical Time
                        console.log('Transaction Hash:', tx.hash);     // Transaction Hash
                        console.log('Transaction InMsg:', tx.inMessage);  // Incoming message
                        console.log('Transaction OutMsgs:', tx.outMessages); // Outgoing messages
                        console.log('Full Transaction:', JSON.stringify(tx, replacer, 2));

                        const inMsgBody = tx.inMessage?.body; // The body contains the payload (may be encoded as a base64 string)

                        if (inMsgBody) {
                            const parser = inMsgBody.beginParse();
                            const opCode = parser.loadUint(32); // Read first 32 bits as op code (can vary)
                            console.log(`Op Code: 0x${opCode.toString(16)}`); // Print op code in hex format

                            const queryId = parser.loadUint(64);
                            console.log('Query ID:', queryId);

                            const nftBalance = parser.loadCoins();
                            console.log('NFT Balance:', fromNano(nftBalance));

                            const nftContent = decodeOffChainContent(parser.loadRef());
                            console.log('NFT Content:', nftContent);
                        } else {
                            console.log('No incoming message body found for transaction:', tx.lt);
                        }
                    }
                }
                // Update the last logical time (lt)
                return BigInt(transactions[0].lt);
            }

            return lastLt;
        }

        async function subscribeToContractEvents() {
            if (!nftCollectionContract || !connected || !client) return;

            let lastLt = BigInt(0); // Initialize with the smallest logical time (lt)

            while (true) {
                try {
                    // Fetch new transactions and update the last logical time
                    lastLt = await getRecentTransactions(nftCollectionContract.address, lastLt);
                } catch (error) {
                    console.error('Error fetching transactions:', error);
                }

                // Wait for a few seconds before polling again
                await delay(5000); // Delay for 5 seconds between polls
            }
        }

        subscribeToContractEvents();
    }, [nftCollectionContract]);

    return {
        contract_address: nftCollectionContract?.address.toString(),
        contract_balance: balance,
        ...contractData,
        sendDeployNft: async () => {
            await nftCollectionContract?.sendDeployNft(sender, offchainNftContent, 100);
        },
        sendEditNft: async () => {
            if (nftCollectionContract === undefined || nftCollectionContract === null) return;

            const tier: Tier = tiers[Math.floor(Math.random() * tiers.length)];
            const tierUrls = ipfsUrls[tier];
            const keys: string[] = Object.keys(tierUrls);
            const key: string = keys[Math.floor(Math.random() * keys.length)];
            // const rank = Number(key.split("_")[1]);

            const nftIndex = 0;
            const contentUrl = `https://ipfs.io/ipfs/${tierUrls[key]}`;
            await nftCollectionContract.sendEditNft(sender, txValue, nftIndex, contentUrl);
        },
        sendTransferNft: async () => {
            if (nftCollectionContract === undefined || nftCollectionContract === null) return;

            const nftIndex = 0;
            await nftCollectionContract.sendTransferNft(sender, toNano("0.1"), nftIndex, sender.address!);
        }
    };
}