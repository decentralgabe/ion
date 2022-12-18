import DownloadManager from '../../../../lib/core/DownloadManager';
import IBlockchain from '../../../../lib/core/interfaces/IBlockchain';
import IOperationStore from '../../../../lib/core/interfaces/IOperationStore';
import ITransactionProcessor from '../../../../lib/core/interfaces/ITransactionProcessor';
import IVersionMetadataFetcher from '../../../../lib/core/interfaces/IVersionMetadataFetcher';
import TransactionModel from '../../../../lib/common/models/TransactionModel';
/**
 * Transaction processor.
 */
export default class TransactionProcessor implements ITransactionProcessor {
    private downloadManager;
    private operationStore;
    private blockchain;
    private versionMetadataFetcher;
    constructor(downloadManager: DownloadManager, operationStore: IOperationStore, blockchain: IBlockchain, versionMetadataFetcher: IVersionMetadataFetcher);
    processTransaction(transaction: TransactionModel): Promise<boolean>;
}
