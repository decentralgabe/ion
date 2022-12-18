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
 * Compare two operations returning -1, 0, 1 when the first operand
 * is less than, equal, and greater than the second, respectively.
 * Used to sort operations by blockchain 'time' order.
 */
function compareOperation(op1, op2) {
    if (op1.transactionNumber < op2.transactionNumber) {
        return -1;
    }
    else if (op1.transactionNumber > op2.transactionNumber) {
        return 1;
    }
    else if (op1.operationIndex < op2.operationIndex) {
        return -1;
    }
    else if (op1.operationIndex > op2.operationIndex) {
        return 1;
    }
    return 0;
}
/**
 * A simple in-memory implementation of operation store.
 */
class MockOperationStore {
    constructor() {
        // Map DID unique suffixes to operations over it stored as an array. The array might be sorted
        // or unsorted by blockchain time order.
        this.didToOperations = new Map();
        // Map DID unique suffixes to a boolean indicating if the operations array for the DID is sorted
        // or not.
        this.didUpdatedSinceLastSort = new Map();
    }
    /**
     * Inserts an operation into the in-memory store.
     */
    insert(operation) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ensureDidContainerExist(operation.didUniqueSuffix);
            // Append the operation to the operation array for the did ...
            this.didToOperations.get(operation.didUniqueSuffix).push(operation);
            // ... which leaves the array unsorted, so we record this fact
            this.didUpdatedSinceLastSort.set(operation.didUniqueSuffix, true);
        });
    }
    insertOrReplace(operations) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const operation of operations) {
                yield this.insert(operation);
            }
        });
    }
    /**
     * Implements OperationStore.get().
     * Get an iterator that returns all operations with a given
     * didUniqueSuffix ordered by (transactionNumber, operationIndex).
     */
    get(didUniqueSuffix) {
        return __awaiter(this, void 0, void 0, function* () {
            let didOps = this.didToOperations.get(didUniqueSuffix);
            if (!didOps) {
                return [];
            }
            const updatedSinceLastSort = this.didUpdatedSinceLastSort.get(didUniqueSuffix);
            // Sort needed if there was a put operation since last sort.
            if (updatedSinceLastSort) {
                didOps.sort(compareOperation); // in-place sort
                didOps = didOps.filter((elem, index, self) => {
                    return (index === 0) || compareOperation(elem, self[index - 1]) !== 0;
                });
                this.didUpdatedSinceLastSort.set(didUniqueSuffix, false);
            }
            return didOps;
        });
    }
    /**
     * Delete all operations transactionNumber greater than the given transactionNumber.
     */
    delete(transactionNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!transactionNumber) {
                this.didToOperations.clear();
                this.didUpdatedSinceLastSort.clear();
                return;
            }
            // Iterate over all DID and remove operations from corresponding
            // operations array. Remove leaves the original order intact so
            // we do not need to update didUpdatedSinceLastSort
            for (const [, didOps] of this.didToOperations) {
                MockOperationStore.removeOperations(didOps, transactionNumber);
            }
        });
    }
    deleteUpdatesEarlierThan(_didUniqueSuffix, _transactionNumber, _operationIndex) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Remove operations. A simple linear scan + filter that leaves the
     * original order intact for non-filters operations.
     */
    static removeOperations(operations, transactionNumber) {
        let writeIndex = 0;
        for (let i = 0; i < operations.length; i++) {
            if (operations[i].transactionNumber <= transactionNumber) {
                operations[writeIndex++] = operations[i];
            }
        }
        while (operations.length > writeIndex) {
            operations.pop();
        }
    }
    ensureDidContainerExist(did) {
        if (this.didToOperations.get(did) === undefined) {
            this.didToOperations.set(did, []);
            this.didUpdatedSinceLastSort.set(did, false);
        }
    }
}
exports.default = MockOperationStore;
//# sourceMappingURL=MockOperationStore.js.map