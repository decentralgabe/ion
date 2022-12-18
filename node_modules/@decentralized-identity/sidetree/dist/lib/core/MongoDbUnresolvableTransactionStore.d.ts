import IUnresolvableTransactionStore from './interfaces/IUnresolvableTransactionStore';
import MongoDbStore from '../common/MongoDbStore';
import TransactionModel from '../common/models/TransactionModel';
import UnresolvableTransactionModel from './models/UnresolvableTransactionModel';
/**
 * Implementation of `IUnresolvableTransactionStore` that stores the transaction data in a MongoDB database.
 */
export default class MongoDbUnresolvableTransactionStore extends MongoDbStore implements IUnresolvableTransactionStore {
    /** Collection name for unresolvable transactions. */
    static readonly unresolvableTransactionCollectionName: string;
    private exponentialDelayFactorInMilliseconds;
    private maximumUnresolvableTransactionReturnCount;
    /**
     * Creates a new instance of this object.
     * @param serverUrl The target server url.
     * @param databaseName The database name where the collection should be saved.
     * @param retryExponentialDelayFactor
     *   The exponential delay factor in milliseconds for retries of unresolvable transactions.
     *   e.g. if it is set to 1 seconds, then the delays for retries will be 1 second, 2 seconds, 4 seconds... until the transaction can be resolved.
     */
    constructor(serverUrl: string, databaseName: string, retryExponentialDelayFactor?: number);
    recordUnresolvableTransactionFetchAttempt(transaction: TransactionModel): Promise<void>;
    removeUnresolvableTransaction(transaction: TransactionModel): Promise<void>;
    getUnresolvableTransactionsDueForRetry(maximumReturnCount?: number): Promise<TransactionModel[]>;
    removeUnresolvableTransactionsLaterThan(transactionNumber?: number): Promise<void>;
    /**
     * Gets the list of unresolvable transactions.
     * Mainly used for test purposes.
     */
    getUnresolvableTransactions(): Promise<UnresolvableTransactionModel[]>;
    /**
     * @inheritDoc
     */
    createIndex(): Promise<void>;
}
