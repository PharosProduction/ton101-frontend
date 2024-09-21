import './App.css'
import {Locales, TonConnectButton, useTonConnectUI} from "@tonconnect/ui-react";
import {fromNano} from "@ton/core";
import WebApp from "@twa-dev/sdk";
import {useNftCollectionContract} from "./hooks/useNftCollectionContract.ts";

function App() {
    const [tonConnectUI, setOptions] = useTonConnectUI();
    const connected = tonConnectUI.connected;

    const onLanguageChange = (lang: string) => {
        setOptions({ language: lang as Locales });
    };

    const {
        contract_address: nftCollectionContractAddress,
        contract_balance: nftCollectionContractBalance,
        nextItemIndex,
        content,
        ownerAddress,
        sendDeployNft
    } = useNftCollectionContract();

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

                        <b>Sender Address</b>
                        <div className='Hint'>{tonConnectUI.wallet?.account.address}</div>
                        <br/>
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

                        <div>
                            <label>language</label>
                            <br/>
                            <select onChange={e => onLanguageChange(e.target.value)}>
                                <option value="en">en</option>
                                <option value="ru">ru</option>
                            </select>
                        </div>

                        <br/>

                        {connected && (
                            <button onClick={() => {
                                sendDeployNft()
                            }}>I want Ludo NFT</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App

// < div
// className = "col-sm-12 col-md m-2" >
//     < div
// className = 'card p-4' >
//     < b > Counter
// Address < /b>
// <div className='Hint'>{mainContractAddress}</div>
// <br/>
//
// <b>Counter Balance</b>
// <div className='Hint'>{fromNano(`${mainContractBalance}`).toString()} 💎TON</div>
// <br/>
//
// <b>Counter Value</b>
// <div>{counter_value ?? "Loading..."}</div>
//
// <br/>
// <br/>
//
// {
//     connected && (
//         <button onClick={() => {
//             sendIncrement()
//         }}>Increment by 2</button>
//     )
// }
// <br/>
// <br/>
// {
//     connected && (
//         <button onClick={() => {
//             sendDeposit()
//         }}>Request deposit of 1.5 💎TON</button>
//     )
// }
// <br/>
// <br/>
// {
//     connected && (
//         <button onClick={() => {
//             sendWithdrawalRequest()
//         }}>Request 0.7 💎TON withdrawal</button>
//     )
// }
// </div>
// </div>


// <br/>
// <br/>
// {WebApp.platform !== "unknown" && <button onClick={() => {
//         showAlert()
//     }}>Show alert</button>}
// <br/>
// <br/>
// {WebApp.platform !== "unknown" && <MainButton text="Test Submit" onClick={() => alert('submitted')}/>}
// {WebApp.platform !== "unknown" && <BackButton onClick={() => {
//     alert('Test back');
//     window.history.back();
// }}/>}

//
// const showAlert = () => {
//     WebApp.showAlert("Hi");
// };
