"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BitcoinClient_1 = require("./BitcoinClient");
const bitcore_lib_1 = require("bitcore-lib");
const ErrorCode_1 = require("./ErrorCode");
const Logger_1 = require("../common/Logger");
const SidetreeError_1 = require("../common/SidetreeError");
/**
 * Parser for raw bitcoin block data
 */
class BitcoinRawDataParser {
    /**
     * Parse the given raw block data file. It can throw error if block data is invalid when validating magic bytes,
     * creating new Block, or validating size
     * @param rawBlockDataFileBuffer The file, in buffer form, to be parsed as blocks
     */
    static parseRawDataFile(rawBlockDataFileBuffer) {
        // Expect raw block data to be in the format of
        // <MagicBytes 4 bytes><SizeBytes 4 bytes><BlockData n bytes><MagicBytes><SizeBytes><BlockData>...repeating
        const processedBlocks = [];
        let count = 0;
        let cursor = 0;
        // loop through each block within the buffer
        while (cursor < rawBlockDataFileBuffer.length) {
            // first 4 bytes are magic bytes
            const actualMagicBytes = rawBlockDataFileBuffer.subarray(cursor, cursor + BitcoinRawDataParser.magicBytesLength);
            if (actualMagicBytes.equals(BitcoinRawDataParser.magicBytes.skip)) {
                break;
            }
            if (!actualMagicBytes.equals(BitcoinRawDataParser.magicBytes.mainnet) &&
                !actualMagicBytes.equals(BitcoinRawDataParser.magicBytes.testnet) &&
                !actualMagicBytes.equals(BitcoinRawDataParser.magicBytes.regtest)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.BitcoinRawDataParserInvalidMagicBytes, `${actualMagicBytes.toString('hex')} at cursor position ${cursor} is not valid bitcoin mainnet, testnet or regtest magic bytes`);
            }
            cursor += BitcoinRawDataParser.magicBytesLength;
            // next 4 bytes must be a the size bytes in Uint little endian
            // denoting how many bytes worth of block data are after it
            const blockSizeInBytes = rawBlockDataFileBuffer.readUInt32LE(cursor);
            cursor += BitcoinRawDataParser.sizeBytesLength;
            // the next n bytes are the block data
            const blockData = rawBlockDataFileBuffer.subarray(cursor, cursor + blockSizeInBytes);
            cursor += blockSizeInBytes;
            let block;
            try {
                block = new bitcore_lib_1.Block(blockData);
            }
            catch (e) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.BitcoinRawDataParserInvalidBlockData, e);
            }
            const blockHeight = BitcoinRawDataParser.getBlockHeightFromBlock(block, actualMagicBytes);
            const transactionModels = BitcoinClient_1.default.convertToBitcoinTransactionModels(block);
            processedBlocks.push({
                hash: block.hash,
                height: blockHeight,
                previousHash: Buffer.from(block.header.prevHash).reverse().toString('hex'),
                transactions: transactionModels
            });
            count++;
        }
        Logger_1.default.info(`Finished processing ${count} blocks from raw block file`);
        return processedBlocks;
    }
    static getBlockHeightFromBlock(block, magicBytes) {
        // the first transaction, the coinbase, contains the block height in its input
        const coinbaseInputScript = block.transactions[0].inputs[0]._scriptBuffer;
        // this denotes how many bytes following represent the block height
        const heightBytes = coinbaseInputScript.readUInt8(0);
        let blockHeight;
        // for regtest blocks 1-16 the blockheight is recorded as 0x51..0x60 (Decimal 81..96) with no heightBytes so adjust this here if it is encountered
        // see: https://bitcoin.stackexchange.com/questions/97116/why-is-the-data-format-for-block-height-in-coinbase-scriptsigs-inconsistent-for
        if (magicBytes.equals(BitcoinRawDataParser.magicBytes.regtest) &&
            heightBytes > 80 && heightBytes < 97) {
            blockHeight = heightBytes - 80;
        }
        else {
            // the next n bytes are the block height in little endian
            blockHeight = coinbaseInputScript.readUIntLE(1, heightBytes);
        }
        return blockHeight;
    }
}
exports.default = BitcoinRawDataParser;
/**
 * The beginning of each block contains the magic bytes indicating main or test net
 * followed by a 4 byte number indicating how big the block data is
 */
BitcoinRawDataParser.magicBytes = {
    testnet: Buffer.from('0b110907', 'hex'),
    mainnet: Buffer.from('f9beb4d9', 'hex'),
    regtest: Buffer.from('fabfb5da', 'hex'),
    skip: Buffer.from('00000000', 'hex') // this means to skip the rest of the file
};
BitcoinRawDataParser.magicBytesLength = 4;
BitcoinRawDataParser.sizeBytesLength = 4;
//# sourceMappingURL=BitcoinRawDataParser.js.map