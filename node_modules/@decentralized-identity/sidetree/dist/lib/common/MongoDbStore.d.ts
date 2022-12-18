import { Collection, Db, LoggerState, MongoClient } from 'mongodb';
/**
 * Base class that contains the common MongoDB collection setup.
 */
export default class MongoDbStore {
    private serverUrl;
    private collectionName;
    private databaseName;
    static readonly defaultQueryTimeoutInMilliseconds = 10000;
    /** MondoDB instance. */
    protected db: Db | undefined;
    /** MongoDB collection */
    protected collection: Collection<any>;
    /**
     * Set the logger for mongodb command monitoring.
     * @param client the mongodb client
     */
    static enableCommandResultLogging(client: MongoClient): void;
    /**
     * The custom logger for general logging purpose in mongodb client
     * @param _message The message is already included in the state so there is no need to log the message twice.
     * @param state The complete logging event state
     */
    static customLogger(_message: string | undefined, state: LoggerState | undefined): void;
    /**
     * Constructs a `MongoDbStore`;
     */
    constructor(serverUrl: string, collectionName: string, databaseName: string);
    /**
     * Initialize the MongoDB transaction store.
     */
    initialize(): Promise<void>;
    /**
     * Clears the store.
     * NOTE: Avoid dropping collection using `collection.drop()` and recreating the collection in rapid succession (such as in tests), because:
     * 1. It takes some time (seconds) for the collection be created again.
     * 2. Some cloud MongoDB services such as CosmosDB will lead to `MongoError: ns not found` connectivity error.
     */
    clearCollection(): Promise<void>;
    /**
     * Creates the collection with indexes if it does not exists.
     */
    private createCollectionIfNotExist;
    /**
     * Create the indices required by this store.
     * To be overridden by inherited classes if a collection index is needed.
     */
    createIndex(): Promise<void>;
}
