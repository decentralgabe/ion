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
const Core_1 = require("../../lib/core/Core");
const ErrorCode_1 = require("../../lib/core/ErrorCode");
const EventEmitter_1 = require("../../lib/common/EventEmitter");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const Logger_1 = require("../../lib/common/Logger");
const MockCas_1 = require("../mocks/MockCas");
const ResponseStatus_1 = require("../../lib/common/enums/ResponseStatus");
describe('Core', () => __awaiter(void 0, void 0, void 0, function* () {
    const testConfig = require('../json/config-test.json');
    const testVersionConfig = require('../json/core-protocol-versioning-test.json');
    const mockCas = new MockCas_1.default();
    const resolvedRequest = new Promise(resolve => {
        const responseModel = { status: ResponseStatus_1.default.Succeeded, body: null };
        resolve(responseModel);
    });
    describe('constructor', () => {
        it('should construct MongoDBOperationStore with database if passed in config', () => {
            const databaseName = 'mongoDbTestDatabase';
            const databaseIncludedConfig = Object.assign({}, testConfig, { databaseName });
            const core = new Core_1.default(databaseIncludedConfig, testVersionConfig, mockCas);
            expect(core['operationStore']['databaseName']).toEqual(databaseName);
            expect(core['unresolvableTransactionStore']['databaseName']).toEqual(databaseName);
            // true because it is set by config value
            expect(core['blockchainClock']['enableRealBlockchainTimePull']).toEqual(true);
        });
    });
    describe('initialize', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should initialize all required dependencies', () => __awaiter(void 0, void 0, void 0, function* () {
            const core = new Core_1.default(testConfig, testVersionConfig, mockCas);
            const serviceStateStoreInitializeSpy = spyOn(core['serviceStateStore'], 'initialize');
            const transactionStoreInitSpy = spyOn(core['transactionStore'], 'initialize');
            const unresolvableTransactionStoreInitSpy = spyOn(core['unresolvableTransactionStore'], 'initialize');
            const operationStoreInitSpy = spyOn(core['operationStore'], 'initialize');
            const confirmationStoreInitSpy = spyOn(core['confirmationStore'], 'initialize');
            const upgradeDatabaseIfNeededSpy = spyOn(core, 'upgradeDatabaseIfNeeded');
            const versionManagerInitSpy = spyOn(core['versionManager'], 'initialize');
            const observerStartSpy = spyOn(core['observer'], 'startPeriodicProcessing');
            const batchSchedulerStartSpy = spyOn(core['batchScheduler'], 'startPeriodicBatchWriting');
            const downloadManagerStartSpy = spyOn(core['downloadManager'], 'start');
            const monitorInitializeSpy = spyOn(core.monitor, 'initialize');
            // mocking it so initialize doesn't actually start the periodic pull
            yield core.initialize();
            expect(serviceStateStoreInitializeSpy).toHaveBeenCalled();
            expect(transactionStoreInitSpy).toHaveBeenCalled();
            expect(unresolvableTransactionStoreInitSpy).toHaveBeenCalled();
            expect(operationStoreInitSpy).toHaveBeenCalled();
            expect(confirmationStoreInitSpy).toHaveBeenCalled();
            expect(upgradeDatabaseIfNeededSpy).toHaveBeenCalled();
            expect(versionManagerInitSpy).toHaveBeenCalled();
            expect(observerStartSpy).toHaveBeenCalled();
            expect(batchSchedulerStartSpy).toHaveBeenCalled();
            expect(downloadManagerStartSpy).toHaveBeenCalled();
            expect(monitorInitializeSpy).toHaveBeenCalled();
        }));
        it('should override the default logger/event emitter if custom logger/event emitter is given.', () => __awaiter(void 0, void 0, void 0, function* () {
            const core = new Core_1.default(testConfig, testVersionConfig, mockCas);
            spyOn(core['serviceStateStore'], 'initialize');
            spyOn(core['transactionStore'], 'initialize');
            spyOn(core['unresolvableTransactionStore'], 'initialize');
            spyOn(core['operationStore'], 'initialize');
            spyOn(core['confirmationStore'], 'initialize');
            spyOn(core, 'upgradeDatabaseIfNeeded');
            spyOn(core['versionManager'], 'initialize');
            spyOn(core['observer'], 'startPeriodicProcessing');
            spyOn(core['batchScheduler'], 'startPeriodicBatchWriting');
            spyOn(core['downloadManager'], 'start');
            spyOn(core.monitor, 'initialize');
            let customLoggerInvoked = false;
            const customLogger = {
                info: () => { customLoggerInvoked = true; },
                warn: () => { },
                error: () => { },
                debug: () => { }
            };
            let customEvenEmitterInvoked = false;
            const customEvenEmitter = {
                emit: () => __awaiter(void 0, void 0, void 0, function* () { customEvenEmitterInvoked = true; })
            };
            // mocking it so initialize doesn't actually start the periodic pull
            yield core.initialize(customLogger, customEvenEmitter);
            // Invoke logger to trigger the custom logger's method defined above.
            Logger_1.default.info('anything');
            // Invoke event emitter to trigger the custom emitter's method defined above.
            yield EventEmitter_1.default.emit('anything');
            expect(customLoggerInvoked).toBeTruthy();
            expect(customEvenEmitterInvoked).toBeTruthy();
        }));
        it('should not start the Batch Writer and Observer if they are disabled.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Disable Batch Writer and observer in config.
            const config = Object.assign({}, testConfig);
            config.batchingIntervalInSeconds = 0;
            config.observingIntervalInSeconds = 0;
            const core = new Core_1.default(config, testVersionConfig, mockCas);
            const observerStartSpy = spyOn(core['observer'], 'startPeriodicProcessing');
            const batchSchedulerStartSpy = spyOn(core['batchScheduler'], 'startPeriodicBatchWriting');
            spyOn(core['serviceStateStore'], 'initialize');
            spyOn(core['transactionStore'], 'initialize');
            spyOn(core['unresolvableTransactionStore'], 'initialize');
            spyOn(core['operationStore'], 'initialize');
            spyOn(core['confirmationStore'], 'initialize');
            spyOn(core, 'upgradeDatabaseIfNeeded');
            spyOn(core['versionManager'], 'initialize');
            spyOn(core['downloadManager'], 'start');
            spyOn(core.monitor, 'initialize');
            // mocking it so initialize doesn't actually start the periodic pull
            yield core.initialize();
            expect(observerStartSpy).not.toHaveBeenCalled();
            expect(batchSchedulerStartSpy).not.toHaveBeenCalled();
        }));
    }));
    describe('initializeDataStores()', () => {
        it('should keep retrying until data stores are initialized successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const core = new Core_1.default(testConfig, testVersionConfig, mockCas);
            // mock a method call within initializeDataStores() so that:
            // 1st invocation: throws an error
            // subsequent invocations: mocks a success
            let callCount = 0;
            const upgradeDatabaseIfNeededSpy = spyOn(core, 'upgradeDatabaseIfNeeded').and.callFake(() => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('any error');
                }
            });
            // mock rest of the data store initialization code to do nothing
            spyOn(core['serviceStateStore'], 'initialize');
            spyOn(core['transactionStore'], 'initialize');
            spyOn(core['unresolvableTransactionStore'], 'initialize');
            spyOn(core['operationStore'], 'initialize');
            spyOn(core['confirmationStore'], 'initialize');
            const retryWaitTimeOnFailureInSeconds = 0; // skip any waiting in unit tests
            yield core['initializeDataStores'](retryWaitTimeOnFailureInSeconds);
            expect(upgradeDatabaseIfNeededSpy).toHaveBeenCalledTimes(2);
        }));
    });
    describe('handleGetVersionRequest()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should call all the dependent services', () => __awaiter(void 0, void 0, void 0, function* () {
            // Keep the 'name' property on the following model objects. The name is used to sort
            // the values alphabetically to validate the response later on.
            const expectedCoreVersion = { name: 'a-service', version: 'x.y.z' };
            const expectedBlockchainVersion = { name: 'b-service', version: 'a.b.c' };
            const core = new Core_1.default(testConfig, testVersionConfig, mockCas);
            const serviceInfoSpy = spyOn(core['serviceInfo'], 'getServiceVersion').and.returnValue(expectedCoreVersion);
            const blockchainSpy = spyOn(core['blockchain'], 'getServiceVersion').and.returnValue(Promise.resolve(expectedBlockchainVersion));
            const fetchedResponse = yield core.handleGetVersionRequest();
            expect(serviceInfoSpy).toHaveBeenCalled();
            expect(blockchainSpy).toHaveBeenCalled();
            expect(fetchedResponse.status).toEqual(ResponseStatus_1.default.Succeeded);
            // Sort the output to make it easier to validate
            const fetchedVersions = JSON.parse(fetchedResponse.body);
            fetchedVersions.sort((a, b) => a.name > b.name ? 1 : -1);
            expect(fetchedVersions[0]).toEqual(expectedCoreVersion);
            expect(fetchedVersions[1]).toEqual(expectedBlockchainVersion);
        }));
    }));
    describe('handleResolveRequest', () => {
        it('should call the needed functions and return a response', () => __awaiter(void 0, void 0, void 0, function* () {
            const core = new Core_1.default(testConfig, testVersionConfig, mockCas);
            const mockRequestHandler = jasmine.createSpyObj('versionManagerSpy', ['handleResolveRequest']);
            mockRequestHandler.handleResolveRequest.and.callFake(() => { return resolvedRequest; });
            core['versionManager']['getRequestHandler'] = () => { return mockRequestHandler; };
            spyOn(core['blockchain'], 'getLatestTime').and.returnValue(Promise.resolve({ time: Number.MAX_SAFE_INTEGER, hash: 'hash' }));
            const response = yield core.handleResolveRequest('did:sidetree:abc');
            expect(mockRequestHandler.handleResolveRequest).toHaveBeenCalled();
            expect(response).toEqual({ status: ResponseStatus_1.default.Succeeded, body: null });
        }));
    });
    describe('handleOperationRequest', () => {
        it('should call the needed functions and return a response', () => __awaiter(void 0, void 0, void 0, function* () {
            const core = new Core_1.default(testConfig, testVersionConfig, mockCas);
            const mockRequestHandler = jasmine.createSpyObj('versionManagerSpy', ['handleOperationRequest']);
            mockRequestHandler.handleOperationRequest.and.callFake(() => { return resolvedRequest; });
            core['versionManager']['getRequestHandler'] = () => { return mockRequestHandler; };
            spyOn(core['blockchain'], 'getLatestTime').and.returnValue(Promise.resolve({ time: Number.MAX_SAFE_INTEGER, hash: 'hash' }));
            const response = yield core.handleOperationRequest(Buffer.from('some string'));
            expect(mockRequestHandler.handleOperationRequest).toHaveBeenCalled();
            expect(response).toEqual({ status: ResponseStatus_1.default.Succeeded, body: null });
        }));
    });
    describe('upgradeDatabaseIfNeeded', () => {
        beforeEach(() => {
        });
        it('should not perform upgrade if the node is not an active Observer node.', () => __awaiter(void 0, void 0, void 0, function* () {
            const config = Object.assign({}, testConfig);
            config.observingIntervalInSeconds = 0; // Force disabling of Observer.
            const core = new Core_1.default(config, testVersionConfig, mockCas);
            const serviceStateStorePutSpy = spyOn(core['serviceStateStore'], 'put');
            yield core.upgradeDatabaseIfNeeded();
            // Verify that upgrade path was NOT invoked.
            expect(serviceStateStorePutSpy).not.toHaveBeenCalled();
        }));
        it('should not perform upgrade if saved database version is the same as the expected database version.', () => __awaiter(void 0, void 0, void 0, function* () {
            const core = new Core_1.default(testConfig, testVersionConfig, mockCas);
            // Simulate that the saved database version is the same as the expected database version.
            spyOn(core['serviceStateStore'], 'get').and.returnValue(Promise.resolve({ databaseVersion: '1.1.0' }));
            const serviceStateStorePutSpy = spyOn(core['serviceStateStore'], 'put');
            yield core.upgradeDatabaseIfNeeded();
            // Verify that upgrade path was NOT invoked.
            expect(serviceStateStorePutSpy).not.toHaveBeenCalled();
        }));
        it('should perform upgrade if saved database version is older than the current running database version.', () => __awaiter(void 0, void 0, void 0, function* () {
            const core = new Core_1.default(testConfig, testVersionConfig, mockCas);
            const operationStoreDeleteSpy = spyOn(core['operationStore'], 'delete');
            const operationStoreCreateIndexSpy = spyOn(core['operationStore'], 'createIndex');
            const unresolvableTransactionStoreClearCollectionSpy = spyOn(core['unresolvableTransactionStore'], 'clearCollection');
            const transactionStoreClearCollectionSpy = spyOn(core['transactionStore'], 'clearCollection');
            const serviceStateStorePutSpy = spyOn(core['serviceStateStore'], 'put');
            // Mock a saved database version that is definitely older than the expected version to trigger DB upgrade.
            spyOn(core['serviceStateStore'], 'get').and.returnValue(Promise.resolve({ databaseVersion: '0.0.1' }));
            yield core.upgradeDatabaseIfNeeded();
            // Verify that that upgrade path was invoked.
            expect(operationStoreDeleteSpy).toHaveBeenCalled();
            expect(unresolvableTransactionStoreClearCollectionSpy).toHaveBeenCalled();
            expect(transactionStoreClearCollectionSpy).toHaveBeenCalled();
            expect(operationStoreCreateIndexSpy).toHaveBeenCalled();
            expect(serviceStateStorePutSpy).toHaveBeenCalledWith({ databaseVersion: '1.1.0' });
        }));
        it('should throw if attempting to run older code on newer DB.', () => __awaiter(void 0, void 0, void 0, function* () {
            const core = new Core_1.default(testConfig, testVersionConfig, mockCas);
            // Mock a saved database version that is definitely newer than the expected version to trigger expected error.
            spyOn(core['serviceStateStore'], 'get').and.returnValue(Promise.resolve({ databaseVersion: '99999.0.0' }));
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => core.upgradeDatabaseIfNeeded(), ErrorCode_1.default.DatabaseDowngradeNotAllowed);
        }));
    });
}));
//# sourceMappingURL=Core.spec.js.map