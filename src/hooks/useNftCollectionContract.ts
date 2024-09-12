import {useTonClient} from "./useTonClient";
import {useEffect, useState} from "react";
import {Address, OpenedContract, toNano} from "@ton/core";
import {useAsyncInitialize} from "./useAsyncInitialize";
import {useTonConnect} from "./useTonConnect";
import {NftCollectionContract} from "../contracts/NftCollectionContract";

const nftCollectionContractAddress = "EQAiLNo3P1BBE2L2xqLhsovcJ2tSBXHUl-qykS_kyaVsPz9S";
const nftContent = 'bafkreifumf564yv5zveb7tczbz5tqcdwhcuo476znhdejyxpjztcaafyx4';

export type NftCollectionData = {
    nextItemIndex: number;
    content: string | undefined;
    ownerAddress: string;
}

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

            const {nextItemIndex, content, ownerAddress} = await nftCollectionContract.getCollectionData();
            setContractData({nextItemIndex, content, ownerAddress});

            const {balance} = await nftCollectionContract.getBalance();
            setBalance(balance);

            await sleep(5000);

            getValue();
        }

        getValue();
    }, [nftCollectionContract]);

    const mintParams = {
        queryId: 100,
        itemOwnerAddress: sender.address!,
        amount: toNano('0.05'),
        commonContentUrl: nftContent
    };

    return {
        contract_address: nftCollectionContract?.address.toString(),
        contract_balance: balance,
        ...contractData,
        sendDeployNft: async () => {
            return nftCollectionContract?.sendDeployNft(sender, toNano("0.3"), mintParams);
        },
        sendBatchDeployNft: async () => {
            return nftCollectionContract?.sendBatchDeployNft(sender, toNano("1"), [mintParams, mintParams, mintParams]);
        },
        sendRoyaltyParams: async () => {
            return nftCollectionContract?.sendRoyaltyParams(sender, toNano("0.05"));
        },
        sendChangeOwner: async () => {
            return nftCollectionContract?.sendChangeOwner(sender, toNano("0.05"), sender.address!);
        }
    };
}