/**
 * Defines the TransactionNumber as a combination of block number and transaction index within the block.
 */
export default class TransactionNumber {
    /**
     * Maximum allowed transaction index in a block.
     */
    private static readonly maxTransactionIndexInBlock;
    /**
     * Maximum allowed transaction count in a block.
     */
    private static readonly maxTransactionCountInBlock;
    /**
     * Constructs the transaction number given the block number and the transaction index in the block.
     */
    static construct(blockNumber: number, transactionIndexInBlock: number): number;
    /**
     * Internal construction method that assumes inputs are valid/validated.
     */
    private static privateConstruct;
    /**
     * Constructs the transaction number of the last possible transaction of the specified block.
     */
    static lastTransactionOfBlock(blockNumber: number): number;
    /**
     * Returns the block number component of transactionNumber
     */
    static getBlockNumber(transactionNumber: number): number;
}
