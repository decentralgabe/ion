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
const MongoDbStore_1 = require("../common/MongoDbStore");
const OperationType_1 = require("./enums/OperationType");
/**
 * Implementation of OperationStore that stores the operation data in
 * a MongoDB database.
 */
class MongoDbOperationStore extends MongoDbStore_1.default {
    constructor(serverUrl, databaseName) {
        super(serverUrl, MongoDbOperationStore.collectionName, databaseName);
    }
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            // This is an unique index, so duplicate inserts are rejected/ignored.
            yield this.collection.createIndex({ didSuffix: 1, txnNumber: 1, opIndex: 1, type: 1 }, { unique: true });
            // The query in `get()` method needs a corresponding composite index in some cloud-based services (CosmosDB 4.0) that supports MongoDB driver.
            yield this.collection.createIndex({ didSuffix: 1, txnNumber: 1, opIndex: 1 }, { unique: true });
            // The query in `get()` method needs a non-composite index on `didSuffix` in some cloud-based services (CosmosDB 4.0) to allow efficient queries.
            yield this.collection.createIndex({ didSuffix: 1 }, { unique: false });
        });
    }
    insertOrReplace(operations) {
        return __awaiter(this, void 0, void 0, function* () {
            const bulkOperations = this.collection.initializeUnorderedBulkOp();
            for (const operation of operations) {
                const mongoOperation = MongoDbOperationStore.convertToMongoOperation(operation);
                bulkOperations.find({
                    didSuffix: operation.didUniqueSuffix,
                    txnNumber: operation.transactionNumber,
                    opIndex: operation.operationIndex,
                    type: operation.type
                }).upsert().replaceOne(mongoOperation);
            }
            yield bulkOperations.execute();
        });
    }
    /**
     * Gets all operations of the given DID unique suffix in ascending chronological order.
     */
    get(didUniqueSuffix) {
        return __awaiter(this, void 0, void 0, function* () {
            const mongoOperations = yield this.collection
                .find({ didSuffix: didUniqueSuffix })
                .sort({ didSuffix: 1, txnNumber: 1, opIndex: 1 })
                .maxTimeMS(MongoDbStore_1.default.defaultQueryTimeoutInMilliseconds)
                .toArray();
            return mongoOperations.map((operation) => { return MongoDbOperationStore.convertToAnchoredOperationModel(operation); });
        });
    }
    delete(transactionNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (transactionNumber) {
                yield this.collection.deleteMany({ txnNumber: { $gt: mongodb_1.Long.fromNumber(transactionNumber) } });
            }
            else {
                yield this.collection.deleteMany({});
            }
        });
    }
    deleteUpdatesEarlierThan(didUniqueSuffix, transactionNumber, operationIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.deleteMany({
                $or: [
                    {
                        didSuffix: didUniqueSuffix,
                        txnNumber: { $lt: mongodb_1.Long.fromNumber(transactionNumber) },
                        type: OperationType_1.default.Update
                    },
                    {
                        didSuffix: didUniqueSuffix,
                        txnNumber: mongodb_1.Long.fromNumber(transactionNumber),
                        opIndex: { $lt: operationIndex },
                        type: OperationType_1.default.Update
                    }
                ]
            });
        });
    }
    /**
     * Convert a Sidetree operation to a more minimal IMongoOperation object
     * that can be stored on MongoDb. The IMongoOperation object has sufficient
     * information to reconstruct the original operation.
     */
    static convertToMongoOperation(operation) {
        return {
            type: operation.type,
            didSuffix: operation.didUniqueSuffix,
            operationBufferBsonBinary: new mongodb_1.Binary(operation.operationBuffer),
            opIndex: operation.operationIndex,
            txnNumber: mongodb_1.Long.fromNumber(operation.transactionNumber),
            txnTime: operation.transactionTime
        };
    }
    /**
     * Convert a MongoDB representation of an operation to a Sidetree operation.
     * Inverse of convertToMongoOperation() method above.
     *
     * Note: mongodb.find() returns an 'any' object that automatically converts longs to numbers -
     * hence the type 'any' for mongoOperation.
     */
    static convertToAnchoredOperationModel(mongoOperation) {
        return {
            type: mongoOperation.type,
            didUniqueSuffix: mongoOperation.didSuffix,
            operationBuffer: mongoOperation.operationBufferBsonBinary.buffer,
            operationIndex: mongoOperation.opIndex,
            transactionNumber: mongoOperation.txnNumber,
            transactionTime: mongoOperation.txnTime
        };
    }
}
exports.default = MongoDbOperationStore;
/** MongoDB collection name under the database where the operations are stored. */
MongoDbOperationStore.collectionName = 'operations';
//# sourceMappingURL=MongoDbOperationStore.js.map