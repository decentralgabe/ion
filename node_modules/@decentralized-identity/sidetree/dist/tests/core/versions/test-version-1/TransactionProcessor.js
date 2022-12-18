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
 * Transaction processor.
 */
class TransactionProcessor {
    constructor(downloadManager, operationStore, blockchain, versionMetadataFetcher) {
        this.downloadManager = downloadManager;
        this.operationStore = operationStore;
        this.blockchain = blockchain;
        this.versionMetadataFetcher = versionMetadataFetcher;
        console.info(this.downloadManager, this.operationStore, this.blockchain, this.versionMetadataFetcher);
    }
    processTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`TransactionProcessor: Not implemented. Version: TestVersion1. Inputs: ${transaction}`);
        });
    }
}
exports.default = TransactionProcessor;
//# sourceMappingURL=TransactionProcessor.js.map