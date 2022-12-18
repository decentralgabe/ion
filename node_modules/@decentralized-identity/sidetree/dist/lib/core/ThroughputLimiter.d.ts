import IVersionManager from './interfaces/IVersionManager';
import TransactionModel from '../common/models/TransactionModel';
/**
 * Keeps track of current block and throughput limits based on the state
 */
export default class ThroughputLimiter {
    private versionManager;
    constructor(versionManager: IVersionManager);
    /**
     * given a an array of transactions, return an array of qualified transactions per transaction time.
     * @param transactions array of transactions to filter for
     */
    getQualifiedTransactions(transactions: TransactionModel[]): Promise<TransactionModel[]>;
}
