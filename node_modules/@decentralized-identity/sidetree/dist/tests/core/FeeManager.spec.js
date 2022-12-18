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
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const FeeManager_1 = require("../../lib/core/versions/latest/FeeManager");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const ProtocolParameters_1 = require("../../lib/core/versions/latest/ProtocolParameters");
describe('FeeManager', () => __awaiter(void 0, void 0, void 0, function* () {
    beforeAll(() => {
        ProtocolParameters_1.default.maxNumberOfOperationsForNoValueTimeLock = 100;
        ProtocolParameters_1.default.normalizedFeeToPerOperationFeeMultiplier = 0.001;
    });
    describe('computeMinimumTransactionFee', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should calculate fee correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            const normalizedFee = 1000;
            const numberOfOperations = 1000;
            const fee = FeeManager_1.default.computeMinimumTransactionFee(normalizedFee, numberOfOperations);
            expect(fee).toEqual(1000);
        }));
        it('should return at least the normalized fee if the calculated fee is lower', () => __awaiter(void 0, void 0, void 0, function* () {
            const fee = FeeManager_1.default.computeMinimumTransactionFee(100, 1);
            expect(fee).toEqual(100);
        }));
        it('should fail if the number of operations is <= 0', () => __awaiter(void 0, void 0, void 0, function* () {
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => FeeManager_1.default.computeMinimumTransactionFee(100, 0), ErrorCode_1.default.OperationCountLessThanZero);
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => FeeManager_1.default.computeMinimumTransactionFee(100, -1), ErrorCode_1.default.OperationCountLessThanZero);
        }));
    }));
    describe('verifyTransactionFeeAndThrowOnError', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should not throw if the fee paid is at least the expected fee', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const feeToPay = FeeManager_1.default.computeMinimumTransactionFee(100, 100);
                FeeManager_1.default.verifyTransactionFeeAndThrowOnError(feeToPay, 100, 100);
            }
            catch (e) {
                fail();
            }
        }));
        it('should not throw if the fee paid is at least the expected fee (0% markup)', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const feeToPay = FeeManager_1.default.computeMinimumTransactionFee(100, 100);
                FeeManager_1.default.verifyTransactionFeeAndThrowOnError(feeToPay, 100, 100);
            }
            catch (e) {
                fail();
            }
        }));
        it('should throw if the fee paid is less than the expected fee', () => __awaiter(void 0, void 0, void 0, function* () {
            const feePaid = 2000; // Make fee paid very small.
            const numberOfOperations = 10000;
            const normalizedFee = 1000;
            // Make the next call w/ a large number of operations to simulate the error condition.
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => FeeManager_1.default.verifyTransactionFeeAndThrowOnError(feePaid, numberOfOperations, normalizedFee), ErrorCode_1.default.TransactionFeePaidInvalid);
        }));
        it('should throw if the fee paid is less than the normalized fee', () => __awaiter(void 0, void 0, void 0, function* () {
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => FeeManager_1.default.verifyTransactionFeeAndThrowOnError(99, 10, 100), ErrorCode_1.default.TransactionFeePaidLessThanNormalizedFee);
        }));
        it('should throw if the number of operations are <= 0', () => __awaiter(void 0, void 0, void 0, function* () {
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => FeeManager_1.default.verifyTransactionFeeAndThrowOnError(101, 0, 10), ErrorCode_1.default.OperationCountLessThanZero);
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => FeeManager_1.default.verifyTransactionFeeAndThrowOnError(101, -1, 10), ErrorCode_1.default.OperationCountLessThanZero);
        }));
    }));
}));
//# sourceMappingURL=FeeManager.spec.js.map