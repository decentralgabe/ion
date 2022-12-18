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
const Logger_1 = require("../common/Logger");
const TransactionNumber_1 = require("./TransactionNumber");
/**
 * Encapsulates the functionality to calculate the amount of spending that the
 * service is doing.
 */
class SpendingMonitor {
    constructor(bitcoinFeeSpendingCutoffPeriodInBlocks, bitcoinFeeSpendingCutoffInSatoshis, transactionStore) {
        this.bitcoinFeeSpendingCutoffPeriodInBlocks = bitcoinFeeSpendingCutoffPeriodInBlocks;
        this.bitcoinFeeSpendingCutoffInSatoshis = bitcoinFeeSpendingCutoffInSatoshis;
        this.transactionStore = transactionStore;
        if (bitcoinFeeSpendingCutoffPeriodInBlocks < 1) {
            throw new Error(`Bitcoin spending cutoff period: ${bitcoinFeeSpendingCutoffPeriodInBlocks} must be greater than 1`);
        }
        if (bitcoinFeeSpendingCutoffInSatoshis <= 0) {
            throw new Error('Bitcoin spending cutoff amount must be > 0');
        }
        this.anchorStringsWritten = new Set();
    }
    /**
     * Add the transaction data to track the spending.
     * @param anchorString The string to be written.
     */
    addTransactionDataBeingWritten(anchorString) {
        this.anchorStringsWritten.add(anchorString);
    }
    /**
     * Calculates whether the specified fee will keep this node within the spending limits.
     * @param currentFeeInSatoshis The fee to be added for the next transaction.
     * @param startingBlockHeight The block height to start the check for the cutoff period.
     */
    isCurrentFeeWithinSpendingLimit(currentFeeInSatoshis, lastProcessedBlockHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            // Special case for when the checking period is 1. Even though the algorithm later will
            // will work for this case, but we will avoid making a DB call.
            if (this.bitcoinFeeSpendingCutoffPeriodInBlocks === 1) {
                return (currentFeeInSatoshis <= this.bitcoinFeeSpendingCutoffInSatoshis);
            }
            // In order to calculate whether we are over the spending limit or not, our algorithm is:
            // <code>
            //   feesFromCutoffPeriod = transactionStore.get_fees_for_cutoff_period
            //   totalFees = currentFee + feesFromCutoffPeriod
            //   if (totalFees > spendingCutoff) { return true }
            // </code>
            //
            // Now remember that the currentFee input is for the next block (which is not written yet), so
            // the next block is included in the cutoff period. Also, the input lastProcessedBlockHeight is
            // also included in the cutoff period. So when we go back to the transaction store, we subtract
            // the these 2 blocks from the cutoff period. For example:
            //  - if the cutoff period is 2, then we want transactions from the last-processed-block and the next one.
            //  - if the cutoff period is 3, then we want transactions from the last-processed-block - 1, last-processed-block, and the next one
            const startingBlockHeight = lastProcessedBlockHeight - this.bitcoinFeeSpendingCutoffPeriodInBlocks - 2;
            // Now get the transactions from the store which are included in the above starting block and higher.
            const startingBlockFirstTxnNumber = TransactionNumber_1.default.construct(startingBlockHeight, 0);
            const allTxnsSinceStartingBlock = yield this.transactionStore.getTransactionsLaterThan(startingBlockFirstTxnNumber - 1, undefined);
            // eslint-disable-next-line max-len
            Logger_1.default.info(`SpendingMonitor: total number of transactions from the transaction store starting from block: ${startingBlockHeight} are: ${allTxnsSinceStartingBlock.length}`);
            // Since the transactions from the store include transactions written by ALL the nodes in the network,
            // filter them to get the transactions that were written only by this node.
            const txnsWrittenByThisInstance = this.findTransactionsWrittenByThisNode(allTxnsSinceStartingBlock);
            Logger_1.default.info(`Number of transactions written by this instance: ${txnsWrittenByThisInstance.length}`);
            const totalFeeForRelatedTxns = txnsWrittenByThisInstance.reduce((total, currTxnModel) => {
                return total + currTxnModel.transactionFeePaid;
            }, 0);
            const totalFeePlusCurrentFee = totalFeeForRelatedTxns + currentFeeInSatoshis;
            if (totalFeePlusCurrentFee > this.bitcoinFeeSpendingCutoffInSatoshis) {
                // eslint-disable-next-line max-len
                Logger_1.default.error(`Current fee (in satoshis): ${currentFeeInSatoshis} + total fees (${totalFeeForRelatedTxns}) since block number: ${startingBlockHeight} is greater than the spending cap: ${this.bitcoinFeeSpendingCutoffInSatoshis}`);
                return false;
            }
            return true;
        });
    }
    /**
     * Finds the transactions which were written by this node. Really added to help with unit testing.
     * @param transactionsFromStore
     */
    findTransactionsWrittenByThisNode(transactionsFromStore) {
        // The transactions written by this node will include the anchor strings that we have been saving
        // so use that data to filter and return.
        const arraysToReturn = transactionsFromStore.filter((txn) => {
            return this.anchorStringsWritten.has(txn.anchorString);
        });
        return arraysToReturn;
    }
}
exports.default = SpendingMonitor;
//# sourceMappingURL=SpendingMonitor.js.map