import { toNano } from '@ton/core';

export const OFFCHAIN_CONTENT_PREFIX = 0x01;
export const ONCHAIN_CONTENT_PREFIX = 0x00;

export const txValue = toNano('0.1');
export const bigTxValue = toNano('0.7');