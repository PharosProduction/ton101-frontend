import {useTonClient} from "./useTonClient.ts";
import {useTonConnect} from "./useTonConnect.ts";
import {useEffect, useState} from "react";
import {Address, OpenedContract} from "@ton/core";
import {useAsyncInitialize} from "./useAsyncInitialize";
import {NftCollectionContract} from "../contracts/NftCollection/NftCollectionContract.ts";
import {NftCollectionData} from "../contracts/NftCollection/NftCollectionTypes.ts";
import {offchainPrepareNftContent} from "../contracts/NftItem/NftItemValues.ts";
import {ipfsUrls, nftCollectionContractAddress, Tier, tiers} from "../contracts/setup.ts";

export function useNftCollectionContract() {
    const client = useTonClient();
    const {sender, connected} = useTonConnect();

    const [contractData, setContractData] = useState<null | NftCollectionData>();
    const [balance, setBalance] = useState<null | number>(0);

    const nftCollectionContract = useAsyncInitialize(async () => {
        if (!client) return null;

        const contract = new NftCollectionContract(
            Address.parse(nftCollectionContractAddress)
        );
        return client.open(contract) as OpenedContract<NftCollectionContract>;
    }, [client]);

    useEffect(() => {
        async function getValue() {
            if (!nftCollectionContract || !connected) return;

            try {
                const {nextItemIndex, content, ownerAddress} = await nftCollectionContract.getCollectionData();
                setContractData({nextItemIndex, content, ownerAddress});

                const {balance} = await nftCollectionContract.getBalance();
                setBalance(balance);
            } catch (err) {
                console.error("CONTRACT GETTER PROBLEM:", err);
                // TODO: надо адекватно отображать проблемы
            }
        }

        getValue();
    }, [client, connected, nftCollectionContract]);

    // useEffect(() => {
    //     async function getRecentTransactions(address: Address, lastLt: bigint): Promise<bigint> {
    //         if (!nftCollectionContract || !connected || !client) return lastLt;
    //
    //         const transactions = await client.getTransactions(address, {limit: 10});
    //
    //         if (transactions.length > 0) {
    //             for (const tx of transactions) {
    //                 // Compare with last known lt to avoid reprocessing older transactions
    //                 if (BigInt(tx.lt) > lastLt) {
    //                     // console.log('New Transaction:', JSON.stringify(tx, replacer, 2));
    //                     console.log('Transaction LT:', tx.lt);         // Logical Time
    //                     console.log('Transaction Hash:', tx.hash);     // Transaction Hash
    //                     console.log('Transaction InMsg:', tx.inMessage);  // Incoming message
    //                     console.log('Transaction OutMsgs:', tx.outMessages); // Outgoing messages
    //                     console.log('Full Transaction:', JSON.stringify(tx, replacer, 2));
    //
    //                     const inMsgBody = tx.inMessage?.body; // The body contains the payload (may be encoded as a base64 string)
    //
    //                     if (inMsgBody) {
    //                         const parser = inMsgBody.beginParse();
    //                         const opCode = parser.loadUint(32); // Read first 32 bits as op code (can vary)
    //                         console.log(`Op Code: 0x${opCode.toString(16)}`); // Print op code in hex format
    //
    //                         const queryId = parser.loadUint(64);
    //                         console.log('Query ID:', queryId);
    //
    //                         const nftBalance = parser.loadCoins();
    //                         console.log('NFT Balance:', fromNano(nftBalance));
    //
    //                         const nftContent = decodeOffChainContent(parser.loadRef());
    //                         console.log('NFT Content:', nftContent);
    //                     } else {
    //                         console.log('No incoming message body found for transaction:', tx.lt);
    //                     }
    //                 }
    //             }
    //             // Update the last logical time (lt)
    //             return BigInt(transactions[0].lt);
    //         }
    //
    //         return lastLt;
    //     }
    //
    //     async function subscribeToContractEvents() {
    //         if (!nftCollectionContract || !connected || !client) return;
    //
    //         let lastLt = BigInt(0); // Initialize with the smallest logical time (lt)
    //
    //         while (true) {
    //             try {
    //                 // Fetch new transactions and update the last logical time
    //                 lastLt = await getRecentTransactions(nftCollectionContract.address, lastLt);
    //             } catch (error) {
    //                 console.error('Error fetching transactions:', error);
    //             }
    //
    //             // Wait for a few seconds before polling again
    //             await delay(5000); // Delay for 5 seconds between polls
    //         }
    //     }
    //
    //     subscribeToContractEvents();
    // }, [client, connected, nftCollectionContract]);

    return {
        contract_address: nftCollectionContract?.address.toString(),
        contract_balance: balance,
        ...contractData,
        sendDeployNft: async (rank: number, tier: string) => {
            nftCollectionContract?.sendDeployNft(sender, 0.01, 0.01, offchainPrepareNftContent, rank, tier, "💎 Your Ludo NFT is getting ready 💎")
                .then(async () => {
                    fetch(`https://counters.ludo.ninja:8090/minting/ton`, {
                        method: 'POST',
                        headers: {
                            'x-client-authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJuaW5qYS5sdWRvIiwic3ViIjoidGctYm90IiwiYXVkIjoidXNlcnMiLCJpYXQiOjE3MTQ0NjU4NDEsImV4cCI6MTc0NjAwMTg0MSwianRpIjoiNTRhYjkyOGUtZmVmMy00YjUzLWE4ZDctYjI3NmNlMTM5YmQ3Iiwic2hvd05zZnciOnRydWUsInJvbGUiOiJjb21wYW55IiwiYXV0aG9yaXRpZXMiOlsiU0VBUkNIIl0sInRhcmlmZiI6IkVYVEVOU0lPTiJ9.DZ7JqpceNXiH8fSjN2ynBWdtBgGSZ-_O9DLMAaaRwwmflqluHQJeZBr5sjP-BC7eDL1avOTEmjcnmre8aXhwbg',
                        }
                    })
                        .then(() => {
                            console.log("ALL GOOD")
                            // TODO: надо адекватно отображать успех
                        })
                        .catch(() => {
                            console.log("ALL BAD")
                            // TODO: надо адекватно отображать проблемы
                        });
                })
                .catch((err) => {
                    console.log("SEND DEPLOY NFT ERROR", err);
                })
        },
        sendEditNft: async () => {
            if (!nftCollectionContract) return;

            const tier: Tier = tiers[Math.floor(Math.random() * tiers.length)];
            const tierUrls = ipfsUrls[tier];
            const keys: string[] = Object.keys(tierUrls);
            const key: string = keys[Math.floor(Math.random() * keys.length)];
            // const rank = Number(key.split("_")[1]);

            const nftIndex = 0;
            const contentUrl = `https://ipfs.io/ipfs/${tierUrls[key]}`;
            await nftCollectionContract.sendEditNft(sender, 0.1, nftIndex, contentUrl, "💎 Ludo NFT 💎");
        },
        sendTransferNft: async () => {
            if (!nftCollectionContract) return;

            const nftIndex = 0;
            await nftCollectionContract.sendTransferNft(sender, 0.1, nftIndex, sender.address!, "💎 Ludo NFT 💎");
        }
    };
}