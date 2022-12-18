import IBatchWriter from '../../lib/core/interfaces/IBatchWriter';
/**
 * Mock Blockchain class for testing.
 */
export default class MockBatchWriter implements IBatchWriter {
    /** Keeps invocation count for testing purposes. */
    invocationCount: number;
    write(): Promise<number>;
}
