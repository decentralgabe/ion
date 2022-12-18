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
const ErrorCode_1 = require("../../lib/bitcoin/ErrorCode");
const TransactionNumber_1 = require("../../lib/bitcoin/TransactionNumber");
describe('TransactionNumber', () => {
    describe('construct()', () => {
        it('should construct transaction number correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionNumber = TransactionNumber_1.default.construct(123456789, 777);
            expect(transactionNumber).toEqual(123456789000777);
        }));
        it('should throw error if block number exceeded max value.', () => __awaiter(void 0, void 0, void 0, function* () {
            expect(() => TransactionNumber_1.default.construct(9000000001, 123456)).toThrow(jasmine.objectContaining({
                code: ErrorCode_1.default.TransactionNumberBlockNumberTooLarge
            }));
        }));
        it('should throw error if transaction index in block exceeded max value.', () => __awaiter(void 0, void 0, void 0, function* () {
            expect(() => TransactionNumber_1.default.construct(123456789, 1000000)).toThrow(jasmine.objectContaining({
                code: ErrorCode_1.default.TransactionNumberTransactionIndexInBlockTooLarge
            }));
        }));
    });
    describe('lastTransactionOfBlock()', () => {
        it('should return the transaction number of the last possible transaction in the given block.', () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionNumber = TransactionNumber_1.default.lastTransactionOfBlock(11111111);
            expect(transactionNumber).toEqual(11111111999999);
        }));
    });
    describe('getBlockNumber()', () => {
        it('should return the block number given a transaction number.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockNumber = TransactionNumber_1.default.getBlockNumber(11111111000000);
            expect(blockNumber).toEqual(11111111);
        }));
    });
});
//# sourceMappingURL=TransactionNumber.spec.js.map