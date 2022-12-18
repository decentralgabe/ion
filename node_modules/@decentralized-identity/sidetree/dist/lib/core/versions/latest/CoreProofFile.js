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
const DeactivateOperation_1 = require("./DeactivateOperation");
const ErrorCode_1 = require("./ErrorCode");
const InputValidator_1 = require("./InputValidator");
const JsonAsync_1 = require("./util/JsonAsync");
const Jws_1 = require("./util/Jws");
const ProtocolParameters_1 = require("./ProtocolParameters");
const RecoverOperation_1 = require("./RecoverOperation");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Defines operations related to a Core Proof File.
 */
class CoreProofFile {
    /**
     * Class that represents a core proof file.
     * NOTE: this class is introduced as an internal structure that keeps useful states in replacement to `CoreProofFileModel`
     * so that repeated computation can be avoided.
     */
    constructor(coreProofFileModel, recoverProofs, deactivateProofs) {
        this.coreProofFileModel = coreProofFileModel;
        this.recoverProofs = recoverProofs;
        this.deactivateProofs = deactivateProofs;
    }
    /**
     * Creates the buffer of a Core Proof File.
     *
     * @returns `Buffer` if at least one operation is given, `undefined` otherwise.
     */
    static createBuffer(recoverOperations, deactivateOperations) {
        return __awaiter(this, void 0, void 0, function* () {
            if (recoverOperations.length === 0 && deactivateOperations.length === 0) {
                return undefined;
            }
            const recoverProofs = recoverOperations.map(operation => { return { signedData: operation.signedDataJws.toCompactJws() }; });
            const deactivateProofs = deactivateOperations.map(operation => { return { signedData: operation.signedDataJws.toCompactJws() }; });
            const coreProofFileModel = {
                operations: {
                    recover: recoverProofs,
                    deactivate: deactivateProofs
                }
            };
            const rawData = Buffer.from(JSON.stringify(coreProofFileModel));
            const compressedRawData = yield Compressor_1.default.compress(Buffer.from(rawData));
            return compressedRawData;
        });
    }
    /**
     * Parses and validates the given core proof file buffer.
     * @param coreProofFileBuffer Compressed core proof file.
     * @throws `SidetreeError` if failed parsing or validation.
     */
    static parse(coreProofFileBuffer, expectedDeactivatedDidUniqueSuffixes) {
        return __awaiter(this, void 0, void 0, function* () {
            let coreProofFileDecompressedBuffer;
            try {
                const maxAllowedDecompressedSizeInBytes = ProtocolParameters_1.default.maxProofFileSizeInBytes * Compressor_1.default.estimatedDecompressionMultiplier;
                coreProofFileDecompressedBuffer = yield Compressor_1.default.decompress(coreProofFileBuffer, maxAllowedDecompressedSizeInBytes);
            }
            catch (error) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.CoreProofFileDecompressionFailure, error);
            }
            let coreProofFileModel;
            try {
                coreProofFileModel = yield JsonAsync_1.default.parse(coreProofFileDecompressedBuffer);
            }
            catch (error) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.CoreProofFileNotJson, error);
            }
            if (coreProofFileModel.operations === undefined) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CoreProofFileOperationsNotFound, `Core proof file does not have any operation proofs.`);
            }
            const operations = coreProofFileModel.operations;
            InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(operations, ['recover', 'deactivate'], 'core proof file');
            const recoverProofs = [];
            const deactivateProofs = [];
            let numberOfProofs = 0;
            // Validate `recover` array if it is defined.
            const recoverProofModels = operations.recover;
            if (recoverProofModels !== undefined) {
                if (!Array.isArray(recoverProofModels)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreProofFileRecoverPropertyNotAnArray, `'recover' property in core proof file is not an array.`);
                }
                // Parse and validate each compact JWS.
                for (const proof of recoverProofModels) {
                    InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(proof, ['signedData'], 'recover proof');
                    const signedDataJws = Jws_1.default.parseCompactJws(proof.signedData);
                    const signedDataModel = yield RecoverOperation_1.default.parseSignedDataPayload(signedDataJws.payload);
                    recoverProofs.push({
                        signedDataJws,
                        signedDataModel
                    });
                }
                numberOfProofs += recoverProofs.length;
            }
            // Validate `deactivate` array if it is defined.
            const deactivateProofModels = operations.deactivate;
            if (deactivateProofModels !== undefined) {
                if (!Array.isArray(deactivateProofModels)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.CoreProofFileDeactivatePropertyNotAnArray, `'deactivate' property in core proof file is not an array.`);
                }
                // Parse and validate each compact JWS.
                let deactivateProofIndex = 0;
                for (const proof of deactivateProofModels) {
                    InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(proof, ['signedData'], 'deactivate proof');
                    const signedDataJws = Jws_1.default.parseCompactJws(proof.signedData);
                    const signedDataModel = yield DeactivateOperation_1.default.parseSignedDataPayload(signedDataJws.payload, expectedDeactivatedDidUniqueSuffixes[deactivateProofIndex]);
                    deactivateProofs.push({
                        signedDataJws,
                        signedDataModel
                    });
                    deactivateProofIndex++;
                }
                numberOfProofs += deactivateProofModels.length;
            }
            if (numberOfProofs === 0) {
                throw new SidetreeError_1.default(ErrorCode_1.default.CoreProofFileHasNoProofs, `Core proof file has no proofs.`);
            }
            return new CoreProofFile(coreProofFileModel, recoverProofs, deactivateProofs);
        });
    }
}
exports.default = CoreProofFile;
//# sourceMappingURL=CoreProofFile.js.map