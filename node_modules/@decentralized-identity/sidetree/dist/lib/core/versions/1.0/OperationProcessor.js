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
const Encoder_1 = require("./Encoder");
const ErrorCode_1 = require("./ErrorCode");
const JsObject_1 = require("./util/JsObject");
const JsonCanonicalizer_1 = require("./util/JsonCanonicalizer");
const Logger_1 = require("../../../common/Logger");
const Multihash_1 = require("./Multihash");
const Operation_1 = require("./Operation");
const OperationType_1 = require("../../enums/OperationType");
const RecoverOperation_1 = require("./RecoverOperation");
const SidetreeError_1 = require("../../../common/SidetreeError");
const UpdateOperation_1 = require("./UpdateOperation");
/**
 * Implementation of IOperationProcessor.
 */
class OperationProcessor {
    apply(anchoredOperationModel, didState) {
        return __awaiter(this, void 0, void 0, function* () {
            // If DID state is undefined, then the operation given must be a create operation, otherwise the operation cannot be applied.
            if (didState === undefined && anchoredOperationModel.type !== OperationType_1.default.Create) {
                return undefined;
            }
            const previousOperationTransactionNumber = didState ? didState.lastOperationTransactionNumber : undefined;
            let appliedDidState;
            if (anchoredOperationModel.type === OperationType_1.default.Create) {
                appliedDidState = yield this.applyCreateOperation(anchoredOperationModel, didState);
            }
            else if (anchoredOperationModel.type === OperationType_1.default.Update) {
                appliedDidState = yield this.applyUpdateOperation(anchoredOperationModel, didState);
            }
            else if (anchoredOperationModel.type === OperationType_1.default.Recover) {
                appliedDidState = yield this.applyRecoverOperation(anchoredOperationModel, didState);
            }
            else if (anchoredOperationModel.type === OperationType_1.default.Deactivate) {
                appliedDidState = yield this.applyDeactivateOperation(anchoredOperationModel, didState);
            }
            else {
                throw new SidetreeError_1.default(ErrorCode_1.default.OperationProcessorUnknownOperationType);
            }
            // If the operation was not applied, return undefined.
            // TODO: https://github.com/decentralized-identity/sidetree/issues/1171:
            //       Make OperationProcessor.applyXyxOperation() return undefined when unable to apply an operation,
            //       Making the failure explicit is better than the current approach of inferring failure based on transaction number,
            //       it will also be more consistent with the pattern used downstream.
            if (appliedDidState === undefined ||
                appliedDidState.lastOperationTransactionNumber === previousOperationTransactionNumber) {
                const index = anchoredOperationModel.operationIndex;
                const time = anchoredOperationModel.transactionTime;
                const number = anchoredOperationModel.transactionNumber;
                const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
                Logger_1.default.info(`Ignored invalid operation for DID '${didUniqueSuffix}' in transaction '${number}' at time '${time}' at operation index ${index}.`);
                return undefined;
            }
            // Operation applied successfully.
            return appliedDidState;
        });
    }
    getMultihashRevealValue(anchoredOperationModel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (anchoredOperationModel.type === OperationType_1.default.Create) {
                throw new SidetreeError_1.default(ErrorCode_1.default.OperationProcessorCreateOperationDoesNotHaveRevealValue);
            }
            const operation = yield Operation_1.default.parse(anchoredOperationModel.operationBuffer);
            const multihashRevealValue = operation.revealValue;
            const multihashRevealValueBuffer = Encoder_1.default.decodeAsBuffer(multihashRevealValue);
            return multihashRevealValueBuffer;
        });
    }
    /**
     * @returns new DID state if operation is applied successfully; the given DID state otherwise.
     */
    applyCreateOperation(anchoredOperationModel, didState) {
        return __awaiter(this, void 0, void 0, function* () {
            // If DID state is already created by a previous create operation, then we cannot apply a create operation again.
            if (didState !== undefined) {
                return didState;
            }
            // When delta parsing fails, operation.delta is undefined.
            const operation = yield CreateOperation_1.default.parse(anchoredOperationModel.operationBuffer);
            const newDidState = {
                document: {},
                nextRecoveryCommitmentHash: operation.suffixData.recoveryCommitment,
                nextUpdateCommitmentHash: undefined,
                lastOperationTransactionNumber: anchoredOperationModel.transactionNumber
            };
            if (operation.delta === undefined) {
                return newDidState;
            }
            // Verify the delta hash against the expected delta hash.
            const deltaPayload = JsonCanonicalizer_1.default.canonicalizeAsBuffer(operation.delta);
            // If code execution gets to this point, delta is defined.
            const isMatchingDelta = Multihash_1.default.verifyEncodedMultihashForContent(deltaPayload, operation.suffixData.deltaHash);
            if (!isMatchingDelta) {
                return newDidState;
            }
            ;
            // Apply the given patches against an empty object.
            const delta = operation.delta;
            // Update the commitment hash regardless of patch application outcome.
            newDidState.nextUpdateCommitmentHash = delta.updateCommitment;
            try {
                const document = {};
                DocumentComposer_1.default.applyPatches(document, delta.patches);
                newDidState.document = document;
            }
            catch (error) {
                const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
                const transactionNumber = anchoredOperationModel.transactionNumber;
                Logger_1.default.info(`Partial update on next commitment hash applied because: ` +
                    `Unable to apply delta patches for transaction number ${transactionNumber} for DID ${didUniqueSuffix}: ${SidetreeError_1.default.stringify(error)}.`);
            }
            return newDidState;
        });
    }
    /**
     * @returns new DID state if operation is applied successfully; the given DID state otherwise.
     */
    applyUpdateOperation(anchoredOperationModel, didState) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = yield UpdateOperation_1.default.parse(anchoredOperationModel.operationBuffer);
            // Verify the update key hash.
            const isValidUpdateKey = Multihash_1.default.canonicalizeAndVerifyDoubleHash(operation.signedData.updateKey, didState.nextUpdateCommitmentHash);
            if (!isValidUpdateKey) {
                return didState;
            }
            // Verify the signature.
            const signatureIsValid = yield operation.signedDataJws.verifySignature(operation.signedData.updateKey);
            if (!signatureIsValid) {
                return didState;
            }
            if (operation.delta === undefined) {
                return didState;
            }
            // Verify the delta hash against the expected delta hash.
            const deltaPayload = JsonCanonicalizer_1.default.canonicalizeAsBuffer(operation.delta);
            const isMatchingDelta = Multihash_1.default.verifyEncodedMultihashForContent(deltaPayload, operation.signedData.deltaHash);
            if (!isMatchingDelta) {
                return didState;
            }
            ;
            // Passed all verifications, must update the update commitment value even if the application of patches fail.
            const newDidState = {
                nextRecoveryCommitmentHash: didState.nextRecoveryCommitmentHash,
                document: didState.document,
                nextUpdateCommitmentHash: operation.delta.updateCommitment,
                lastOperationTransactionNumber: anchoredOperationModel.transactionNumber
            };
            try {
                // NOTE: MUST pass DEEP COPY of the DID Document to `DocumentComposer` such that in the event of a patch failure,
                // the original document is not modified.
                const documentDeepCopy = JsObject_1.default.deepCopyObject(didState.document);
                DocumentComposer_1.default.applyPatches(documentDeepCopy, operation.delta.patches);
                newDidState.document = documentDeepCopy;
            }
            catch (error) {
                const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
                const transactionNumber = anchoredOperationModel.transactionNumber;
                Logger_1.default.info(`Unable to apply document patch in transaction number ${transactionNumber} for DID ${didUniqueSuffix}: ${SidetreeError_1.default.stringify(error)}.`);
            }
            return newDidState;
        });
    }
    /**
     * @returns new DID state if operation is applied successfully; the given DID state otherwise.
     */
    applyRecoverOperation(anchoredOperationModel, didState) {
        return __awaiter(this, void 0, void 0, function* () {
            // When delta parsing fails, operation.delta is undefined.
            const operation = yield RecoverOperation_1.default.parse(anchoredOperationModel.operationBuffer);
            // Verify the recovery key hash.
            const isValidRecoveryKey = Multihash_1.default.canonicalizeAndVerifyDoubleHash(operation.signedData.recoveryKey, didState.nextRecoveryCommitmentHash);
            if (!isValidRecoveryKey) {
                return didState;
            }
            // Verify the signature.
            const signatureIsValid = yield operation.signedDataJws.verifySignature(operation.signedData.recoveryKey);
            if (!signatureIsValid) {
                return didState;
            }
            const newDidState = {
                nextRecoveryCommitmentHash: operation.signedData.recoveryCommitment,
                document: {},
                nextUpdateCommitmentHash: undefined,
                lastOperationTransactionNumber: anchoredOperationModel.transactionNumber
            };
            if (operation.delta === undefined) {
                return newDidState;
            }
            // Verify the delta hash against the expected delta hash.
            const deltaPayload = JsonCanonicalizer_1.default.canonicalizeAsBuffer(operation.delta);
            const isMatchingDelta = Multihash_1.default.verifyEncodedMultihashForContent(deltaPayload, operation.signedData.deltaHash);
            if (!isMatchingDelta) {
                return newDidState;
            }
            ;
            // Apply the given patches against an empty object.
            const delta = operation.delta;
            // update the commitment hash regardless
            newDidState.nextUpdateCommitmentHash = delta.updateCommitment;
            try {
                const document = {};
                DocumentComposer_1.default.applyPatches(document, delta.patches);
                newDidState.document = document;
            }
            catch (error) {
                const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
                const transactionNumber = anchoredOperationModel.transactionNumber;
                Logger_1.default.info(`Partial update on next commitment hash applied because: ` +
                    `Unable to apply delta patches for transaction number ${transactionNumber} for DID ${didUniqueSuffix}: ${SidetreeError_1.default.stringify(error)}.`);
            }
            return newDidState;
        });
    }
    /**
     * @returns new DID state if operation is applied successfully; the given DID state otherwise.
     */
    applyDeactivateOperation(anchoredOperationModel, didState) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = yield DeactivateOperation_1.default.parse(anchoredOperationModel.operationBuffer);
            // Verify the recovery key hash.
            const isValidRecoveryKey = Multihash_1.default.canonicalizeAndVerifyDoubleHash(operation.signedData.recoveryKey, didState.nextRecoveryCommitmentHash);
            if (!isValidRecoveryKey) {
                return didState;
            }
            // Verify the signature.
            const signatureIsValid = yield operation.signedDataJws.verifySignature(operation.signedData.recoveryKey);
            if (!signatureIsValid) {
                return didState;
            }
            // The operation passes all checks.
            const newDidState = {
                document: didState.document,
                // New values below.
                nextRecoveryCommitmentHash: undefined,
                nextUpdateCommitmentHash: undefined,
                lastOperationTransactionNumber: anchoredOperationModel.transactionNumber
            };
            return newDidState;
        });
    }
}
exports.default = OperationProcessor;
//# sourceMappingURL=OperationProcessor.js.map