import {beginCell, Builder, DictionaryValue, Slice, toNano} from '@ton/core';
import { MintParams } from './NftCollectionTypes';
import { decodeOffChainContent, encodeOffChainContent } from '../utils/offchainEncoding';

export class BatchMintParams implements DictionaryValue<MintParams> {

  serialize(src: MintParams, cell: Builder): void {
    cell.storeCoins(toNano(src.nftBalance.toString())); // nft balance
    cell.storeRef(encodeOffChainContent(src.nftContent));
    cell.storeUint(src.nftRank!, 32);
    cell.storeRef(beginCell().storeStringTail(src.nftTier!).endCell());
  }

  parse(cell: Slice): MintParams {
    const nftBalance = Number(cell.loadCoins());
    const nftContent = decodeOffChainContent(cell.loadRef())!;
    const nftRank = cell.loadUint(32);
    const nftTier = cell.loadStringTail();

    return { nftBalance, nftContent, nftRank, nftTier };
  }
}