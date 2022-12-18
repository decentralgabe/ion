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
const MockTransactionStore_1 = require("../mocks/MockTransactionStore");
const MockVersionManager_1 = require("../mocks/MockVersionManager");
const ThroughputLimiter_1 = require("../../lib/core/ThroughputLimiter");
const TransactionSelector_1 = require("../../lib/core/versions/latest/TransactionSelector");
describe('ThroughputLimiter', () => {
    let throughputLimiter;
    const versionManager = new MockVersionManager_1.default();
    let transactionSelector;
    beforeEach(() => {
        transactionSelector = new TransactionSelector_1.default(new MockTransactionStore_1.default());
        spyOn(transactionSelector, 'selectQualifiedTransactions').and.callFake((transactions) => {
            // mock selecting the first one
            return new Promise((resolve) => { resolve([transactions[0]]); });
        });
        spyOn(versionManager, 'getTransactionSelector').and.returnValue(transactionSelector);
        throughputLimiter = new ThroughputLimiter_1.default(versionManager);
    });
    describe('getQualifiedTransactions', () => {
        it('should execute with expected behavior', () => __awaiter(void 0, void 0, void 0, function* () {
            const transactions = [
                {
                    transactionNumber: 1,
                    transactionTime: 1,
                    transactionTimeHash: 'some hash',
                    anchorString: 'some string',
                    transactionFeePaid: 333,
                    normalizedTransactionFee: 1,
                    writer: 'writer1'
                },
                {
                    transactionNumber: 2,
                    transactionTime: 2,
                    transactionTimeHash: 'some hash',
                    anchorString: 'some string',
                    transactionFeePaid: 998,
                    normalizedTransactionFee: 1,
                    writer: 'writer2'
                },
                {
                    transactionNumber: 3,
                    transactionTime: 2,
                    transactionTimeHash: 'some hash',
                    anchorString: 'some string',
                    transactionFeePaid: 999,
                    normalizedTransactionFee: 1,
                    writer: 'writer3'
                },
                {
                    transactionNumber: 4,
                    transactionTime: 3,
                    transactionTimeHash: 'some hash',
                    anchorString: 'some string',
                    transactionFeePaid: 14,
                    normalizedTransactionFee: 1,
                    writer: 'writer4'
                }
            ];
            const result = yield throughputLimiter.getQualifiedTransactions(transactions);
            const expected = [
                {
                    transactionNumber: 1,
                    transactionTime: 1,
                    transactionTimeHash: 'some hash',
                    anchorString: 'some string',
                    transactionFeePaid: 333,
                    normalizedTransactionFee: 1,
                    writer: 'writer1'
                },
                {
                    transactionNumber: 2,
                    transactionTime: 2,
                    transactionTimeHash: 'some hash',
                    anchorString: 'some string',
                    transactionFeePaid: 998,
                    normalizedTransactionFee: 1,
                    writer: 'writer2'
                },
                {
                    transactionNumber: 4,
                    transactionTime: 3,
                    transactionTimeHash: 'some hash',
                    anchorString: 'some string',
                    transactionFeePaid: 14,
                    normalizedTransactionFee: 1,
                    writer: 'writer4'
                }
            ];
            expect(transactionSelector.selectQualifiedTransactions).toHaveBeenCalledTimes(3);
            expect(result).toEqual(expected);
        }));
    });
});
//# sourceMappingURL=ThroughputLimiter.spec.js.map