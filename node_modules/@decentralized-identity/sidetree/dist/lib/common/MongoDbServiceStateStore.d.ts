import IServiceStateStore from './interfaces/IServiceStateStore';
import MongoDbStore from './MongoDbStore';
/**
 * Implementation of IServiceStateStore using MongoDB database.
 */
export default class MongoDbServiceStateStore<T> extends MongoDbStore implements IServiceStateStore<T> {
    /** Collection name for storing service state. */
    static readonly collectionName = "service";
    /**
     * Constructs a `MongoDbServiceStateStore`;
     */
    constructor(serverUrl: string, databaseName: string);
    put(serviceState: T): Promise<void>;
    get(): Promise<T>;
}
