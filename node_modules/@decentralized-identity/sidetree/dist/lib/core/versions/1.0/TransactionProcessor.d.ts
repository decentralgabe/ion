import DownloadManager from '../../DownloadManager';
import IBlockchain from '../../interfaces/IBlockchain';
import IOperationStore from '../../interfaces/IOperationStore';
import ITransactionProcessor from '../../interfaces/ITransactionProcessor';
import IVersionMetadataFetcher from '../../interfaces/IVersionMetadataFetcher';
import TransactionModel from '../../../common/models/TransactionModel';
/**
 * Implementation of the `ITransactionProcessor`.
 */
export default class TransactionProcessor implements ITransactionProcessor {
    private downloadManager;
    private operationStore;
    private blockchain;
    private versionMetadataFetcher;
    constructor(downloadManager: DownloadManager, operationStore: IOperationStore, blockchain: IBlockchain, versionMetadataFetcher: IVersionMetadataFetcher);
    processTransaction(transaction: TransactionModel): Promise<boolean>;
    private downloadAndVerifyCoreIndexFile;
    private downloadAndVerifyCoreProofFile;
    private downloadAndVerifyProvisionalProofFile;
    private downloadAndVerifyProvisionalIndexFile;
    private downloadAndVerifyChunkFile;
    private composeAnchoredOperationModels;
    private static composeAnchoredCreateOperationModels;
    private static composeAnchoredRecoverOperationModels;
    private static composeAnchoredDeactivateOperationModels;
    private static composeAnchoredUpdateOperationModels;
    private downloadFileFromCas;
}
