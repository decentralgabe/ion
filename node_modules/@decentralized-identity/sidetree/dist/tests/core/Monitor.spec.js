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
const BatchWriter_1 = require("../../lib/core/versions/latest/BatchWriter");
const lib_1 = require("../../lib");
describe('Monitor', () => __awaiter(void 0, void 0, void 0, function* () {
    const testConfig = require('../json/config-test.json');
    describe('getOperationQueueSize()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should get operation queue size correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            const monitor = new lib_1.SidetreeMonitor(testConfig, {}, {});
            const operationQueueInitializeSpy = spyOn(monitor.operationQueue, 'initialize');
            const transactionStoreInitializeSpy = spyOn(monitor.transactionStore, 'initialize');
            yield monitor.initialize();
            expect(operationQueueInitializeSpy).toHaveBeenCalledTimes(1);
            expect(transactionStoreInitializeSpy).toHaveBeenCalledTimes(1);
        }));
    }));
    describe('getOperationQueueSize()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should get operation queue size correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            const monitor = new lib_1.SidetreeMonitor(testConfig, {}, {});
            spyOn(monitor.operationQueue, 'getSize').and.returnValue(Promise.resolve(300));
            const output = yield monitor.getOperationQueueSize();
            expect(output).toEqual({ operationQueueSize: 300 });
        }));
    }));
    describe('getWriterMaxBatchSize()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should get writer max batch size correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            const monitor = new lib_1.SidetreeMonitor(testConfig, {}, {});
            monitor.blockchain = { getWriterValueTimeLock: () => { } };
            spyOn(monitor.blockchain, 'getWriterValueTimeLock');
            spyOn(BatchWriter_1.default, 'getNumberOfOperationsAllowed').and.returnValue(1000);
            const output = yield monitor.getWriterMaxBatchSize();
            expect(output).toEqual({ writerMaxBatchSize: 1000 });
        }));
    }));
    describe('getLastTransaction()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should get last processed transaction correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransaction = {
                anchorString: 'anyAnchor',
                transactionFeePaid: 1,
                transactionNumber: 1,
                transactionTime: 1,
                transactionTimeHash: 'anyHash',
                writer: 'anyWriter',
                normalizedTransactionFee: 1
            };
            const monitor = new lib_1.SidetreeMonitor(testConfig, {}, {});
            spyOn(monitor.transactionStore, 'getLastTransaction').and.returnValue(Promise.resolve(mockTransaction));
            const output = yield monitor.getLastProcessedTransaction();
            expect(output).toEqual(mockTransaction);
        }));
    }));
}));
//# sourceMappingURL=Monitor.spec.js.map