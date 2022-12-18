"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeSpan = require("time-span");
const TransactionUnderProcessingModel_1 = require("./models/TransactionUnderProcessingModel");
const EventCode_1 = require("./EventCode");
const EventEmitter_1 = require("../common/EventEmitter");
const Logger_1 = require("../common/Logger");
const SharedErrorCode_1 = require("../common/SharedErrorCode");
const SidetreeError_1 = require("../common/SidetreeError");
const ThroughputLimiter_1 = require("./ThroughputLimiter");
/**
 * Class that performs periodic processing of batches of Sidetree operations anchored to the blockchain.
 */
class Observer {
    constructor(versionManager, blockchain, maxConcurrentDownloads, operationStore, transactionStore, unresolvableTransactionStore, confirmationStore, observingIntervalInSeconds) {
        this.versionManager = versionManager;
        this.blockchain = blockchain;
        this.maxConcurrentDownloads = maxConcurrentDownloads;
        this.operationStore = operationStore;
        this.transactionStore = transactionStore;
        this.unresolvableTransactionStore = unresolvableTransactionStore;
        this.confirmationStore = confirmationStore;
        this.observingIntervalInSeconds = observingIntervalInSeconds;
        /**
         * Denotes if the periodic transaction processing should continue to occur.
         * Used mainly for test purposes.
         */
        this.continuePeriodicProcessing = false;
        /**
         * The list of transactions that are being downloaded or processed.
         */
        this.transactionsUnderProcessing = [];
        this.throughputLimiter = new ThroughputLimiter_1.default(versionManager);
    }
    /**
     * The method that starts the periodic polling and processing of Sidetree operations.
     */
    startPeriodicProcessing() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Starting periodic transactions processing.`);
            setImmediate(() => __awaiter(this, void 0, void 0, function* () {
                this.continuePeriodicProcessing = true;
                this.processTransactions();
            }));
        });
    }
    /**
     * Stops periodic transaction processing.
     * Mainly used for test purposes.
     */
    stopPeriodicProcessing() {
        Logger_1.default.info(`Stopped periodic transactions processing.`);
        this.continuePeriodicProcessing = false;
    }
    /**
     * Processes new transactions if any, then reprocess a set of unresolvable transactions if any,
     * then schedules the next round of processing unless `stopPeriodicProcessing()` is invoked.
     */
    processTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Optional update to store the processed transactions that completed in between the polling periods.
                yield this.storeThenTrimConsecutiveTransactionsProcessed();
                // Keep fetching new Sidetree transactions from blockchain and processing them
                // until there are no more new transactions or there is a block reorganization.
                let moreTransactions = false;
                do {
                    if (this.cursorTransaction === undefined) {
                        this.cursorTransaction = yield this.transactionStore.getLastTransaction();
                    }
                    const cursorTransactionNumber = this.cursorTransaction ? this.cursorTransaction.transactionNumber : undefined;
                    const cursorTransactionTimeHash = this.cursorTransaction ? this.cursorTransaction.transactionTimeHash : undefined;
                    const cursorTransactionTime = this.cursorTransaction ? this.cursorTransaction.transactionTime : 0;
                    let invalidTransactionNumberOrTimeHash = false;
                    let readResult;
                    const endTimer = timeSpan(); // Measure time taken to go blockchain read.
                    try {
                        Logger_1.default.info('Fetching Sidetree transactions from blockchain service...');
                        readResult = yield this.blockchain.read(cursorTransactionNumber, cursorTransactionTimeHash);
                        Logger_1.default.info(`Fetched ${readResult.transactions.length} Sidetree transactions from blockchain service in ${endTimer.rounded()} ms.`);
                    }
                    catch (error) {
                        if (error instanceof SidetreeError_1.default && error.code === SharedErrorCode_1.default.InvalidTransactionNumberOrTimeHash) {
                            Logger_1.default.info(`Invalid transaction number ${cursorTransactionNumber} or time hash ${cursorTransactionTimeHash} given to blockchain service.`);
                            invalidTransactionNumberOrTimeHash = true;
                        }
                        else {
                            throw error;
                        }
                    }
                    const transactions = readResult ? readResult.transactions : [];
                    moreTransactions = readResult ? readResult.moreTransactions : false;
                    // Set the cursor for fetching of next transaction batch in the next loop.
                    if (transactions.length > 0) {
                        this.cursorTransaction = transactions[transactions.length - 1];
                    }
                    // Queue parallel downloading and processing of chunk files.
                    let qualifiedTransactions = yield this.throughputLimiter.getQualifiedTransactions(transactions);
                    qualifiedTransactions = qualifiedTransactions.sort((a, b) => { return a.transactionNumber - b.transactionNumber; });
                    for (const transaction of qualifiedTransactions) {
                        const transactionUnderProcessing = {
                            transaction: transaction,
                            processingStatus: TransactionUnderProcessingModel_1.TransactionProcessingStatus.Processing
                        };
                        this.transactionsUnderProcessing.push(transactionUnderProcessing);
                        // Intentionally not awaiting on downloading and processing each operation batch.
                        this.processTransaction(transaction, transactionUnderProcessing);
                    }
                    // NOTE: Blockchain reorg has happened for sure only if `invalidTransactionNumberOrTimeHash` AND
                    // latest transaction time is less or equal to blockchain service time.
                    // This check will prevent Core from reverting transactions if/when blockchain service is re-initializing its data itself.
                    let blockReorganizationDetected = false;
                    if (invalidTransactionNumberOrTimeHash) {
                        const latestBlockchainTime = yield this.blockchain.getLatestTime();
                        if (cursorTransactionTime <= latestBlockchainTime.time) {
                            blockReorganizationDetected = true;
                            moreTransactions = true;
                        }
                        else {
                            Logger_1.default.info(`Blockchain microservice blockchain time is behind last known transaction time, waiting for blockchain microservice to catch up...`);
                        }
                    }
                    // If block reorg is detected, we must wait until no more operation processing is pending,
                    // then revert invalid transaction and operations.
                    if (blockReorganizationDetected) {
                        Logger_1.default.info(`Block reorganization detected.`);
                        EventEmitter_1.default.emit(EventCode_1.default.SidetreeObserverBlockReorganization);
                        yield Observer.waitUntilCountOfTransactionsUnderProcessingIsLessOrEqualTo(this.transactionsUnderProcessing, 0);
                        yield this.storeThenTrimConsecutiveTransactionsProcessed(); // This is an optional optimization to give best the chance of minimal revert dataset.
                        Logger_1.default.info(`Reverting invalid transactions...`);
                        yield this.revertInvalidTransactions();
                        Logger_1.default.info(`Completed reverting invalid transactions.`);
                        this.cursorTransaction = undefined;
                    }
                    else {
                        // Else it means all transactions fetched are good for processing.
                        // We hold off from fetching more transactions if the list of transactions under processing gets too long.
                        // We will wait for count of transaction being processed to fall to the maximum allowed concurrent downloads
                        // before attempting further transaction fetches.
                        yield Observer.waitUntilCountOfTransactionsUnderProcessingIsLessOrEqualTo(this.transactionsUnderProcessing, this.maxConcurrentDownloads);
                        yield this.storeThenTrimConsecutiveTransactionsProcessed();
                        // If there is an error in processing a transaction that PREVENTS processing subsequent Sidetree transactions from the blockchain
                        // (e.g. A DB outage/error that prevents us from recording a transaction for retries),
                        // erase the entire list transactions under processing since processing MUST not advance beyond the transaction that failed processing.
                        const hasErrorInTransactionProcessing = this.hasErrorInTransactionProcessing();
                        if (hasErrorInTransactionProcessing) {
                            // Step to defend against potential uncontrolled growth in `transactionsUnderProcessing` array size due to looping.
                            yield Observer.waitUntilCountOfTransactionsUnderProcessingIsLessOrEqualTo(this.transactionsUnderProcessing, 0);
                            yield this.storeThenTrimConsecutiveTransactionsProcessed();
                            // Clear the the entire list of transactions under processing since we have cannot advance further due to error.
                            this.transactionsUnderProcessing = [];
                            this.cursorTransaction = undefined;
                        }
                    }
                } while (moreTransactions);
                Logger_1.default.info('Successfully kicked off downloading/processing of all new Sidetree transactions.');
                // Continue onto processing unresolvable transactions if any.
                yield this.processUnresolvableTransactions();
                EventEmitter_1.default.emit(EventCode_1.default.SidetreeObserverLoopSuccess);
            }
            catch (error) {
                EventEmitter_1.default.emit(EventCode_1.default.SidetreeObserverLoopFailure);
                Logger_1.default.error(`Encountered unhandled and possibly fatal Observer error, must investigate and fix:`);
                Logger_1.default.error(error);
            }
            finally {
                if (this.continuePeriodicProcessing) {
                    Logger_1.default.info(`Waiting for ${this.observingIntervalInSeconds} seconds before fetching and processing transactions again.`);
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () { return this.processTransactions(); }), this.observingIntervalInSeconds * 1000);
                }
            }
        });
    }
    /**
     * Gets the total count of the transactions given that are still under processing.
     */
    static getCountOfTransactionsUnderProcessing(transactionsUnderProcessing) {
        const countOfTransactionsUnderProcessing = transactionsUnderProcessing.filter(transaction => transaction.processingStatus === TransactionUnderProcessingModel_1.TransactionProcessingStatus.Processing).length;
        return countOfTransactionsUnderProcessing;
    }
    /**
     * Returns true if at least processing of one transaction resulted in an error that prevents advancement of transaction processing.
     */
    hasErrorInTransactionProcessing() {
        const firstTransactionProcessingError = this.transactionsUnderProcessing.find(transaction => transaction.processingStatus === TransactionUnderProcessingModel_1.TransactionProcessingStatus.Error);
        return (firstTransactionProcessingError !== undefined);
    }
    static waitUntilCountOfTransactionsUnderProcessingIsLessOrEqualTo(transactionsUnderProcessing, count) {
        return __awaiter(this, void 0, void 0, function* () {
            let countOfTransactionsUnderProcessing = Observer.getCountOfTransactionsUnderProcessing(transactionsUnderProcessing);
            while (countOfTransactionsUnderProcessing > count) {
                // Wait a little before checking again.
                yield new Promise(resolve => setTimeout(resolve, 1000));
                countOfTransactionsUnderProcessing = Observer.getCountOfTransactionsUnderProcessing(transactionsUnderProcessing);
            }
        });
    }
    /**
     * Attempts to fetch and process unresolvable transactions due for retry.
     * Waits until all unresolvable transactions due for retry are processed.
     */
    processUnresolvableTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Processing previously unresolvable transactions if any...`);
            const endTimer = timeSpan();
            const unresolvableTransactions = yield this.unresolvableTransactionStore.getUnresolvableTransactionsDueForRetry();
            Logger_1.default.info(`Fetched ${unresolvableTransactions.length} unresolvable transactions to retry in ${endTimer.rounded()} ms.`);
            // Download and process each unresolvable transactions.
            const unresolvableTransactionStatus = [];
            for (const transaction of unresolvableTransactions) {
                const awaitingTransaction = {
                    transaction: transaction,
                    processingStatus: TransactionUnderProcessingModel_1.TransactionProcessingStatus.Processing
                };
                unresolvableTransactionStatus.push(awaitingTransaction);
                // Intentionally not awaiting on downloading and processing each operation batch.
                this.processTransaction(transaction, awaitingTransaction);
            }
            yield Observer.waitUntilCountOfTransactionsUnderProcessingIsLessOrEqualTo(unresolvableTransactionStatus, 0);
        });
    }
    /**
     * Goes through `transactionsUnderProcessing` in chronological order, records every consecutive processed transaction in the transaction store,
     * then remove them from `transactionsUnderProcessing` and update the in memory `lastConsecutivelyProcessedTransaction`.
     *
     * NOTE: this excludes transaction processing that resulted in `TransactionProcessingStatus.Error`,
     * because such error includes the case when the code fails to store the transaction to the retry table for future retry,
     * adding it to the transaction table means such transaction won't be processed again, resulting in missing operation data.
     * @returns The last transaction consecutively processed.
     */
    storeThenTrimConsecutiveTransactionsProcessed() {
        return __awaiter(this, void 0, void 0, function* () {
            let lastConsecutivelyProcessedTransaction;
            let i = 0;
            while (i < this.transactionsUnderProcessing.length &&
                this.transactionsUnderProcessing[i].processingStatus === TransactionUnderProcessingModel_1.TransactionProcessingStatus.Processed) {
                lastConsecutivelyProcessedTransaction = this.transactionsUnderProcessing[i].transaction;
                yield this.transactionStore.addTransaction(lastConsecutivelyProcessedTransaction);
                i++;
            }
            // Trim off consecutive transactions that are processed successfully.
            this.transactionsUnderProcessing.splice(0, i);
        });
    }
    /**
     * Processes the given transaction by passing the transaction to the right version of the transaction processor based on the transaction time.
     * The transaction processing generically involves first downloading DID operation data from CAS (Content Addressable Storage),
     * then storing the operations indexed/grouped by DIDs in the persistent operation DB.
     */
    processTransaction(transaction, transactionUnderProcessing) {
        return __awaiter(this, void 0, void 0, function* () {
            let transactionProcessedSuccessfully;
            try {
                const transactionProcessor = this.versionManager.getTransactionProcessor(transaction.transactionTime);
                transactionProcessedSuccessfully = yield transactionProcessor.processTransaction(transaction);
            }
            catch (error) {
                Logger_1.default.error(`Unhandled error encountered processing transaction '${transaction.transactionNumber}'.`);
                Logger_1.default.error(error);
                transactionProcessedSuccessfully = false;
            }
            Logger_1.default.info(`Transaction ${transaction.anchorString} is confirmed at ${transaction.transactionTime}`);
            yield this.confirmationStore.confirm(transaction.anchorString, transaction.transactionTime);
            if (transactionProcessedSuccessfully) {
                Logger_1.default.info(`Removing transaction '${transaction.transactionNumber}' from unresolvable transactions if exists...`);
                this.unresolvableTransactionStore.removeUnresolvableTransaction(transaction); // Skip await since failure is not a critical and results in a retry.
            }
            else {
                try {
                    Logger_1.default.info(`Recording failed processing attempt for transaction '${transaction.transactionNumber}'...`);
                    yield this.unresolvableTransactionStore.recordUnresolvableTransactionFetchAttempt(transaction);
                }
                catch (error) {
                    transactionUnderProcessing.processingStatus = TransactionUnderProcessingModel_1.TransactionProcessingStatus.Error;
                    Logger_1.default.error(`Error encountered saving unresolvable transaction '${transaction.transactionNumber}' for retry.`);
                    Logger_1.default.error(error);
                    return;
                }
            }
            Logger_1.default.info(`Finished processing transaction '${transaction.transactionNumber}'.`);
            transactionUnderProcessing.processingStatus = TransactionUnderProcessingModel_1.TransactionProcessingStatus.Processed;
        });
    }
    /**
     * Reverts invalid transactions. Used in the event of a block-reorganization.
     */
    revertInvalidTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            // Compute a list of exponentially-spaced transactions with their index, starting from the last transaction of the processed transactions.
            const exponentiallySpacedTransactions = yield this.transactionStore.getExponentiallySpacedTransactions();
            // Find a known valid Sidetree transaction that is prior to the block reorganization.
            const bestKnownValidRecentTransaction = yield this.blockchain.getFirstValidTransaction(exponentiallySpacedTransactions);
            const bestKnownValidRecentTransactionNumber = bestKnownValidRecentTransaction === undefined ? undefined : bestKnownValidRecentTransaction.transactionNumber;
            Logger_1.default.info(`Best known valid recent transaction: ${bestKnownValidRecentTransactionNumber}`);
            // Revert all processed operations that came after the best known valid recent transaction.
            Logger_1.default.info('Reverting operations...');
            yield this.operationStore.delete(bestKnownValidRecentTransactionNumber);
            yield this.unresolvableTransactionStore.removeUnresolvableTransactionsLaterThan(bestKnownValidRecentTransactionNumber);
            yield this.confirmationStore.resetAfter(bestKnownValidRecentTransaction === null || bestKnownValidRecentTransaction === void 0 ? void 0 : bestKnownValidRecentTransaction.transactionTime);
            // NOTE: MUST do steps below LAST in this particular order to handle incomplete operation rollback due to unexpected scenarios, such as power outage etc.
            yield this.transactionStore.removeTransactionsLaterThan(bestKnownValidRecentTransactionNumber);
        });
    }
}
exports.default = Observer;
//# sourceMappingURL=Observer.js.map