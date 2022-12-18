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
const JsObject_1 = require("../../lib/core/versions/latest/util/JsObject");
const mongodb_1 = require("mongodb");
const MongoDb_1 = require("../common/MongoDb");
const MongoDbOperationStore_1 = require("../../lib/core/MongoDbOperationStore");
const Multihash_1 = require("../../lib/core/versions/latest/Multihash");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const UpdateOperation_1 = require("../../lib/core/versions/latest/UpdateOperation");
const databaseName = 'sidetree-test';
function createOperationStore(mongoDbConnectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        const operationStore = new MongoDbOperationStore_1.default(mongoDbConnectionString, databaseName);
        yield operationStore.initialize();
        return operationStore;
    });
}
/**
 * Constructs an operation chain that starts with the given create operation followed by a number of update operations.
 * @param transactionNumber The transaction number to use for all the operations created. If undefined, the array index is used.
 */
function createOperationChain(createOperation, chainLength, signingKey, signingPrivateKey, transactionNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const didUniqueSuffix = createOperation.didUniqueSuffix;
        const chain = new Array(createOperation);
        let currentPublicKey = signingKey;
        let currentPrivateKey = signingPrivateKey;
        for (let i = 1; i < chainLength; i++) {
            const transactionNumberToUse = transactionNumber || i;
            const transactionTimeToUse = transactionNumberToUse;
            const [newPublicKey, newPrivateKey] = yield OperationGenerator_1.default.generateKeyPair(`key${i}`);
            const operationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, currentPublicKey.publicKeyJwk, currentPrivateKey, newPublicKey, // we add the same key as the secret public key value for convenience, this should not be by user
            Multihash_1.default.canonicalizeThenDoubleHashThenEncode(newPublicKey.publicKeyJwk));
            currentPublicKey = newPublicKey;
            currentPrivateKey = newPrivateKey;
            const operationModel = yield UpdateOperation_1.default.parse(Buffer.from(JSON.stringify(operationRequest)));
            const anchoredOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(operationModel, transactionTimeToUse, transactionNumberToUse, i);
            chain.push(anchoredOperation);
        }
        return chain;
    });
}
// Check if two operations are equal
function checkEqual(operation1, operation2) {
    expect(operation1.transactionNumber).toBeDefined();
    expect(operation2.transactionNumber).toBeDefined();
    expect(operation1.transactionNumber).toEqual(operation2.transactionNumber);
    expect(operation1.operationIndex).toBeDefined();
    expect(operation2.operationIndex).toBeDefined();
    expect(operation1.operationIndex).toEqual(operation2.operationIndex);
    expect(operation1.transactionTime).toBeDefined();
    expect(operation2.transactionTime).toBeDefined();
    expect(operation1.transactionTime).toEqual(operation2.transactionTime);
    expect(operation1.didUniqueSuffix).toEqual(operation2.didUniqueSuffix);
    expect(operation1.type).toEqual(operation2.type);
    expect(operation1.operationBuffer).toEqual(operation2.operationBuffer);
}
// Check if two operation arrays are equal
function checkEqualArray(putOperations, gotOperations) {
    expect(gotOperations.length).toEqual(putOperations.length);
    for (let i = 0; i < putOperations.length; i++) {
        checkEqual(gotOperations[i], putOperations[i]);
    }
}
describe('MongoDbOperationStore', () => __awaiter(void 0, void 0, void 0, function* () {
    let operationStore;
    const config = require('../json/config-test.json');
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield MongoDb_1.default.createInmemoryDb(config);
        operationStore = yield createOperationStore(config.mongoDbConnectionString);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield operationStore.delete();
    }));
    it('should create collection when initialize is called', () => __awaiter(void 0, void 0, void 0, function* () {
        // Make a new instance of operation store and initialize
        const databaseName = 'test-new-db';
        const emptyOperationStore = new MongoDbOperationStore_1.default(config.mongoDbConnectionString, databaseName);
        yield emptyOperationStore.initialize();
        // Make connection to mongo db to verify collection exists
        const client = yield mongodb_1.MongoClient.connect(config.mongoDbConnectionString, { useNewUrlParser: true });
        const db = client.db(databaseName);
        const collections = yield db.collections();
        const collectionNames = collections.map(collection => collection.collectionName);
        expect(collectionNames.includes(MongoDbOperationStore_1.default.collectionName)).toBeTruthy();
        // clean up
        yield db.dropDatabase();
    }));
    describe('insertOrReplace()', () => {
        it('should be able to insert an create operation successfully.', () => __awaiter(void 0, void 0, void 0, function* () {
            const operationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
            const anchoredOperationModel = operationData.anchoredOperationModel;
            yield operationStore.insertOrReplace([anchoredOperationModel]);
            const returnedOperations = yield operationStore.get(anchoredOperationModel.didUniqueSuffix);
            checkEqualArray([anchoredOperationModel], returnedOperations);
        }));
        it('should be able to insert an update operation successfully.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Use a create operation to generate a DID
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
            const anchoredOperationModel = createOperationData.anchoredOperationModel;
            const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
            // Generate an update operation.
            const operationRequest = yield OperationGenerator_1.default.generateUpdateOperationRequestForServices(didUniqueSuffix, createOperationData.signingPublicKey.publicKeyJwk, createOperationData.signingPrivateKey, OperationGenerator_1.default.generateRandomHash(), 'someID', []);
            const operationModel = yield UpdateOperation_1.default.parse(Buffer.from(JSON.stringify(operationRequest)));
            const anchoredUpdateOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(operationModel, 1, 1, 0);
            yield operationStore.insertOrReplace([anchoredUpdateOperation]);
            const returnedOperations = yield operationStore.get(didUniqueSuffix);
            checkEqualArray([anchoredUpdateOperation], returnedOperations);
        }));
        it('should replace an existing operations successfully.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Use a create operation to generate a DID
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
            const anchoredOperationModel = createOperationData.anchoredOperationModel;
            // Deep clone the create request to strip off the `delta` property.
            const clonedCreateRequestWithoutDelta = JsObject_1.default.deepCopyObject(createOperationData.operationRequest);
            delete clonedCreateRequestWithoutDelta.delta;
            // Create an anchored create operation without `delta` property in the operation buffer.
            const anchoredOperationModelWithoutDelta = JsObject_1.default.deepCopyObject(anchoredOperationModel);
            anchoredOperationModelWithoutDelta.operationBuffer = Buffer.from(JSON.stringify(clonedCreateRequestWithoutDelta));
            // Insert the anchored operation without `delta` into DB first.
            yield operationStore.insertOrReplace([anchoredOperationModelWithoutDelta]);
            const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
            const returnedOperations1 = yield operationStore.get(didUniqueSuffix);
            checkEqualArray([anchoredOperationModelWithoutDelta], returnedOperations1);
            // Insert the anchored operation with `delta` into DB.
            yield operationStore.insertOrReplace([anchoredOperationModel]);
            const returnedOperations2 = yield operationStore.get(didUniqueSuffix);
            checkEqualArray([anchoredOperationModel], returnedOperations2);
        }));
    });
    it('should get all operations in a batch put', () => __awaiter(void 0, void 0, void 0, function* () {
        // Use a create operation to generate a DID
        const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
        const anchoredOperationModel = createOperationData.anchoredOperationModel;
        const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
        const signingPublicKey = createOperationData.signingPublicKey;
        const signingPrivateKey = createOperationData.signingPrivateKey;
        const chainSize = 10;
        const operationChain = yield createOperationChain(anchoredOperationModel, chainSize, signingPublicKey, signingPrivateKey);
        yield operationStore.insertOrReplace(operationChain);
        const returnedOperations = yield operationStore.get(didUniqueSuffix);
        checkEqualArray(operationChain, returnedOperations);
    }));
    it('should get all operations in a batch put with duplicates', () => __awaiter(void 0, void 0, void 0, function* () {
        // Use a create operation to generate a DID
        const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
        const anchoredOperationModel = createOperationData.anchoredOperationModel;
        const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
        const signingPublicKey = createOperationData.signingPublicKey;
        const signingPrivateKey = createOperationData.signingPrivateKey;
        const chainSize = 10;
        const operationChain = yield createOperationChain(anchoredOperationModel, chainSize, signingPublicKey, signingPrivateKey);
        // construct an operation chain with duplicated operations
        const batchWithDuplicates = operationChain.concat(operationChain);
        yield operationStore.insertOrReplace(batchWithDuplicates);
        const returnedOperations = yield operationStore.get(didUniqueSuffix);
        checkEqualArray(operationChain, returnedOperations);
    }));
    it('should delete all', () => __awaiter(void 0, void 0, void 0, function* () {
        // Use a create operation to generate a DID
        const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
        const anchoredOperationModel = createOperationData.anchoredOperationModel;
        const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
        const signingPublicKey = createOperationData.signingPublicKey;
        const signingPrivateKey = createOperationData.signingPrivateKey;
        const chainSize = 10;
        const operationChain = yield createOperationChain(anchoredOperationModel, chainSize, signingPublicKey, signingPrivateKey);
        yield operationStore.insertOrReplace(operationChain);
        const returnedOperations = yield operationStore.get(didUniqueSuffix);
        checkEqualArray(operationChain, returnedOperations);
        yield operationStore.delete();
        const returnedOperationsAfterRollback = yield operationStore.get(didUniqueSuffix);
        expect(returnedOperationsAfterRollback.length).toEqual(0);
    }));
    it('should delete operations with timestamp filter', () => __awaiter(void 0, void 0, void 0, function* () {
        // Use a create operation to generate a DID
        const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
        const anchoredOperationModel = createOperationData.anchoredOperationModel;
        const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
        const signingPublicKey = createOperationData.signingPublicKey;
        const signingPrivateKey = createOperationData.signingPrivateKey;
        const chainSize = 10;
        const operationChain = yield createOperationChain(anchoredOperationModel, chainSize, signingPublicKey, signingPrivateKey);
        yield operationStore.insertOrReplace(operationChain);
        const returnedOperations = yield operationStore.get(didUniqueSuffix);
        checkEqualArray(operationChain, returnedOperations);
        const rollbackTime = chainSize / 2;
        yield operationStore.delete(rollbackTime);
        const returnedOperationsAfterRollback = yield operationStore.get(didUniqueSuffix);
        // Returned operations should be equal to the first rollbackTime + 1 operations in the batch
        checkEqualArray(operationChain.slice(0, rollbackTime + 1), returnedOperationsAfterRollback);
    }));
    it('should remember operations after stop/restart', () => __awaiter(void 0, void 0, void 0, function* () {
        // Use a create operation to generate a DID
        const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
        const anchoredOperationModel = createOperationData.anchoredOperationModel;
        const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
        const signingPublicKey = createOperationData.signingPublicKey;
        const signingPrivateKey = createOperationData.signingPrivateKey;
        const chainSize = 10;
        const operationChain = yield createOperationChain(anchoredOperationModel, chainSize, signingPublicKey, signingPrivateKey);
        yield operationStore.insertOrReplace(operationChain);
        let returnedOperations = yield operationStore.get(didUniqueSuffix);
        checkEqualArray(operationChain, returnedOperations);
        // Create another instance of the operation store
        operationStore = yield createOperationStore(config.mongoDbConnectionString);
        // Check if we have all the previously put operations
        returnedOperations = yield operationStore.get(didUniqueSuffix);
        checkEqualArray(operationChain, returnedOperations);
    }));
    it('should get all operations in transaction time order', () => __awaiter(void 0, void 0, void 0, function* () {
        // Use a create operation to generate a DID
        const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
        const anchoredOperationModel = createOperationData.anchoredOperationModel;
        const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
        const signingPublicKey = createOperationData.signingPublicKey;
        const signingPrivateKey = createOperationData.signingPrivateKey;
        const chainSize = 10;
        const operationChain = yield createOperationChain(anchoredOperationModel, chainSize, signingPublicKey, signingPrivateKey);
        // Insert operations in reverse transaction time order
        for (let i = chainSize - 1; i >= 0; i--) {
            yield operationStore.insertOrReplace([operationChain[i]]);
        }
        const returnedOperations = yield operationStore.get(didUniqueSuffix);
        checkEqualArray(operationChain, returnedOperations);
    }));
    describe('deleteUpdatesEarlierThan()', () => {
        it('should delete updates in the earlier transactions correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            // Use a create operation to generate a DID
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
            const anchoredOperationModel = createOperationData.anchoredOperationModel;
            const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
            const signingPublicKey = createOperationData.signingPublicKey;
            const signingPrivateKey = createOperationData.signingPrivateKey;
            const chainSize = 10;
            const operationChain = yield createOperationChain(anchoredOperationModel, chainSize, signingPublicKey, signingPrivateKey);
            yield operationStore.insertOrReplace(operationChain);
            const returnedOperations = yield operationStore.get(didUniqueSuffix);
            checkEqualArray(operationChain, returnedOperations);
            const markerOperation = operationChain[5];
            yield operationStore.deleteUpdatesEarlierThan(didUniqueSuffix, markerOperation.transactionNumber, markerOperation.operationIndex);
            const returnedOperationsAfterDeletion = yield operationStore.get(didUniqueSuffix);
            // Expected remaining operations is the first operation + the last 5 update operations.
            const expectedRemainingOperations = [anchoredOperationModel];
            expectedRemainingOperations.push(...operationChain.slice(5));
            checkEqualArray(expectedRemainingOperations, returnedOperationsAfterDeletion);
        }));
        it('should delete earlier updates in the same transaction correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            // Use a create operation to generate a DID
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 0, transactionNumber: 0, operationIndex: 0 });
            const anchoredOperationModel = createOperationData.anchoredOperationModel;
            const didUniqueSuffix = anchoredOperationModel.didUniqueSuffix;
            const signingPublicKey = createOperationData.signingPublicKey;
            const signingPrivateKey = createOperationData.signingPrivateKey;
            const chainSize = 10;
            const txnNumber = 1;
            const operationChain = yield createOperationChain(anchoredOperationModel, chainSize, signingPublicKey, signingPrivateKey, txnNumber);
            yield operationStore.insertOrReplace(operationChain);
            const returnedOperations = yield operationStore.get(didUniqueSuffix);
            checkEqualArray(operationChain, returnedOperations);
            const markerOperation = operationChain[5];
            yield operationStore.deleteUpdatesEarlierThan(didUniqueSuffix, markerOperation.transactionNumber, markerOperation.operationIndex);
            const returnedOperationsAfterDeletion = yield operationStore.get(didUniqueSuffix);
            // Expected remaining operations is the first operation + the last 5 update operations.
            const expectedRemainingOperations = [anchoredOperationModel];
            expectedRemainingOperations.push(...operationChain.slice(5));
            checkEqualArray(expectedRemainingOperations, returnedOperationsAfterDeletion);
        }));
    });
}));
//# sourceMappingURL=MongoDbOperationStore.spec.js.map