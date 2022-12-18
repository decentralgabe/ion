"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorCode_1 = require("./ErrorCode");
const ProtocolParameters_1 = require("./ProtocolParameters");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Encapsulates the functionality to compute and verify the value time lock amounts.
 */
class ValueTimeLockVerifier {
    /**
     * Calculates the maximum number of operations allowed to be written for the given lock information. If
     * there is no lock then it returns the number of operations which do not require a lock.
     *
     * @param valueTimeLock The lock object if exists
     * @param versionMetadataFetcher The mapper from transaction time to version metadata
     */
    static calculateMaxNumberOfOperationsAllowed(valueTimeLock, versionMetadataFetcher) {
        if (valueTimeLock === undefined) {
            return ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock;
        }
        const versionMetadata = versionMetadataFetcher.getVersionMetadata(valueTimeLock.lockTransactionTime);
        const normalizedFeeToPerOperationFeeMultiplier = versionMetadata.normalizedFeeToPerOperationFeeMultiplier;
        const valueTimeLockAmountMultiplier = versionMetadata.valueTimeLockAmountMultiplier;
        // Using the following formula:
        //  requiredLockAmount = normalizedFee * normalizedFeeMultiplier * numberOfOps * valueTimeLockMultiplier
        //
        // We are going to find the numberOfOps given the requiredLockAmount
        const feePerOperation = valueTimeLock.normalizedFee * normalizedFeeToPerOperationFeeMultiplier;
        const numberOfOpsAllowed = valueTimeLock.amountLocked / (feePerOperation * valueTimeLockAmountMultiplier);
        // Make sure that we are returning an integer; rounding down to make sure that we are not going above
        // the max limit.
        const numberOfOpsAllowedInt = Math.floor(numberOfOpsAllowed);
        // Return at least the 'free' operations
        return Math.max(numberOfOpsAllowedInt, ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock);
    }
    /**
     * Verifies that the value lock object (amount, transaction time range) is correct for the specified number
     * of operations.
     *
     * @param valueTimeLock The value time lock object used for verification.
     * @param numberOfOperations The target number of operations.
     * @param sidetreeTransactionTime The transaction time where the operations were written.
     * @param sidetreeTransactionWriter The writer of the transaction.
     * @param versionMetadataFetcher The mapper from transaction time to version metadata
     */
    static verifyLockAmountAndThrowOnError(valueTimeLock, numberOfOperations, sidetreeTransactionTime, sidetreeTransactionWriter, versionMetadataFetcher) {
        // If the number of written operations were under the free limit then there's nothing to check
        if (numberOfOperations <= ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock) {
            return;
        }
        if (valueTimeLock) {
            // Check the lock owner
            if (valueTimeLock.owner !== sidetreeTransactionWriter) {
                throw new SidetreeError_1.default(ErrorCode_1.default.ValueTimeLockVerifierTransactionWriterLockOwnerMismatch, `Sidetree transaction writer: ${sidetreeTransactionWriter} - Lock owner: ${valueTimeLock.owner}`);
            }
            // Check the lock duration
            if (sidetreeTransactionTime < valueTimeLock.lockTransactionTime ||
                sidetreeTransactionTime >= valueTimeLock.unlockTransactionTime) {
                throw new SidetreeError_1.default(ErrorCode_1.default.ValueTimeLockVerifierTransactionTimeOutsideLockRange, 
                // eslint-disable-next-line max-len
                `Sidetree transaction block: ${sidetreeTransactionTime}; lock start time: ${valueTimeLock.lockTransactionTime}; unlock time: ${valueTimeLock.unlockTransactionTime}`);
            }
        }
        const maxNumberOfOpsAllowed = this.calculateMaxNumberOfOperationsAllowed(valueTimeLock, versionMetadataFetcher);
        if (numberOfOperations > maxNumberOfOpsAllowed) {
            throw new SidetreeError_1.default(ErrorCode_1.default.ValueTimeLockVerifierInvalidNumberOfOperations, `Max number of ops allowed: ${maxNumberOfOpsAllowed}; actual number of ops: ${numberOfOperations}`);
        }
    }
}
exports.default = ValueTimeLockVerifier;
//# sourceMappingURL=ValueTimeLockVerifier.js.map