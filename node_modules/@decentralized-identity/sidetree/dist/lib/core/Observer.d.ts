import IBlockchain from './interfaces/IBlockchain';
import IConfirmationStore from './interfaces/IConfirmationStore';
import IOperationStore from './interfaces/IOperationStore';
import ITransactionStore from './interfaces/ITransactionStore';
import IUnresolvableTransactionStore from './interfaces/IUnresolvableTransactionStore';
import IVersionManager from './interfaces/IVersionManager';
/**
 * Class that performs periodic processing of batches of Sidetree operations anchored to the blockchain.
 */
export default class Observer {
    private versionManager;
    private blockchain;
    private maxConcurrentDownloads;
    private operationStore;
    private transactionStore;
    private unresolvableTransactionStore;
    private confirmationStore;
    private observingIntervalInSeconds;
    /**
     * Denotes if the periodic transaction processing should continue to occur.
     * Used mainly for test purposes.
     */
    private continuePeriodicProcessing;
    /**
     * The list of transactions that are being downloaded or processed.
     */
    private transactionsUnderProcessing;
    /**
     * This is the transaction that is used as a cursor/timestamp to fetch newer transaction.
     */
    private cursorTransaction;
    private throughputLimiter;
    constructor(versionManager: IVersionManager, blockchain: IBlockchain, maxConcurrentDownloads: number, operationStore: IOperationStore, transactionStore: ITransactionStore, unresolvableTransactionStore: IUnresolvableTransactionStore, confirmationStore: IConfirmationStore, observingIntervalInSeconds: number);
    /**
     * The method that starts the periodic polling and processing of Sidetree operations.
     */
    startPeriodicProcessing(): Promise<void>;
    /**
     * Stops periodic transaction processing.
     * Mainly used for test purposes.
     */
    stopPeriodicProcessing(): void;
    /**
     * Processes new transactions if any, then reprocess a set of unresolvable transactions if any,
     * then schedules the next round of processing unless `stopPeriodicProcessing()` is invoked.
     */
    private processTransactions;
    /**
     * Gets the total count of the transactions given that are still under processing.
     */
    private static getCountOfTransactionsUnderProcessing;
    /**
     * Returns true if at least processing of one transaction resulted in an error that prevents advancement of transaction processing.
     */
    private hasErrorInTransactionProcessing;
    private static waitUntilCountOfTransactionsUnderProcessingIsLessOrEqualTo;
    /**
     * Attempts to fetch and process unresolvable transactions due for retry.
     * Waits until all unresolvable transactions due for retry are processed.
     */
    private processUnresolvableTransactions;
    /**
     * Goes through `transactionsUnderProcessing` in chronological order, records every consecutive processed transaction in the transaction store,
     * then remove them from `transactionsUnderProcessing` and update the in memory `lastConsecutivelyProcessedTransaction`.
     *
     * NOTE: this excludes transaction processing that resulted in `TransactionProcessingStatus.Error`,
     * because such error includes the case when the code fails to store the transaction to the retry table for future retry,
     * adding it to the transaction table means such transaction won't be processed again, resulting in missing operation data.
     * @returns The last transaction consecutively processed.
     */
    private storeThenTrimConsecutiveTransactionsProcessed;
    /**
     * Processes the given transaction by passing the transaction to the right version of the transaction processor based on the transaction time.
     * The transaction processing generically involves first downloading DID operation data from CAS (Content Addressable Storage),
     * then storing the operations indexed/grouped by DIDs in the persistent operation DB.
     */
    private processTransaction;
    /**
     * Reverts invalid transactions. Used in the event of a block-reorganization.
     */
    private revertInvalidTransactions;
}
