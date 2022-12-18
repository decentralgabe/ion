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
const MongoDbStore_1 = require("../../common/MongoDbStore");
/**
 * Encapsulates functionality to store the bitcoin lock information to Db.
 */
class MongoDbLockTransactionStore extends MongoDbStore_1.default {
    /**
     * Creates a new instance of this object.
     * @param serverUrl The target server url.
     * @param databaseName The database name where the collection should be saved.
     */
    constructor(serverUrl, databaseName) {
        super(serverUrl, MongoDbLockTransactionStore.lockCollectionName, databaseName);
    }
    /**
     * Adds the specified lock information into the database.
     *
     * @param bitcoinLock The lock information to be added.
     */
    addLock(bitcoinLock) {
        return __awaiter(this, void 0, void 0, function* () {
            const lockInMongoDb = {
                desiredLockAmountInSatoshis: bitcoinLock.desiredLockAmountInSatoshis,
                transactionId: bitcoinLock.transactionId,
                rawTransaction: bitcoinLock.rawTransaction,
                redeemScriptAsHex: bitcoinLock.redeemScriptAsHex,
                // NOTE: MUST force 'createTimestamp' to be Int64 in MondoDB.
                createTimestamp: mongodb_1.Long.fromNumber(bitcoinLock.createTimestamp),
                type: bitcoinLock.type
            };
            yield this.collection.insertOne(lockInMongoDb);
        });
    }
    /**
     * Gets the latest lock (highest create timestamp) saved in the db; or undefined if nothing saved.
     */
    getLastLock() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastLocks = yield this.collection
                .find()
                .limit(1)
                .sort({ createTimestamp: -1 })
                .toArray();
            if (!lastLocks || lastLocks.length <= 0) {
                return undefined;
            }
            return lastLocks[0];
        });
    }
    /**
     * @inheritDoc
     */
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.createIndex({ createTimestamp: -1 });
        });
    }
}
exports.default = MongoDbLockTransactionStore;
/** The collection name */
MongoDbLockTransactionStore.lockCollectionName = 'locks';
//# sourceMappingURL=MongoDbLockTransactionStore.js.map