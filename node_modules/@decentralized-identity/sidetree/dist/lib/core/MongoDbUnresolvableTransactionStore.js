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
const Logger_1 = require("../common/Logger");
const mongodb_1 = require("mongodb");
const MongoDbStore_1 = require("../common/MongoDbStore");
/**
 * Implementation of `IUnresolvableTransactionStore` that stores the transaction data in a MongoDB database.
 */
class MongoDbUnresolvableTransactionStore extends MongoDbStore_1.default {
    /**
     * Creates a new instance of this object.
     * @param serverUrl The target server url.
     * @param databaseName The database name where the collection should be saved.
     * @param retryExponentialDelayFactor
     *   The exponential delay factor in milliseconds for retries of unresolvable transactions.
     *   e.g. if it is set to 1 seconds, then the delays for retries will be 1 second, 2 seconds, 4 seconds... until the transaction can be resolved.
     */
    constructor(serverUrl, databaseName, retryExponentialDelayFactor) {
        super(serverUrl, MongoDbUnresolvableTransactionStore.unresolvableTransactionCollectionName, databaseName);
        this.exponentialDelayFactorInMilliseconds = 60000;
        this.maximumUnresolvableTransactionReturnCount = 100;
        if (retryExponentialDelayFactor !== undefined) {
            this.exponentialDelayFactorInMilliseconds = retryExponentialDelayFactor;
        }
    }
    recordUnresolvableTransactionFetchAttempt(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            // Try to get the unresolvable transaction from store.
            const transactionTime = transaction.transactionTime;
            const transactionNumber = transaction.transactionNumber;
            const searchFilter = { transactionTime, transactionNumber: mongodb_1.Long.fromNumber(transactionNumber) };
            const findResults = yield this.collection.find(searchFilter).toArray();
            let unresolvableTransaction;
            if (findResults && findResults.length > 0) {
                unresolvableTransaction = findResults[0];
            }
            // If unresolvable transaction not found in store, insert a new one; else update the info on retry attempts.
            if (unresolvableTransaction === undefined) {
                const newUnresolvableTransaction = {
                    anchorString: transaction.anchorString,
                    transactionTime,
                    transactionNumber: mongodb_1.Long.fromNumber(transactionNumber),
                    transactionTimeHash: transaction.transactionTimeHash,
                    transactionFeePaid: transaction.transactionFeePaid,
                    normalizedTransactionFee: transaction.normalizedTransactionFee,
                    writer: transaction.writer,
                    // Additional properties used for retry logic below.
                    firstFetchTime: Date.now(),
                    retryAttempts: 0,
                    nextRetryTime: Date.now()
                };
                yield this.collection.insertOne(newUnresolvableTransaction);
            }
            else {
                const retryAttempts = unresolvableTransaction.retryAttempts + 1;
                // Exponentially delay the retry the more attempts are done in the past.
                const anchorString = transaction.anchorString;
                const requiredElapsedTimeSinceFirstFetchBeforeNextRetry = Math.pow(2, unresolvableTransaction.retryAttempts) * this.exponentialDelayFactorInMilliseconds;
                const requiredElapsedTimeInSeconds = requiredElapsedTimeSinceFirstFetchBeforeNextRetry / 1000;
                Logger_1.default.info(`Record transaction ${transactionNumber} with anchor string ${anchorString} to retry after ${requiredElapsedTimeInSeconds} seconds.`);
                const nextRetryTime = unresolvableTransaction.firstFetchTime + requiredElapsedTimeSinceFirstFetchBeforeNextRetry;
                const searchFilter = { transactionTime, transactionNumber: mongodb_1.Long.fromNumber(transactionNumber) };
                yield this.collection.updateOne(searchFilter, { $set: { retryAttempts, nextRetryTime } });
            }
        });
    }
    removeUnresolvableTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionTime = transaction.transactionTime;
            const transactionNumber = transaction.transactionNumber;
            yield this.collection.deleteOne({ transactionTime, transactionNumber: mongodb_1.Long.fromNumber(transactionNumber) });
        });
    }
    getUnresolvableTransactionsDueForRetry(maximumReturnCount) {
        return __awaiter(this, void 0, void 0, function* () {
            // Override the return count if it is specified.
            let returnCount = this.maximumUnresolvableTransactionReturnCount;
            if (maximumReturnCount !== undefined) {
                returnCount = maximumReturnCount;
            }
            const now = Date.now();
            const unresolvableTransactionsToRetry = yield this.collection.find({ nextRetryTime: { $lte: now } }).sort({ nextRetryTime: 1 }).limit(returnCount).toArray();
            return unresolvableTransactionsToRetry;
        });
    }
    removeUnresolvableTransactionsLaterThan(transactionNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            // If given `undefined`, remove all transactions.
            if (transactionNumber === undefined) {
                yield this.clearCollection();
                return;
            }
            yield this.collection.deleteMany({ transactionNumber: { $gt: mongodb_1.Long.fromNumber(transactionNumber) } });
        });
    }
    /**
     * Gets the list of unresolvable transactions.
     * Mainly used for test purposes.
     */
    getUnresolvableTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.collection.find().sort({ transactionTime: 1, transactionNumber: 1 }).toArray();
            return transactions;
        });
    }
    /**
     * @inheritDoc
     */
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.createIndex({ transactionTime: 1, transactionNumber: 1 }, { unique: true });
            yield this.collection.createIndex({ nextRetryTime: 1 });
        });
    }
}
exports.default = MongoDbUnresolvableTransactionStore;
/** Collection name for unresolvable transactions. */
MongoDbUnresolvableTransactionStore.unresolvableTransactionCollectionName = 'unresolvable-transactions';
//# sourceMappingURL=MongoDbUnresolvableTransactionStore.js.map