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
const CreateOperation_1 = require("./CreateOperation");
const DeactivateOperation_1 = require("./DeactivateOperation");
const DocumentComposer_1 = require("./DocumentComposer");
const ErrorCode_1 = require("./ErrorCode");
const InputValidator_1 = require("./InputValidator");
const OperationType_1 = require("../../enums/OperationType");
const RecoverOperation_1 = require("./RecoverOperation");
const SidetreeError_1 = require("../../../common/SidetreeError");
const UpdateOperation_1 = require("./UpdateOperation");
/**
 * A class that contains Sidetree operation utility methods.
 */
class Operation {
    /**
     * Parses the given buffer into an `OperationModel`.
     */
    static parse(operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            // Parse request buffer into a JS object.
            const operationJsonString = operationBuffer.toString();
            const operationObject = JSON.parse(operationJsonString);
            const operationType = operationObject.type;
            if (operationType === OperationType_1.default.Create) {
                return CreateOperation_1.default.parseObject(operationObject, operationBuffer);
            }
            else if (operationType === OperationType_1.default.Update) {
                return UpdateOperation_1.default.parseObject(operationObject, operationBuffer);
            }
            else if (operationType === OperationType_1.default.Recover) {
                return RecoverOperation_1.default.parseObject(operationObject, operationBuffer);
            }
            else if (operationType === OperationType_1.default.Deactivate) {
                return DeactivateOperation_1.default.parseObject(operationObject, operationBuffer);
            }
            else {
                throw new SidetreeError_1.default(ErrorCode_1.default.OperationTypeUnknownOrMissing);
            }
        });
    }
    /**
     * validate delta and throw if invalid
     * @param delta the delta to validate
     */
    static validateDelta(delta) {
        InputValidator_1.default.validateNonArrayObject(delta, 'delta');
        InputValidator_1.default.validateObjectContainsOnlyAllowedProperties(delta, ['patches', 'updateCommitment'], 'delta');
        // Validate `patches` property using the DocumentComposer.
        DocumentComposer_1.default.validateDocumentPatches(delta.patches);
        InputValidator_1.default.validateEncodedMultihash(delta.updateCommitment, 'update commitment');
    }
}
exports.default = Operation;
/** Maximum allowed encoded reveal value string length. */
Operation.maxEncodedRevealValueLength = 50;
//# sourceMappingURL=Operation.js.map