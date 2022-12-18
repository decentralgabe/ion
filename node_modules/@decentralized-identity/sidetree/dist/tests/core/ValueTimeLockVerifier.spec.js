"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const ProtocolParameters_1 = require("../../lib/core/versions/latest/ProtocolParameters");
const ValueTimeLockVerifier_1 = require("../../lib/core/versions/latest/ValueTimeLockVerifier");
describe('ValueTimeLockVerifier', () => {
    let versionMetadataFetcher = {};
    const versionMetadata = {
        normalizedFeeToPerOperationFeeMultiplier: 0.50,
        valueTimeLockAmountMultiplier: 100
    };
    versionMetadataFetcher = {
        getVersionMetadata: () => {
            return versionMetadata;
        }
    };
    describe('calculateMaxNumberOfOperationsAllowed', () => {
        it('should return the correct lock amount', () => {
            const valueTimeLockInput = {
                amountLocked: 12349876,
                identifier: 'identifier',
                lockTransactionTime: 1234,
                unlockTransactionTime: 1240,
                normalizedFee: 3,
                owner: 'owner'
            };
            const feePerOp = valueTimeLockInput.normalizedFee * versionMetadata.normalizedFeeToPerOperationFeeMultiplier;
            const numOfOps = valueTimeLockInput.amountLocked / (feePerOp * versionMetadata.valueTimeLockAmountMultiplier);
            const expectedNumOfOps = Math.floor(numOfOps);
            const actual = ValueTimeLockVerifier_1.default.calculateMaxNumberOfOperationsAllowed(valueTimeLockInput, versionMetadataFetcher);
            expect(actual).toEqual(expectedNumOfOps);
        });
        it('should return the number of free ops if the lock amount is too small', () => {
            const valueTimeLockInput = {
                amountLocked: 100,
                identifier: 'identifier',
                lockTransactionTime: 1234,
                unlockTransactionTime: 1240,
                normalizedFee: 100,
                owner: 'owner'
            };
            const actual = ValueTimeLockVerifier_1.default.calculateMaxNumberOfOperationsAllowed(valueTimeLockInput, versionMetadataFetcher);
            expect(actual).toEqual(ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock);
        });
        it('should return number of free ops if the value lock is undefined.', () => {
            const actual = ValueTimeLockVerifier_1.default.calculateMaxNumberOfOperationsAllowed(undefined, versionMetadataFetcher);
            expect(actual).toEqual(ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock);
        });
    });
    describe('verifyLockAmountAndThrowOnError', () => {
        it('should not throw if the number of operations are less than the free-operations-count', () => {
            const calcMaxOpsSpy = spyOn(ValueTimeLockVerifier_1.default, 'calculateMaxNumberOfOperationsAllowed');
            const numberOfOpsInput = ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock;
            ValueTimeLockVerifier_1.default.verifyLockAmountAndThrowOnError(undefined, numberOfOpsInput, 12, 'txn writer', versionMetadataFetcher);
            expect(calcMaxOpsSpy).not.toHaveBeenCalled();
        });
        it('should throw if the lock-owner and transaction-writer do not match', () => {
            const valueTimeLockInput = {
                amountLocked: 1234,
                identifier: 'identifier',
                lockTransactionTime: 1234,
                unlockTransactionTime: 1235,
                normalizedFee: 123,
                owner: 'lock-owner'
            };
            const numberOfOpsInput = ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock + 100;
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => ValueTimeLockVerifier_1.default.verifyLockAmountAndThrowOnError(valueTimeLockInput, numberOfOpsInput, 12, 'txn writer', versionMetadataFetcher), ErrorCode_1.default.ValueTimeLockVerifierTransactionWriterLockOwnerMismatch);
        });
        it('should throw if the current block is earlier than the lock start time.', () => {
            const valueTimeLockinput = {
                amountLocked: 100,
                identifier: 'identifier',
                lockTransactionTime: 1234,
                unlockTransactionTime: 7890,
                normalizedFee: 200,
                owner: 'owner'
            };
            const numberOfOpsInput = ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock + 100;
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => ValueTimeLockVerifier_1.default.verifyLockAmountAndThrowOnError(valueTimeLockinput, numberOfOpsInput, valueTimeLockinput.lockTransactionTime - 1, valueTimeLockinput.owner, versionMetadataFetcher), ErrorCode_1.default.ValueTimeLockVerifierTransactionTimeOutsideLockRange);
        });
        it('should throw if the lock is later than the lock end time.', () => {
            const valueTimeLockinput = {
                amountLocked: 100,
                identifier: 'identifier',
                lockTransactionTime: 1234,
                unlockTransactionTime: 7890,
                normalizedFee: 200,
                owner: 'owner'
            };
            const numberOfOpsInput = ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock + 100;
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => ValueTimeLockVerifier_1.default.verifyLockAmountAndThrowOnError(valueTimeLockinput, numberOfOpsInput, valueTimeLockinput.unlockTransactionTime, valueTimeLockinput.owner, versionMetadataFetcher), ErrorCode_1.default.ValueTimeLockVerifierTransactionTimeOutsideLockRange);
        });
        it('should throw if the lock amount is less than the required amount.', () => {
            const mockMaxNumOfOps = 234;
            spyOn(ValueTimeLockVerifier_1.default, 'calculateMaxNumberOfOperationsAllowed').and.returnValue(mockMaxNumOfOps);
            const valueTimeLockinput = {
                amountLocked: 123,
                identifier: 'identifier',
                lockTransactionTime: 1234,
                unlockTransactionTime: 7890,
                normalizedFee: 200,
                owner: 'owner'
            };
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => ValueTimeLockVerifier_1.default.verifyLockAmountAndThrowOnError(valueTimeLockinput, mockMaxNumOfOps + 1, valueTimeLockinput.lockTransactionTime + 1, valueTimeLockinput.owner, versionMetadataFetcher), ErrorCode_1.default.ValueTimeLockVerifierInvalidNumberOfOperations);
        });
        it('should throw if operations are greater than the number allowed without lock.', () => {
            const mockMaxNumOfOps = 9999999;
            spyOn(ValueTimeLockVerifier_1.default, 'calculateMaxNumberOfOperationsAllowed').and.returnValue(100);
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => {
                ValueTimeLockVerifier_1.default.verifyLockAmountAndThrowOnError(undefined, mockMaxNumOfOps, 1234, 'owner', versionMetadataFetcher);
            }, ErrorCode_1.default.ValueTimeLockVerifierInvalidNumberOfOperations);
        });
        it('should not throw if all of the checks pass.', () => {
            const mockMaxNumOfOps = 234;
            spyOn(ValueTimeLockVerifier_1.default, 'calculateMaxNumberOfOperationsAllowed').and.returnValue(mockMaxNumOfOps);
            const valueTimeLockinput = {
                amountLocked: 123,
                identifier: 'identifier',
                lockTransactionTime: 1234,
                unlockTransactionTime: 7890,
                normalizedFee: 200,
                owner: 'owner'
            };
            ValueTimeLockVerifier_1.default.verifyLockAmountAndThrowOnError(valueTimeLockinput, mockMaxNumOfOps, valueTimeLockinput.lockTransactionTime + 1, valueTimeLockinput.owner, versionMetadataFetcher);
            // no exception === no unexpected errors.
        });
    });
});
//# sourceMappingURL=ValueTimeLockVerifier.spec.js.map