import MongoDbStore from '../../common/MongoDbStore';
import SavedLockModel from './../models/SavedLockedModel';
/**
 * Encapsulates functionality to store the bitcoin lock information to Db.
 */
export default class MongoDbLockTransactionStore extends MongoDbStore {
    /** The collection name */
    static readonly lockCollectionName = "locks";
    /**
     * Creates a new instance of this object.
     * @param serverUrl The target server url.
     * @param databaseName The database name where the collection should be saved.
     */
    constructor(serverUrl: string, databaseName: string);
    /**
     * Adds the specified lock information into the database.
     *
     * @param bitcoinLock The lock information to be added.
     */
    addLock(bitcoinLock: SavedLockModel): Promise<void>;
    /**
     * Gets the latest lock (highest create timestamp) saved in the db; or undefined if nothing saved.
     */
    getLastLock(): Promise<SavedLockModel | undefined>;
    /**
     * @inheritDoc
     */
    createIndex(): Promise<void>;
}
