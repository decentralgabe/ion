/// <reference types="node" />
import BitcoinBlockModel from './models/BitcoinBlockModel';
/**
 * Parser for raw bitcoin block data
 */
export default class BitcoinRawDataParser {
    /**
     * The beginning of each block contains the magic bytes indicating main or test net
     * followed by a 4 byte number indicating how big the block data is
     */
    private static magicBytes;
    private static magicBytesLength;
    private static sizeBytesLength;
    /**
     * Parse the given raw block data file. It can throw error if block data is invalid when validating magic bytes,
     * creating new Block, or validating size
     * @param rawBlockDataFileBuffer The file, in buffer form, to be parsed as blocks
     */
    static parseRawDataFile(rawBlockDataFileBuffer: Buffer): BitcoinBlockModel[];
    private static getBlockHeightFromBlock;
}
