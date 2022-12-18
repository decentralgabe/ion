/// <reference types="node" />
import IOperationQueue from './interfaces/IOperationQueue';
import MongoDbStore from '../../../common/MongoDbStore';
import QueuedOperationModel from './models/QueuedOperationModel';
/**
 * Operation queue used by the Batch Writer implemented using MongoDB.
 */
export default class MongoDbOperationQueue extends MongoDbStore implements IOperationQueue {
    /** Collection name for queued operations. */
    static readonly collectionName: string;
    /**
     * Creates a new instance of this object.
     * @param serverUrl The target server url.
     * @param databaseName The database name where the collection should be saved.
     */
    constructor(serverUrl: string, databaseName: string);
    /**
     * @inheritDoc
     */
    createIndex(): Promise<void>;
    enqueue(didUniqueSuffix: string, operationBuffer: Buffer): Promise<void>;
    dequeue(count: number): Promise<QueuedOperationModel[]>;
    peek(count: number): Promise<QueuedOperationModel[]>;
    /**
     * Checks to see if the queue already contains an operation for the given DID unique suffix.
     */
    contains(didUniqueSuffix: string): Promise<boolean>;
    getSize(): Promise<number>;
    private static convertToQueuedOperationModel;
}
