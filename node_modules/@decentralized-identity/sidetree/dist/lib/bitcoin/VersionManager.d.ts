import BitcoinVersionModel from './models/BitcoinVersionModel';
import IBitcoinConfig from './IBitcoinConfig';
import IBlockMetadataStore from './interfaces/IBlockMetadataStore';
import IFeeCalculator from './interfaces/IFeeCalculator';
/**
 * The class that handles code versioning.
 */
export default class VersionManager {
    private versionsReverseSorted;
    private feeCalculators;
    private protocolParameters;
    constructor();
    /**
     * Loads all the implementation versions.
     */
    initialize(versions: BitcoinVersionModel[], config: IBitcoinConfig, blockMetadataStore: IBlockMetadataStore): Promise<void>;
    /**
     * Gets the corresponding version of the `IFeeCalculator` based on the given block height.
     */
    getFeeCalculator(blockHeight: number): IFeeCalculator;
    /**
     * Gets the corresponding version of the lock duration based on the given block height.
     */
    getLockDurationInBlocks(blockHeight: number): number;
    /**
     * Gets the corresponding implementation version string given the blockchain time.
     */
    private getVersionString;
    private loadDefaultExportsForVersion;
}
