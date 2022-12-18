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
/**
 * A mock in-memory operation queue used by the Batch Writer.
 */
class MockOperationQueue {
    constructor() {
        this.latestTimestamp = 0;
        this.operations = new Map();
    }
    enqueue(didUniqueSuffix, operationBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            this.latestTimestamp++;
            this.operations.set(didUniqueSuffix, [this.latestTimestamp, operationBuffer]);
        });
    }
    dequeue(count) {
        return __awaiter(this, void 0, void 0, function* () {
            // Sort the entries by their timestamp.
            // If compare function returns < 0, a is before b, vice versa.
            const sortedEntries = Array.from(this.operations.entries()).sort((a, b) => a[1][0] - b[1][0]);
            const sortedQueuedOperations = sortedEntries.map(entry => {
                return { didUniqueSuffix: entry[0], operationBuffer: entry[1][1] };
            });
            const sortedKeys = sortedEntries.map(entry => entry[0]);
            const keyBatch = sortedKeys.slice(0, count);
            keyBatch.forEach((key) => this.operations.delete(key));
            const operationBatch = sortedQueuedOperations.slice(0, count);
            return operationBatch;
        });
    }
    peek(count) {
        return __awaiter(this, void 0, void 0, function* () {
            // Sort the entries by their timestamp.
            const sortedEntries = Array.from(this.operations.entries()).sort((a, b) => a[1][0] - b[1][0]);
            const sortedQueuedOperations = sortedEntries.map(entry => {
                return { didUniqueSuffix: entry[0], operationBuffer: entry[1][1] };
            });
            const operationBatch = sortedQueuedOperations.slice(0, count);
            return operationBatch;
        });
    }
    contains(didUniqueSuffix) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.operations.has(didUniqueSuffix);
        });
    }
    getSize() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.operations.size;
        });
    }
}
exports.default = MockOperationQueue;
//# sourceMappingURL=MockOperationQueue.js.map