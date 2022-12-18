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
const mongodb_1 = require("mongodb");
const Logger_1 = require("../common/Logger");
/**
 * Base class that contains the common MongoDB collection setup.
 */
class MongoDbStore {
    /**
     * Constructs a `MongoDbStore`;
     */
    constructor(serverUrl, collectionName, databaseName) {
        this.serverUrl = serverUrl;
        this.collectionName = collectionName;
        this.databaseName = databaseName;
    }
    /**
     * Set the logger for mongodb command monitoring.
     * @param client the mongodb client
     */
    static enableCommandResultLogging(client) {
        client.on('commandSucceeded', (event) => {
            // Command name can have different casing in different MongoDB versions, so always compare lower case.
            const lowerCaseCommandName = event.commandName.toLowerCase();
            if (!['ping', 'hello', 'ismaster', 'hostinfo'].includes(lowerCaseCommandName)) {
                Logger_1.default.info(event);
            }
        });
        client.on('commandFailed', (event) => {
            Logger_1.default.warn(event);
        });
    }
    /**
     * The custom logger for general logging purpose in mongodb client
     * @param _message The message is already included in the state so there is no need to log the message twice.
     * @param state The complete logging event state
     */
    static customLogger(_message, state) {
        if (state === undefined) {
            return;
        }
        switch (state.type) {
            case 'error':
                Logger_1.default.error(state);
                break;
            default:
                Logger_1.default.info(state);
        }
    }
    ;
    /**
     * Initialize the MongoDB transaction store.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // `useNewUrlParser` addresses nodejs's URL parser deprecation warning.
            const client = yield mongodb_1.MongoClient.connect(this.serverUrl, {
                useNewUrlParser: true,
                logger: MongoDbStore.customLogger,
                monitorCommands: true,
                loggerLevel: 'error'
            });
            MongoDbStore.enableCommandResultLogging(client);
            this.db = client.db(this.databaseName);
            yield this.createCollectionIfNotExist(this.db);
        });
    }
    /**
     * Clears the store.
     * NOTE: Avoid dropping collection using `collection.drop()` and recreating the collection in rapid succession (such as in tests), because:
     * 1. It takes some time (seconds) for the collection be created again.
     * 2. Some cloud MongoDB services such as CosmosDB will lead to `MongoError: ns not found` connectivity error.
     */
    clearCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.deleteMany({}); // Empty filter removes all entries in collection.
        });
    }
    /**
     * Creates the collection with indexes if it does not exists.
     */
    createCollectionIfNotExist(db) {
        return __awaiter(this, void 0, void 0, function* () {
            const collections = yield db.collections();
            const collectionNames = collections.map(collection => collection.collectionName);
            // If collection exists, use it; else create it.
            if (collectionNames.includes(this.collectionName)) {
                Logger_1.default.info(`Collection '${this.collectionName}' found.`);
                this.collection = db.collection(this.collectionName);
            }
            else {
                Logger_1.default.info(`Collection '${this.collectionName}' does not exists, creating...`);
                this.collection = yield db.createCollection(this.collectionName);
                yield this.createIndex();
                Logger_1.default.info(`Collection '${this.collectionName}' created.`);
            }
        });
    }
    /**
     * Create the indices required by this store.
     * To be overridden by inherited classes if a collection index is needed.
     */
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.default = MongoDbStore;
MongoDbStore.defaultQueryTimeoutInMilliseconds = 10000;
//# sourceMappingURL=MongoDbStore.js.map