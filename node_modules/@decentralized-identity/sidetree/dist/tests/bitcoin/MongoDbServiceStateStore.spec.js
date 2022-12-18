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
const MongoDb_1 = require("../common/MongoDb");
const MongoDbServiceStateStore_1 = require("../../lib/common/MongoDbServiceStateStore");
/**
 * Creates a MongoDbServiceStateStore and initializes it.
 */
function createStore(storeUri, databaseName) {
    return __awaiter(this, void 0, void 0, function* () {
        const store = new MongoDbServiceStateStore_1.default(storeUri, databaseName);
        yield store.initialize();
        return store;
    });
}
describe('MongoDbServiceStateStore', () => __awaiter(void 0, void 0, void 0, function* () {
    const config = require('../json/config-test.json');
    const databaseName = 'sidetree-test';
    let store;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield MongoDb_1.default.createInmemoryDb(config);
        store = yield createStore(config.mongoDbConnectionString, databaseName);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield store.clearCollection();
    }));
    it('should put and get service state correctly.', (done) => __awaiter(void 0, void 0, void 0, function* () {
        // Put then get an initial service state.
        const initialServiceState = { databaseVersion: '1.0.0' };
        yield store.put(initialServiceState);
        let actualServiceState = yield store.get();
        expect(actualServiceState).toEqual(initialServiceState);
        // Put then get another service state to test upsert.
        const newServiceState = { databaseVersion: '2.0.0' };
        yield store.put(newServiceState);
        actualServiceState = yield store.get();
        expect(actualServiceState).toEqual(newServiceState);
        done();
    }));
    describe('get()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should get empty object if service state is not found in DB.', () => __awaiter(void 0, void 0, void 0, function* () {
            yield store.clearCollection();
            const actualServiceState = yield store.get();
            expect(actualServiceState).toEqual({});
        }));
    }));
    describe('initialize()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should create collection on initialization if it does not exist.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Deleting collections to setup this test.
            const client = yield mongodb_1.MongoClient.connect(config.mongoDbConnectionString);
            const db = client.db(databaseName);
            yield db.dropCollection(MongoDbServiceStateStore_1.default.collectionName);
            // Make sure no collection exists before we start the test.
            const collections = yield db.collections();
            const collectionNames = collections.map(collection => collection.collectionName);
            expect(collectionNames.includes(MongoDbServiceStateStore_1.default.collectionName)).toBeFalsy();
            // NOTE: In CosmosDB `db.createCollection()` call in `initialize()` does not make the collection "visible"
            // until a subsequent operation is called (such as `createIndex()` or inserting record) possibly due to lazy load.
            // hence in this test we insert a record and retrieve it again to prove that the collection is created.
            yield store.initialize();
            yield store.put({ databaseVersion: '1.1.0' });
            const serviceState = yield store.get();
            expect(serviceState === null || serviceState === void 0 ? void 0 : serviceState.databaseVersion).toEqual('1.1.0');
            done();
        }));
    }));
}));
//# sourceMappingURL=MongoDbServiceStateStore.spec.js.map