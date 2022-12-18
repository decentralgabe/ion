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
 * Batch writer.
 */
class BatchWriter {
    constructor(operationQueue, blockchain, cas, versionMetadataFetcher) {
        this.operationQueue = operationQueue;
        this.blockchain = blockchain;
        this.cas = cas;
        this.versionMetadataFetcher = versionMetadataFetcher;
        console.info(this.operationQueue, this.blockchain, this.cas, this.versionMetadataFetcher);
    }
    write() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('BatchWriter: Not implemented. Version: TestVersion1');
        });
    }
}
exports.default = BatchWriter;
//# sourceMappingURL=BatchWriter.js.map