import BlockMetadata from '../../models/BlockMetadata';
import BlockMetadataWithoutNormalizedFee from '../../models/BlockMetadataWithoutNormalizedFee';
import IBlockMetadataStore from '../../interfaces/IBlockMetadataStore';
import IFeeCalculator from '../../interfaces/IFeeCalculator';
/**
 * `IFeeCalculator` implementation.
 */
export default class NormalizedFeeCalculator implements IFeeCalculator {
    private blockMetadataStore;
    private genesisBlockNumber;
    private initialNormalizedFeeInSatoshis;
    private feeLookBackWindowInBlocks;
    private feeMaxFluctuationMultiplierPerBlock;
    /**
     * A cache to remember blocks in the look-back window for a particular block height
     * which reduces calls to the block metadata store under the most common usage pattern.
     */
    private cachedLookBackWindow;
    /**
     * The block height that the cached look back window is for.
     */
    private blockHeightOfCachedLookBackWindow;
    constructor(blockMetadataStore: IBlockMetadataStore, genesisBlockNumber: number, initialNormalizedFeeInSatoshis: number, feeLookBackWindowInBlocks: number, feeMaxFluctuationMultiplierPerBlock: number);
    /**
     * Initializes the normalized fee calculator.
     */
    initialize(): Promise<void>;
    addNormalizedFeeToBlockMetadata(blockMetadata: BlockMetadataWithoutNormalizedFee): Promise<BlockMetadata>;
    getNormalizedFee(block: number): Promise<number>;
    calculateNormalizedTransactionFeeFromBlock(block: BlockMetadata): number;
    private getBlocksInLookBackWindow;
    private calculateNormalizedFee;
    private adjustFeeToWithinFluctuationRate;
    /**
     * Block height has to be the same as blockHeightOfCachedLookBackWindow
     * because the cache remembers the blocks required to calculate fee for the anticipated block
     * This can fail if fees are asked out of order
     *
     * cachedLookBackWindow.length has to be the same as this.feeLookBackWindowInBlocks
     * because the cache needs the exact same number of blocks as the look back window
     * This can fail if the node dies during slow init before finishing processing through the look back window
     * The cache will have partial data therefore not valid
     *
     * @param blockHeight The current bock height which the normalized fee is asked for
     */
    private isCacheValid;
}
