"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorCode_1 = require("./ErrorCode");
const SidetreeError_1 = require("../common/SidetreeError");
/**
 * Defines the TransactionNumber as a combination of block number and transaction index within the block.
 */
class TransactionNumber {
    /**
     * Constructs the transaction number given the block number and the transaction index in the block.
     */
    static construct(blockNumber, transactionIndexInBlock) {
        // NOTE: JavaScript can have 53 bit integer before starting to loose precision: 2 ^ 53 = 9,007,199,254,740,992.
        // We allocate first 6 digits for transaction index within a block, and rest of the digits for block number.
        if (transactionIndexInBlock > TransactionNumber.maxTransactionIndexInBlock) {
            throw new SidetreeError_1.default(ErrorCode_1.default.TransactionNumberTransactionIndexInBlockTooLarge, `Position index ${transactionIndexInBlock} given exceeds max allowed value of ${TransactionNumber.maxTransactionIndexInBlock}`);
        }
        // Choosing a nice round number as long as it is less than `9007199254`.
        const maxBlockNumber = 9000000000;
        if (blockNumber > maxBlockNumber) {
            throw new SidetreeError_1.default(ErrorCode_1.default.TransactionNumberBlockNumberTooLarge, `Block number ${blockNumber} given exceeds max allowed value of ${maxBlockNumber}`);
        }
        const transactionNumber = TransactionNumber.privateConstruct(blockNumber, transactionIndexInBlock);
        return transactionNumber;
    }
    /**
     * Internal construction method that assumes inputs are valid/validated.
     */
    static privateConstruct(blockNumber, transactionIndexInBlock) {
        const transactionNumber = blockNumber * TransactionNumber.maxTransactionCountInBlock + transactionIndexInBlock;
        return transactionNumber;
    }
    /**
     * Constructs the transaction number of the last possible transaction of the specified block.
     */
    static lastTransactionOfBlock(blockNumber) {
        return TransactionNumber.privateConstruct(blockNumber, TransactionNumber.maxTransactionIndexInBlock);
    }
    /**
     * Returns the block number component of transactionNumber
     */
    static getBlockNumber(transactionNumber) {
        const blockNumber = Math.trunc(transactionNumber / TransactionNumber.maxTransactionCountInBlock);
        return blockNumber;
    }
}
exports.default = TransactionNumber;
/**
 * Maximum allowed transaction index in a block.
 */
TransactionNumber.maxTransactionIndexInBlock = 999999;
/**
 * Maximum allowed transaction count in a block.
 */
TransactionNumber.maxTransactionCountInBlock = TransactionNumber.maxTransactionIndexInBlock + 1; // 1,000,000
//# sourceMappingURL=TransactionNumber.js.map