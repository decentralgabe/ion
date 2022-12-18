import ITransactionSelector from '../../../../lib/core/interfaces/ITransactionSelector';
import TransactionModel from '../../../../lib/common/models/TransactionModel';
/**
 * test version of throughput limiter
 */
export default class TransactionSelector implements ITransactionSelector {
    selectQualifiedTransactions(_transactions: TransactionModel[]): Promise<TransactionModel[]>;
}
