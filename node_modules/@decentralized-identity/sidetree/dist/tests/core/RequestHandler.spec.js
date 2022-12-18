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
const crypto = require("crypto");
const generatedFixture = require("../vectors/generated.json");
const longFormResponseDidDocument = require("../vectors/resolution/longFormResponseDidDocument.json");
const BatchScheduler_1 = require("../../lib/core/BatchScheduler");
const BatchWriter_1 = require("../../lib/core/versions/latest/BatchWriter");
const ChunkFile_1 = require("../../lib/core/versions/latest/ChunkFile");
const Compressor_1 = require("../../lib/core/versions/latest/util/Compressor");
const CreateOperation_1 = require("../../lib/core/versions/latest/CreateOperation");
const Did_1 = require("../../lib/core/versions/latest/Did");
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const Fixture_1 = require("../utils/Fixture");
const JsonAsync_1 = require("../../lib/core/versions/latest/util/JsonAsync");
const Jwk_1 = require("../../lib/core/versions/latest/util/Jwk");
const MockBlockchain_1 = require("../mocks/MockBlockchain");
const MockCas_1 = require("../mocks/MockCas");
const MockConfirmationStore_1 = require("../mocks/MockConfirmationStore");
const MockOperationQueue_1 = require("../mocks/MockOperationQueue");
const MockOperationStore_1 = require("../mocks/MockOperationStore");
const MockVersionManager_1 = require("../mocks/MockVersionManager");
const Operation_1 = require("../../lib/core/versions/latest/Operation");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const OperationProcessor_1 = require("../../lib/core/versions/latest/OperationProcessor");
const OperationType_1 = require("../../lib/core/enums/OperationType");
const RequestHandler_1 = require("../../lib/core/versions/latest/RequestHandler");
const Resolver_1 = require("../../lib/core/Resolver");
const Response_1 = require("../../lib/common/Response");
const ResponseStatus_1 = require("../../lib/common/enums/ResponseStatus");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
const util = require('util');
const OVERWRITE_FIXTURES = false;
describe('RequestHandler', () => {
    // Suppress console logging during testing so we get a compact test summary in console.
    console.info = () => { };
    console.error = () => { };
    console.info = () => { };
    const config = require('../json/config-test.json');
    const didMethodName = config.didMethodName;
    // Load the DID Document template.
    const blockchain = new MockBlockchain_1.default();
    let cas;
    let batchScheduler;
    let operationStore;
    let resolver;
    let requestHandler;
    let versionManager;
    let recoveryPublicKey;
    let recoveryPrivateKey;
    let did; // This DID is created at the beginning of every test.
    let didUniqueSuffix;
    let confirmationStore;
    // Start a new instance of Operation Processor, and create a DID before every test.
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const operationQueue = new MockOperationQueue_1.default();
        spyOn(blockchain, 'getFee').and.returnValue(Promise.resolve(100));
        spyOn(blockchain, 'getWriterValueTimeLock').and.returnValue(Promise.resolve(undefined));
        let versionMetadataFetcher = {};
        const versionMetadata = {
            normalizedFeeToPerOperationFeeMultiplier: 0.01
        };
        versionMetadataFetcher = {
            getVersionMetadata: () => {
                return versionMetadata;
            }
        };
        cas = new MockCas_1.default();
        confirmationStore = new MockConfirmationStore_1.default();
        const batchWriter = new BatchWriter_1.default(operationQueue, blockchain, cas, versionMetadataFetcher, confirmationStore);
        const operationProcessor = new OperationProcessor_1.default();
        versionManager = new MockVersionManager_1.default();
        spyOn(versionManager, 'getOperationProcessor').and.returnValue(operationProcessor);
        spyOn(versionManager, 'getBatchWriter').and.returnValue(batchWriter);
        operationStore = new MockOperationStore_1.default();
        resolver = new Resolver_1.default(versionManager, operationStore);
        batchScheduler = new BatchScheduler_1.default(versionManager, blockchain, config.batchingIntervalInSeconds);
        requestHandler = new RequestHandler_1.default(resolver, operationQueue, didMethodName);
        // Set a latest time that must be able to resolve to a protocol version in the protocol config file used.
        const mockLatestTime = {
            time: 1000000,
            hash: 'dummyHash'
        };
        blockchain.setLatestTime(mockLatestTime);
        // Generate a unique key-pair used for each test.
        [recoveryPublicKey, recoveryPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair();
        const [signingPublicKey] = yield OperationGenerator_1.default.generateKeyPair('key2');
        const services = OperationGenerator_1.default.generateServices(['serviceId123']);
        const createOperationBuffer = yield OperationGenerator_1.default.generateCreateOperationBuffer(recoveryPublicKey, signingPublicKey, services);
        const createOperation = yield CreateOperation_1.default.parse(createOperationBuffer);
        didUniqueSuffix = createOperation.didUniqueSuffix;
        did = `did:${didMethodName}:${didUniqueSuffix}`;
        // Test that the create request gets the correct response.
        const response = yield requestHandler.handleOperationRequest(createOperationBuffer);
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(200);
        expect(response).toBeDefined();
        expect(response.body.didDocument.id).toEqual(did);
        // Insert the create operation into DB.
        const namedAnchoredCreateOperationModel = {
            didUniqueSuffix: createOperation.didUniqueSuffix,
            type: OperationType_1.default.Create,
            transactionNumber: 1,
            transactionTime: 1,
            operationBuffer: createOperationBuffer,
            operationIndex: 0
        };
        yield operationStore.insertOrReplace([namedAnchoredCreateOperationModel]);
        // Trigger the batch writing to clear the operation queue for future tests.
        yield batchScheduler.writeOperationBatch();
        confirmationStore.clear();
    }));
    it('should resolve long form did from test vectors correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield requestHandler.handleResolveRequest(generatedFixture.create.longFormDid);
        expect(response.status).toEqual(ResponseStatus_1.default.Succeeded);
        Fixture_1.default.fixtureDriftHelper(response.body, longFormResponseDidDocument, 'resolution/longFormResponseDidDocument.json', OVERWRITE_FIXTURES);
        expect(response.body).toEqual(longFormResponseDidDocument);
    }));
    it('should process create operation from test vectors correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const createOperationBuffer = Buffer.from(JSON.stringify(generatedFixture.create.operationRequest));
        const response = yield requestHandler.handleOperationRequest(createOperationBuffer);
        expect(response.status).toEqual(ResponseStatus_1.default.Succeeded);
    }));
    it('should process update operation from test vectors correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const updateOperationBuffer = Buffer.from(JSON.stringify(generatedFixture.update.operationRequest));
        const response = yield requestHandler.handleOperationRequest(updateOperationBuffer);
        expect(response.status).toEqual(ResponseStatus_1.default.Succeeded);
    }));
    it('should process recover operation from test vectors correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const recoverOperationBuffer = Buffer.from(JSON.stringify(generatedFixture.recover.operationRequest));
        const response = yield requestHandler.handleOperationRequest(recoverOperationBuffer);
        expect(response.status).toEqual(ResponseStatus_1.default.Succeeded);
    }));
    it('should process deactivate operation from test vectors correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const deactivateOperationBuffer = Buffer.from(JSON.stringify(generatedFixture.deactivate.operationRequest));
        const response = yield requestHandler.handleOperationRequest(deactivateOperationBuffer);
        expect(response.status).toEqual(ResponseStatus_1.default.Succeeded);
    }));
    it('should queue operation request and have it processed by the batch scheduler correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
        const [anyPublicKey, anyPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair(); // Used in multiple operation requests for testing purposes.
        // Create request.
        const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ operationIndex: 1, transactionNumber: 1, transactionTime: 1 });
        const createOperationBuffer = createOperationData.anchoredOperationModel.operationBuffer;
        const createOperation = createOperationData.createOperation;
        // Update request.
        const didToUpdate = OperationGenerator_1.default.generateRandomHash();
        const updateOperationData = yield OperationGenerator_1.default.generateUpdateOperation(didToUpdate, anyPublicKey, anyPrivateKey);
        const updateRequestBuffer = updateOperationData.operationBuffer;
        const updateOperation = updateOperationData.updateOperation;
        // Recover request.
        const didToRecover = OperationGenerator_1.default.generateRandomHash();
        const recoverOperationData = yield OperationGenerator_1.default.generateRecoverOperation({ didUniqueSuffix: didToRecover, recoveryPrivateKey: anyPrivateKey });
        const recoverRequestBuffer = recoverOperationData.operationBuffer;
        const recoverOperation = recoverOperationData.recoverOperation;
        // Deactivate request.
        const didToDeactivate = OperationGenerator_1.default.generateRandomHash();
        const deactivateOperationData = yield OperationGenerator_1.default.createDeactivateOperation(didToDeactivate, anyPrivateKey);
        const deactivateRequestBuffer = deactivateOperationData.operationBuffer;
        yield requestHandler.handleOperationRequest(createOperationBuffer);
        yield requestHandler.handleOperationRequest(updateRequestBuffer);
        yield requestHandler.handleOperationRequest(recoverRequestBuffer);
        yield requestHandler.handleOperationRequest(deactivateRequestBuffer);
        const blockchainWriteSpy = spyOn(blockchain, 'write');
        yield batchScheduler.writeOperationBatch();
        expect(blockchainWriteSpy).toHaveBeenCalledTimes(1);
        // Verify that CAS was invoked to store the chunk file.
        const maxChunkFileSize = 20000000;
        const expectedBatchBuffer = yield ChunkFile_1.default.createBuffer([createOperation], [recoverOperation], [updateOperation]);
        const expectedChunkFileUri = MockCas_1.default.getAddress(expectedBatchBuffer);
        const fetchResult = yield cas.read(expectedChunkFileUri, maxChunkFileSize);
        const decompressedData = yield Compressor_1.default.decompress(fetchResult.content, maxChunkFileSize);
        const chunkFile = JSON.parse(decompressedData.toString());
        expect(chunkFile.deltas.length).toEqual(3); // Deactivates do not have `delta`.
    }));
    it('should return bad request if delta given in request is larger than protocol limit.', () => __awaiter(void 0, void 0, void 0, function* () {
        const createOperationData = yield OperationGenerator_1.default.generateCreateOperation();
        const createOperationRequest = createOperationData.operationRequest;
        const getRandomBytesAsync = util.promisify(crypto.randomBytes);
        const largeBuffer = yield getRandomBytesAsync(4000);
        createOperationRequest.delta = {
            updateCommitment: largeBuffer.toString(),
            patches: []
        };
        const createOperationBuffer = Buffer.from(JSON.stringify(createOperationRequest));
        const response = yield requestHandler.handleOperationRequest(createOperationBuffer);
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(400);
        expect(response.body.code).toEqual(ErrorCode_1.default.DeltaExceedsMaximumSize);
    }));
    it('should return bad request if two operations for the same DID is received.', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create the initial create operation.
        const [recoveryPublicKey] = yield Jwk_1.default.generateEs256kKeyPair();
        const [signingPublicKey] = yield OperationGenerator_1.default.generateKeyPair('signingKey');
        const createOperationBuffer = yield OperationGenerator_1.default.generateCreateOperationBuffer(recoveryPublicKey, signingPublicKey);
        // Submit the create request twice.
        yield requestHandler.handleOperationRequest(createOperationBuffer);
        const response = yield requestHandler.handleOperationRequest(createOperationBuffer);
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(400);
        expect(response.body.code).toEqual(ErrorCode_1.default.QueueingMultipleOperationsPerDidNotAllowed);
    }));
    it('should return a correctly resolved DID Document given a known DID.', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield requestHandler.handleResolveRequest(did);
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(200);
        expect(response.body).toBeDefined();
        validateDidReferencesInDidDocument(response.body.didDocument, did);
    }));
    it('should return a resolved DID Document given a valid long-form DID.', () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a long-form DID string.
        const longFormDid = (yield OperationGenerator_1.default.generateLongFormDid()).longFormDid;
        const response = yield requestHandler.handleResolveRequest(longFormDid);
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(200);
        expect(response.body).toBeDefined();
        validateDidReferencesInDidDocument(response.body.didDocument, longFormDid);
    }));
    it('should return NotFound given an unknown DID.', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield requestHandler.handleResolveRequest('did:sidetree:EiAgE-q5cRcn4JHh8ETJGKqaJv1z2OgjmN3N-APx0aAvHg');
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(404);
        expect(response.body).toEqual({ code: ErrorCode_1.default.DidNotFound, message: 'DID Not Found' });
    }));
    it('should return BadRequest given a malformed DID.', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield requestHandler.handleResolveRequest('did:sidetree:EiAgE-q5cRcn4JHh8ETJGKqaJv1z2OgjmN3N-APx0aAvHg:unused.');
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(400);
        expect(response.body.code).toEqual(ErrorCode_1.default.EncoderValidateBase64UrlStringInputNotBase64UrlString);
    }));
    it('should respond with HTTP 200 when DID deactivate operation request is successful.', () => __awaiter(void 0, void 0, void 0, function* () {
        const deactivateOperationData = yield OperationGenerator_1.default.createDeactivateOperation(didUniqueSuffix, recoveryPrivateKey);
        const response = yield requestHandler.handleOperationRequest(deactivateOperationData.operationBuffer);
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(200);
    }));
    it('should respond with HTTP 200 when an update operation request is successful.', () => __awaiter(void 0, void 0, void 0, function* () {
        const [, anySigningPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair();
        const [additionalKey] = yield OperationGenerator_1.default.generateKeyPair(`new-key1`);
        const [signingPublicKey] = yield OperationGenerator_1.default.generateKeyPair('signingKey');
        const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, signingPublicKey.publicKeyJwk, anySigningPrivateKey, additionalKey, OperationGenerator_1.default.generateRandomHash());
        const requestBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
        const response = yield requestHandler.handleOperationRequest(requestBuffer);
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(200);
    }));
    it('should respond with HTTP 200 when a recover operation request is successful.', () => __awaiter(void 0, void 0, void 0, function* () {
        const recoveryOperationData = yield OperationGenerator_1.default.generateRecoverOperation({ didUniqueSuffix, recoveryPrivateKey });
        const response = yield requestHandler.handleOperationRequest(recoveryOperationData.operationBuffer);
        const httpStatus = Response_1.default.toHttpStatus(response.status);
        expect(httpStatus).toEqual(200);
    }));
    describe('handleResolveRequest()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return internal server error if non-Sidetree error has occurred.', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(Did_1.default, 'create').and.throwError('Non-Sidetree error.');
            const response = yield requestHandler.handleResolveRequest('unused');
            expect(response.status).toEqual(ResponseStatus_1.default.ServerError);
        }));
        it('[Bug #817] should return status as `deactivated` if DID is deactivated.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Intentionally not including `nextRecoveryCommitmentHash` and `nextUpdateCommitmentHash` to simulate deactivated state.
            const document = { unused: 'unused' };
            const mockedResolverReturnedDidState = {
                document,
                lastOperationTransactionNumber: 123
            };
            spyOn(requestHandler.resolver, 'resolve').and.returnValue(Promise.resolve(mockedResolverReturnedDidState));
            const anyDid = 'did:sidetree:' + OperationGenerator_1.default.generateRandomHash();
            const response = yield requestHandler.handleResolveRequest(anyDid);
            expect(response.status).toEqual(ResponseStatus_1.default.Deactivated);
            expect(response.body.didDocumentMetadata.deactivated).toEqual(true);
        }));
    }));
    describe('handleOperationRequest()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return `BadRequest` if unknown error is thrown during generic operation parsing stage.', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(JsonAsync_1.default, 'parse').and.throwError('Non-Sidetree error.');
            const response = yield requestHandler.handleOperationRequest(Buffer.from('unused'));
            expect(response.status).toEqual(ResponseStatus_1.default.BadRequest);
        }));
        it('should return `BadRequest` if operation of an unknown type is given.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simulate an unknown operation type.
            const mockCreateOperation = (yield OperationGenerator_1.default.generateCreateOperation()).createOperation;
            mockCreateOperation.type = 'unknownType';
            spyOn(JsonAsync_1.default, 'parse').and.returnValue(Promise.resolve('unused'));
            spyOn(Operation_1.default, 'parse').and.returnValue(Promise.resolve(mockCreateOperation));
            const response = yield requestHandler.handleOperationRequest(Buffer.from('unused'));
            expect(response.status).toEqual(ResponseStatus_1.default.BadRequest);
            expect(response.body.code).toEqual(ErrorCode_1.default.RequestHandlerUnknownOperationType);
        }));
        it('should return `BadRequest` if Sidetree error is thrown during operation processing stage.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simulate a Sidetree error thrown when processing operation.
            const mockErrorCode = 'anyCode';
            spyOn(requestHandler, 'applyCreateOperation').and.callFake(() => { throw new SidetreeError_1.default(mockErrorCode); });
            const operationBuffer = (yield OperationGenerator_1.default.generateCreateOperation()).createOperation.operationBuffer;
            const response = yield requestHandler.handleOperationRequest(operationBuffer);
            expect(response.status).toEqual(ResponseStatus_1.default.BadRequest);
            expect(response.body.code).toEqual(mockErrorCode);
        }));
        it('should return `ServerError` if non-Sidetree error is thrown during operation processing stage.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simulate a non-Sidetree error thrown when processing operation.
            spyOn(requestHandler, 'applyCreateOperation').and.throwError('any error');
            const operationBuffer = (yield OperationGenerator_1.default.generateCreateOperation()).createOperation.operationBuffer;
            const response = yield requestHandler.handleOperationRequest(operationBuffer);
            expect(response.status).toEqual(ResponseStatus_1.default.ServerError);
        }));
    }));
    describe('handleCreateRequest()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return `BadRequest` if unable to generate initial DID state from the given create operation model.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const createOperationData = yield OperationGenerator_1.default.generateCreateOperation();
            const createOperation = createOperationData.createOperation;
            // Simulate undefined being returned by `applyCreateOperation()`.
            spyOn(requestHandler, 'applyCreateOperation').and.returnValue(Promise.resolve(undefined));
            const response = yield requestHandler.handleCreateRequest(createOperation);
            expect(response.status).toEqual(ResponseStatus_1.default.BadRequest);
            done();
        }));
    }));
    describe('resolveLongFormDid()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return the resolved DID document, and `published` value as `true` if it is resolvable as a registered DID.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [anySigningPublicKey] = yield OperationGenerator_1.default.generateKeyPair('anySigningKey');
            const document = {
                publicKeys: [anySigningPublicKey]
            };
            const mockedResolverReturnedDidState = {
                document,
                lastOperationTransactionNumber: 123,
                nextRecoveryCommitmentHash: 'anyCommitmentHash',
                nextUpdateCommitmentHash: 'anyCommitmentHash'
            };
            spyOn(requestHandler.resolver, 'resolve').and.returnValue(Promise.resolve(mockedResolverReturnedDidState));
            const [didState, published] = yield requestHandler.resolveLongFormDid('unused');
            expect(published).toEqual(true);
            expect(didState.document.publicKeys.length).toEqual(1);
            expect(didState.document.publicKeys[0].publicKeyJwk).toEqual(anySigningPublicKey.publicKeyJwk);
        }));
    }));
});
/**
 * Verifies that the given DID document contains correct references to the DID throughout.
 */
function validateDidReferencesInDidDocument(didDocument, did) {
    expect(didDocument.id).toEqual(did);
    if (didDocument.publicKey) {
        for (const publicKeyEntry of didDocument.publicKey) {
            expect(publicKeyEntry.controller).toEqual(did);
            expect(publicKeyEntry.id.startsWith('#'));
        }
    }
    if (didDocument.service) {
        for (const serviceEntry of didDocument.service) {
            expect(serviceEntry.id.startsWith('#'));
        }
    }
}
//# sourceMappingURL=RequestHandler.spec.js.map