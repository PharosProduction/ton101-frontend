import { beginCell, BitBuilder, BitReader, Cell } from '@ton/core';
import { OFFCHAIN_CONTENT_PREFIX } from './constants';

// Public

export function encodeOffChainContent(content: string): Cell {
    let data = Buffer.from(content);
    const prefix = Buffer.from([0x01]);
    data = Buffer.concat([prefix, data]);

    return makeSnakeCell(data);
}

export function decodeOffChainContent(content: Cell | undefined | null): string | null {
    if (!content) {
        throw new Error(`No content`);
    }

    const data = flattenSnakeCell(content);
    const prefix = data[0];

    if (prefix != (OFFCHAIN_CONTENT_PREFIX)) {
        throw new Error(`Unknown content prefix: ${prefix.toString(16)}`);
    }

    return data.slice(1).toString();
}

export function toOffChainTextCell(s: string): Cell {
    return beginCell().storeBuffer(Buffer.from(s)).asCell();
}

// Private

const CELL_MAX_SIZE_BYTES: number = Math.floor((1023 - 8) / 8);

function makeSnakeCell(data: Buffer): Cell {
    const chunks = bufferToChunks(data, CELL_MAX_SIZE_BYTES);

    if (chunks.length === 0) {
        return beginCell().endCell();
    }

    if (chunks.length === 1) {
        return beginCell().storeBuffer(chunks[0]).endCell();
    }

    let curCell = beginCell();

    for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];
        curCell.storeBuffer(chunk);

        if (i - 1 >= 0) {
            const nextCell = beginCell();
            nextCell.storeRef(curCell);
            curCell = nextCell;
        }
    }

    return curCell.endCell();
}

function flattenSnakeCell(cell: Cell): Buffer {
    let c: Cell | null = cell;

    const bitResult = new BitBuilder();
    while (c) {
        const cs = c.beginParse();
        if (cs.remainingBits === 0) {
            break;
        }

        const data = cs.loadBits(cs.remainingBits);
        bitResult.writeBits(data);
        c = c.refs && c.refs[0];
    }

    const endBits = bitResult.build();
    const reader = new BitReader(endBits);

    return reader.loadBuffer(reader.remaining / 8);
}

function bufferToChunks(buff: Buffer, chunkSize: number): Buffer[] {
    const chunks: Buffer[] = [];
    while (buff.byteLength > 0) {
        chunks.push(buff.subarray(0, chunkSize));
        buff = buff.subarray(chunkSize);
    }

    return chunks;
}
