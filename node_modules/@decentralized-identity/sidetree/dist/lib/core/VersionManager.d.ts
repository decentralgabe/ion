import AbstractVersionMetadata from './abstracts/AbstractVersionMetadata';
import Config from './models/Config';
import DownloadManager from './DownloadManager';
import IBatchWriter from './interfaces/IBatchWriter';
import IBlockchain from './interfaces/IBlockchain';
import ICas from './interfaces/ICas';
import IConfirmationStore from './interfaces/IConfirmationStore';
import IOperationProcessor from './interfaces/IOperationProcessor';
import IOperationStore from './interfaces/IOperationStore';
import IRequestHandler from './interfaces/IRequestHandler';
import ITransactionProcessor from './interfaces/ITransactionProcessor';
import ITransactionSelector from './interfaces/ITransactionSelector';
import ITransactionStore from './interfaces/ITransactionStore';
import IVersionManager from './interfaces/IVersionManager';
import IVersionMetadataFetcher from './interfaces/IVersionMetadataFetcher';
import Resolver from './Resolver';
import VersionModel from './models/VersionModel';
/**
 * The class that handles code versioning.
 */
export default class VersionManager implements IVersionManager, IVersionMetadataFetcher {
    private config;
    private versionsReverseSorted;
    private batchWriters;
    private operationProcessors;
    private requestHandlers;
    private transactionProcessors;
    private transactionSelectors;
    private versionMetadatas;
    constructor(config: Config, versions: VersionModel[]);
    /**
     * Loads all the implementation versions.
     */
    initialize(blockchain: IBlockchain, cas: ICas, downloadManager: DownloadManager, operationStore: IOperationStore, resolver: Resolver, transactionStore: ITransactionStore, confirmationStore: IConfirmationStore): Promise<void>;
    /**
     * Gets the corresponding version of the `IBatchWriter` based on the given blockchain time.
     */
    getBatchWriter(blockchainTime: number): IBatchWriter;
    /**
     * Gets the corresponding version of the `IOperationProcessor` based on the given blockchain time.
     */
    getOperationProcessor(blockchainTime: number): IOperationProcessor;
    /**
     * Gets the corresponding version of the `IRequestHandler` based on the given blockchain time.
     */
    getRequestHandler(blockchainTime: number): IRequestHandler;
    /**
     * Gets the corresponding version of the `TransactionProcessor` based on the given blockchain time.
     */
    getTransactionProcessor(blockchainTime: number): ITransactionProcessor;
    /**
     * Gets the corresponding version of the `TransactionSelector` based on the given blockchain time.
     */
    getTransactionSelector(blockchainTime: number): ITransactionSelector;
    getVersionMetadata(blockchainTime: number): AbstractVersionMetadata;
    /**
     * Gets the corresponding implementation version string given the blockchain time.
     */
    private getVersionString;
    private loadDefaultExportsForVersion;
}
