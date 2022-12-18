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
const BitcoinClient_1 = require("../../lib/bitcoin/BitcoinClient");
const MockTransactionStore_1 = require("../mocks/MockTransactionStore");
const SpendingMonitor_1 = require("../../lib/bitcoin/SpendingMonitor");
const TransactionNumber_1 = require("../../lib/bitcoin/TransactionNumber");
describe('SpendingMonitor', () => {
    let spendingMonitor;
    const bitcoinFeeSpendingCutoffPeriodInBlocks = 100;
    const bitcoinFeeSpendingCutoffInSatoshis = BitcoinClient_1.default.convertBtcToSatoshis(3); // 3 * BitcoinProcessor['satoshiPerBitcoin'];
    const mockTxns = [
        { transactionNumber: 12345, transactionTime: 10, transactionTimeHash: 'hash1', anchorString: 'anchor_string1', transactionFeePaid: 100, normalizedTransactionFee: 90, writer: 'writer1' },
        { transactionNumber: 67890, transactionTime: 11, transactionTimeHash: 'hash2', anchorString: 'anchor_string2', transactionFeePaid: 110, normalizedTransactionFee: 95, writer: 'writer2' }
    ];
    beforeEach(() => {
        spendingMonitor = new SpendingMonitor_1.default(bitcoinFeeSpendingCutoffPeriodInBlocks, bitcoinFeeSpendingCutoffInSatoshis, new MockTransactionStore_1.default());
    });
    describe('constructor', () => {
        it('should throw if the cutoff period is not in the correct range.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // eslint-disable-next-line no-new
                new SpendingMonitor_1.default(0, bitcoinFeeSpendingCutoffInSatoshis, new MockTransactionStore_1.default());
                fail('Expected exception not thrown');
            }
            catch (e) {
                expect(e).toBeDefined();
            }
            done();
        }));
        it('should throw if the cutoff amount is not in the correct range.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // eslint-disable-next-line no-new
                new SpendingMonitor_1.default(1, 0, new MockTransactionStore_1.default());
                fail('Expected exception not thrown');
            }
            catch (e) {
                expect(e).toBeDefined();
            }
            done();
        }));
    });
    describe('addTransactionDataBeingWritten', () => {
        it('should add the anchor strings to the internal set.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            spendingMonitor.addTransactionDataBeingWritten('data1');
            spendingMonitor.addTransactionDataBeingWritten('data2');
            spendingMonitor.addTransactionDataBeingWritten('data1');
            expect(spendingMonitor['anchorStringsWritten'].size).toEqual(2);
            expect(spendingMonitor['anchorStringsWritten']).toContain('data1');
            expect(spendingMonitor['anchorStringsWritten']).toContain('data2');
            done();
        }));
    });
    describe('isCurrentFeeWithinSpendingLimit', () => {
        it('should return false if the spending limit is reached for the cutoff period of 1', (done) => __awaiter(void 0, void 0, void 0, function* () {
            spendingMonitor['bitcoinFeeSpendingCutoffPeriodInBlocks'] = 1;
            const result = yield spendingMonitor.isCurrentFeeWithinSpendingLimit(bitcoinFeeSpendingCutoffInSatoshis + 1, 5);
            expect(result).toBeFalsy();
            done();
        }));
        it('should return true if the spending limit is not reached for the cutoff period of 1', (done) => __awaiter(void 0, void 0, void 0, function* () {
            spendingMonitor['bitcoinFeeSpendingCutoffPeriodInBlocks'] = 1;
            const result = yield spendingMonitor.isCurrentFeeWithinSpendingLimit(bitcoinFeeSpendingCutoffInSatoshis, 5000);
            expect(result).toBeTruthy();
            done();
        }));
        it('should return false if the spending limit is reached.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setup fees so that we are over the limit
            const fees = [bitcoinFeeSpendingCutoffInSatoshis / 3, bitcoinFeeSpendingCutoffInSatoshis / 3, (bitcoinFeeSpendingCutoffInSatoshis / 3) + 1000];
            mockTxns[0].transactionFeePaid = fees[0];
            mockTxns[1].transactionFeePaid = fees[1];
            const txnStoreSpy = spyOn(spendingMonitor['transactionStore'], 'getTransactionsLaterThan');
            txnStoreSpy.and.returnValue(Promise.resolve(mockTxns));
            const filterTxnSpy = spyOn(spendingMonitor, 'findTransactionsWrittenByThisNode');
            filterTxnSpy.and.returnValue(mockTxns);
            const currentFee = fees[2];
            const lastProcessBlockHeight = 5000;
            const result = yield spendingMonitor.isCurrentFeeWithinSpendingLimit(currentFee, lastProcessBlockHeight);
            expect(result).toBeFalsy();
            expect(txnStoreSpy).toHaveBeenCalled();
            expect(filterTxnSpy).toHaveBeenCalled();
            const expectedTxnNumberForTxnStore = TransactionNumber_1.default.construct(lastProcessBlockHeight - bitcoinFeeSpendingCutoffPeriodInBlocks - 2, 0) - 1;
            expect(txnStoreSpy).toHaveBeenCalledWith(expectedTxnNumberForTxnStore, undefined);
            done();
        }));
        it('should return true if the spending limit is not reached.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setup fees so that we are under the limit
            const fees = [bitcoinFeeSpendingCutoffInSatoshis / 3, bitcoinFeeSpendingCutoffInSatoshis / 3, (bitcoinFeeSpendingCutoffInSatoshis / 3) - 1000];
            mockTxns[0].transactionFeePaid = fees[0];
            mockTxns[1].transactionFeePaid = fees[1];
            const txnStoreSpy = spyOn(spendingMonitor['transactionStore'], 'getTransactionsLaterThan');
            txnStoreSpy.and.returnValue(Promise.resolve(mockTxns));
            const filterTxnSpy = spyOn(spendingMonitor, 'findTransactionsWrittenByThisNode');
            filterTxnSpy.and.returnValue(mockTxns);
            // Pass in the fee which will ensure that the we are going to stay under the limit
            const currentFee = fees[2];
            const result = yield spendingMonitor.isCurrentFeeWithinSpendingLimit(currentFee, 5000);
            expect(result).toBeTruthy();
            expect(txnStoreSpy).toHaveBeenCalled();
            expect(filterTxnSpy).toHaveBeenCalled();
            done();
        }));
        it('should return true if we are exactly at the spending limit.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setup fees so that we are exactly at the limit
            const fees = [bitcoinFeeSpendingCutoffInSatoshis / 3, bitcoinFeeSpendingCutoffInSatoshis / 3, bitcoinFeeSpendingCutoffInSatoshis / 3];
            mockTxns[0].transactionFeePaid = fees[0];
            mockTxns[1].transactionFeePaid = fees[1];
            const txnStoreSpy = spyOn(spendingMonitor['transactionStore'], 'getTransactionsLaterThan');
            txnStoreSpy.and.returnValue(Promise.resolve(mockTxns));
            const filterTxnSpy = spyOn(spendingMonitor, 'findTransactionsWrittenByThisNode');
            filterTxnSpy.and.returnValue(mockTxns);
            // Pass in the fee which will ensure that the we are going to stay under the limit
            const currentFee = fees[2];
            const result = yield spendingMonitor.isCurrentFeeWithinSpendingLimit(currentFee, 5000);
            expect(result).toBeTruthy();
            expect(txnStoreSpy).toHaveBeenCalled();
            expect(filterTxnSpy).toHaveBeenCalled();
            done();
        }));
    });
    describe('findTransactionsWrittenByThisNode', () => {
        beforeEach(() => {
            spendingMonitor['anchorStringsWritten'].clear();
        });
        it('should only find transactions for which anchor strings were already added to the monitor.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Add only the data for one of the mock txns and expect only that one to be returned
            spendingMonitor['anchorStringsWritten'].add(mockTxns[0].anchorString);
            const actual = spendingMonitor['findTransactionsWrittenByThisNode'](mockTxns);
            expect(actual.length).toEqual(1);
            expect(actual[0]).toEqual(mockTxns[0]);
            done();
        }));
        it('should not return any txns if nothing matches.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Nothing is added to the monitor so nothing should be returned.
            const actual = spendingMonitor['findTransactionsWrittenByThisNode'](mockTxns);
            expect(actual).toBeDefined();
            expect(actual.length).toEqual(0);
            done();
        }));
        it('should not return any txns if nothing is passed in.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Nothing is added to the monitor so nothing should be returned.
            const actual = spendingMonitor['findTransactionsWrittenByThisNode']([]);
            expect(actual).toBeDefined();
            expect(actual.length).toEqual(0);
            done();
        }));
    });
});
//# sourceMappingURL=SpendingMonitor.spec.js.map