"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Mock version manager for testing.
 */
class MockVersionManager {
    getBatchWriter(blockchainTime) {
        throw new Error('Not implemented. Use spyOn to override the functionality. Input: ' + blockchainTime);
    }
    getOperationProcessor(blockchainTime) {
        throw new Error('Not implemented. Use spyOn to override the functionality. Input: ' + blockchainTime);
    }
    getRequestHandler(blockchainTime) {
        throw new Error('Not implemented. Use spyOn to override the functionality. Input: ' + blockchainTime);
    }
    getTransactionProcessor(blockchainTime) {
        throw new Error('Not implemented. Use spyOn to override the functionality. Input: ' + blockchainTime);
    }
    getTransactionSelector(blockchainTime) {
        throw new Error('Not implemented. Use spyOn to override the functionality. Input: ' + blockchainTime);
    }
}
exports.default = MockVersionManager;
//# sourceMappingURL=MockVersionManager.js.map