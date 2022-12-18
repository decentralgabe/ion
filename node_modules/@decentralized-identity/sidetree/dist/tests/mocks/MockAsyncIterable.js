"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * mock class for async iterable
 */
class MockAsyncIterable {
    constructor(doneValue, notDoneValue, numOfElements) {
        this.doneValue = {
            value: undefined,
            done: true
        };
        this.notDoneValue = {
            value: undefined,
            done: false
        };
        this.indexTracker = {
            numOfElements: Number.MAX_SAFE_INTEGER,
            currentIndex: 0
        };
        this.doneValue.value = doneValue;
        this.notDoneValue.value = notDoneValue;
        if (numOfElements !== undefined) {
            this.indexTracker.numOfElements = numOfElements;
        }
    }
    /**
     * yields the next element. Based on arg, the test can control what to return.
     * If the first argument is 'notDone', then it will yield mockIteratorYieldResult,
     * otherwise mockIteratorReturnResult
     */
    next(...args) {
        if (args[0] && args[0] === 'notDone') {
            return new Promise((resolve) => {
                resolve(this.notDoneValue);
            });
        }
        return new Promise((resolve) => {
            resolve(this.doneValue);
        });
    }
    /**
     * iterator function of an iterable
     */
    [Symbol.asyncIterator]() {
        const notDoneValue = this.notDoneValue;
        const indexTracker = this.indexTracker;
        const doneValue = this.doneValue;
        return {
            next() {
                if (indexTracker.currentIndex < indexTracker.numOfElements) {
                    indexTracker.currentIndex++;
                    return Promise.resolve(notDoneValue);
                }
                return Promise.resolve(doneValue);
            }
        };
    }
}
exports.default = MockAsyncIterable;
//# sourceMappingURL=MockAsyncIterable.js.map