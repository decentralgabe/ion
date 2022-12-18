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
const AbstractVersionMetadata_1 = require("./abstracts/AbstractVersionMetadata");
const ErrorCode_1 = require("./ErrorCode");
const SidetreeError_1 = require("../common/SidetreeError");
/**
 * The class that handles code versioning.
 */
class VersionManager {
    constructor(config, versions) {
        this.config = config;
        // Reverse sort versions.
        this.versionsReverseSorted = versions.sort((a, b) => b.startingBlockchainTime - a.startingBlockchainTime);
        this.batchWriters = new Map();
        this.operationProcessors = new Map();
        this.requestHandlers = new Map();
        this.transactionProcessors = new Map();
        this.transactionSelectors = new Map();
        this.versionMetadatas = new Map();
    }
    /**
     * Loads all the implementation versions.
     */
    initialize(blockchain, cas, downloadManager, operationStore, resolver, transactionStore, confirmationStore) {
        return __awaiter(this, void 0, void 0, function* () {
            // NOTE: In principal each version of the interface implementations can have different constructors,
            // but we currently keep the constructor signature the same as much as possible for simple instance construction,
            // but it is not inherently "bad" if we have to have conditional constructions for each if we have to.
            for (const versionModel of this.versionsReverseSorted) {
                const version = versionModel.version;
                const MongoDbOperationQueue = yield this.loadDefaultExportsForVersion(version, 'MongoDbOperationQueue');
                const operationQueue = new MongoDbOperationQueue(this.config.mongoDbConnectionString, this.config.databaseName);
                yield operationQueue.initialize();
                const TransactionProcessor = yield this.loadDefaultExportsForVersion(version, 'TransactionProcessor');
                const transactionProcessor = new TransactionProcessor(downloadManager, operationStore, blockchain, this);
                this.transactionProcessors.set(version, transactionProcessor);
                const TransactionSelector = yield this.loadDefaultExportsForVersion(version, 'TransactionSelector');
                const transactionSelector = new TransactionSelector(transactionStore);
                this.transactionSelectors.set(version, transactionSelector);
                const BatchWriter = yield this.loadDefaultExportsForVersion(version, 'BatchWriter');
                const batchWriter = new BatchWriter(operationQueue, blockchain, cas, this, confirmationStore);
                this.batchWriters.set(version, batchWriter);
                const OperationProcessor = yield this.loadDefaultExportsForVersion(version, 'OperationProcessor');
                const operationProcessor = new OperationProcessor();
                this.operationProcessors.set(version, operationProcessor);
                const RequestHandler = yield this.loadDefaultExportsForVersion(version, 'RequestHandler');
                const requestHandler = new RequestHandler(resolver, operationQueue, this.config.didMethodName);
                this.requestHandlers.set(version, requestHandler);
                const VersionMetadata = yield this.loadDefaultExportsForVersion(version, 'VersionMetadata');
                const versionMetadata = new VersionMetadata();
                if (!(versionMetadata instanceof AbstractVersionMetadata_1.default)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.VersionManagerVersionMetadataIncorrectType, `make sure VersionMetaData is properly implemented for version ${version}`);
                }
                this.versionMetadatas.set(version, versionMetadata);
            }
        });
    }
    /**
     * Gets the corresponding version of the `IBatchWriter` based on the given blockchain time.
     */
    getBatchWriter(blockchainTime) {
        const version = this.getVersionString(blockchainTime);
        const batchWriter = this.batchWriters.get(version);
        return batchWriter;
    }
    /**
     * Gets the corresponding version of the `IOperationProcessor` based on the given blockchain time.
     */
    getOperationProcessor(blockchainTime) {
        const version = this.getVersionString(blockchainTime);
        const operationProcessor = this.operationProcessors.get(version);
        return operationProcessor;
    }
    /**
     * Gets the corresponding version of the `IRequestHandler` based on the given blockchain time.
     */
    getRequestHandler(blockchainTime) {
        const version = this.getVersionString(blockchainTime);
        const requestHandler = this.requestHandlers.get(version);
        return requestHandler;
    }
    /**
     * Gets the corresponding version of the `TransactionProcessor` based on the given blockchain time.
     */
    getTransactionProcessor(blockchainTime) {
        const version = this.getVersionString(blockchainTime);
        const transactionProcessor = this.transactionProcessors.get(version);
        return transactionProcessor;
    }
    /**
     * Gets the corresponding version of the `TransactionSelector` based on the given blockchain time.
     */
    getTransactionSelector(blockchainTime) {
        const version = this.getVersionString(blockchainTime);
        const transactionSelector = this.transactionSelectors.get(version);
        return transactionSelector;
    }
    getVersionMetadata(blockchainTime) {
        const versionString = this.getVersionString(blockchainTime);
        const versionMetadata = this.versionMetadatas.get(versionString);
        // this is always be defined because if blockchain time is found, version will be defined
        return versionMetadata;
    }
    /**
     * Gets the corresponding implementation version string given the blockchain time.
     */
    getVersionString(blockchainTime) {
        // Iterate through each version to find the right version.
        for (const versionModel of this.versionsReverseSorted) {
            if (blockchainTime >= versionModel.startingBlockchainTime) {
                return versionModel.version;
            }
        }
        throw new SidetreeError_1.default(ErrorCode_1.default.VersionManagerVersionStringNotFound, `Unable to find version string for blockchain time ${blockchainTime}.`);
    }
    loadDefaultExportsForVersion(version, className) {
        return __awaiter(this, void 0, void 0, function* () {
            const defaults = (yield Promise.resolve().then(() => require(`./versions/${version}/${className}`))).default;
            return defaults;
        });
    }
}
exports.default = VersionManager;
//# sourceMappingURL=VersionManager.js.map