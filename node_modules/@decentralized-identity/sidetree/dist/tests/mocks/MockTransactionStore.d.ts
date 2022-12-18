import ITransactionStore from '../../lib/core/interfaces/ITransactionStore';
import IUnresolvableTransactionStore from '../../lib/core/interfaces/IUnresolvableTransactionStore';
import TransactionModel from '../../lib/common/models/TransactionModel';
/**
 * In-memory implementation of the `TransactionStore`.
 */
export default class MockTransactionStore implements ITransactionStore, IUnresolvableTransactionStore {
    private processedTransactions;
    private unresolvableTransactions;
    addTransaction(transaction: TransactionModel): Promise<void>;
    getLastTransaction(): Promise<TransactionModel | undefined>;
    getExponentiallySpacedTransactions(): Promise<TransactionModel[]>;
    getTransaction(_transactionNumber: number): Promise<TransactionModel | undefined>;
    getTransactionsLaterThan(transactionNumber: number | undefined, max: number | undefined): Promise<TransactionModel[]>;
    recordUnresolvableTransactionFetchAttempt(transaction: TransactionModel): Promise<void>;
    removeUnresolvableTransaction(transaction: TransactionModel): Promise<void>;
    getUnresolvableTransactionsDueForRetry(): Promise<TransactionModel[]>;
    removeTransactionsLaterThan(transactionNumber?: number): Promise<void>;
    removeUnresolvableTransactionsLaterThan(transactionNumber?: number): Promise<void>;
    /**
     * Gets the list of transactions.
     * Mainly used for test purposes.
     */
    getTransactions(): TransactionModel[];
    getTransactionsStartingFrom(inclusiveBeginTransactionTime: number, exclusiveEndTransactionTime: number): Promise<TransactionModel[]>;
}
