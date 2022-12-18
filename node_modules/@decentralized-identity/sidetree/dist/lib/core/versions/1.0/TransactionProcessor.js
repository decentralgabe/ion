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
const ArrayMethods_1 = require("./util/ArrayMethods");
const ChunkFile_1 = require("./ChunkFile");
const CoreIndexFile_1 = require("./CoreIndexFile");
const CoreProofFile_1 = require("./CoreProofFile");
const ErrorCode_1 = require("./ErrorCode");
const FeeManager_1 = require("./FeeManager");
const FetchResultCode_1 = require("../../../common/enums/FetchResultCode");
const LogColor_1 = require("../../../common/LogColor");
const Logger_1 = require("../../../common/Logger");
const OperationType_1 = require("../../enums/OperationType");
const ProtocolParameters_1 = require("./ProtocolParameters");
const ProvisionalIndexFile_1 = require("./ProvisionalIndexFile");
const ProvisionalProofFile_1 = require("./ProvisionalProofFile");
const SidetreeError_1 = require("../../../common/SidetreeError");
const ValueTimeLockVerifier_1 = require("./ValueTimeLockVerifier");
/**
 * Implementation of the `ITransactionProcessor`.
 */
class TransactionProcessor {
    constructor(downloadManager, operationStore, blockchain, versionMetadataFetcher) {
        this.downloadManager = downloadManager;
        this.operationStore = operationStore;
        this.blockchain = blockchain;
        this.versionMetadataFetcher = versionMetadataFetcher;
    }
    processTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            // Download the core (index and proof) files.
            let anchoredData;
            let coreIndexFile;
            let coreProofFile;
            try {
                // Decode the anchor string.
                anchoredData = AnchoredDataSerializer_1.default.deserialize(transaction.anchorString);
                // Verify enough fee paid.
                FeeManager_1.default.verifyTransactionFeeAndThrowOnError(transaction.transactionFeePaid, anchoredData.numberOfOperations, transaction.normalizedTransactionFee);
                // Download and verify core index file.
                coreIndexFile = yield this.downloadAndVerifyCoreIndexFile(transaction, anchoredData.coreIndexFileUri, anchoredData.numberOfOperations);
                // Download and verify core proof file.
                coreProofFile = yield this.downloadAndVerifyCoreProofFile(coreIndexFile);
            }
            catch (error) {
                let retryNeeded = true;
                if (error instanceof SidetreeError_1.default) {
                    // If error is related to CAS network connectivity issues, we need to retry later.
                    if (error.code === ErrorCode_1.default.CasNotReachable ||
                        error.code === ErrorCode_1.default.CasFileNotFound) {
                        retryNeeded = true;
                    }
                    else {
                        // eslint-disable-next-line max-len
                        Logger_1.default.info(LogColor_1.default.lightBlue(`Invalid core file found for anchor string '${LogColor_1.default.green(transaction.anchorString)}', the entire batch is discarded. Error: ${LogColor_1.default.yellow(error.message)}`));
                        retryNeeded = false;
                    }
                }
                else {
                    Logger_1.default.error(LogColor_1.default.red(`Unexpected error while fetching and downloading core files, MUST investigate and fix: ${error.message}`));
                    retryNeeded = true;
                }
                const transactionProcessedCompletely = !retryNeeded;
                return transactionProcessedCompletely;
            }
            // Once code reaches here, it means core files are valid. In order to be compatible with the future data-pruning feature,
            // the operations referenced in core index file must be retained regardless of the validity of provisional and chunk files.
            // Download provisional and chunk files.
            let retryNeeded;
            let provisionalIndexFile;
            let provisionalProofFile;
            let chunkFileModel;
            try {
                // Download and verify provisional index file.
                provisionalIndexFile = yield this.downloadAndVerifyProvisionalIndexFile(coreIndexFile, anchoredData.numberOfOperations);
                // Download and verify provisional proof file.
                provisionalProofFile = yield this.downloadAndVerifyProvisionalProofFile(provisionalIndexFile);
                // Download and verify chunk file.
                chunkFileModel = yield this.downloadAndVerifyChunkFile(coreIndexFile, provisionalIndexFile);
                retryNeeded = false;
            }
            catch (error) {
                // If we encounter any error, regardless of whether the transaction should be retried for processing,
                // we set all the provisional/chunk files to be `undefined`,
                // this is because chunk file would not be available/valid for its deltas to be used during resolutions,
                // thus no need to store the operation references found in the provisional index file.
                provisionalIndexFile = undefined;
                provisionalProofFile = undefined;
                chunkFileModel = undefined;
                // Now we decide if we should try to process this transaction again in the future.
                if (error instanceof SidetreeError_1.default) {
                    // If error is related to CAS network connectivity issues, we need to retry later.
                    if (error.code === ErrorCode_1.default.CasNotReachable ||
                        error.code === ErrorCode_1.default.CasFileNotFound) {
                        retryNeeded = true;
                    }
                    else {
                        // eslint-disable-next-line max-len
                        Logger_1.default.info(LogColor_1.default.lightBlue(`Invalid provisional/chunk file found for anchor string '${LogColor_1.default.green(transaction.anchorString)}', the entire batch is discarded. Error: ${LogColor_1.default.yellow(error.message)}`));
                        retryNeeded = false;
                    }
                }
                else {
                    Logger_1.default.error(LogColor_1.default.red(`Unexpected error while fetching and downloading provisional files, MUST investigate and fix: ${error.message}`));
                    retryNeeded = true;
                }
            }
            // Once code reaches here, it means all the files that are not `undefined` (and their relationships) are validated,
            // there is no need to perform any more validations at this point, we just need to compose the anchored operations and store them.
            // Compose using files downloaded into anchored operations.
            const operations = yield this.composeAnchoredOperationModels(transaction, coreIndexFile, provisionalIndexFile, coreProofFile, provisionalProofFile, chunkFileModel);
            yield this.operationStore.insertOrReplace(operations);
            Logger_1.default.info(LogColor_1.default.lightBlue(`Processed ${LogColor_1.default.green(operations.length)} operations. Retry needed: ${LogColor_1.default.green(retryNeeded)}`));
            const transactionProcessedCompletely = !retryNeeded;
            return transactionProcessedCompletely;
        });
    }
    downloadAndVerifyCoreIndexFile(transaction, coreIndexFileUri, paidOperationCount) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify the number of paid operations does not exceed the maximum allowed limit.
            if (paidOperationCount > ProtocolParameters_1.default.maxOperationsPerBatch) {
                throw new SidetreeError_1.default(ErrorCode_1.default.TransactionProcessorPaidOperationCountExceedsLimit, `Paid batch size of ${paidOperationCount} operations exceeds the allowed limit of ${ProtocolParameters_1.default.maxOperationsPerBatch}.`);
            }
            Logger_1.default.info(`Downloading core index file '${coreIndexFileUri}', max file size limit ${ProtocolParameters_1.default.maxCoreIndexFileSizeInBytes} bytes...`);
            const fileBuffer = yield this.downloadFileFromCas(coreIndexFileUri, ProtocolParameters_1.default.maxCoreIndexFileSizeInBytes);
            const coreIndexFile = yield CoreIndexFile_1.default.parse(fileBuffer);
            const operationCountInCoreIndexFile = coreIndexFile.didUniqueSuffixes.length;
            if (operationCountInCoreIndexFile > paidOperationCount) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileOperationCountExceededPaidLimit, `Operation count ${operationCountInCoreIndexFile} in core index file exceeded limit of : ${paidOperationCount}`);
            }
            // Verify required lock if one was needed.
            const valueTimeLock = coreIndexFile.model.writerLockId
                ? yield this.blockchain.getValueTimeLock(coreIndexFile.model.writerLockId)
                : undefined;
            ValueTimeLockVerifier_1.default.verifyLockAmountAndThrowOnError(valueTimeLock, paidOperationCount, transaction.transactionTime, transaction.writer, this.versionMetadataFetcher);
            return coreIndexFile;
        });
    }
    downloadAndVerifyCoreProofFile(coreIndexFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const coreProofFileUri = coreIndexFile.model.coreProofFileUri;
            if (coreProofFileUri === undefined) {
                return;
            }
            Logger_1.default.info(`Downloading core proof file '${coreProofFileUri}', max file size limit ${ProtocolParameters_1.default.maxProofFileSizeInBytes}...`);
            const fileBuffer = yield this.downloadFileFromCas(coreProofFileUri, ProtocolParameters_1.default.maxProofFileSizeInBytes);
            const coreProofFile = yield CoreProofFile_1.default.parse(fileBuffer, coreIndexFile.deactivateDidSuffixes);
            const recoverAndDeactivateCount = coreIndexFile.deactivateDidSuffixes.length + coreIndexFile.recoverDidSuffixes.length;
            const proofCountInCoreProofFile = coreProofFile.deactivateProofs.length + coreProofFile.recoverProofs.length;
            if (recoverAndDeactivateCount !== proofCountInCoreProofFile) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CoreProofFileProofCountNotTheSameAsOperationCountInCoreIndexFile, `Proof count of ${proofCountInCoreProofFile} in core proof file different to ` +
                    `recover + deactivate count of ${recoverAndDeactivateCount} in core index file.`);
            }
            return coreProofFile;
        });
    }
    downloadAndVerifyProvisionalProofFile(provisionalIndexFile) {
        return __awaiter(this, void 0, void 0, function* () {
            // If there is no provisional proof file to download, just return.
            if (provisionalIndexFile === undefined || provisionalIndexFile.model.provisionalProofFileUri === undefined) {
                return;
            }
            const provisionalProofFileUri = provisionalIndexFile.model.provisionalProofFileUri;
            Logger_1.default.info(`Downloading provisional proof file '${provisionalProofFileUri}', max file size limit ${ProtocolParameters_1.default.maxProofFileSizeInBytes}...`);
            const fileBuffer = yield this.downloadFileFromCas(provisionalProofFileUri, ProtocolParameters_1.default.maxProofFileSizeInBytes);
            const provisionalProofFile = yield ProvisionalProofFile_1.default.parse(fileBuffer);
            const operationCountInProvisionalIndexFile = provisionalIndexFile.didUniqueSuffixes.length;
            const proofCountInProvisionalProofFile = provisionalProofFile.updateProofs.length;
            if (operationCountInProvisionalIndexFile !== proofCountInProvisionalProofFile) {
                throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalProofFileProofCountNotTheSameAsOperationCountInProvisionalIndexFile, `Proof count ${proofCountInProvisionalProofFile} in provisional proof file is different from ` +
                    `operation count ${operationCountInProvisionalIndexFile} in provisional index file.`);
            }
            return provisionalProofFile;
        });
    }
    downloadAndVerifyProvisionalIndexFile(coreIndexFile, paidOperationCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const coreIndexFileModel = coreIndexFile.model;
            // If no provisional index file URI is defined (legitimate case when there is only deactivates in the operation batch),
            // then no provisional index file to download.
            const provisionalIndexFileUri = coreIndexFileModel.provisionalIndexFileUri;
            if (provisionalIndexFileUri === undefined) {
                return undefined;
            }
            Logger_1.default.info(`Downloading provisional index file '${provisionalIndexFileUri}', max file size limit ${ProtocolParameters_1.default.maxProvisionalIndexFileSizeInBytes}...`);
            const fileBuffer = yield this.downloadFileFromCas(provisionalIndexFileUri, ProtocolParameters_1.default.maxProvisionalIndexFileSizeInBytes);
            const provisionalIndexFile = yield ProvisionalIndexFile_1.default.parse(fileBuffer);
            // Calculate the max paid update operation count.
            const operationCountInCoreIndexFile = coreIndexFile.didUniqueSuffixes.length;
            const maxPaidUpdateOperationCount = paidOperationCount - operationCountInCoreIndexFile;
            const updateOperationCount = provisionalIndexFile.didUniqueSuffixes.length;
            if (updateOperationCount > maxPaidUpdateOperationCount) {
                throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileUpdateOperationCountGreaterThanMaxPaidCount, `Update operation count of ${updateOperationCount} in provisional index file is greater than max paid count of ${maxPaidUpdateOperationCount}.`);
            }
            // If we find operations for the same DID between anchor and provisional index files,
            // we will penalize the writer by not accepting any updates.
            if (!ArrayMethods_1.default.areMutuallyExclusive(coreIndexFile.didUniqueSuffixes, provisionalIndexFile.didUniqueSuffixes)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileDidReferenceDuplicatedWithCoreIndexFile, `Provisional index file has at least one DID reference duplicated with core index file.`);
            }
            return provisionalIndexFile;
        });
    }
    downloadAndVerifyChunkFile(coreIndexFile, provisionalIndexFile) {
        return __awaiter(this, void 0, void 0, function* () {
            // Can't download chunk file if provisional index file is not given.
            if (provisionalIndexFile === undefined) {
                return undefined;
            }
            const chunkFileUri = provisionalIndexFile.model.chunks[0].chunkFileUri;
            Logger_1.default.info(`Downloading chunk file '${chunkFileUri}', max size limit ${ProtocolParameters_1.default.maxChunkFileSizeInBytes}...`);
            const fileBuffer = yield this.downloadFileFromCas(chunkFileUri, ProtocolParameters_1.default.maxChunkFileSizeInBytes);
            const chunkFileModel = yield ChunkFile_1.default.parse(fileBuffer);
            const totalCountOfOperationsWithDelta = coreIndexFile.createDidSuffixes.length + coreIndexFile.recoverDidSuffixes.length + provisionalIndexFile.didUniqueSuffixes.length;
            if (chunkFileModel.deltas.length !== totalCountOfOperationsWithDelta) {
                throw new SidetreeError_1.default(ErrorCode_1.default.ChunkFileDeltaCountIncorrect, `Delta array length ${chunkFileModel.deltas.length} is not the same as the count of ${totalCountOfOperationsWithDelta} operations with delta.`);
            }
            return chunkFileModel;
        });
    }
    composeAnchoredOperationModels(transaction, coreIndexFile, provisionalIndexFile, coreProofFile, provisionalProofFile, chunkFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const anchoredCreateOperationModels = TransactionProcessor.composeAnchoredCreateOperationModels(transaction, coreIndexFile, chunkFile);
            const anchoredRecoverOperationModels = TransactionProcessor.composeAnchoredRecoverOperationModels(transaction, coreIndexFile, coreProofFile, chunkFile);
            const anchoredDeactivateOperationModels = TransactionProcessor.composeAnchoredDeactivateOperationModels(transaction, coreIndexFile, coreProofFile);
            const anchoredUpdateOperationModels = TransactionProcessor.composeAnchoredUpdateOperationModels(transaction, coreIndexFile, provisionalIndexFile, provisionalProofFile, chunkFile);
            const anchoredOperationModels = [];
            anchoredOperationModels.push(...anchoredCreateOperationModels);
            anchoredOperationModels.push(...anchoredRecoverOperationModels);
            anchoredOperationModels.push(...anchoredDeactivateOperationModels);
            anchoredOperationModels.push(...anchoredUpdateOperationModels);
            return anchoredOperationModels;
        });
    }
    static composeAnchoredCreateOperationModels(transaction, coreIndexFile, chunkFile) {
        if (coreIndexFile.createDidSuffixes.length === 0) {
            return [];
        }
        let createDeltas;
        if (chunkFile !== undefined) {
            createDeltas = chunkFile.deltas.slice(0, coreIndexFile.createDidSuffixes.length);
        }
        const createDidSuffixes = coreIndexFile.createDidSuffixes;
        const anchoredOperationModels = [];
        for (let i = 0; i < createDidSuffixes.length; i++) {
            const suffixData = coreIndexFile.model.operations.create[i].suffixData;
            // Compose the original operation request from the files.
            const composedRequest = {
                type: OperationType_1.default.Create,
                suffixData: suffixData,
                delta: createDeltas === null || createDeltas === void 0 ? void 0 : createDeltas[i] // Add `delta` property if chunk file found.
            };
            // TODO: Issue 442 - https://github.com/decentralized-identity/sidetree/issues/442
            // Use actual operation request object instead of buffer.
            const operationBuffer = Buffer.from(JSON.stringify(composedRequest));
            const anchoredOperationModel = {
                didUniqueSuffix: createDidSuffixes[i],
                type: OperationType_1.default.Create,
                operationBuffer,
                operationIndex: i,
                transactionNumber: transaction.transactionNumber,
                transactionTime: transaction.transactionTime
            };
            anchoredOperationModels.push(anchoredOperationModel);
        }
        return anchoredOperationModels;
    }
    static composeAnchoredRecoverOperationModels(transaction, coreIndexFile, coreProofFile, chunkFile) {
        if (coreIndexFile.recoverDidSuffixes.length === 0) {
            return [];
        }
        let recoverDeltas;
        if (chunkFile !== undefined) {
            const recoverDeltaStartIndex = coreIndexFile.createDidSuffixes.length;
            const recoverDeltaEndIndexExclusive = recoverDeltaStartIndex + coreIndexFile.recoverDidSuffixes.length;
            recoverDeltas = chunkFile.deltas.slice(recoverDeltaStartIndex, recoverDeltaEndIndexExclusive);
        }
        const recoverDidSuffixes = coreIndexFile.recoverDidSuffixes;
        const recoverProofs = coreProofFile.recoverProofs.map((proof) => proof.signedDataJws.toCompactJws());
        const anchoredOperationModels = [];
        for (let i = 0; i < recoverDidSuffixes.length; i++) {
            // Compose the original operation request from the files.
            const composedRequest = {
                type: OperationType_1.default.Recover,
                didSuffix: recoverDidSuffixes[i],
                revealValue: coreIndexFile.model.operations.recover[i].revealValue,
                signedData: recoverProofs[i],
                delta: recoverDeltas === null || recoverDeltas === void 0 ? void 0 : recoverDeltas[i] // Add `delta` property if chunk file found.
            };
            // TODO: Issue 442 - https://github.com/decentralized-identity/sidetree/issues/442
            // Use actual operation request object instead of buffer.
            const operationBuffer = Buffer.from(JSON.stringify(composedRequest));
            const anchoredOperationModel = {
                didUniqueSuffix: recoverDidSuffixes[i],
                type: OperationType_1.default.Recover,
                operationBuffer,
                operationIndex: coreIndexFile.createDidSuffixes.length + i,
                transactionNumber: transaction.transactionNumber,
                transactionTime: transaction.transactionTime
            };
            anchoredOperationModels.push(anchoredOperationModel);
        }
        return anchoredOperationModels;
    }
    static composeAnchoredDeactivateOperationModels(transaction, coreIndexFile, coreProofFile) {
        if (coreIndexFile.deactivateDidSuffixes.length === 0) {
            return [];
        }
        const deactivateDidSuffixes = coreIndexFile.deactivateDidSuffixes;
        const deactivateProofs = coreProofFile.deactivateProofs.map((proof) => proof.signedDataJws.toCompactJws());
        const anchoredOperationModels = [];
        for (let i = 0; i < deactivateDidSuffixes.length; i++) {
            // Compose the original operation request from the files.
            const composedRequest = {
                type: OperationType_1.default.Deactivate,
                didSuffix: deactivateDidSuffixes[i],
                revealValue: coreIndexFile.model.operations.deactivate[i].revealValue,
                signedData: deactivateProofs[i]
            };
            // TODO: Issue 442 - https://github.com/decentralized-identity/sidetree/issues/442
            // Use actual operation request object instead of buffer.
            const operationBuffer = Buffer.from(JSON.stringify(composedRequest));
            const anchoredOperationModel = {
                didUniqueSuffix: deactivateDidSuffixes[i],
                type: OperationType_1.default.Deactivate,
                operationBuffer,
                operationIndex: coreIndexFile.createDidSuffixes.length + coreIndexFile.recoverDidSuffixes.length + i,
                transactionNumber: transaction.transactionNumber,
                transactionTime: transaction.transactionTime
            };
            anchoredOperationModels.push(anchoredOperationModel);
        }
        return anchoredOperationModels;
    }
    static composeAnchoredUpdateOperationModels(transaction, coreIndexFile, provisionalIndexFile, provisionalProofFile, chunkFile) {
        // If provisional index file is undefined (in the case of batch containing only deactivates) or
        // if provisional index file's update operation reference count is zero (in the case of batch containing creates and/or recovers).
        if (provisionalIndexFile === undefined ||
            provisionalIndexFile.didUniqueSuffixes.length === 0) {
            return [];
        }
        let updateDeltas;
        if (chunkFile !== undefined) {
            const updateDeltaStartIndex = coreIndexFile.createDidSuffixes.length + coreIndexFile.recoverDidSuffixes.length;
            updateDeltas = chunkFile.deltas.slice(updateDeltaStartIndex);
        }
        const updateDidSuffixes = provisionalIndexFile.didUniqueSuffixes;
        const updateProofs = provisionalProofFile.updateProofs.map((proof) => proof.signedDataJws.toCompactJws());
        const anchoredOperationModels = [];
        for (let i = 0; i < updateDidSuffixes.length; i++) {
            // Compose the original operation request from the files.
            const composedRequest = {
                type: OperationType_1.default.Update,
                didSuffix: updateDidSuffixes[i],
                revealValue: provisionalIndexFile.model.operations.update[i].revealValue,
                signedData: updateProofs[i],
                delta: updateDeltas === null || updateDeltas === void 0 ? void 0 : updateDeltas[i] // Add `delta` property if chunk file found.
            };
            // TODO: Issue 442 - https://github.com/decentralized-identity/sidetree/issues/442
            // Use actual operation request object instead of buffer.
            const operationBuffer = Buffer.from(JSON.stringify(composedRequest));
            const anchoredOperationModel = {
                didUniqueSuffix: updateDidSuffixes[i],
                type: OperationType_1.default.Update,
                operationBuffer,
                operationIndex: coreIndexFile.didUniqueSuffixes.length + i,
                transactionNumber: transaction.transactionNumber,
                transactionTime: transaction.transactionTime
            };
            anchoredOperationModels.push(anchoredOperationModel);
        }
        return anchoredOperationModels;
    }
    downloadFileFromCas(fileUri, maxFileSizeInBytes) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Downloading file '${fileUri}', max size limit ${maxFileSizeInBytes}...`);
            const fileFetchResult = yield this.downloadManager.download(fileUri, maxFileSizeInBytes);
            if (fileFetchResult.code === FetchResultCode_1.default.InvalidHash) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CasFileUriNotValid, `File hash '${fileUri}' is not a valid hash.`);
            }
            if (fileFetchResult.code === FetchResultCode_1.default.MaxSizeExceeded) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CasFileTooLarge, `File '${fileUri}' exceeded max size limit of ${maxFileSizeInBytes} bytes.`);
            }
            if (fileFetchResult.code === FetchResultCode_1.default.NotAFile) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CasFileNotAFile, `File hash '${fileUri}' points to a content that is not a file.`);
            }
            if (fileFetchResult.code === FetchResultCode_1.default.CasNotReachable) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CasNotReachable, `CAS not reachable for file '${fileUri}'.`);
            }
            if (fileFetchResult.code === FetchResultCode_1.default.NotFound) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CasFileNotFound, `File '${fileUri}' not found.`);
            }
            Logger_1.default.info(`File '${fileUri}' of size ${fileFetchResult.content.length} downloaded.`);
            return fileFetchResult.content;
        });
    }
}
exports.default = TransactionProcessor;
//# sourceMappingURL=TransactionProcessor.js.map