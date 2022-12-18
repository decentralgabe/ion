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
const ErrorCode_1 = require("./ErrorCode");
const EventCode_1 = require("./EventCode");
const EventEmitter_1 = require("../common/EventEmitter");
const Logger_1 = require("../common/Logger");
const SidetreeError_1 = require("../common/SidetreeError");
/**
 * Class that performs periodic writing of batches of Sidetree operations to CAS and blockchain.
 */
class BatchScheduler {
    constructor(versionManager, blockchain, batchingIntervalInSeconds) {
        this.versionManager = versionManager;
        this.blockchain = blockchain;
        this.batchingIntervalInSeconds = batchingIntervalInSeconds;
        /**
         * Denotes if the periodic batch writing should continue to occur.
         * Used mainly for test purposes.
         */
        this.continuePeriodicBatchWriting = false;
    }
    /**
     * The function that starts periodically anchoring operation batches to blockchain.
     */
    startPeriodicBatchWriting() {
        this.continuePeriodicBatchWriting = true;
        setImmediate(() => __awaiter(this, void 0, void 0, function* () { return this.writeOperationBatch(); }));
    }
    /**
     * Stops periodic batch writing.
     * Mainly used for test purposes.
     */
    stopPeriodicBatchWriting() {
        Logger_1.default.info(`Stopped periodic batch writing.`);
        this.continuePeriodicBatchWriting = false;
    }
    /**
     * Processes the operations in the queue.
     */
    writeOperationBatch() {
        return __awaiter(this, void 0, void 0, function* () {
            const endTimer = timeSpan(); // For calculating time taken to write operations.
            try {
                Logger_1.default.info('Start operation batch writing...');
                // Get the correct version of the `BatchWriter`.
                const currentTime = (yield this.blockchain.getLatestTime()).time;
                const batchWriter = this.versionManager.getBatchWriter(currentTime);
                const batchSize = yield batchWriter.write();
                EventEmitter_1.default.emit(EventCode_1.default.SidetreeBatchWriterLoopSuccess, { batchSize });
            }
            catch (error) {
                // Default the error to unexpected error.
                const loopFailureEventData = { code: ErrorCode_1.default.BatchSchedulerWriteUnexpectedError };
                // Only overwrite the error code if this is a concrete known error.
                if (error instanceof SidetreeError_1.default && error.code !== ErrorCode_1.default.BlockchainWriteUnexpectedError) {
                    loopFailureEventData.code = error.code;
                }
                else {
                    Logger_1.default.error('Unexpected and unhandled error during batch writing, investigate and fix:');
                    Logger_1.default.error(error);
                }
                EventEmitter_1.default.emit(EventCode_1.default.SidetreeBatchWriterLoopFailure, loopFailureEventData);
            }
            finally {
                Logger_1.default.info(`End batch writing. Duration: ${endTimer.rounded()} ms.`);
                if (this.continuePeriodicBatchWriting) {
                    Logger_1.default.info(`Waiting for ${this.batchingIntervalInSeconds} seconds before writing another batch.`);
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () { return this.writeOperationBatch(); }), this.batchingIntervalInSeconds * 1000);
                }
            }
        });
    }
}
exports.default = BatchScheduler;
//# sourceMappingURL=BatchScheduler.js.map