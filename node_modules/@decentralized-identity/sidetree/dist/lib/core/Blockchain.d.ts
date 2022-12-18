import BlockchainTimeModel from './models/BlockchainTimeModel';
import IBlockchain from './interfaces/IBlockchain';
import ServiceVersionModel from '../common/models/ServiceVersionModel';
import TransactionModel from '../common/models/TransactionModel';
import ValueTimeLockModel from '../common/models/ValueTimeLockModel';
/**
 * Class that communicates with the underlying blockchain using REST API defined by the protocol document.
 */
export default class Blockchain implements IBlockchain {
    uri: string;
    private serviceVersionFetcher;
    private fetch;
    /** URI that handles transaction operations. */
    private transactionsUri;
    private timeUri;
    private feeUri;
    private locksUri;
    private writerLockUri;
    constructor(uri: string);
    write(anchorString: string, minimumFee: number): Promise<void>;
    read(sinceTransactionNumber?: number, transactionTimeHash?: string): Promise<{
        moreTransactions: boolean;
        transactions: TransactionModel[];
    }>;
    getFirstValidTransaction(transactions: TransactionModel[]): Promise<TransactionModel | undefined>;
    /**
     * Gets the version of the bitcoin service.
     */
    getServiceVersion(): Promise<ServiceVersionModel>;
    /**
     * Gets the latest blockchain time and updates the cached time.
     */
    getLatestTime(): Promise<BlockchainTimeModel>;
    getFee(transactionTime: number): Promise<number>;
    getValueTimeLock(lockIdentifier: string): Promise<ValueTimeLockModel | undefined>;
    getWriterValueTimeLock(): Promise<ValueTimeLockModel | undefined>;
}
