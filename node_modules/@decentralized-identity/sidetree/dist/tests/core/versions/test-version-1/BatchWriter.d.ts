import IBatchWriter from '../../../../lib/core/interfaces/IBatchWriter';
import IBlockchain from '../../../../lib/core/interfaces/IBlockchain';
import ICas from '../../../../lib/core/interfaces/ICas';
import IOperationQueue from '../../../../lib/core/versions/latest/interfaces/IOperationQueue';
import IVersionMetadataFetcher from '../../../../lib/core/interfaces/IVersionMetadataFetcher';
/**
 * Batch writer.
 */
export default class BatchWriter implements IBatchWriter {
    private operationQueue;
    private blockchain;
    private cas;
    private versionMetadataFetcher;
    constructor(operationQueue: IOperationQueue, blockchain: IBlockchain, cas: ICas, versionMetadataFetcher: IVersionMetadataFetcher);
    write(): Promise<number>;
}
