import './App.css'
import {TonConnectButton} from "@tonconnect/ui-react";
import {useMainContract} from "./hooks/useMainContract.ts";
import {useTonConnect} from "./hooks/useTonConnect.ts";
import {fromNano} from "@ton/core";
import WebApp from "@twa-dev/sdk";
import {BackButton, MainButton} from "@twa-dev/sdk/react";
import {useNftCollectionContract} from "./hooks/useNftCollectionContract.ts";

function App() {
    const {
        contract_address: mainContractAddress,
        contract_balance: mainContractBalance,
        counter_value,
        // recent_sender,
        // owner,
        sendIncrement,
        sendDeposit,
        sendWithdrawalRequest
    } = useMainContract();

    const {
        contract_address: nftCollectionContractAddress,
        contract_balance: nftCollectionContractBalance,
        nextItemIndex,
        content,
        ownerAddress,
        sendDeployNft,
        sendBatchDeployNft,
        sendRoyaltyParams,
        sendChangeOwner
    } = useNftCollectionContract();

    const {connected} = useTonConnect();

    const showAlert = () => {
        WebApp.showAlert("Hi");
    };

    return (
        <div className="parent">
            <div className="row">
                <div className="column">
                    <div className="Card">
                        <TonConnectButton/>
                    </div>
                </div>

                <div className="column">
                    <div className='Card'>
                        <b>Platform</b>
                        <div className='Hint'>{WebApp.platform}</div>

                        {WebApp.platform !== "unknown" && <a onClick={() => {
                            showAlert()
                        }}>Show alert</a>}

                        {WebApp.platform !== "unknown" && <MainButton text="Test Submit" onClick={() => alert('submitted')}/>}
                        {WebApp.platform !== "unknown" && <BackButton onClick={() => {
                            alert('Test back');
                            window.history.back();
                        }}/>}
                        <br/>

                        <b>Counter Address</b>
                        <div className='Hint'>{mainContractAddress?.slice(0, 30) + "..."}</div>
                        <br/>

                        <b>Counter Balance</b>
                        <div className='Hint'>{fromNano(`${mainContractBalance}`).toString()} "💎TON"</div>
                        <br/>

                        <b>Counter Value</b>
                        <div>{counter_value ?? "Loading..."}</div>

                        <br/>
                        <br/>

                        {connected && (
                            <a onClick={() => {
                                sendIncrement()
                            }}>Increment by 2</a>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <a onClick={() => {
                                sendDeposit()
                            }}>Request deposit of 1.5 💎TON</a>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <a onClick={() => {
                                sendWithdrawalRequest()
                            }}>Request 0.7 💎TON withdrawal</a>
                        )}
                    </div>
                </div>

                <div className="column">
                    <div className='Card'>
                        <b>NFT Collection Address</b>
                        <div className='Hint'>{nftCollectionContractAddress?.slice(0, 30) + "..."}</div>
                        <br/>

                        <b>NFT Collection Balance</b>
                        <div className='Hint'>{fromNano(`${nftCollectionContractBalance}`).toString()} "💎TON"</div>
                        <br/>

                        <b>NFT Collection Owner</b>
                        <div className='Hint'>{ownerAddress?.slice(0, 30) + "..."}</div>
                        <br/>

                        <b>NFTs in Collection</b>
                        <div className='Hint'>{nextItemIndex}</div>
                        <br/>

                        <b>NFT Collection Content</b>
                        <div className='Hint'>{content}</div>
                        <br/>

                        <br/>
                        <br/>

                        {connected && (
                            <a onClick={() => {
                                sendDeployNft()
                            }}>Deploy NFT</a>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <a onClick={() => {
                                sendBatchDeployNft()
                            }}>Batch deploy NFTs</a>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <a onClick={() => {
                                sendRoyaltyParams()
                            }}>Send royalty params</a>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <a onClick={() => {
                                sendChangeOwner()
                            }}>Change owner</a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
