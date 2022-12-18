/// <reference types="node" />
import { ISidetreeCas, ISidetreeEventEmitter, ISidetreeLogger } from '..';
import Config from './models/Config';
import Monitor from './Monitor';
import ResponseModel from '../common/models/ResponseModel';
import VersionModel from './models/VersionModel';
/**
 * The core class that is instantiated when running a Sidetree node.
 */
export default class Core {
    private config;
    private cas;
    /** Monitor of the running Core service. */
    monitor: Monitor;
    private serviceStateStore;
    private transactionStore;
    private unresolvableTransactionStore;
    private operationStore;
    private versionManager;
    private blockchain;
    private downloadManager;
    private observer;
    private batchScheduler;
    private resolver;
    private serviceInfo;
    private blockchainClock;
    private confirmationStore;
    /**
     * Core constructor.
     */
    constructor(config: Config, versionModels: VersionModel[], cas: ISidetreeCas);
    /**
     * The initialization method that must be called before consumption of this core object.
     * The method starts the Observer and Batch Writer.
     */
    initialize(customLogger?: ISidetreeLogger, customEventEmitter?: ISidetreeEventEmitter): Promise<void>;
    /**
     * Attempts to initialize data stores until success.
     * @param retryWaitTimeOnFailureInSeconds Time to wait if initialization failed.
     */
    private initializeDataStores;
    /**
     * Handles an operation request.
     */
    handleOperationRequest(request: Buffer): Promise<ResponseModel>;
    /**
     * Handles resolve operation.
     * @param didOrDidDocument Can either be:
     *   1. Fully qualified DID. e.g. 'did:sidetree:abc' or
     *   2. An encoded DID Document prefixed by the DID method name. e.g. 'did:sidetree:<encoded-DID-Document>'.
     */
    handleResolveRequest(didOrDidDocument: string): Promise<ResponseModel>;
    /**
     * Handles the get version request. It gets the versions from the dependent services
     * as well.
     */
    handleGetVersionRequest(): Promise<ResponseModel>;
    private upgradeDatabaseIfNeeded;
}
