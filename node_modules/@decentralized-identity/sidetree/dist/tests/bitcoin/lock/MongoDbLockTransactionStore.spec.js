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
const MongoDb_1 = require("../../common/MongoDb");
const MongoDbLockTransactionStore_1 = require("../../../lib/bitcoin/lock/MongoDbLockTransactionStore");
const SavedLockType_1 = require("../../../lib/bitcoin/enums/SavedLockType");
function createLockStore(transactionStoreUri, databaseName) {
    return __awaiter(this, void 0, void 0, function* () {
        const lockStore = new MongoDbLockTransactionStore_1.default(transactionStoreUri, databaseName);
        yield lockStore.initialize();
        return lockStore;
    });
}
function generateAndStoreLocks(lockStore, count) {
    return __awaiter(this, void 0, void 0, function* () {
        const locks = [];
        for (let i = 1; i <= count; i++) {
            const lock = {
                transactionId: i.toString(),
                desiredLockAmountInSatoshis: i * 1000,
                rawTransaction: `serialized txn - ${i}`,
                redeemScriptAsHex: `redeem-script-${i}`,
                type: getLockTypeFromIndex(i),
                createTimestamp: (Date.now() + i * 1000)
            };
            yield lockStore.addLock(lock);
            locks.push(lock);
        }
        return locks;
    });
}
function getLockTypeFromIndex(i) {
    return (i % 3 === 0) ? SavedLockType_1.default.Create
        : (i % 3 === 1) ? SavedLockType_1.default.Relock
            : SavedLockType_1.default.ReturnToWallet;
}
describe('MongoDbLockTransactionStore', () => __awaiter(void 0, void 0, void 0, function* () {
    const config = require('../../json/config-test.json');
    const databaseName = 'sidetree-test';
    let lockStore;
    const originalDefaultTestTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000; // These asynchronous tests can take a bit longer than normal.
        yield MongoDb_1.default.createInmemoryDb(config);
        lockStore = yield createLockStore(config.mongoDbConnectionString, databaseName);
    }));
    afterAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalDefaultTestTimeout;
    });
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield lockStore.clearCollection();
    }));
    it('should create collections needed on initialization if they do not exist.', () => __awaiter(void 0, void 0, void 0, function* () {
        console.info(`Deleting collections...`);
        const client = yield mongodb_1.MongoClient.connect(config.mongoDbConnectionString);
        const db = client.db(databaseName);
        yield db.dropCollection(MongoDbLockTransactionStore_1.default.lockCollectionName);
        console.info(`Verify collections no longer exist.`);
        let collections = yield db.collections();
        let collectionNames = collections.map(collection => collection.collectionName);
        expect(collectionNames.includes(MongoDbLockTransactionStore_1.default.lockCollectionName)).toBeFalsy();
        console.info(`Trigger initialization.`);
        yield lockStore.initialize();
        console.info(`Verify collection exists now.`);
        collections = yield db.collections();
        collectionNames = collections.map(collection => collection.collectionName);
        expect(collectionNames.includes(MongoDbLockTransactionStore_1.default.lockCollectionName)).toBeTruthy();
    }));
    it('should get the latest lock.', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockLocks = yield generateAndStoreLocks(lockStore, 10);
        const expectedLastLock = mockLocks[mockLocks.length - 1];
        const lastLock = yield lockStore.getLastLock();
        expect(lastLock).toBeDefined();
        delete lastLock['_id']; // _id is added by mongo; remove for equality check
        expect(lastLock).toEqual(expectedLastLock);
    }));
    it('should return undefined if there is no locks saved.', () => __awaiter(void 0, void 0, void 0, function* () {
        const lastLock = yield lockStore.getLastLock();
        expect(lastLock).not.toBeDefined();
    }));
}));
//# sourceMappingURL=MongoDbLockTransactionStore.spec.js.map