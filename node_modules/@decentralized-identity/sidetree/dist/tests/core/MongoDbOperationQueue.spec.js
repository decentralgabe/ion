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
const MongoDb_1 = require("../common/MongoDb");
const MongoDbOperationQueue_1 = require("../../lib/core/versions/latest/MongoDbOperationQueue");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
/**
 * Creates a MongoDbOperationQueue and initializes it.
 */
function createOperationQueue(storeUri, databaseName) {
    return __awaiter(this, void 0, void 0, function* () {
        const operationQueue = new MongoDbOperationQueue_1.default(storeUri, databaseName);
        yield operationQueue.initialize();
        return operationQueue;
    });
}
/**
 * Generates the given count of operations and queues them in the given operation queue.
 * e.g. The DID unique suffix will start from '1', '2', '3'... and buffer will be generated from the DID unique suffix.
 */
function generateAndQueueOperations(operationQueue, count) {
    return __awaiter(this, void 0, void 0, function* () {
        const operations = [];
        for (let i = 1; i <= count; i++) {
            const didUniqueSuffix = i.toString();
            const operationBuffer = Buffer.from(didUniqueSuffix);
            operations.push({ didUniqueSuffix, operationBuffer });
            yield operationQueue.enqueue(didUniqueSuffix, operationBuffer);
        }
        return operations;
    });
}
describe('MongoDbOperationQueue', () => __awaiter(void 0, void 0, void 0, function* () {
    const config = require('../json/config-test.json');
    const databaseName = 'sidetree-test';
    let operationQueue;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield MongoDb_1.default.createInmemoryDb(config);
        operationQueue = yield createOperationQueue(config.mongoDbConnectionString, databaseName);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield operationQueue.clearCollection();
    }));
    it('should peek with correct count.', () => __awaiter(void 0, void 0, void 0, function* () {
        const operationCount = 3;
        const queuedOperations = yield generateAndQueueOperations(operationQueue, operationCount);
        // Expect empty array if peeked with count 0.
        let peekedOperations = yield operationQueue.peek(0);
        expect(peekedOperations).not.toBeNull();
        expect(peekedOperations.length).toBe(0);
        // Expected same result no matter how many times the queue is peeked.
        for (let i = 0; i < 5; i++) {
            peekedOperations = yield operationQueue.peek(2);
            expect(peekedOperations.length).toEqual(2);
            expect(peekedOperations[0].operationBuffer).toEqual(queuedOperations[0].operationBuffer);
            expect(peekedOperations[1].operationBuffer).toEqual(queuedOperations[1].operationBuffer);
        }
    }));
    it('should dequeue with correct count.', () => __awaiter(void 0, void 0, void 0, function* () {
        const operationCount = 3;
        const queuedOperations = yield generateAndQueueOperations(operationQueue, operationCount);
        // Expect empty array if peeked with count 0.
        let dequeuedOperations = yield operationQueue.dequeue(0);
        expect(dequeuedOperations).not.toBeNull();
        expect(dequeuedOperations.length).toBe(0);
        dequeuedOperations = yield operationQueue.dequeue(2);
        const remainingOperations = yield operationQueue.peek(operationCount);
        expect(dequeuedOperations.length).toEqual(2);
        expect(dequeuedOperations[0].operationBuffer).toEqual(queuedOperations[0].operationBuffer);
        expect(dequeuedOperations[1].operationBuffer).toEqual(queuedOperations[1].operationBuffer);
        expect(remainingOperations.length).toEqual(1);
        expect(remainingOperations[0].operationBuffer).toEqual(queuedOperations[2].operationBuffer);
    }));
    it('should check if an operation of the given DID unique suffix exists correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
        const operationCount = 3;
        yield generateAndQueueOperations(operationQueue, operationCount);
        for (let i = 1; i <= operationCount; i++) {
            const operationExists = yield operationQueue.contains(i.toString());
            expect(operationExists).toBeTruthy();
        }
        const operationExists = yield operationQueue.contains('non-existent-did-unique-suffix');
        expect(operationExists).toBeFalsy();
    }));
    it('should throw SidetreeError with code when enqueueing more than 1 operation for DID.', () => __awaiter(void 0, void 0, void 0, function* () {
        const operationCount = 3;
        yield generateAndQueueOperations(operationQueue, operationCount);
        spyOn(operationQueue.collection, 'insertOne').and.callFake(() => {
            const error = new Error(ErrorCode_1.default.BatchWriterAlreadyHasOperationForDid);
            error['code'] = 11000;
            throw error;
        });
        try {
            yield generateAndQueueOperations(operationQueue, operationCount);
        }
        catch (error) {
            if (error instanceof SidetreeError_1.default &&
                error.code === ErrorCode_1.default.BatchWriterAlreadyHasOperationForDid) {
                // Expected Sidetree error.
            }
            else {
                throw error; // Unexpected error, throw to fail the test.
            }
        }
    }));
    it('should throw original error if unexpected error is thrown when enqueuing.', () => __awaiter(void 0, void 0, void 0, function* () {
        spyOn(operationQueue.collection, 'insertOne').and.callFake(() => {
            const error = new Error(ErrorCode_1.default.BatchWriterAlreadyHasOperationForDid);
            error['code'] = 'unexpected-error';
            throw error;
        });
        try {
            yield generateAndQueueOperations(operationQueue, 1);
        }
        catch (error) {
            if (error.code === 'unexpected-error') {
                // Expected behavior.
            }
            else {
                throw error; // Unexpected behavior, throw to fail the test.
            }
        }
    }));
    it('should get queue size correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
        const operationCount = 3;
        yield generateAndQueueOperations(operationQueue, operationCount);
        const size = yield operationQueue.getSize();
        expect(size).toEqual(3);
    }));
}));
//# sourceMappingURL=MongoDbOperationQueue.spec.js.map