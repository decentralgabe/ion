"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Keeps track of current block and throughput limits based on the state
 */
class ThroughputLimiter {
    constructor(versionManager) {
        this.versionManager = versionManager;
    }
    /**
     * given a an array of transactions, return an array of qualified transactions per transaction time.
     * @param transactions array of transactions to filter for
     */
    getQualifiedTransactions(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentTransactionTime;
            const transactionsGroupedByTransactionTime = [];
            for (const transaction of transactions) {
                // If transaction is transitioning into a new time, create a new grouping.
                if (transaction.transactionTime !== currentTransactionTime) {
                    transactionsGroupedByTransactionTime.push([]);
                    currentTransactionTime = transaction.transactionTime;
                }
                transactionsGroupedByTransactionTime[transactionsGroupedByTransactionTime.length - 1].push(transaction);
            }
            const qualifiedTransactions = [];
            for (const transactionGroup of transactionsGroupedByTransactionTime) {
                const transactionSelector = this.versionManager.getTransactionSelector(transactionGroup[0].transactionTime);
                const qualifiedTransactionsInCurrentGroup = yield transactionSelector.selectQualifiedTransactions(transactionGroup);
                qualifiedTransactions.push(...qualifiedTransactionsInCurrentGroup);
            }
            return qualifiedTransactions;
        });
    }
}
exports.default = ThroughputLimiter;
//# sourceMappingURL=ThroughputLimiter.js.map