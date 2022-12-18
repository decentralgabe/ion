import ITransactionStore from '../core/interfaces/ITransactionStore';
import MongoDbStore from './MongoDbStore';
import TransactionModel from './models/TransactionModel';
/**
 * Implementation of ITransactionStore that stores the transaction data in a MongoDB database.
 */
export default class MongoDbTransactionStore extends MongoDbStore implements ITransactionStore {
    /** Collection name for transactions. */
    static readonly transactionCollectionName: string;
    /**
     * Creates a new instance of this object.
     * @param serverUrl The target server url.
     * @param databaseName The database name where the collection should be saved.
     */
    constructor(serverUrl: string, databaseName: string);
    /**
     * Returns the number of transactions in the store.
     * Mainly used by tests.
     */
    getTransactionsCount(): Promise<number>;
    getTransaction(transactionNumber: number): Promise<TransactionModel | undefined>;
    getTransactionsLaterThan(transactionNumber: number | undefined, max: number | undefined): Promise<TransactionModel[]>;
    addTransaction(transaction: TransactionModel): Promise<void>;
    getLastTransaction(): Promise<TransactionModel | undefined>;
    getExponentiallySpacedTransactions(): Promise<TransactionModel[]>;
    removeTransactionsLaterThan(transactionNumber?: number): Promise<void>;
    /**
     * Remove transactions by transaction time hash
     * @param transactionTimeHash the transaction time hash which the transactions should be removed for
     */
    removeTransactionByTransactionTimeHash(transactionTimeHash: string): Promise<void>;
    /**
     * Gets the list of processed transactions.
     * Mainly used for test purposes.
     */
    getTransactions(): Promise<TransactionModel[]>;
    /**
     * Gets a list of transactions between the bounds of transaction time. The smaller value will be inclusive while the bigger be exclusive
     * @param inclusiveBeginTransactionTime The first transaction time to begin querying for
     * @param exclusiveEndTransactionTime The transaction time to stop querying for
     */
    getTransactionsStartingFrom(inclusiveBeginTransactionTime: number, exclusiveEndTransactionTime: number): Promise<TransactionModel[]>;
    /**
     * @inheritDoc
     */
    createIndex(): Promise<void>;
}
