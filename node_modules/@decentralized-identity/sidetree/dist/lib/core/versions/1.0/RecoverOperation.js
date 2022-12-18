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
const Encoder_1 = require("./Encoder");
const ErrorCode_1 = require("./ErrorCode");
const InputValidator_1 = require("./InputValidator");
const JsonAsync_1 = require("./util/JsonAsync");
const Jwk_1 = require("./util/Jwk");
const Jws_1 = require("./util/Jws");
const Multihash_1 = require("./Multihash");
const Operation_1 = require("./Operation");
const OperationType_1 = require("../../enums/OperationType");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * A class that represents a recover operation.
 */
class RecoverOperation {
    /**
     * NOTE: should only be used by `parse()` and `parseObject()` else the constructed instance could be invalid.
     */
    constructor(operationBuffer, didUniqueSuffix, revealValue, signedDataJws, signedData, delta) {
        this.operationBuffer = operationBuffer;
        this.didUniqueSuffix = didUniqueSuffix;
        this.revealValue = revealValue;
        this.signedDataJws = signedDataJws;
        this.signedData = signedData;
        this.delta = delta;
        /** The type of operation. */
        this.type = OperationType_1.default.Recover;
    }
    /**
     * Parses the given buffer as a `RecoverOperation`.
     */
    static parse(operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const operationJsonString = operationBuffer.toString();
            const operationObject = yield JsonAsync_1.default.parse(operationJsonString);
            const recoverOperation = yield RecoverOperation.parseObject(operationObject, operationBuffer);
            return recoverOperation;
        });
    }
    /**
     * Parses the given operation object as a `RecoverOperation`.
     * The `operationBuffer` given is assumed to be valid and is assigned to the `operationBuffer` directly.
     * NOTE: This method is purely intended to be used as an optimization method over the `parse` method in that
     * JSON parsing is not required to be performed more than once when an operation buffer of an unknown operation type is given.
     */
    static parseObject(operationObject, operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(operationObject, ['type', 'didSuffix', 'revealValue', 'signedData', 'delta'], 'recover request');
            if (operationObject.type !== OperationType_1.default.Recover) {
                throw new SidetreeError_1.default(ErrorCode_1.default.RecoverOperationTypeIncorrect);
            }
            InputValidator_1.default.validateEncodedMultihash(operationObject.didSuffix, 'recover request didSuffix');
            InputValidator_1.default.validateEncodedMultihash(operationObject.revealValue, 'recover request reveal value');
            const signedDataJws = Jws_1.default.parseCompactJws(operationObject.signedData);
            const signedDataModel = yield RecoverOperation.parseSignedDataPayload(signedDataJws.payload);
            // Validate that the canonicalized recovery public key hash is the same as `revealValue`.
            Multihash_1.default.validateCanonicalizeObjectHash(signedDataModel.recoveryKey, operationObject.revealValue, 'recover request recovery key');
            let delta;
            try {
                Operation_1.default.validateDelta(operationObject.delta);
                delta = operationObject.delta;
            }
            catch (_a) {
                // For compatibility with data pruning, we have to assume that `delta` may be unavailable,
                // thus an operation with invalid `delta` needs to be processed as an operation with unavailable `delta`,
                // so here we let `delta` be `undefined`.
            }
            return new RecoverOperation(operationBuffer, operationObject.didSuffix, operationObject.revealValue, signedDataJws, signedDataModel, delta);
        });
    }
    /**
     * Parses the signed data payload of a recover operation.
     */
    static parseSignedDataPayload(signedDataEncodedString) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedDataJsonString = Encoder_1.default.decodeAsString(signedDataEncodedString);
            const signedData = yield JsonAsync_1.default.parse(signedDataJsonString);
            const properties = Object.keys(signedData);
            if (properties.length !== 3) {
                throw new SidetreeError_1.default(ErrorCode_1.default.RecoverOperationSignedDataMissingOrUnknownProperty);
            }
            Jwk_1.default.validateJwkEs256k(signedData.recoveryKey);
            InputValidator_1.default.validateEncodedMultihash(signedData.deltaHash, 'recover operation delta hash');
            InputValidator_1.default.validateEncodedMultihash(signedData.recoveryCommitment, 'recover operation next recovery commitment');
            return signedData;
        });
    }
}
exports.default = RecoverOperation;
//# sourceMappingURL=RecoverOperation.js.map