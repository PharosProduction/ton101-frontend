import { address } from '@ton/core';
import { OnchainNftContent } from './NftItemTypes';

export const offchainNftContent = 'https://ipfs.io/ipfs/bafkreigdpnfbru6turpzkvuslg36vregf4lfglwoj3ko5yjpwg252p25di';

export function onchainNftContent(walletAddress: string): OnchainNftContent {
    return {
        name: "Ludo Rank NFT v3",
        description: `Web3 score of the TON wallet ${walletAddress}`,
        attributes: [
            {"trait_type":"Rank", "value": "72"},
            {"trait_type":"Tier", "value":"platinum"},
            {"trait_type":"Blockchain", "value": "ton"},
            {"trait_type":"Wallet", "value":`${walletAddress}`},
            {"trait_type":"Version", "value":"1.0.0"},
            {"trait_type":"Deploy", "value":"manual"}
        ],
        image: "https://www.ludo.ninja/public/video/frames/LR-NFT-231.png",
        video: "https://www.youtube.com/watch?v=mVTV97CGLMk",
        animationUrl: "https://www.youtube.com/watch?v=mVTV97CGLMk",
        rank: "72",
        tier: "platinum",
        blockchain: "ton",
        wallet: address(walletAddress),
        version: "1.0.0"
    }
}

export const nftIndexZero: number = 0;
export const nftIsInited: number = -1;
export const nftNotInited: number = 0;