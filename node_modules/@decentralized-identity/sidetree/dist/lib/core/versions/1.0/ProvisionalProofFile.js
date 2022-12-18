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
const Compressor_1 = require("./util/Compressor");
const ErrorCode_1 = require("./ErrorCode");
const InputValidator_1 = require("./InputValidator");
const JsonAsync_1 = require("./util/JsonAsync");
const Jws_1 = require("./util/Jws");
const ProtocolParameters_1 = require("./ProtocolParameters");
const SidetreeError_1 = require("../../../common/SidetreeError");
const UpdateOperation_1 = require("./UpdateOperation");
/**
 * Defines operations related to a Provisional Proof File.
 */
class ProvisionalProofFile {
    /**
     * Class that represents a provisional proof file.
     * NOTE: this class is introduced as an internal structure that keeps useful states in replacement to `ProvisionalProofFileModel`
     * so that repeated computation can be avoided.
     */
    constructor(provisionalProofFileModel, updateProofs) {
        this.provisionalProofFileModel = provisionalProofFileModel;
        this.updateProofs = updateProofs;
    }
    /**
     * Creates the buffer of a Provisional Proof File.
     *
     * @returns `Buffer` if at least one operation is given, `undefined` otherwise.
     */
    static createBuffer(updateOperations) {
        return __awaiter(this, void 0, void 0, function* () {
            if (updateOperations.length === 0) {
                return undefined;
            }
            const updateProofs = updateOperations.map(operation => { return { signedData: operation.signedDataJws.toCompactJws() }; });
            const provisionalProofFileModel = {
                operations: {
                    update: updateProofs
                }
            };
            const rawData = Buffer.from(JSON.stringify(provisionalProofFileModel));
            const compressedRawData = yield Compressor_1.default.compress(Buffer.from(rawData));
            return compressedRawData;
        });
    }
    /**
     * Parses and validates the given provisional proof file buffer.
     * @param provisionalProofFileBuffer Compressed provisional proof file.
     * @throws `SidetreeError` if failed parsing or validation.
     */
    static parse(provisionalProofFileBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            let provisionalProofFileDecompressedBuffer;
            try {
                const maxAllowedDecompressedSizeInBytes = ProtocolParameters_1.default.maxProofFileSizeInBytes * Compressor_1.default.estimatedDecompressionMultiplier;
                provisionalProofFileDecompressedBuffer = yield Compressor_1.default.decompress(provisionalProofFileBuffer, maxAllowedDecompressedSizeInBytes);
            }
            catch (error) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.ProvisionalProofFileDecompressionFailure, error);
            }
            let provisionalProofFileModel;
            try {
                provisionalProofFileModel = yield JsonAsync_1.default.parse(provisionalProofFileDecompressedBuffer);
            }
            catch (error) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.ProvisionalProofFileNotJson, error);
            }
            if (provisionalProofFileModel.operations === undefined) {
                throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalProofFileOperationsNotFound, `Provisional proof file does not have any operation proofs.`);
            }
            const operations = provisionalProofFileModel.operations;
            InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(operations, ['update'], 'provisional proof file');
            const updateProofs = [];
            // Validate `update` array if it is defined.
            const updateProofModels = operations.update;
            if (!Array.isArray(updateProofModels)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalProofFileUpdatePropertyNotAnArray, `'update' property in provisional proof file is not an array with entries.`);
            }
            // Parse and validate each compact JWS.
            for (const proof of updateProofModels) {
                InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(proof, ['signedData'], 'update proof');
                const signedDataJws = Jws_1.default.parseCompactJws(proof.signedData);
                const signedDataModel = yield UpdateOperation_1.default.parseSignedDataPayload(signedDataJws.payload);
                updateProofs.push({
                    signedDataJws,
                    signedDataModel
                });
            }
            if (updateProofs.length === 0) {
                throw new SidetreeError_1.default(ErrorCode_1.default.ProvisionalProofFileHasNoProofs, `Provisional proof file has no proofs.`);
            }
            return new ProvisionalProofFile(provisionalProofFileModel, updateProofs);
        });
    }
}
exports.default = ProvisionalProofFile;
//# sourceMappingURL=ProvisionalProofFile.js.map