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
const AnchoredDataSerializer_1 = require("./AnchoredDataSerializer");
const ErrorCode_1 = require("./ErrorCode");
const Logger_1 = require("../../../common/Logger");
const priorityqueue_1 = require("priorityqueue");
const ProtocolParameters_1 = require("./ProtocolParameters");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * rate limits how many operations is valid per block
 */
class TransactionSelector {
    constructor(transactionStore) {
        this.transactionStore = transactionStore;
        this.maxNumberOfOperationsPerBlock = ProtocolParameters_1.default.maxNumberOfOperationsPerTransactionTime;
        this.maxNumberOfTransactionsPerBlock = ProtocolParameters_1.default.maxNumberOfTransactionsPerTransactionTime;
    }
    static getTransactionPriorityQueue() {
        const comparator = (a, b) => {
            // higher fee comes first. If fees are the same, earlier transaction comes first
            return a.transactionFeePaid - b.transactionFeePaid || b.transactionNumber - a.transactionNumber;
        };
        return new priorityqueue_1.default({ comparator });
    }
    /**
     * Returns an array of transactions that should be processed. Ranked by highest fee paid per transaction and up to the
     * max number of operations per block
     * @param transactions The transactions that should be ranked and considered to process
     */
    selectQualifiedTransactions(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!transactions.length) {
                return [];
            }
            const transactionsPriorityQueue = TransactionSelector.getTransactionPriorityQueue();
            const currentTransactionTime = transactions[0].transactionTime;
            TransactionSelector.validateTransactions(transactions, currentTransactionTime);
            TransactionSelector.enqueueFirstTransactionFromEachWriter(transactions, currentTransactionTime, transactionsPriorityQueue);
            const [numberOfOperations, numberOfTransactions] = yield this.getNumberOfOperationsAndTransactionsAlreadyInTransactionTime(currentTransactionTime);
            const numberOfOperationsToQualify = this.maxNumberOfOperationsPerBlock - numberOfOperations;
            const numberOfTransactionsToQualify = this.maxNumberOfTransactionsPerBlock - numberOfTransactions;
            const transactionsToReturn = TransactionSelector.getHighestFeeTransactionsFromCurrentTransactionTime(numberOfOperationsToQualify, numberOfTransactionsToQualify, transactionsPriorityQueue);
            return transactionsToReturn;
        });
    }
    static validateTransactions(transactions, currentTransactionTime) {
        for (const transaction of transactions) {
            // expect all transactions to be in the same transaction time
            if (transaction.transactionTime !== currentTransactionTime) {
                throw new SidetreeError_1.default(ErrorCode_1.default.TransactionsNotInSameBlock, 'transaction must be in the same block to perform rate limiting, investigate and fix');
            }
        }
    }
    static enqueueFirstTransactionFromEachWriter(transactions, currentTransactionTime, transactionsPriorityQueue) {
        const writerToTransactionNumberMap = new Map();
        // if multiple transactions have the same writer, take the first one in the array and enqueue into transactionPriorityQueue
        for (const transaction of transactions) {
            // only 1 transaction is allowed per writer
            if (writerToTransactionNumberMap.has(transaction.writer)) {
                const acceptedTransactionNumber = writerToTransactionNumberMap.get(transaction.writer);
                // eslint-disable-next-line max-len
                Logger_1.default.info(`Multiple transactions found in transaction time ${currentTransactionTime} from writer ${transaction.writer}, considering transaction ${acceptedTransactionNumber} and ignoring ${transaction.transactionNumber}`);
            }
            else {
                transactionsPriorityQueue.push(transaction);
                writerToTransactionNumberMap.set(transaction.writer, transaction.transactionNumber);
            }
        }
    }
    getNumberOfOperationsAndTransactionsAlreadyInTransactionTime(transactionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.transactionStore.getTransactionsStartingFrom(transactionTime, transactionTime);
            let numberOfOperations = 0;
            if (transactions) {
                for (const transaction of transactions) {
                    try {
                        const numOfOperationsInCurrentTransaction = AnchoredDataSerializer_1.default.deserialize(transaction.anchorString).numberOfOperations;
                        numberOfOperations += numOfOperationsInCurrentTransaction;
                    }
                    catch (e) {
                        Logger_1.default.info(`Error thrown in TransactionSelector: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
                        Logger_1.default.info(`Transaction with anchor string ${transaction.anchorString} not considered as selected.`);
                    }
                }
            }
            const numberOfTransactions = transactions ? transactions.length : 0;
            return [numberOfOperations, numberOfTransactions];
        });
    }
    /**
     * Given transactions within a block, return the ones that should be processed.
     */
    static getHighestFeeTransactionsFromCurrentTransactionTime(numberOfOperationsToQualify, numberOfTransactionsToQualify, transactionsPriorityQueue) {
        let numberOfOperationsSeen = 0;
        const transactionsToReturn = [];
        while (transactionsToReturn.length < numberOfTransactionsToQualify &&
            numberOfOperationsSeen < numberOfOperationsToQualify &&
            transactionsPriorityQueue.length > 0) {
            const currentTransaction = transactionsPriorityQueue.pop();
            try {
                const numOfOperationsInCurrentTransaction = AnchoredDataSerializer_1.default.deserialize(currentTransaction.anchorString).numberOfOperations;
                numberOfOperationsSeen += numOfOperationsInCurrentTransaction;
                if (numberOfOperationsSeen <= numberOfOperationsToQualify) {
                    transactionsToReturn.push(currentTransaction);
                }
            }
            catch (e) {
                Logger_1.default.info(`Error thrown in TransactionSelector: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
                Logger_1.default.info(`Transaction with anchor string ${currentTransaction.anchorString} not selected`);
            }
        }
        // sort based on transaction number ascending
        return transactionsToReturn;
    }
}
exports.default = TransactionSelector;
//# sourceMappingURL=TransactionSelector.js.map