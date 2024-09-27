import { Dictionary, beginCell, Cell, DictionaryKeyTypes } from '@ton/core';
import { sha256_sync } from '@ton/crypto';
import {OnchainCollectionContent} from "../NftCollection/NftCollectionTypes.ts";
import {OnchainNftContent} from "../NftItem/NftItemTypes.ts";

// Public

export function toSha256(s: string): bigint {
    return BigInt(`0x${sha256_sync(s).toString('hex')}`);
}

export function toOnChainTextCell(s: string): Cell {
    return beginCell().storeUint(0, 8).storeStringTail(s).endCell();
}

export function toDictionaryCell<K extends DictionaryKeyTypes, V>(dictionary: Dictionary<K, V>): Cell {
    return beginCell()
        .storeUint(0, 8)  // Store the on-chain prefix
        .storeDict(dictionary)         // Store the dictionary
        .endCell();
}

export function encodeBufferOnChain(buffer: Buffer): Buffer {
    const prefix = Buffer.from([0]);
    return Buffer.concat([prefix, buffer]);
}

export function decodeBufferOnChain(buffer: Buffer): Buffer {
    const prefix = buffer[0];
    if (prefix !== 0) {
        throw new Error(`Unsupported prefix: ${prefix}`);
    }
    return buffer.subarray(1);
}

export function buildCollectionContentCell(content: OnchainCollectionContent): Cell {
    const collectionContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    collectionContentDict.set(toSha256('name'), toOnChainTextCell(content.name));
    collectionContentDict.set(toSha256('description'), toOnChainTextCell(content.description));
    collectionContentDict.set(toSha256('image'), toOnChainTextCell(content.image));
    collectionContentDict.set(toSha256('cover_image'), toOnChainTextCell(content.cover_image));
    collectionContentDict.set(toSha256('external_link'), toOnChainTextCell(content.external_link));
    collectionContentDict.set(toSha256('social_links'), toOnChainTextCell(JSON.stringify(content.social_links)));
    collectionContentDict.set(toSha256('attributes'), toOnChainTextCell(JSON.stringify(content.attributes)));

    return toDictionaryCell(collectionContentDict);
}

export function getItemContentDict(content: OnchainNftContent): Cell {
    const itemContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    itemContentDict.set(toSha256('name'), toOnChainTextCell(content.name));
    itemContentDict.set(toSha256('description'), toOnChainTextCell(content.description));
    itemContentDict.set(toSha256('attributes'), toOnChainTextCell(JSON.stringify(content.attributes)));
    itemContentDict.set(toSha256('image'), toOnChainTextCell(content.image));
    itemContentDict.set(toSha256('animation_url'), toOnChainTextCell(content.animationUrl))
    itemContentDict.set(toSha256('rank'), toOnChainTextCell(content.rank.toString()))
    itemContentDict.set(toSha256('tier'), toOnChainTextCell(content.tier))
    itemContentDict.set(toSha256('blockchain'), toOnChainTextCell(content.blockchain))
    itemContentDict.set(toSha256('wallet'), toOnChainTextCell(content.wallet.toString()))
    itemContentDict.set(toSha256('version'), toOnChainTextCell(content.version))

    return toDictionaryCell(itemContentDict);
}

export function setItemContentCell(content: OnchainNftContent): Cell {
    return getItemContentDict(content);
}