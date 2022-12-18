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
const ArrayMethods_1 = require("./util/ArrayMethods");
const Compressor_1 = require("./util/Compressor");
const Did_1 = require("./Did");
const ErrorCode_1 = require("./ErrorCode");
const InputValidator_1 = require("./InputValidator");
const JsonAsync_1 = require("./util/JsonAsync");
const ProtocolParameters_1 = require("./ProtocolParameters");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Class containing Core Index File related operations.
 */
class CoreIndexFile {
    /**
     * Class that represents an core index file.
     * NOTE: this class is introduced as an internal structure in replacement to `CoreIndexFileModel`
     * to keep useful metadata so that repeated computation can be avoided.
     */
    constructor(model, didUniqueSuffixes, createDidSuffixes, recoverDidSuffixes, deactivateDidSuffixes) {
        this.model = model;
        this.didUniqueSuffixes = didUniqueSuffixes;
        this.createDidSuffixes = createDidSuffixes;
        this.recoverDidSuffixes = recoverDidSuffixes;
        this.deactivateDidSuffixes = deactivateDidSuffixes;
    }
    /**
     * Parses and validates the given core index file buffer.
     * @throws `SidetreeError` if failed parsing or validation.
     */
    static parse(coreIndexFileBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            let coreIndexFileDecompressedBuffer;
            try {
                const maxAllowedDecompressedSizeInBytes = ProtocolParameters_1.default.maxCoreIndexFileSizeInBytes * Compressor_1.default.estimatedDecompressionMultiplier;
                coreIndexFileDecompressedBuffer = yield Compressor_1.default.decompress(coreIndexFileBuffer, maxAllowedDecompressedSizeInBytes);
            }
            catch (e) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.CoreIndexFileDecompressionFailure, e);
            }
            let coreIndexFileModel;
            try {
                coreIndexFileModel = yield JsonAsync_1.default.parse(coreIndexFileDecompressedBuffer);
            }
            catch (e) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.CoreIndexFileNotJson, e);
            }
            const allowedProperties = new Set(['provisionalIndexFileUri', 'coreProofFileUri', 'operations', 'writerLockId']);
            for (const property in coreIndexFileModel) {
                if (!allowedProperties.has(property)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileHasUnknownProperty);
                }
            }
            // `writerLockId` validations.
            if (('writerLockId' in coreIndexFileModel)) {
                if (typeof coreIndexFileModel.writerLockId !== 'string') {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileWriterLockIdPropertyNotString);
                }
                CoreIndexFile.validateWriterLockId(coreIndexFileModel.writerLockId);
            }
            // `operations` validations.
            let operations = {};
            if ('operations' in coreIndexFileModel) {
                operations = coreIndexFileModel.operations;
            }
            const allowedOperationsProperties = new Set(['create', 'recover', 'deactivate']);
            for (const property in operations) {
                if (!allowedOperationsProperties.has(property)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileUnexpectedPropertyInOperations, `Unexpected property ${property} in 'operations' property in core index file.`);
                }
            }
            // Will be populated for later validity check.
            const didUniqueSuffixes = [];
            // Validate `create` if exists.
            let createDidSuffixes = [];
            if (operations.create !== undefined) {
                if (!Array.isArray(operations.create)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileCreatePropertyNotArray);
                }
                // Validate every create reference.
                CoreIndexFile.validateCreateReferences(operations.create);
                createDidSuffixes = operations.create.map(operation => Did_1.default.computeUniqueSuffix(operation.suffixData));
                didUniqueSuffixes.push(...createDidSuffixes);
            }
            // Validate `recover` if exists.
            let recoverDidSuffixes = [];
            if (operations.recover !== undefined) {
                if (!Array.isArray(operations.recover)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileRecoverPropertyNotArray);
                }
                // Validate every recover reference.
                InputValidator_1.default.validateOperationReferences(operations.recover, 'recover reference');
                recoverDidSuffixes = operations.recover.map(operation => operation.didSuffix);
                didUniqueSuffixes.push(...recoverDidSuffixes);
            }
            // Validate `deactivate` if exists.
            let deactivateDidSuffixes = [];
            if (operations.deactivate !== undefined) {
                if (!Array.isArray(operations.deactivate)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileDeactivatePropertyNotArray);
                }
                // Validate every deactivate reference.
                InputValidator_1.default.validateOperationReferences(operations.deactivate, 'deactivate reference');
                deactivateDidSuffixes = operations.deactivate.map(operation => operation.didSuffix);
                didUniqueSuffixes.push(...deactivateDidSuffixes);
            }
            if (ArrayMethods_1.default.hasDuplicates(didUniqueSuffixes)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileMultipleOperationsForTheSameDid);
            }
            // If there is no operation reference in this file, then `provisionalIndexFileUri` MUST exist, because there must be at least one operation in a batch,
            // so this would imply that the operation reference must be in the provisional index file.
            // Map file URI validations.
            if (!('provisionalIndexFileUri' in coreIndexFileModel)) {
                // If `provisionalIndexFileUri` does not exist, then `operations` MUST have just deactivates. ie. only deactivates have no delta in chunk file.
                const createPlusRecoverOperationCount = createDidSuffixes.length + recoverDidSuffixes.length;
                if (createPlusRecoverOperationCount !== 0) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileProvisionalIndexFileUriMissing, `Provisional index file URI must exist since there are ${createDidSuffixes.length} creates and ${recoverDidSuffixes.length} recoveries.`);
                }
            }
            else {
                InputValidator_1.default.validateCasFileUri(coreIndexFileModel.provisionalIndexFileUri, 'provisional index file URI');
            }
            // Validate core proof file URI.
            if (recoverDidSuffixes.length > 0 || deactivateDidSuffixes.length > 0) {
                InputValidator_1.default.validateCasFileUri(coreIndexFileModel.coreProofFileUri, 'core proof file URI');
            }
            else {
                if (coreIndexFileModel.coreProofFileUri !== undefined) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileCoreProofFileUriNotAllowed, `Core proof file '${coreIndexFileModel.coreProofFileUri}' not allowed in an core index file with no recovers and deactivates.`);
                }
            }
            const coreIndexFile = new CoreIndexFile(coreIndexFileModel, didUniqueSuffixes, createDidSuffixes, recoverDidSuffixes, deactivateDidSuffixes);
            return coreIndexFile;
        });
    }
    /**
     * Creates an `CoreIndexFileModel`.
     */
    static createModel(writerLockId, provisionalIndexFileUri, coreProofFileUri, createOperationArray, recoverOperationArray, deactivateOperationArray) {
        return __awaiter(this, void 0, void 0, function* () {
            if (writerLockId !== undefined) {
                CoreIndexFile.validateWriterLockId(writerLockId);
            }
            const coreIndexFileModel = {
                writerLockId,
                provisionalIndexFileUri
            };
            // Only insert `operations` property if there is at least one operation reference.
            if (createOperationArray.length > 0 ||
                recoverOperationArray.length > 0 ||
                deactivateOperationArray.length > 0) {
                coreIndexFileModel.operations = {};
            }
            const createReferences = createOperationArray.map(operation => {
                return {
                    suffixData: {
                        deltaHash: operation.suffixData.deltaHash,
                        recoveryCommitment: operation.suffixData.recoveryCommitment,
                        type: operation.suffixData.type
                    }
                };
            });
            // Only insert `create` property if there are create operation references.
            if (createReferences.length > 0) {
                coreIndexFileModel.operations.create = createReferences;
            }
            const recoverReferences = recoverOperationArray.map(operation => {
                const revealValue = operation.revealValue;
                return { didSuffix: operation.didUniqueSuffix, revealValue };
            });
            // Only insert `recover` property if there are recover operation references.
            if (recoverReferences.length > 0) {
                coreIndexFileModel.operations.recover = recoverReferences;
            }
            const deactivateReferences = deactivateOperationArray.map(operation => {
                const revealValue = operation.revealValue;
                return { didSuffix: operation.didUniqueSuffix, revealValue };
            });
            // Only insert `deactivate` property if there are deactivate operation references.
            if (deactivateReferences.length > 0) {
                coreIndexFileModel.operations.deactivate = deactivateReferences;
            }
            // Only insert `coreProofFileUri` property if a value is given.
            if (coreProofFileUri !== undefined) {
                coreIndexFileModel.coreProofFileUri = coreProofFileUri;
            }
            return coreIndexFileModel;
        });
    }
    /**
     * Creates an core index file buffer.
     */
    static createBuffer(writerLockId, provisionalIndexFileUri, coreProofFileUri, createOperations, recoverOperations, deactivateOperations) {
        return __awaiter(this, void 0, void 0, function* () {
            const coreIndexFileModel = yield CoreIndexFile.createModel(writerLockId, provisionalIndexFileUri, coreProofFileUri, createOperations, recoverOperations, deactivateOperations);
            const coreIndexFileJson = JSON.stringify(coreIndexFileModel);
            const coreIndexFileBuffer = Buffer.from(coreIndexFileJson);
            return Compressor_1.default.compress(coreIndexFileBuffer);
        });
    }
    static validateWriterLockId(writerLockId) {
        // Max size check.
        const writerLockIdSizeInBytes = Buffer.from(writerLockId).length;
        if (writerLockIdSizeInBytes > ProtocolParameters_1.default.maxWriterLockIdInBytes) {
            throw new SidetreeError_1.default(ErrorCode_1.default.CoreIndexFileWriterLockIdExceededMaxSize, `Writer lock ID of ${writerLockIdSizeInBytes} bytes exceeded the maximum size of ${ProtocolParameters_1.default.maxWriterLockIdInBytes} bytes.`);
        }
    }
    /**
     * Validates the given create operation references.
     */
    static validateCreateReferences(operationReferences) {
        for (const operationReference of operationReferences) {
            // Only `suffixData` is allowed.
            InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(operationReference, ['suffixData'], `create operation reference`);
            InputValidator_1.default.validateSuffixData(operationReference.suffixData);
        }
    }
}
exports.default = CoreIndexFile;
//# sourceMappingURL=CoreIndexFile.js.map