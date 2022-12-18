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
const ErrorCode_1 = require("../../ErrorCode");
const LogColor_1 = require("../../../common/LogColor");
const Logger_1 = require("../../../common/Logger");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * `IFeeCalculator` implementation.
 */
class NormalizedFeeCalculator {
    constructor(blockMetadataStore, genesisBlockNumber, initialNormalizedFeeInSatoshis, feeLookBackWindowInBlocks, feeMaxFluctuationMultiplierPerBlock) {
        this.blockMetadataStore = blockMetadataStore;
        this.genesisBlockNumber = genesisBlockNumber;
        this.initialNormalizedFeeInSatoshis = initialNormalizedFeeInSatoshis;
        this.feeLookBackWindowInBlocks = feeLookBackWindowInBlocks;
        this.feeMaxFluctuationMultiplierPerBlock = feeMaxFluctuationMultiplierPerBlock;
        /**
         * The block height that the cached look back window is for.
         */
        this.blockHeightOfCachedLookBackWindow = undefined;
        this.cachedLookBackWindow = [];
    }
    /**
     * Initializes the normalized fee calculator.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Initializing normalized fee calculator.`);
        });
    }
    addNormalizedFeeToBlockMetadata(blockMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            // If the height of the given block does not have large enough look-back window, just use initial fee.
            if (blockMetadata.height < this.genesisBlockNumber + this.feeLookBackWindowInBlocks) {
                const blockWithFee = Object.assign({ normalizedFee: this.initialNormalizedFeeInSatoshis }, blockMetadata);
                // We need to push the block metadata into the look-back cache in preparation for when look-back window becomes large enough with the given block height.
                this.cachedLookBackWindow.push(blockWithFee);
                this.blockHeightOfCachedLookBackWindow = blockMetadata.height + 1;
                return blockWithFee;
            }
            // Code reaches here whn the look-back window is large enough.
            // The cache won't work if the block is not the anticipated height or if required blocks aren't in cache, refetch the blocks and store in cache.
            if (!this.isCacheValid(blockMetadata.height)) {
                this.cachedLookBackWindow = yield this.getBlocksInLookBackWindow(blockMetadata.height);
                this.blockHeightOfCachedLookBackWindow = blockMetadata.height;
            }
            const normalizedFee = this.calculateNormalizedFee(this.cachedLookBackWindow);
            const newBlockWithFee = Object.assign({ normalizedFee }, blockMetadata);
            this.cachedLookBackWindow.push(newBlockWithFee);
            this.cachedLookBackWindow.shift();
            this.blockHeightOfCachedLookBackWindow++;
            Logger_1.default.info(LogColor_1.default.lightBlue(`Calculated raw normalized fee for block ${LogColor_1.default.green(blockMetadata.height)}: ${LogColor_1.default.green(normalizedFee)}`));
            return newBlockWithFee;
        });
    }
    getNormalizedFee(block) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: #943 This is left here because it may be versioned. Move it out if we confirm it will not be versioned.
            // https://github.com/decentralized-identity/sidetree/issues/943
            const blockMetadata = yield this.blockMetadataStore.get(block, block + 1);
            if (blockMetadata.length === 0) {
                throw new SidetreeError_1.default(ErrorCode_1.default.NormalizedFeeCalculatorBlockNotFound);
            }
            return this.calculateNormalizedTransactionFeeFromBlock(blockMetadata[0]);
        });
    }
    calculateNormalizedTransactionFeeFromBlock(block) {
        return Math.floor(block.normalizedFee);
    }
    getBlocksInLookBackWindow(block) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockMetadataArray = yield this.blockMetadataStore.get(block - this.feeLookBackWindowInBlocks, block);
            return blockMetadataArray;
        });
    }
    calculateNormalizedFee(blocksToAverage) {
        let totalFee = 0;
        let totalTransactionCount = 0;
        for (const blockToAverage of blocksToAverage) {
            totalFee += blockToAverage.totalFee;
            totalTransactionCount += blockToAverage.transactionCount;
        }
        // TODO: #926 investigate potential rounding differences between languages and implementations
        // https://github.com/decentralized-identity/sidetree/issues/926
        const unadjustedFee = totalFee / totalTransactionCount;
        const previousFee = blocksToAverage[blocksToAverage.length - 1].normalizedFee;
        return this.adjustFeeToWithinFluctuationRate(unadjustedFee, previousFee);
    }
    adjustFeeToWithinFluctuationRate(unadjustedFee, previousFee) {
        const maxAllowedFee = previousFee * (1 + this.feeMaxFluctuationMultiplierPerBlock);
        const minAllowedFee = previousFee * (1 - this.feeMaxFluctuationMultiplierPerBlock);
        if (unadjustedFee > maxAllowedFee) {
            return maxAllowedFee;
        }
        if (unadjustedFee < minAllowedFee) {
            return minAllowedFee;
        }
        return unadjustedFee;
    }
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
    isCacheValid(blockHeight) {
        return this.blockHeightOfCachedLookBackWindow === blockHeight &&
            this.feeLookBackWindowInBlocks === this.cachedLookBackWindow.length;
    }
}
exports.default = NormalizedFeeCalculator;
//# sourceMappingURL=NormalizedFeeCalculator.js.map