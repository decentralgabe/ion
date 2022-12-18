import Blockchain from './Blockchain';
import Config from './models/Config';
import TransactionModel from '../common/models/TransactionModel';
import VersionManager from './VersionManager';
/**
 * An class to monitor the Core.
 * NOTE: this class can be completely decoupled from Core, Core does not need this class at all to function.
 */
export default class Monitor {
    private blockchain;
    private operationQueue;
    private transactionStore;
    private readonly versionManager;
    constructor(config: Config, versionManager: VersionManager, blockchain: Blockchain);
    initialize(): Promise<void>;
    /**
     * Gets the size of the operation queue.
     */
    getOperationQueueSize(): Promise<{
        operationQueueSize: number;
    }>;
    /**
     * Gets the maximum batch size the writer is currently capable of writing.
     */
    getWriterMaxBatchSize(): Promise<{
        writerMaxBatchSize: number;
    }>;
    /**
     * Gets the last processed transaction.
     */
    getLastProcessedTransaction(): Promise<TransactionModel | undefined>;
}
