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
const mongodb_1 = require("mongodb");
const Logger_1 = require("../common/Logger");
const MongoDbStore_1 = require("./MongoDbStore");
/**
 * Implementation of ITransactionStore that stores the transaction data in a MongoDB database.
 */
class MongoDbTransactionStore extends MongoDbStore_1.default {
    /**
     * Creates a new instance of this object.
     * @param serverUrl The target server url.
     * @param databaseName The database name where the collection should be saved.
     */
    constructor(serverUrl, databaseName) {
        super(serverUrl, MongoDbTransactionStore.transactionCollectionName, databaseName);
    }
    /**
     * Returns the number of transactions in the store.
     * Mainly used by tests.
     */
    getTransactionsCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionCount = yield this.collection.count();
            return transactionCount;
        });
    }
    getTransaction(transactionNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.collection.find({ transactionNumber: mongodb_1.Long.fromNumber(transactionNumber) }).toArray();
            if (transactions.length === 0) {
                return undefined;
            }
            const transaction = transactions[0];
            return transaction;
        });
    }
    getTransactionsLaterThan(transactionNumber, max) {
        return __awaiter(this, void 0, void 0, function* () {
            let transactions = [];
            try {
                let dbCursor;
                // If given `undefined`, return transactions from the start.
                if (transactionNumber === undefined) {
                    dbCursor = this.collection.find();
                }
                else {
                    dbCursor = this.collection.find({ transactionNumber: { $gt: mongodb_1.Long.fromNumber(transactionNumber) } });
                }
                // If a limit is defined then set it.
                if (max) {
                    dbCursor = dbCursor.limit(max);
                }
                // Sort the output
                dbCursor = dbCursor.sort({ transactionNumber: 1 });
                // Fetch the transactions
                transactions = yield dbCursor.toArray();
            }
            catch (error) {
                Logger_1.default.error(error);
            }
            return transactions;
        });
    }
    addTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transactionInMongoDb = {
                    anchorString: transaction.anchorString,
                    // NOTE: MUST force `transactionNumber` to be Int64 in MondoDB.
                    transactionNumber: mongodb_1.Long.fromNumber(transaction.transactionNumber),
                    transactionTime: transaction.transactionTime,
                    transactionTimeHash: transaction.transactionTimeHash,
                    transactionFeePaid: transaction.transactionFeePaid,
                    normalizedTransactionFee: transaction.normalizedTransactionFee,
                    writer: transaction.writer
                };
                yield this.collection.insertOne(transactionInMongoDb);
            }
            catch (error) {
                // Swallow duplicate insert errors (error code 11000) as no-op; rethrow others
                if (error.code !== 11000) {
                    throw error;
                }
            }
        });
    }
    getLastTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastTransactions = yield this.collection.find().limit(1).sort({ transactionNumber: -1 }).toArray();
            if (lastTransactions.length === 0) {
                return undefined;
            }
            const lastProcessedTransaction = lastTransactions[0];
            return lastProcessedTransaction;
        });
    }
    getExponentiallySpacedTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const exponentiallySpacedTransactions = [];
            const allTransactions = yield this.collection.find().sort({ transactionNumber: 1 }).toArray();
            let index = allTransactions.length - 1;
            let distance = 1;
            while (index >= 0) {
                exponentiallySpacedTransactions.push(allTransactions[index]);
                index -= distance;
                distance *= 2;
            }
            return exponentiallySpacedTransactions;
        });
    }
    removeTransactionsLaterThan(transactionNumber) {
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
     * Remove transactions by transaction time hash
     * @param transactionTimeHash the transaction time hash which the transactions should be removed for
     */
    removeTransactionByTransactionTimeHash(transactionTimeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.deleteMany({ transactionTimeHash: { $eq: transactionTimeHash } });
        });
    }
    /**
     * Gets the list of processed transactions.
     * Mainly used for test purposes.
     */
    getTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.collection.find().sort({ transactionNumber: 1 }).toArray();
            return transactions;
        });
    }
    /**
     * Gets a list of transactions between the bounds of transaction time. The smaller value will be inclusive while the bigger be exclusive
     * @param inclusiveBeginTransactionTime The first transaction time to begin querying for
     * @param exclusiveEndTransactionTime The transaction time to stop querying for
     */
    getTransactionsStartingFrom(inclusiveBeginTransactionTime, exclusiveEndTransactionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor;
            if (inclusiveBeginTransactionTime === exclusiveEndTransactionTime) {
                // if begin === end, query for 1 transaction time
                cursor = this.collection.find({ transactionTime: { $eq: mongodb_1.Long.fromNumber(inclusiveBeginTransactionTime) } });
            }
            else {
                cursor = this.collection.find({
                    $and: [
                        { transactionTime: { $gte: mongodb_1.Long.fromNumber(inclusiveBeginTransactionTime) } },
                        { transactionTime: { $lt: mongodb_1.Long.fromNumber(exclusiveEndTransactionTime) } }
                    ]
                });
            }
            const transactions = yield cursor.sort({ transactionNumber: 1 }).toArray();
            return transactions;
        });
    }
    /**
     * @inheritDoc
     */
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.createIndex({ transactionNumber: 1 }, { unique: true });
        });
    }
}
exports.default = MongoDbTransactionStore;
/** Collection name for transactions. */
MongoDbTransactionStore.transactionCollectionName = 'transactions';
//# sourceMappingURL=MongoDbTransactionStore.js.map