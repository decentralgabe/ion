import AnchoredOperationModel from './models/AnchoredOperationModel';
import IOperationStore from './interfaces/IOperationStore';
import MongoDbStore from '../common/MongoDbStore';
/**
 * Implementation of OperationStore that stores the operation data in
 * a MongoDB database.
 */
export default class MongoDbOperationStore extends MongoDbStore implements IOperationStore {
    /** MongoDB collection name under the database where the operations are stored. */
    static readonly collectionName: string;
    constructor(serverUrl: string, databaseName: string);
    createIndex(): Promise<void>;
    insertOrReplace(operations: AnchoredOperationModel[]): Promise<void>;
    /**
     * Gets all operations of the given DID unique suffix in ascending chronological order.
     */
    get(didUniqueSuffix: string): Promise<AnchoredOperationModel[]>;
    delete(transactionNumber?: number): Promise<void>;
    deleteUpdatesEarlierThan(didUniqueSuffix: string, transactionNumber: number, operationIndex: number): Promise<void>;
    /**
     * Convert a Sidetree operation to a more minimal IMongoOperation object
     * that can be stored on MongoDb. The IMongoOperation object has sufficient
     * information to reconstruct the original operation.
     */
    private static convertToMongoOperation;
    /**
     * Convert a MongoDB representation of an operation to a Sidetree operation.
     * Inverse of convertToMongoOperation() method above.
     *
     * Note: mongodb.find() returns an 'any' object that automatically converts longs to numbers -
     * hence the type 'any' for mongoOperation.
     */
    private static convertToAnchoredOperationModel;
}
