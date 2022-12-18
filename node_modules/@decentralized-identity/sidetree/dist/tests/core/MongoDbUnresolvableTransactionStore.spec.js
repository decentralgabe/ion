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
const MongoDb_1 = require("../common/MongoDb");
const MongoDbUnresolvableTransactionStore_1 = require("../../lib/core/MongoDbUnresolvableTransactionStore");
/**
 * Creates a MongoDbUnresolvableTransactionStore and initializes it.
 */
function createIUnresolvableTransactionStore(transactionStoreUri, databaseName) {
    return __awaiter(this, void 0, void 0, function* () {
        const unresolvableTransactionStore = new MongoDbUnresolvableTransactionStore_1.default(transactionStoreUri, databaseName, 1);
        yield unresolvableTransactionStore.initialize();
        return unresolvableTransactionStore;
    });
}
/**
 * Generates transactions where all the properties are initialized to the 1-based index of the transaction.
 * e.g. First transaction will have all properties assigned as 1 or '1';
 * @param count Number of transactions to generate.
 */
function generateTransactions(count) {
    return __awaiter(this, void 0, void 0, function* () {
        const transactions = [];
        for (let i = 1; i <= count; i++) {
            const transaction = {
                anchorString: i.toString(),
                transactionNumber: i,
                transactionTime: i,
                transactionTimeHash: i.toString(),
                transactionFeePaid: 1,
                normalizedTransactionFee: 1,
                writer: 'writer'
            };
            transactions.push(transaction);
        }
        return transactions;
    });
}
/**
 * Verifies an `UnresolvableTransactionModel` against the expected `TransactionModel`.
 */
