import {beginCell, Builder, Cell, ContractProvider, Sender, SendMode, toNano} from '@ton/core';

// Public

// The first 32 bits must match the text comment op code `0x00000000` and the remaining - UTF-8 encoded text.
export function createComment(comment: string | null, body: Builder) {
    if (comment === null) return body

    const msgCell = beginCell()
        .storeStringTail(comment)
        .endCell();
    body.storeBit(0);
    body.storeRef(msgCell);
}

export function sendInternal(provider: ContractProvider, via: Sender, deposit: number, body: Cell | null): Promise<void> {
    try {
        return provider.internal(via, {
            value: toNano(deposit.toString()),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body
        });
    } catch (err) {
        console.log("ERR sendInternal:", err);
        return Promise.reject(err);
    }
}