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
 * A class that represents an update operation.
 */
class UpdateOperation {
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
        this.type = OperationType_1.default.Update;
    }
    /**
     * Parses the given buffer as a `UpdateOperation`.
     */
    static parse(operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const operationJsonString = operationBuffer.toString();
            const operationObject = yield JsonAsync_1.default.parse(operationJsonString);
            const updateOperation = yield UpdateOperation.parseObject(operationObject, operationBuffer);
            return updateOperation;
        });
    }
    /**
     * Parses the given operation object as a `UpdateOperation`.
     * The `operationBuffer` given is assumed to be valid and is assigned to the `operationBuffer` directly.
     * NOTE: This method is purely intended to be used as an optimization method over the `parse` method in that
     * JSON parsing is not required to be performed more than once when an operation buffer of an unknown operation type is given.
     */
    static parseObject(operationObject, operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(operationObject, ['type', 'didSuffix', 'revealValue', 'signedData', 'delta'], 'update request');
            if (operationObject.type !== OperationType_1.default.Update) {
                throw new SidetreeError_1.default(ErrorCode_1.default.UpdateOperationTypeIncorrect);
            }
            InputValidator_1.default.validateEncodedMultihash(operationObject.didSuffix, 'update request didSuffix');
            InputValidator_1.default.validateEncodedMultihash(operationObject.revealValue, 'update request reveal value');
            const signedData = Jws_1.default.parseCompactJws(operationObject.signedData);
            const signedDataModel = yield UpdateOperation.parseSignedDataPayload(signedData.payload);
            // Validate that the canonicalized update key hash is the same as `revealValue`.
            Multihash_1.default.validateCanonicalizeObjectHash(signedDataModel.updateKey, operationObject.revealValue, 'update request update key');
            Operation_1.default.validateDelta(operationObject.delta);
            return new UpdateOperation(operationBuffer, operationObject.didSuffix, operationObject.revealValue, signedData, signedDataModel, operationObject.delta);
        });
    }
    /**
     * Parses the signed data payload of an update operation.
     */
    static parseSignedDataPayload(signedDataEncodedString) {
        return __awaiter(this, void 0, void 0, function* () {
            const signedDataJsonString = Encoder_1.default.decodeAsString(signedDataEncodedString);
            const signedData = yield JsonAsync_1.default.parse(signedDataJsonString);
            const properties = Object.keys(signedData);
            if (properties.length !== 2) {
                throw new SidetreeError_1.default(ErrorCode_1.default.UpdateOperationSignedDataHasMissingOrUnknownProperty);
            }
            Jwk_1.default.validateJwkEs256k(signedData.updateKey);
            InputValidator_1.default.validateEncodedMultihash(signedData.deltaHash, 'update operation delta hash');
            return signedData;
        });
    }
}
exports.default = UpdateOperation;
//# sourceMappingURL=UpdateOperation.js.map