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
const Did_1 = require("./Did");
const ErrorCode_1 = require("./ErrorCode");
const InputValidator_1 = require("./InputValidator");
const JsonAsync_1 = require("./util/JsonAsync");
const Operation_1 = require("./Operation");
const OperationType_1 = require("../../enums/OperationType");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * A class that represents a create operation.
 */
class CreateOperation {
    /**
     * NOTE: should only be used by `parse()` and `parseObject()` else the constructed instance could be invalid.
     */
    constructor(operationBuffer, didUniqueSuffix, suffixData, delta) {
        this.operationBuffer = operationBuffer;
        this.didUniqueSuffix = didUniqueSuffix;
        this.suffixData = suffixData;
        this.delta = delta;
        /** The type of operation. */
        this.type = OperationType_1.default.Create;
    }
    /**
     * Parses the given buffer as a `CreateOperation`.
     */
    static parse(operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const operationJsonString = operationBuffer.toString();
            const operationObject = yield JsonAsync_1.default.parse(operationJsonString);
            const createOperation = CreateOperation.parseObject(operationObject, operationBuffer);
            return createOperation;
        });
    }
    /**
     * Parses the given operation object as a `CreateOperation`.
     * The `operationBuffer` given is assumed to be valid and is assigned to the `operationBuffer` directly.
     * NOTE: This method is purely intended to be used as an optimization method over the `parse` method in that
     * JSON parsing is not required to be performed more than once when an operation buffer of an unknown operation type is given.
     * @param operationObject The operationObject is a json object with no encoding
     * @param operationBuffer The buffer format of the operationObject
     */
    static parseObject(operationObject, operationBuffer) {
        const expectedPropertyCount = 3;
        const properties = Object.keys(operationObject);
        if (properties.length !== expectedPropertyCount) {
            throw new SidetreeError_1.default(ErrorCode_1.default.CreateOperationMissingOrUnknownProperty);
        }
        if (operationObject.type !== OperationType_1.default.Create) {
            throw new SidetreeError_1.default(ErrorCode_1.default.CreateOperationTypeIncorrect);
        }
        const suffixData = operationObject.suffixData;
        InputValidator_1.default.validateSuffixData(suffixData);
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
        const didUniqueSuffix = Did_1.default.computeUniqueSuffix(suffixData);
        return new CreateOperation(operationBuffer, didUniqueSuffix, suffixData, delta);
    }
}
exports.default = CreateOperation;
//# sourceMappingURL=CreateOperation.js.map