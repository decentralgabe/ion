import IBatchWriter from '../../interfaces/IBatchWriter';
import IBlockchain from '../../interfaces/IBlockchain';
import ICas from '../../interfaces/ICas';
import IConfirmationStore from '../../interfaces/IConfirmationStore';
import IOperationQueue from './interfaces/IOperationQueue';
import IVersionMetadataFetcher from '../../interfaces/IVersionMetadataFetcher';
import ValueTimeLockModel from '../../../common/models/ValueTimeLockModel';
/**
 * Implementation of the `IBatchWriter`.
 */
export default class BatchWriter implements IBatchWriter {
    private operationQueue;
    private blockchain;
    private cas;
    private versionMetadataFetcher;
    private confirmationStore;
    constructor(operationQueue: IOperationQueue, blockchain: IBlockchain, cas: ICas, versionMetadataFetcher: IVersionMetadataFetcher, confirmationStore: IConfirmationStore);
    write(): Promise<number>;
    /**
     * Create and write chunk file if needed.
     * @returns CAS URI of the chunk file. `undefined` if there is no need to create and write the file.
     */
    private createAndWriteChunkFileIfNeeded;
    /**
     * Create and write provisional index file if needed.
     * @returns  URI of the provisional index file. `undefined` if there is no need to create and write the file.
     */
    private createAndWriteProvisionalIndexFileIfNeeded;
    private static hasEnoughConfirmations;
    /**
     * Gets the maximum number of operations allowed to be written with the given value time lock.
     */
    static getNumberOfOperationsAllowed(versionMetadataFetcher: IVersionMetadataFetcher, valueTimeLock: ValueTimeLockModel | undefined): number;
}
