import './App.css'
import {Locales, TonConnectButton, useTonConnectUI} from "@tonconnect/ui-react";
import {fromNano} from "@ton/core";
import WebApp from "@twa-dev/sdk";
import {useNftCollectionContract} from "./hooks/useNftCollectionContract.ts";
import {useEffect, useState} from "react";

function App() {
    const [tonConnectUI, setOptions] = useTonConnectUI();
    const connected = tonConnectUI.connected;

    const onLanguageChange = (lang: string) => {
        setOptions({ language: lang as Locales });
    };

    const [rank, setRank] = useState<number | null>(null);
    const [tier, setTier] = useState<string | null>(null);
    const [totalNfts, setTotalNfts] = useState<number | null>(null);
    const [tonNfts, setTonNfts] = useState<number | null>(null);
    const [polygonNfts, setPolygonNfts] = useState<number | null>(null);
    const [mvxNfts, setMvxNfts] = useState<number | null>(null);

    const {
        contract_address: nftCollectionContractAddress,
        contract_balance: nftCollectionContractBalance,
        nextItemIndex,
        content,
        ownerAddress,
        sendDeployNft,
        sendEditNft
    } = useNftCollectionContract();

    tonConnectUI.connectionRestored.then(restored => {
        if (restored) {
            console.log(
                'Connection restored. Wallet:',
                JSON.stringify({
                    ...tonConnectUI.wallet
                })
            );
        } else {
            console.log('Connection was not restored.');
        }
    });

    useEffect(() => {
        if (!tonConnectUI.wallet?.account.address) return;

        fetch(`https://telegram.ludo.ninja:8060/wallets/rank?blockchain=ton&address=${tonConnectUI.wallet?.account.address}`, {
            method: 'GET',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Accept': 'application/json; charset=UTF-8',
                'x-client-authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJuaW5qYS5sdWRvIiwic3ViIjoidGctYm90IiwiYXVkIjoidXNlcnMiLCJpYXQiOjE3MTQ0NjU4NDEsImV4cCI6MTc0NjAwMTg0MSwianRpIjoiNTRhYjkyOGUtZmVmMy00YjUzLWE4ZDctYjI3NmNlMTM5YmQ3Iiwic2hvd05zZnciOnRydWUsInJvbGUiOiJjb21wYW55IiwiYXV0aG9yaXRpZXMiOlsiU0VBUkNIIl0sInRhcmlmZiI6IkVYVEVOU0lPTiJ9.DZ7JqpceNXiH8fSjN2ynBWdtBgGSZ-_O9DLMAaaRwwmflqluHQJeZBr5sjP-BC7eDL1avOTEmjcnmre8aXhwbg',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setRank(data.rank);
            })
            .catch(() => {
                setRank(0)
            });

        const currentWallet = tonConnectUI.wallet;
        console.log("CURRENT WALLET:", currentWallet);
        const currentAccount = tonConnectUI.account;
        console.log("CURRENT ACCOUNT:", currentAccount);
        const currentIsConnectedStatus = tonConnectUI.connected;
        console.log("CURRENT CONNECTED STATUS:", currentIsConnectedStatus);
    }, [tonConnectUI.wallet?.account.address]);

    useEffect(() => {
        fetch(`https://counters.ludo.ninja:8090/minting/stats`, {
            method: 'GET',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Accept': 'application/json; charset=UTF-8',
                'x-client-authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJuaW5qYS5sdWRvIiwic3ViIjoidGctYm90IiwiYXVkIjoidXNlcnMiLCJpYXQiOjE3MTQ0NjU4NDEsImV4cCI6MTc0NjAwMTg0MSwianRpIjoiNTRhYjkyOGUtZmVmMy00YjUzLWE4ZDctYjI3NmNlMTM5YmQ3Iiwic2hvd05zZnciOnRydWUsInJvbGUiOiJjb21wYW55IiwiYXV0aG9yaXRpZXMiOlsiU0VBUkNIIl0sInRhcmlmZiI6IkVYVEVOU0lPTiJ9.DZ7JqpceNXiH8fSjN2ynBWdtBgGSZ-_O9DLMAaaRwwmflqluHQJeZBr5sjP-BC7eDL1avOTEmjcnmre8aXhwbg',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setTotalNfts(data.total);
                setTonNfts(0);
                setPolygonNfts(0);
                setMvxNfts(0);
            })
            .catch(() => {
                setTotalNfts(0);
                setTonNfts(0);
                setPolygonNfts(0);
                setMvxNfts(0);
            });
    }, []);

    useEffect(() => {
        if (!tonConnectUI.wallet?.account.address) return;

        fetch(`https://telegram.ludo.ninja:8060/tiers/ton/${tonConnectUI.wallet?.account.address}`, {
            method: 'GET',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Accept': 'application/json; charset=UTF-8',
                'x-client-authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJuaW5qYS5sdWRvIiwic3ViIjoidGctYm90IiwiYXVkIjoidXNlcnMiLCJpYXQiOjE3MTQ0NjU4NDEsImV4cCI6MTc0NjAwMTg0MSwianRpIjoiNTRhYjkyOGUtZmVmMy00YjUzLWE4ZDctYjI3NmNlMTM5YmQ3Iiwic2hvd05zZnciOnRydWUsInJvbGUiOiJjb21wYW55IiwiYXV0aG9yaXRpZXMiOlsiU0VBUkNIIl0sInRhcmlmZiI6IkVYVEVOU0lPTiJ9.DZ7JqpceNXiH8fSjN2ynBWdtBgGSZ-_O9DLMAaaRwwmflqluHQJeZBr5sjP-BC7eDL1avOTEmjcnmre8aXhwbg',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.errors !== null) {
                    setTier("User not found");
                } else {
                    setTier(data.tier);
                }
            })
            .catch(() => {
                setTier("User not found");
            });
    }, [tonConnectUI.wallet?.account.address]);

    return (
        <div className="container">
            <div className="row flex-row">
                <div className="col-sm-12 col-md m-2">
                    <div className="card p-4">
                        <b>Total NFTs</b>
                        <div className='Hint'>{totalNfts}</div>
                        <br/>
                        <b>TON NFTs</b>
                        <div className='Hint'>{tonNfts}</div>
                        <br/>
                        <b>Polygon NFTs</b>
                        <div className='Hint'>{polygonNfts}</div>
                        <br/>
                        <b>MultiversX NFTs</b>
                        <div className='Hint'>{mvxNfts}</div>
                        <br/>
                    </div>
                </div>

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

                        <b>Ludo Rank</b>
                        <div className='Hint'>{rank !== null ? rank : "Unable to calculate rank"}</div>
                        <br/>

                        <b>Ludo Tier</b>
                        <div className='Hint'>{tier !== null ? tier : "Unknown user"}</div>
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
                                sendDeployNft(rank || 0, tier || "Basic")
                            }}>I want Ludo NFT</button>
                        )}
                        {connected && (
                            <button onClick={() => {
                                sendEditNft()
                            }}>Edit with new content</button>
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
// <br/>e
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
