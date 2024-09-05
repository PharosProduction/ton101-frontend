import './App.css'
import {TonConnectButton} from "@tonconnect/ui-react";
import {useMainContract} from "./hooks/useMainContract.ts";
import {useTonConnect} from "./hooks/useTonConnect.ts";
import {fromNano} from "@ton/core";

function App() {
    const {
        contract_address,
        counter_value,
        // recent_sender,
        // owner,
        contract_balance,
        sendIncrement,
        sendDeposit,
        sendWithdrawalRequest
    } = useMainContract();

    const {connected} = useTonConnect();

    return (
        <>
            <div className="card">
                <TonConnectButton/>
            </div>

            <div className='Card'>
                <b>Our contract Address</b>
                <div className='Hint'>{contract_address?.slice(0, 30) + "..."}</div>
                <b>Our contract Balance</b>
                <div className='Hint'>{fromNano(`${contract_balance}`).toString()} "💎TON"</div>
            </div>

            <div className='Card'>
                <b>Counter Value</b>
                <div>{counter_value ?? "Loading..."}</div>
            </div>

            {connected && (
                <a onClick={() => {
                    sendIncrement()
                }}>Increment by 2</a>
            )}

            <br/>

            {connected && (
                <a onClick={() => {
                    sendDeposit()
                }}>Request deposit of 1.5 💎TON</a>
            )}

            <br/>

            {connected && (
                <a onClick={() => {
                    sendWithdrawalRequest()
                }}>Request 0.7 💎TON withdrawal</a>
            )}
        </>
    )
}

export default App
