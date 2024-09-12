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
        <div className="container">
            <div className="row flex-row">
                <div className="col-sm-12 col-md m-2">
                    <div className="card p-4">
                        <TonConnectButton/>
                        <br/>
                        <br/>
                        <b>Platform</b>
                        <div className='Hint'>{WebApp.platform}</div>
                        <br/>
                        <br/>
                        {WebApp.platform !== "unknown" && <button onClick={() => {
                            showAlert()
                        }}>Show alert</button>}
                        <br/>
                        <br/>
                        {WebApp.platform !== "unknown" && <MainButton text="Test Submit" onClick={() => alert('submitted')}/>}
                        {WebApp.platform !== "unknown" && <BackButton onClick={() => {
                            alert('Test back');
                            window.history.back();
                        }}/>}
                        <br/>
                    </div>
                </div>

                <div className="col-sm-12 col-md m-2">
                    <div className='card p-4'>
                        <b>Counter Address</b>
                        <div className='Hint'>{mainContractAddress}</div>
                        <br/>

                        <b>Counter Balance</b>
                        <div className='Hint'>{fromNano(`${mainContractBalance}`).toString()} 💎TON</div>
                        <br/>

                        <b>Counter Value</b>
                        <div>{counter_value ?? "Loading..."}</div>

                        <br/>
                        <br/>

                        {connected && (
                            <button onClick={() => {
                                sendIncrement()
                            }}>Increment by 2</button>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <button onClick={() => {
                                sendDeposit()
                            }}>Request deposit of 1.5 💎TON</button>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <button onClick={() => {
                                sendWithdrawalRequest()
                            }}>Request 0.7 💎TON withdrawal</button>
                        )}
                    </div>
                </div>

                <div className="col-sm-12 col-md m-2">
                    <div className='card p-4'>
                        <b>NFT Collection Address</b>
                        <div className='Hint'>{nftCollectionContractAddress}</div>
                        <br/>

                        <b>NFT Collection Balance</b>
                        <div className='Hint'>{fromNano(`${nftCollectionContractBalance}`).toString()} 💎TON</div>
                        <br/>

                        <b>NFT Collection Owner</b>
                        <div className='Hint'>{ownerAddress}</div>
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
                            <button onClick={() => {
                                sendDeployNft()
                            }}>Deploy NFT</button>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <button onClick={() => {
                                sendBatchDeployNft()
                            }}>Batch deploy NFTs</button>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <button onClick={() => {
                                sendRoyaltyParams()
                            }}>Send royalty params</button>
                        )}
                        <br/>
                        <br/>
                        {connected && (
                            <button onClick={() => {
                                sendChangeOwner()
                            }}>Change owner</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