function verifyUnresolvableTransactionModel(actual, expected) {
    return __awaiter(this, void 0, void 0, function* () {
        const actualCopy = Object.assign({}, actual);
        delete actualCopy._id; // For removing the _id property assigned from MongoDB.
        delete actualCopy.firstFetchTime;
        delete actualCopy.nextRetryTime;
        delete actualCopy.retryAttempts;
        expect(actualCopy).toEqual(expected);
    });
}
describe('MongoDbUnresolvableTransactionStore', () => __awaiter(void 0, void 0, void 0, function* () {
    const config = require('../json/config-test.json');
    const databaseName = 'sidetree-test';
    let store;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield MongoDb_1.default.createInmemoryDb(config);
        store = yield createIUnresolvableTransactionStore(config.mongoDbConnectionString, databaseName);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield store.clearCollection();
    }));
    it('should create collection needed on initialization if they do not exist.', () => __awaiter(void 0, void 0, void 0, function* () {
        console.info(`Deleting collections...`);
        const client = yield mongodb_1.MongoClient.connect(config.mongoDbConnectionString);
        const db = client.db(databaseName);
        yield db.dropCollection(MongoDbUnresolvableTransactionStore_1.default.unresolvableTransactionCollectionName);
        console.info(`Verify collections no longer exist.`);
        let collections = yield db.collections();
        let collectionNames = collections.map(collection => collection.collectionName);
        expect(collectionNames.includes(MongoDbUnresolvableTransactionStore_1.default.unresolvableTransactionCollectionName)).toBeFalsy();
        console.info(`Trigger initialization.`);
        yield store.initialize();
        console.info(`Verify collection exists now.`);
        collections = yield db.collections();
        collectionNames = collections.map(collection => collection.collectionName);
        expect(collectionNames.includes(MongoDbUnresolvableTransactionStore_1.default.unresolvableTransactionCollectionName)).toBeTruthy();
    }));
    it('should record and update unresolvable transactions', () => __awaiter(void 0, void 0, void 0, function* () {
        const transactionCount = 10;
        const transactions = yield generateTransactions(transactionCount);
        // Simulate the first 3 transactions as unresolvable.
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[0]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[1]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[2]);
        let unresolvableTransactions = yield store.getUnresolvableTransactions();
        expect(unresolvableTransactions.length).toEqual(3);
        verifyUnresolvableTransactionModel(unresolvableTransactions[0], transactions[0]);
        verifyUnresolvableTransactionModel(unresolvableTransactions[1], transactions[1]);
        verifyUnresolvableTransactionModel(unresolvableTransactions[2], transactions[2]);
        // Simulate the first transaction as failing retry attempt again.
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[0]);
        unresolvableTransactions = yield store.getUnresolvableTransactions();
        expect(unresolvableTransactions.length).toEqual(3);
        expect(unresolvableTransactions[0].retryAttempts).toEqual(1);
    }));
    it('should be able to remove an existing unresolvable transactions', () => __awaiter(void 0, void 0, void 0, function* () {
        const transactionCount = 10;
        const transactions = yield generateTransactions(transactionCount);
        // Simulate the first 3 transactions as unresolvable.
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[0]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[1]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[2]);
        let unresolvableTransactions = yield store.getUnresolvableTransactions();
        expect(unresolvableTransactions.length).toEqual(3);
        // Remove the 2nd unresolvable transaction.
        yield store.removeUnresolvableTransaction(transactions[1]);
        unresolvableTransactions = yield store.getUnresolvableTransactions();
        expect(unresolvableTransactions.length).toEqual(2);
        // Expect that we can no longer find the originally 2nd unresolvable transaction.
        const unresolvableTransactionNumbers = unresolvableTransactions.map(transaction => transaction.transactionNumber);
        expect(unresolvableTransactionNumbers.includes(2)).toBeFalsy();
    }));
    it('should be able to limit the number of unresolvable transactions returned for processing retry.', () => __awaiter(void 0, void 0, void 0, function* () {
        const transactionCount = 10;
        const transactions = yield generateTransactions(transactionCount);
        // Simulate the first 3 transactions as unresolvable.
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[0]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[1]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[2]);
        let unresolvableTransactions = yield store.getUnresolvableTransactions();
        expect(unresolvableTransactions.length).toEqual(3);
        // Get only 2 unresolvable transactions due for retry.
        const maxReturnCount = 2;
        let unresolvableTransactionsDueForRetry = yield store.getUnresolvableTransactionsDueForRetry(maxReturnCount);
        expect(unresolvableTransactionsDueForRetry.length).toEqual(2);
        // Simulate successful resolution of the 2 returned transactions and removing them from the store.
        for (const transaction of unresolvableTransactionsDueForRetry) {
            yield store.removeUnresolvableTransaction(transaction);
        }
        unresolvableTransactions = yield store.getUnresolvableTransactions();
        expect(unresolvableTransactions.length).toEqual(1);
        // Get remaining 1 unresolvable transaction due for retry.
        unresolvableTransactionsDueForRetry = yield store.getUnresolvableTransactionsDueForRetry();
        expect(unresolvableTransactionsDueForRetry.length).toEqual(1);
        // Simulate successful resolution of the 1 returned transaction and removing it from the store.
        for (const transaction of unresolvableTransactionsDueForRetry) {
            yield store.removeUnresolvableTransaction(transaction);
        }
        unresolvableTransactions = yield store.getUnresolvableTransactions();
        expect(unresolvableTransactions.length).toEqual(0);
    }));
    it('should be able to delete transactions greater than a given transaction time.', () => __awaiter(void 0, void 0, void 0, function* () {
        const transactionCount = 10;
        const transactions = yield generateTransactions(transactionCount);
        // Simulate the transactions 4, 5, 6 as unresolvable.
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[3]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[4]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[5]);
        // Deleting all transactions that are later than transaction number 5.
        yield store.removeUnresolvableTransactionsLaterThan(5);
        // Expecting only transaction 4 & 5 are unresolvable transactions.
        const unresolvableTransactions = yield store.getUnresolvableTransactions();
        expect(unresolvableTransactions.length).toEqual(2);
        const unresolvableTransactionNumbers = unresolvableTransactions.map(transaction => transaction.transactionNumber);
        expect(unresolvableTransactionNumbers.includes(4)).toBeTruthy();
        expect(unresolvableTransactionNumbers.includes(5)).toBeTruthy();
    }));
    it('should be able to delete all transactions.', () => __awaiter(void 0, void 0, void 0, function* () {
        const transactionCount = 10;
        const transactions = yield generateTransactions(transactionCount);
        // Simulate the transactions 4, 5, 6 as unresolvable.
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[3]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[4]);
        yield store.recordUnresolvableTransactionFetchAttempt(transactions[5]);
        // Deleting all transactions by not passing any argument.
        yield store.removeUnresolvableTransactionsLaterThan();
        const unresolvableTransactions = yield store.getUnresolvableTransactions();
        expect(unresolvableTransactions.length).toEqual(0);
    }));
}));
//# sourceMappingURL=MongoDbUnresolvableTransactionStore.spec.js.map