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
const OperationType_1 = require("../../enums/OperationType");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * A class that represents a deactivate operation.
 */
class DeactivateOperation {
    /**
     * NOTE: should only be used by `parse()` and `parseObject()` else the constructed instance could be invalid.
     */
    constructor(operationBuffer, didUniqueSuffix, revealValue, signedDataJws, signedData) {
        this.operationBuffer = operationBuffer;
        this.didUniqueSuffix = didUniqueSuffix;
        this.revealValue = revealValue;
        this.signedDataJws = signedDataJws;
        this.signedData = signedData;
        /** The type of operation. */
        this.type = OperationType_1.default.Deactivate;
    }
    /**
     * Parses the given buffer as a `UpdateOperation`.
     */
    static parse(operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const operationJsonString = operationBuffer.toString();
            const operationObject = yield JsonAsync_1.default.parse(operationJsonString);
            const deactivateOperation = yield DeactivateOperation.parseObject(operationObject, operationBuffer);
            return deactivateOperation;
        });
    }
    /**
     * Parses the given operation object as a `DeactivateOperation`.
     * The `operationBuffer` given is assumed to be valid and is assigned to the `operationBuffer` directly.
     * NOTE: This method is purely intended to be used as an optimization method over the `parse` method in that
     * JSON parsing is not required to be performed more than once when an operation buffer of an unknown operation type is given.
     */
    static parseObject(operationObject, operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(operationObject, ['type', 'didSuffix', 'revealValue', 'signedData'], 'deactivate request');
            if (operationObject.type !== OperationType_1.default.Deactivate) {
                throw new SidetreeError_1.default(ErrorCode_1.default.DeactivateOperationTypeIncorrect);
            }
            InputValidator_1.default.validateEncodedMultihash(operationObject.didSuffix, 'deactivate request didSuffix');
            InputValidator_1.default.validateEncodedMultihash(operationObject.revealValue, 'deactivate request reveal value');
            const signedDataJws = Jws_1.default.parseCompactJws(operationObject.signedData);
            const signedDataModel = yield DeactivateOperation.parseSignedDataPayload(signedDataJws.payload, operationObject.didSuffix);
            // Validate that the canonicalized recovery public key hash is the same as `revealValue`.
            Multihash_1.default.validateCanonicalizeObjectHash(signedDataModel.recoveryKey, operationObject.revealValue, 'deactivate request recovery key');
            return new DeactivateOperation(operationBuffer, operationObject.didSuffix, operationObject.revealValue, signedDataJws, signedDataModel);
        });
    }
    /**
     * Parses the signed data payload of a deactivate operation.
     */
    static parseSignedDataPayload(signedDataEncodedString, expectedDidUniqueSuffix) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedDataJsonString = Encoder_1.default.decodeAsString(signedDataEncodedString);
            const signedData = yield JsonAsync_1.default.parse(signedDataJsonString);
            const properties = Object.keys(signedData);
            if (properties.length !== 2) {
                throw new SidetreeError_1.default(ErrorCode_1.default.DeactivateOperationSignedDataMissingOrUnknownProperty);
            }
            if (signedData.didSuffix !== expectedDidUniqueSuffix) {
                throw new SidetreeError_1.default(ErrorCode_1.default.DeactivateOperationSignedDidUniqueSuffixMismatch);
            }
            Jwk_1.default.validateJwkEs256k(signedData.recoveryKey);
            return signedData;
        });
    }
}
exports.default = DeactivateOperation;
//# sourceMappingURL=DeactivateOperation.js.map