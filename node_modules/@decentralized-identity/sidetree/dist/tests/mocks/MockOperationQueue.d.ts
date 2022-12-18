/// <reference types="node" />
import IOperationQueue from '../../lib/core/versions/latest/interfaces/IOperationQueue';
import QueuedOperationModel from '../../lib/core/versions/latest/models/QueuedOperationModel';
/**
 * A mock in-memory operation queue used by the Batch Writer.
 */
export default class MockOperationQueue implements IOperationQueue {
    private latestTimestamp;
    private operations;
    enqueue(didUniqueSuffix: string, operationBuffer: Buffer): Promise<void>;
    dequeue(count: number): Promise<QueuedOperationModel[]>;
    peek(count: number): Promise<QueuedOperationModel[]>;
    contains(didUniqueSuffix: string): Promise<boolean>;
    getSize(): Promise<number>;
}
