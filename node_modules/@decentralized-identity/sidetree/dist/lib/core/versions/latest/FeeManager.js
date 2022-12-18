"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorCode_1 = require("./ErrorCode");
const ProtocolParameters_1 = require("./ProtocolParameters");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Encapsulates the functionality to calculate and verify the blockchain transaction fees.
 */
class FeeManager {
    /**
     * Converts the normalized fee (returned by the blockchain) into the transaction fee to be paid when writing
     * the current transaction.
     *
     * @param normalizedFee The normalized fee for the current transaction.
     * @param numberOfOperations The number of operations to write.
     *
     * @throws if the number of operations are <= 0.
     */
    static computeMinimumTransactionFee(normalizedFee, numberOfOperations) {
        if (numberOfOperations <= 0) {
            throw new SidetreeError_1.default(ErrorCode_1.default.OperationCountLessThanZero, `Fee cannot be calculated for the given number of operations: ${numberOfOperations}`);
        }
        const feePerOperation = normalizedFee * ProtocolParameters_1.default.normalizedFeeToPerOperationFeeMultiplier;
        const feeForAllOperations = feePerOperation * numberOfOperations;
        // Requiring at least normalized fee prevents miner from paying lower fee because they get to decide what transactions to include in a block
        // It also encourages batching because the fee per operation ratio will be lower with more operations per transaction
        const transactionFee = Math.max(feeForAllOperations, normalizedFee);
        return transactionFee;
    }
    /**
     * Verifies that the fee paid for the given transaction is valid; throws if it is not valid.
     *
     * @param transactionFeePaid The actual fee paid for that transaction.
     * @param numberOfOperations The number of operations written.
     * @param normalizedFee The normalized fee for that transaction.
     *
     * @throws if the number of operations is <= 0; if the fee paid is invalid.
     */
    static verifyTransactionFeeAndThrowOnError(transactionFeePaid, numberOfOperations, normalizedFee) {
        // If there are no operations written then someone wrote incorrect data and we are going to throw
        if (numberOfOperations <= 0) {
            throw new SidetreeError_1.default(ErrorCode_1.default.OperationCountLessThanZero, `The number of operations: ${numberOfOperations} must be greater than 0`);
        }
        // Requiring at least normalized fee prevents miner from paying lower fee because they get to decide what transactions to include in a block
        // It also encourages batching because the fee per operation ratio will be lower with more operations per transaction
        if (transactionFeePaid < normalizedFee) {
            throw new SidetreeError_1.default(ErrorCode_1.default.TransactionFeePaidLessThanNormalizedFee, `The actual fee paid: ${transactionFeePaid} should be greater than or equal to the normalized fee: ${normalizedFee}`);
        }
        const actualFeePerOperation = transactionFeePaid / numberOfOperations;
        const expectedFeePerOperation = normalizedFee * ProtocolParameters_1.default.normalizedFeeToPerOperationFeeMultiplier;
        if (actualFeePerOperation < expectedFeePerOperation) {
            throw new SidetreeError_1.default(ErrorCode_1.default.TransactionFeePaidInvalid, `The actual fee paid: ${transactionFeePaid} per number of operations: ${numberOfOperations} should be at least ${expectedFeePerOperation}.`);
        }
    }
}
exports.default = FeeManager;
//# sourceMappingURL=FeeManager.js.map