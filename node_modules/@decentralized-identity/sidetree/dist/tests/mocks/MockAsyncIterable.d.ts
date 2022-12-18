/**
 * mock class for async iterable
 */
export default class MockAsyncIterable implements AsyncIterator<any>, AsyncIterable<any> {
    private doneValue;
    private notDoneValue;
    private indexTracker;
    constructor(doneValue?: any, notDoneValue?: any, numOfElements?: number);
    /**
     * yields the next element. Based on arg, the test can control what to return.
     * If the first argument is 'notDone', then it will yield mockIteratorYieldResult,
     * otherwise mockIteratorReturnResult
     */
    next(...args: [] | [undefined]): Promise<IteratorResult<any>>;
    /**
     * iterator function of an iterable
     */
    [Symbol.asyncIterator](): AsyncIterator<any>;
}
