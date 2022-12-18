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
const SortedArray_1 = require("../core/util/SortedArray");
/**
 * In-memory implementation of the `TransactionStore`.
 */
class MockTransactionStore {
    constructor() {
        this.processedTransactions = [];
        this.unresolvableTransactions = new Map();
    }
    addTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const lastTransaction = yield this.getLastTransaction();
            // If the last transaction is later or equal to the transaction to add,
            // then we know this is a transaction previously processed, so no need to add it again.
            if (lastTransaction && lastTransaction.transactionNumber >= transaction.transactionNumber) {
                return;
            }
            this.processedTransactions.push(transaction);
        });
    }
    getLastTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.processedTransactions.length === 0) {
                return undefined;
            }
            const lastProcessedTransactionIndex = this.processedTransactions.length - 1;
            const lastProcessedTransaction = this.processedTransactions[lastProcessedTransactionIndex];
            return lastProcessedTransaction;
        });
    }
    getExponentiallySpacedTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const exponentiallySpacedTransactions = [];
            let index = this.processedTransactions.length - 1;
            let distance = 1;
            while (index >= 0) {
                exponentiallySpacedTransactions.push(this.processedTransactions[index]);
                index -= distance;
                distance *= 2;
            }
            return exponentiallySpacedTransactions;
        });
    }
    getTransaction(_transactionNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Not implemented.');
        });
    }
    getTransactionsLaterThan(transactionNumber, max) {
        return __awaiter(this, void 0, void 0, function* () {
            let transactions = this.processedTransactions;
            if (transactionNumber !== undefined) {
                transactions = transactions.filter(entry => entry.transactionTime > transactionNumber);
            }
            if (max !== undefined) {
                transactions = transactions.slice(0, max);
            }
            return transactions;
        });
    }
    recordUnresolvableTransactionFetchAttempt(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const unresolvableTransaction = this.unresolvableTransactions.get(transaction.transactionNumber);
            if (unresolvableTransaction === undefined) {
                const unresolvableTransaction = {
                    transaction,
                    firstFetchTime: Date.now(),
                    retryAttempts: 0,
                    nextRetryTime: Date.now()
                };
                this.unresolvableTransactions.set(transaction.transactionNumber, unresolvableTransaction);
            }
            else {
                unresolvableTransaction.retryAttempts++;
                // Exponentially delay the retry the more attempts are done in the past.
                const exponentialFactorInMilliseconds = 60000;
                const requiredElapsedTimeSinceFirstFetchBeforeNextRetry = Math.pow(2, unresolvableTransaction.retryAttempts) * exponentialFactorInMilliseconds;
                const requiredElapsedTimeInSeconds = requiredElapsedTimeSinceFirstFetchBeforeNextRetry / 1000;
                const anchorString = transaction.anchorString;
                const transactionNumber = transaction.transactionNumber;
                console.info(`Record transaction ${transactionNumber} with anchor string ${anchorString} to retry after ${requiredElapsedTimeInSeconds} seconds.`);
                unresolvableTransaction.nextRetryTime = unresolvableTransaction.firstFetchTime + requiredElapsedTimeSinceFirstFetchBeforeNextRetry;
            }
        });
    }
    removeUnresolvableTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.unresolvableTransactions.delete(transaction.transactionNumber);
        });
    }
    getUnresolvableTransactionsDueForRetry() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const unresolvableTransactionsToRetry = [];
            // Iterate to get all unresolvable transactions that are due for retrying.
            for (const value of this.unresolvableTransactions.values()) {
                // Calculate the expected next time of retry.
                if (now > value.nextRetryTime) {
                    unresolvableTransactionsToRetry.push(value.transaction);
                }
            }
            return unresolvableTransactionsToRetry;
        });
    }
    removeTransactionsLaterThan(transactionNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            // If given `undefined`, remove all transactions.
            if (transactionNumber === undefined) {
                this.processedTransactions = [];
                return;
            }
            // Locate the index of the given transaction using binary search.
            const compareTransactionAndTransactionNumber = (transaction, transactionNumber) => { return transaction.transactionNumber - transactionNumber; };
            const bestKnownValidRecentProcessedTransactionIndex = SortedArray_1.default.binarySearch(this.processedTransactions, transactionNumber, compareTransactionAndTransactionNumber);
            // The following conditions should never be possible.
            if (bestKnownValidRecentProcessedTransactionIndex === undefined) {
                throw Error(`Unable to locate processed transaction: ${transactionNumber}`);
            }
            console.info(`Reverting ${this.processedTransactions.length - bestKnownValidRecentProcessedTransactionIndex - 1} transactions...`);
            this.processedTransactions.splice(bestKnownValidRecentProcessedTransactionIndex + 1);
        });
    }
    removeUnresolvableTransactionsLaterThan(transactionNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            // If given `undefined`, remove all unresolvable transactions.
            if (transactionNumber === undefined) {
                this.unresolvableTransactions = new Map();
                return;
            }
            // Find all unresolvable transactions greater than the given transaction number.
            const invalidUnresolvableTransactionNumbers = [];
            for (const key of this.unresolvableTransactions.keys()) {
                if (key > transactionNumber) {
                    invalidUnresolvableTransactionNumbers.push(key);
                }
            }
            // Remove every invalid unresolvable transactions.
            for (const key of invalidUnresolvableTransactionNumbers) {
                this.unresolvableTransactions.delete(key);
            }
        });
    }
    /**
     * Gets the list of transactions.
     * Mainly used for test purposes.
     */
    getTransactions() {
        return this.processedTransactions;
    }
    getTransactionsStartingFrom(inclusiveBeginTransactionTime, exclusiveEndTransactionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            if (inclusiveBeginTransactionTime === exclusiveEndTransactionTime) {
                return this.processedTransactions.filter((transaction) => { return transaction.transactionTime === inclusiveBeginTransactionTime; });
            }
            else {
                return this.processedTransactions.filter((transaction) => {
                    return transaction.transactionTime >= inclusiveBeginTransactionTime &&
                        transaction.transactionTime < exclusiveEndTransactionTime;
                });
            }
        });
    }
}
exports.default = MockTransactionStore;
//# sourceMappingURL=MockTransactionStore.js.map