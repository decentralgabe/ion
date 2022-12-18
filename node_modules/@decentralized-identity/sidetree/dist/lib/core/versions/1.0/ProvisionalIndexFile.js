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
const ErrorCode_1 = require("./ErrorCode");
const InputValidator_1 = require("./InputValidator");
const JsonAsync_1 = require("./util/JsonAsync");
const ProtocolParameters_1 = require("./ProtocolParameters");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Class containing Map File related operations.
 */
class ProvisionalIndexFile {
    /**
     * Class that represents a provisional index file.
     * NOTE: this class is introduced as an internal structure in replacement to `ProvisionalIndexFileModel`
     * to keep useful metadata so that repeated computation can be avoided.
     */
    constructor(model, didUniqueSuffixes) {
        this.model = model;
        this.didUniqueSuffixes = didUniqueSuffixes;
    }
    /**
     * Parses and validates the given provisional index file buffer.
     * @throws `SidetreeError` if failed parsing or validation.
     */
    static parse(provisionalIndexFileBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            let decompressedBuffer;
            try {
                const maxAllowedDecompressedSizeInBytes = ProtocolParameters_1.default.maxProvisionalIndexFileSizeInBytes * Compressor_1.default.estimatedDecompressionMultiplier;
                decompressedBuffer = yield Compressor_1.default.decompress(provisionalIndexFileBuffer, maxAllowedDecompressedSizeInBytes);
            }
            catch (error) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.ProvisionalIndexFileDecompressionFailure, error);
            }
            let provisionalIndexFileModel;
            try {
                provisionalIndexFileModel = yield JsonAsync_1.default.parse(decompressedBuffer);
            }
            catch (error) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.ProvisionalIndexFileNotJson, error);
            }
            const allowedProperties = new Set(['chunks', 'operations', 'provisionalProofFileUri']);
            for (const property in provisionalIndexFileModel) {
                if (!allowedProperties.has(property)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileHasUnknownProperty);
                }
            }
            ProvisionalIndexFile.validateChunksProperty(provisionalIndexFileModel.chunks);
            const didSuffixes = yield ProvisionalIndexFile.validateOperationsProperty(provisionalIndexFileModel.operations);
            // Validate provisional proof file URI.
            if (didSuffixes.length > 0) {
                InputValidator_1.default.validateCasFileUri(provisionalIndexFileModel.provisionalProofFileUri, 'provisional proof file URI');
            }
            else {
                if (provisionalIndexFileModel.provisionalProofFileUri !== undefined) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileProvisionalProofFileUriNotAllowed, `Provisional proof file '${provisionalIndexFileModel.provisionalProofFileUri}' not allowed in a provisional index file with no updates.`);
                }
            }
            const provisionalIndexFile = new ProvisionalIndexFile(provisionalIndexFileModel, didSuffixes);
            return provisionalIndexFile;
        });
    }
    /**
     * Validates the given `operations` property, throws error if the property fails validation.
     *
     * @returns The of array of unique DID suffixes if validation succeeds.
     */
    static validateOperationsProperty(operations) {
        if (operations === undefined) {
            return [];
        }
        InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(operations, ['update'], 'provisional operation references');
        if (!Array.isArray(operations.update)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileUpdateOperationsNotArray);
        }
        // Validate all update operation references.
        InputValidator_1.default.validateOperationReferences(operations.update, 'update reference');
        // Make sure no operation with same DID.
        const didSuffixes = operations.update.map(operation => operation.didSuffix);
        if (ArrayMethods_1.default.hasDuplicates(didSuffixes)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileMultipleOperationsForTheSameDid);
        }
        return didSuffixes;
    }
    /**
     * Validates the given `chunks` property, throws error if the property fails validation.
     */
    static validateChunksProperty(chunks) {
        if (!Array.isArray(chunks)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileChunksPropertyMissingOrIncorrectType);
        }
        // This version expects only one hash.
        if (chunks.length !== 1) {
            throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileChunksPropertyDoesNotHaveExactlyOneElement);
        }
        const chunk = chunks[0];
        const properties = Object.keys(chunk);
        if (properties.length !== 1) {
            throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileChunkHasMissingOrUnknownProperty);
        }
        InputValidator_1.default.validateCasFileUri(chunk.chunkFileUri, 'chunk file URI');
    }
    /**
     * Creates the Map File buffer.
     */
    static createBuffer(chunkFileUri, provisionalProofFileUri, updateOperationArray) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateReferences = updateOperationArray.map(operation => {
                const revealValue = operation.revealValue;
                return { didSuffix: operation.didUniqueSuffix, revealValue };
            });
            const provisionalIndexFileModel = {
                chunks: [{ chunkFileUri }]
            };
            // Only insert `operations` and `provisionalProofFileUri` properties if there are update operations.
            if (updateReferences.length > 0) {
                provisionalIndexFileModel.operations = {
                    update: updateReferences
                };
                provisionalIndexFileModel.provisionalProofFileUri = provisionalProofFileUri;
            }
            const rawData = JSON.stringify(provisionalIndexFileModel);
            const compressedRawData = yield Compressor_1.default.compress(Buffer.from(rawData));
            return compressedRawData;
        });
    }
}
exports.default = ProvisionalIndexFile;
//# sourceMappingURL=ProvisionalIndexFile.js.map