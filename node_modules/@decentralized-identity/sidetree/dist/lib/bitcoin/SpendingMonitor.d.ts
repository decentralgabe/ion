import ITransactionStore from '../core/interfaces/ITransactionStore';
/**
 * Encapsulates the functionality to calculate the amount of spending that the
 * service is doing.
 */
export default class SpendingMonitor {
    private bitcoinFeeSpendingCutoffPeriodInBlocks;
    private bitcoinFeeSpendingCutoffInSatoshis;
    private transactionStore;
    private anchorStringsWritten;
    constructor(bitcoinFeeSpendingCutoffPeriodInBlocks: number, bitcoinFeeSpendingCutoffInSatoshis: number, transactionStore: ITransactionStore);
    /**
     * Add the transaction data to track the spending.
     * @param anchorString The string to be written.
     */
    addTransactionDataBeingWritten(anchorString: string): void;
    /**
     * Calculates whether the specified fee will keep this node within the spending limits.
     * @param currentFeeInSatoshis The fee to be added for the next transaction.
     * @param startingBlockHeight The block height to start the check for the cutoff period.
     */
    isCurrentFeeWithinSpendingLimit(currentFeeInSatoshis: number, lastProcessedBlockHeight: number): Promise<boolean>;
    /**
     * Finds the transactions which were written by this node. Really added to help with unit testing.
     * @param transactionsFromStore
     */
    private findTransactionsWrittenByThisNode;
}
