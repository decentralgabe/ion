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
const DownloadManager_1 = require("../../lib/core/DownloadManager");
const ErrorCode_1 = require("../../lib/core/ErrorCode");
const MockBlockchain_1 = require("../mocks/MockBlockchain");
const MockCas_1 = require("../mocks/MockCas");
const MockConfirmationStore_1 = require("../mocks/MockConfirmationStore");
const MockOperationStore_1 = require("../mocks/MockOperationStore");
const MockTransactionStore_1 = require("../mocks/MockTransactionStore");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const OperationType_1 = require("../../lib/core/enums/OperationType");
const Resolver_1 = require("../../lib/core/Resolver");
const VersionManager_1 = require("../../lib/core/VersionManager");
describe('VersionManager', () => __awaiter(void 0, void 0, void 0, function* () {
    let config;
    let blockChain;
    let cas;
    let operationStore;
    let downloadMgr;
    let mockTransactionStore;
    let mockConfirmationStore;
    beforeEach(() => {
        config = require('../json/config-test.json');
        blockChain = new MockBlockchain_1.default();
        cas = new MockCas_1.default();
        operationStore = new MockOperationStore_1.default();
        downloadMgr = new DownloadManager_1.default(1, cas);
        mockTransactionStore = new MockTransactionStore_1.default();
        mockConfirmationStore = new MockConfirmationStore_1.default();
    });
    describe('initialize()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should initialize all the objects correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1000, version: 'test-version-1' }
            ];
            const versionMgr = new VersionManager_1.default(config, versionModels);
            spyOn(versionMgr, 'loadDefaultExportsForVersion').and.callFake((version, className) => __awaiter(void 0, void 0, void 0, function* () {
                return (yield Promise.resolve().then(() => require(`./versions/${version}/${className}`))).default;
            }));
            const resolver = new Resolver_1.default(versionMgr, operationStore);
            yield versionMgr.initialize(blockChain, cas, downloadMgr, operationStore, resolver, mockTransactionStore, mockConfirmationStore);
            expect(versionMgr['batchWriters'].get('test-version-1')).toBeDefined();
            expect(versionMgr['transactionProcessors'].get('test-version-1')).toBeDefined();
            // No exception thrown == initialize was successful
        }));
        it('should throw if version metadata is the wrong type.', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1000, version: 'test-version-1' }
            ];
            const versionMgr = new VersionManager_1.default(config, versionModels);
            spyOn(versionMgr, 'loadDefaultExportsForVersion').and.callFake((version, className) => __awaiter(void 0, void 0, void 0, function* () {
                if (className === 'VersionMetadata') {
                    const fakeClass = class {
                    }; // a fake class that does nothing
                    return fakeClass;
                }
                else {
                    return (yield Promise.resolve().then(() => require(`./versions/${version}/${className}`))).default;
                }
            }));
            const resolver = new Resolver_1.default(versionMgr, operationStore);
            try {
                yield versionMgr.initialize(blockChain, cas, downloadMgr, operationStore, resolver, mockTransactionStore, mockConfirmationStore);
                fail('expect to throw but did not');
            }
            catch (e) {
                expect(e.code).toEqual(ErrorCode_1.default.VersionManagerVersionMetadataIncorrectType);
            }
        }));
        it('should throw if the versions folder is missing.', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1000, version: 'invalid_version' }
            ];
            const versionMgr = new VersionManager_1.default(config, versionModels);
            const resolver = new Resolver_1.default(versionMgr, operationStore);
            yield expectAsync(versionMgr.initialize(blockChain, cas, downloadMgr, operationStore, resolver, mockTransactionStore, mockConfirmationStore)).toBeRejected();
        }));
    }));
    describe('loadDefaultExportsForVersion()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should be able to load a default export of a versioned component successfully.', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1, version: 'unused' }
            ];
            const versionManager = new VersionManager_1.default(config, versionModels);
            const OperationProcessor = yield versionManager.loadDefaultExportsForVersion('latest', 'OperationProcessor');
            const operationProcessor = new OperationProcessor();
            expect(operationProcessor).toBeDefined();
        }));
    }));
    describe('getTransactionSelector()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return the correct version of `ITransactionSelector`.', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1000, version: '1000' },
                { startingBlockchainTime: 2000, version: '2000' }
            ];
            const versionManager = new VersionManager_1.default(config, versionModels);
            // Setting up loading of mock ITransactionSelector implementations.
            const mockTransactionSelector1 = class {
                selectQualifiedTransactions() { return []; }
            };
            const anyTransactionModel = OperationGenerator_1.default.generateTransactionModel();
            const mockTransactionSelector2 = class {
                selectQualifiedTransactions() { return [anyTransactionModel]; }
            };
            spyOn(versionManager, 'loadDefaultExportsForVersion').and.callFake((version, className) => __awaiter(void 0, void 0, void 0, function* () {
                if (className === 'TransactionSelector') {
                    if (version === '1000') {
                        return mockTransactionSelector1;
                    }
                    else { // '2000'
                        return mockTransactionSelector2;
                    }
                }
                // Else we are loading components unrelated to this test, default to loading from `latest` version folder.
                const classObject = (yield Promise.resolve().then(() => require(`../../lib/core/versions/latest/${className}`))).default;
                // Override the `intialize()` call so no network call occurs, else the test the will fail in GitHub CICD.
                if (className === 'MongoDbOperationQueue') {
                    classObject.prototype.initialize = () => __awaiter(void 0, void 0, void 0, function* () { });
                }
                return classObject;
            }));
            const resolver = new Resolver_1.default(versionManager, operationStore);
            yield versionManager.initialize(blockChain, cas, downloadMgr, operationStore, resolver, mockTransactionStore, mockConfirmationStore);
            const transactions = yield versionManager.getTransactionSelector(2001).selectQualifiedTransactions([]);
            expect(transactions[0].anchorString).toEqual(anyTransactionModel.anchorString);
        }));
    }));
    describe('getVersionMetadata', () => {
        it('should return the expected versionMetadata', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1000, version: 'test-version-1' }
            ];
            const versionMgr = new VersionManager_1.default(config, versionModels);
            spyOn(versionMgr, 'loadDefaultExportsForVersion').and.callFake((version, className) => __awaiter(void 0, void 0, void 0, function* () {
                return (yield Promise.resolve().then(() => require(`./versions/${version}/${className}`))).default;
            }));
            const resolver = new Resolver_1.default(versionMgr, operationStore);
            yield versionMgr.initialize(blockChain, cas, downloadMgr, operationStore, resolver, mockTransactionStore, mockConfirmationStore);
            const result = versionMgr.getVersionMetadata(1001);
            expect(result.normalizedFeeToPerOperationFeeMultiplier).toEqual(0.01);
        }));
    });
    describe('get* functions.', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return the correct version-ed objects for valid version.', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1000, version: 'test-version-1' }
            ];
            const versionMgr = new VersionManager_1.default(config, versionModels);
            spyOn(versionMgr, 'loadDefaultExportsForVersion').and.callFake((version, className) => __awaiter(void 0, void 0, void 0, function* () {
                return (yield Promise.resolve().then(() => require(`./versions/${version}/${className}`))).default;
            }));
            const resolver = new Resolver_1.default(versionMgr, operationStore);
            yield versionMgr.initialize(blockChain, cas, downloadMgr, operationStore, resolver, mockTransactionStore, mockConfirmationStore);
            // Get the objects for the valid version (see versions/testingversion1 folder) and call
            // functions on the objects to make sure that the correct objects are being returned.
            // For testing, the functions in the above testingversion folder are throwing errors so
            // that is way that we can tell that the correct object is actually being returned.
            const batchWriter = versionMgr.getBatchWriter(1000);
            yield expectAsync(batchWriter.write()).toBeRejected();
            const operationProcessor = versionMgr.getOperationProcessor(1001);
            const namedAnchoredOpModel = {
                type: OperationType_1.default.Create,
                didUniqueSuffix: 'unusedDidUniqueSuffix',
                transactionTime: 0,
                transactionNumber: 0,
                operationIndex: 0,
                operationBuffer: Buffer.from('')
            };
            yield expectAsync(operationProcessor.apply(namedAnchoredOpModel, undefined)).toBeRejected();
            const requestHandler = versionMgr.getRequestHandler(2000);
            yield expectAsync(requestHandler.handleResolveRequest('')).toBeRejected();
            const txProcessor = versionMgr.getTransactionProcessor(10000);
            const txModel = {
                anchorString: '',
                transactionNumber: 0,
                transactionTime: 0,
                transactionTimeHash: '',
                transactionFeePaid: 1,
                normalizedTransactionFee: 1,
                writer: 'writer'
            };
            yield expectAsync(txProcessor.processTransaction(txModel)).toBeRejected();
        }));
        it('should throw for an invalid version.', () => __awaiter(void 0, void 0, void 0, function* () {
            const versionModels = [
                { startingBlockchainTime: 1000, version: 'test-version-1' }
            ];
            const versionMgr = new VersionManager_1.default(config, versionModels);
            spyOn(versionMgr, 'loadDefaultExportsForVersion').and.callFake((version, className) => __awaiter(void 0, void 0, void 0, function* () {
                return (yield Promise.resolve().then(() => require(`./versions/${version}/${className}`))).default;
            }));
            const resolver = new Resolver_1.default(versionMgr, operationStore);
            yield versionMgr.initialize(blockChain, cas, downloadMgr, operationStore, resolver, mockTransactionStore, mockConfirmationStore);
            // Expect an invalid blockchain time input to throw
            expect(() => { versionMgr.getBatchWriter(0); }).toThrowError();
            expect(() => { versionMgr.getOperationProcessor(999); }).toThrowError();
            expect(() => { versionMgr.getRequestHandler(100); }).toThrowError();
            expect(() => { versionMgr.getTransactionProcessor(500); }).toThrowError();
        }));
    }));
}));
//# sourceMappingURL=VersionManager.spec.js.map