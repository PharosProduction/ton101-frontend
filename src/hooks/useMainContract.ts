import {useTonClient} from "./useTonClient.ts";
import {useEffect, useState} from "react";
import {Address, OpenedContract, toNano} from "@ton/core";
import {useAsyncInitialize} from "./useAsyncInitialize.ts";
import {MainContract} from "../contracts/MainContract.ts";
import {useTonConnect} from "./useTonConnect.ts";

const mainContractAddress = "EQAvJAP7cJHW7oQrI1laKq63UgNmD30Qt5uRN3XgNxDj0jWV";

export function useMainContract() {
    const client = useTonClient();
    const {sender} = useTonConnect();

    const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

    const [contractData, setContractData] = useState<null | {
        counter_value: number;
        recent_sender: Address;
        owner: Address;
    }>();
    const [balance, setBalance] = useState<null | number>(0);

    const mainContract = useAsyncInitialize(async () => {
        if (!client) return;

        const contract = new MainContract(
            Address.parse(mainContractAddress)
        );
        return client.open(contract) as OpenedContract<MainContract>;
    }, [client]);

    useEffect(() => {
        async function getValue() {
            if (!mainContract) return;

            const val = await mainContract.getStorageData();
            const {balance} = await mainContract.getBalance();

            setContractData({
                counter_value: val.number,
                recent_sender: val.recent_sender,
                owner: val.owner
            });
            setBalance(balance);

            await sleep(5000);

            getValue();
        }

        getValue();
    }, [mainContract]);

    return {
        contract_address: mainContract?.address.toString(),
        contract_balance: balance,
        ...contractData,
        sendIncrement: async () => {
            return mainContract?.sendIncrement(sender, toNano("0.05"), 2);
        },
        sendDeposit: async () => {
            return mainContract?.sendDeposit(sender, toNano("1.5"));
        },
        sendWithdrawalRequest: async () => {
            return mainContract?.sendWithdrawalRequest(sender, toNano("0.05"), toNano("0.7"));
        }
    };
}