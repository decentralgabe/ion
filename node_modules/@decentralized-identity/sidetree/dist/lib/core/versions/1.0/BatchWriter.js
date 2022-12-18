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
const AnchoredDataSerializer_1 = require("./AnchoredDataSerializer");
const ChunkFile_1 = require("./ChunkFile");
const CoreIndexFile_1 = require("./CoreIndexFile");
const CoreProofFile_1 = require("./CoreProofFile");
const FeeManager_1 = require("./FeeManager");
const LogColor_1 = require("../../../common/LogColor");
const Logger_1 = require("../../../common/Logger");
const Operation_1 = require("./Operation");
const OperationType_1 = require("../../enums/OperationType");
const ProtocolParameters_1 = require("./ProtocolParameters");
const ProvisionalIndexFile_1 = require("./ProvisionalIndexFile");
const ProvisionalProofFile_1 = require("./ProvisionalProofFile");
const ValueTimeLockVerifier_1 = require("./ValueTimeLockVerifier");
/**
 * Implementation of the `IBatchWriter`.
 */
class BatchWriter {
    constructor(operationQueue, blockchain, cas, versionMetadataFetcher, confirmationStore) {
        this.operationQueue = operationQueue;
        this.blockchain = blockchain;
        this.cas = cas;
        this.versionMetadataFetcher = versionMetadataFetcher;
        this.confirmationStore = confirmationStore;
    }
    write() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTime = yield this.blockchain.getLatestTime();
            const normalizedFee = yield this.blockchain.getFee(currentTime.time);
            const currentLock = yield this.blockchain.getWriterValueTimeLock();
            const numberOfOpsAllowed = BatchWriter.getNumberOfOperationsAllowed(this.versionMetadataFetcher, currentLock);
            // Get the batch of operations to be anchored on the blockchain.
            const queuedOperations = yield this.operationQueue.peek(numberOfOpsAllowed);
            const numberOfOperations = queuedOperations.length;
            // Do nothing if there is nothing to batch together.
            if (numberOfOperations === 0) {
                Logger_1.default.info(`No queued operations to batch.`);
                return 0;
            }
            const lastSubmitted = yield this.confirmationStore.getLastSubmitted();
            Logger_1.default.info(`Got the last submitted from ConfirmationStore: submitted at ${lastSubmitted === null || lastSubmitted === void 0 ? void 0 : lastSubmitted.submittedAt}, confirmed at ${lastSubmitted === null || lastSubmitted === void 0 ? void 0 : lastSubmitted.confirmedAt}.`);
            if (lastSubmitted !== undefined &&
                !BatchWriter.hasEnoughConfirmations(lastSubmitted.confirmedAt, currentTime.time)) {
                Logger_1.default.info(`Waiting for more confirmations. Confirmed at ${lastSubmitted.confirmedAt}, Current at ${currentTime.time}.`);
                return 0;
            }
            const operationModels = yield Promise.all(queuedOperations.map((queuedOperation) => __awaiter(this, void 0, void 0, function* () { return Operation_1.default.parse(queuedOperation.operationBuffer); })));
            const createOperations = operationModels.filter(operation => operation.type === OperationType_1.default.Create);
            const recoverOperations = operationModels.filter(operation => operation.type === OperationType_1.default.Recover);
            const updateOperations = operationModels.filter(operation => operation.type === OperationType_1.default.Update);
            const deactivateOperations = operationModels.filter(operation => operation.type === OperationType_1.default.Deactivate);
            // Write core proof file if needed.
            const coreProofFileBuffer = yield CoreProofFile_1.default.createBuffer(recoverOperations, deactivateOperations);
            let coreProofFileUri;
            if (coreProofFileBuffer !== undefined) {
                coreProofFileUri = yield this.cas.write(coreProofFileBuffer);
            }
            // Write provisional proof file if needed.
            const provisionalProofFileBuffer = yield ProvisionalProofFile_1.default.createBuffer(updateOperations);
            let provisionalProofFileUri;
            if (provisionalProofFileBuffer !== undefined) {
                provisionalProofFileUri = yield this.cas.write(provisionalProofFileBuffer);
            }
            const chunkFileUri = yield this.createAndWriteChunkFileIfNeeded(createOperations, recoverOperations, updateOperations);
            const provisionalIndexFileUri = yield this.createAndWriteProvisionalIndexFileIfNeeded(chunkFileUri, provisionalProofFileUri, updateOperations);
            // Write the core index file to content addressable store.
            const writerLockId = currentLock ? currentLock.identifier : undefined;
            const coreIndexFileBuffer = yield CoreIndexFile_1.default.createBuffer(writerLockId, provisionalIndexFileUri, coreProofFileUri, createOperations, recoverOperations, deactivateOperations);
            const coreIndexFileUri = yield this.cas.write(coreIndexFileBuffer);
            Logger_1.default.info(LogColor_1.default.lightBlue(`Wrote core index file ${LogColor_1.default.green(coreIndexFileUri)} to content addressable store.`));
            // Anchor the data to the blockchain
            const dataToBeAnchored = {
                coreIndexFileUri,
                numberOfOperations
            };
            const stringToWriteToBlockchain = AnchoredDataSerializer_1.default.serialize(dataToBeAnchored);
            const fee = FeeManager_1.default.computeMinimumTransactionFee(normalizedFee, numberOfOperations);
            Logger_1.default.info(LogColor_1.default.lightBlue(`Writing data to blockchain: ${LogColor_1.default.green(stringToWriteToBlockchain)} with minimum fee of: ${LogColor_1.default.green(fee)}`));
            yield this.blockchain.write(stringToWriteToBlockchain, fee);
            Logger_1.default.info(`Transaction ${stringToWriteToBlockchain} is submitted at ${currentTime.time}`);
            yield this.confirmationStore.submit(stringToWriteToBlockchain, currentTime.time);
            // Remove written operations from queue after batch writing has completed successfully.
            yield this.operationQueue.dequeue(numberOfOperations);
            Logger_1.default.info(LogColor_1.default.lightBlue(`Batch size = ${LogColor_1.default.green(numberOfOperations)}`));
            return numberOfOperations;
        });
    }
    /**
     * Create and write chunk file if needed.
     * @returns CAS URI of the chunk file. `undefined` if there is no need to create and write the file.
     */
    createAndWriteChunkFileIfNeeded(createOperations, recoverOperations, updateOperations) {
        return __awaiter(this, void 0, void 0, function* () {
            const chunkFileBuffer = yield ChunkFile_1.default.createBuffer(createOperations, recoverOperations, updateOperations);
            if (chunkFileBuffer === undefined) {
                return undefined;
            }
            const chunkFileUri = yield this.cas.write(chunkFileBuffer);
            Logger_1.default.info(LogColor_1.default.lightBlue(`Wrote chunk file ${LogColor_1.default.green(chunkFileUri)} to content addressable store.`));
            return chunkFileUri;
        });
    }
    /**
     * Create and write provisional index file if needed.
     * @returns  URI of the provisional index file. `undefined` if there is no need to create and write the file.
     */
    createAndWriteProvisionalIndexFileIfNeeded(chunkFileUri, provisionalProofFileUri, updateOperations) {
        return __awaiter(this, void 0, void 0, function* () {
            // If `chunkFileUri` is `undefined` it means there are only deactivates, and a batch with only deactivates does not reference a provisional index file.
            if (chunkFileUri === undefined) {
                return undefined;
            }
            const provisionalIndexFileBuffer = yield ProvisionalIndexFile_1.default.createBuffer(chunkFileUri, provisionalProofFileUri, updateOperations);
            const provisionalIndexFileUri = yield this.cas.write(provisionalIndexFileBuffer);
            Logger_1.default.info(LogColor_1.default.lightBlue(`Wrote provisional index file ${LogColor_1.default.green(provisionalIndexFileUri)} to content addressable store.`));
            return provisionalIndexFileUri;
        });
    }
    static hasEnoughConfirmations(confirmedAt, currentTime) {
        const minConfirmationBetweenWrites = 6;
        // If not confirmed.
        if (confirmedAt === undefined) {
            return false;
        }
        const numberOfConfirmations = currentTime - confirmedAt + 1;
        if (numberOfConfirmations < minConfirmationBetweenWrites) {
            return false;
        }
        return true;
    }
    /**
     * Gets the maximum number of operations allowed to be written with the given value time lock.
     */
    static getNumberOfOperationsAllowed(versionMetadataFetcher, valueTimeLock) {
        const maxNumberOfOpsAllowedByProtocol = ProtocolParameters_1.default.maxOperationsPerBatch;
        const maxNumberOfOpsAllowedByLock = ValueTimeLockVerifier_1.default.calculateMaxNumberOfOperationsAllowed(valueTimeLock, versionMetadataFetcher);
        if (maxNumberOfOpsAllowedByLock > maxNumberOfOpsAllowedByProtocol) {
            // eslint-disable-next-line max-len
            Logger_1.default.info(`Maximum number of operations allowed by value time lock: ${maxNumberOfOpsAllowedByLock}; Maximum number of operations allowed by protocol: ${maxNumberOfOpsAllowedByProtocol}`);
        }
        return Math.min(maxNumberOfOpsAllowedByLock, maxNumberOfOpsAllowedByProtocol);
    }
}
exports.default = BatchWriter;
//# sourceMappingURL=BatchWriter.js.map