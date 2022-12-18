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
const ErrorCode_1 = require("./ErrorCode");
const MongoDbStore_1 = require("../../../common/MongoDbStore");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Operation queue used by the Batch Writer implemented using MongoDB.
 */
class MongoDbOperationQueue extends MongoDbStore_1.default {
    /**
     * Creates a new instance of this object.
     * @param serverUrl The target server url.
     * @param databaseName The database name where the collection should be saved.
     */
    constructor(serverUrl, databaseName) {
        super(serverUrl, MongoDbOperationQueue.collectionName, databaseName);
    }
    /**
     * @inheritDoc
     */
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.createIndex({ didUniqueSuffix: 1 }, { unique: true });
        });
    }
    enqueue(didUniqueSuffix, operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const queuedOperation = {
                    didUniqueSuffix,
                    operationBufferBsonBinary: new mongodb_1.Binary(operationBuffer)
                };
                yield this.collection.insertOne(queuedOperation);
            }
            catch (error) {
                // Duplicate insert errors (error code 11000).
                if (error.code === 11000) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.BatchWriterAlreadyHasOperationForDid);
                }
                throw error;
            }
        });
    }
    dequeue(count) {
        return __awaiter(this, void 0, void 0, function* () {
            if (count <= 0) {
                return [];
            }
            const queuedOperations = yield this.collection.find().sort({ _id: 1 }).limit(count).toArray();
            const lastOperation = queuedOperations[queuedOperations.length - 1];
            yield this.collection.deleteMany({ _id: { $lte: lastOperation._id } });
            return queuedOperations.map((operation) => MongoDbOperationQueue.convertToQueuedOperationModel(operation));
        });
    }
    peek(count) {
        return __awaiter(this, void 0, void 0, function* () {
            if (count <= 0) {
                return [];
            }
            // NOTE: `_id` is the default index that is sorted based by create time.
            const queuedOperations = yield this.collection.find().sort({ _id: 1 }).limit(count).toArray();
            return queuedOperations.map((operation) => MongoDbOperationQueue.convertToQueuedOperationModel(operation));
        });
    }
    /**
     * Checks to see if the queue already contains an operation for the given DID unique suffix.
     */
    contains(didUniqueSuffix) {
        return __awaiter(this, void 0, void 0, function* () {
            const operations = yield this.collection.find({ didUniqueSuffix }).limit(1).toArray();
            return operations.length > 0;
        });
    }
    getSize() {
        return __awaiter(this, void 0, void 0, function* () {
            const size = yield this.collection.estimatedDocumentCount();
            return size;
        });
    }
    static convertToQueuedOperationModel(mongoQueuedOperation) {
        return {
            didUniqueSuffix: mongoQueuedOperation.didUniqueSuffix,
            operationBuffer: mongoQueuedOperation.operationBufferBsonBinary.buffer
        };
    }
}
exports.default = MongoDbOperationQueue;
/** Collection name for queued operations. */
MongoDbOperationQueue.collectionName = 'queued-operations';
//# sourceMappingURL=MongoDbOperationQueue.js.map