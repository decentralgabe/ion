import IBatchWriter from '../../lib/core/interfaces/IBatchWriter';
import IOperationProcessor from '../../lib/core/interfaces/IOperationProcessor';
import IRequestHandler from '../../lib/core/interfaces/IRequestHandler';
import ITransactionProcessor from '../../lib/core/interfaces/ITransactionProcessor';
import ITransactionSelector from '../../lib/core/interfaces/ITransactionSelector';
import IVersionManager from '../../lib/core/interfaces/IVersionManager';
/**
 * Mock version manager for testing.
 */
export default class MockVersionManager implements IVersionManager {
    getBatchWriter(blockchainTime: number): IBatchWriter;
    getOperationProcessor(blockchainTime: number): IOperationProcessor;
    getRequestHandler(blockchainTime: number): IRequestHandler;
    getTransactionProcessor(blockchainTime: number): ITransactionProcessor;
    getTransactionSelector(blockchainTime: number): ITransactionSelector;
}
