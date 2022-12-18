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
const BatchWriter_1 = require("./versions/latest/BatchWriter");
const MongoDbOperationQueue_1 = require("./versions/latest/MongoDbOperationQueue");
const MongoDbTransactionStore_1 = require("../common/MongoDbTransactionStore");
/**
 * An class to monitor the Core.
 * NOTE: this class can be completely decoupled from Core, Core does not need this class at all to function.
 */
class Monitor {
    constructor(config, versionManager, blockchain) {
        this.operationQueue = new MongoDbOperationQueue_1.default(config.mongoDbConnectionString, config.databaseName);
        this.transactionStore = new MongoDbTransactionStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.blockchain = blockchain;
        this.versionManager = versionManager;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.transactionStore.initialize();
            yield this.operationQueue.initialize();
        });
    }
    /**
     * Gets the size of the operation queue.
     */
    getOperationQueueSize() {
        return __awaiter(this, void 0, void 0, function* () {
            const operationQueueSize = yield this.operationQueue.getSize();
            return { operationQueueSize };
        });
    }
    /**
     * Gets the maximum batch size the writer is currently capable of writing.
     */
    getWriterMaxBatchSize() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentLock = yield this.blockchain.getWriterValueTimeLock();
            const writerMaxBatchSize = BatchWriter_1.default.getNumberOfOperationsAllowed(this.versionManager, currentLock);
            return { writerMaxBatchSize };
        });
    }
    /**
     * Gets the last processed transaction.
     */
    getLastProcessedTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastProcessedTransaction = yield this.transactionStore.getLastTransaction();
            return lastProcessedTransaction;
        });
    }
}
exports.default = Monitor;
//# sourceMappingURL=Monitor.js.map