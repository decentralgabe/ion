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
const ErrorCode_1 = require("./ErrorCode");
const SidetreeError_1 = require("../common/SidetreeError");
/**
 * The class that handles code versioning.
 */
class VersionManager {
    constructor() {
        this.versionsReverseSorted = [];
        this.feeCalculators = new Map();
        this.protocolParameters = new Map();
    }
    /**
     * Loads all the implementation versions.
     */
    initialize(versions, config, blockMetadataStore) {
        return __awaiter(this, void 0, void 0, function* () {
            // Reverse sort versions.
            this.versionsReverseSorted = versions.sort((a, b) => b.startingBlockchainTime - a.startingBlockchainTime);
            // NOTE: In principal each version of the interface implementations can have different constructors,
            // but we currently keep the constructor signature the same as much as possible for simple instance construction,
            // but it is not inherently "bad" if we have to have conditional constructions for each if we have to.
            for (const versionModel of this.versionsReverseSorted) {
                const version = versionModel.version;
                this.protocolParameters.set(version, versionModel.protocolParameters);
                const initialNormalizedFeeInSatoshis = versionModel.protocolParameters.initialNormalizedFeeInSatoshis;
                const feeLookBackWindowInBlocks = versionModel.protocolParameters.feeLookBackWindowInBlocks;
                const feeMaxFluctuationMultiplierPerBlock = versionModel.protocolParameters.feeMaxFluctuationMultiplierPerBlock;
                const FeeCalculator = yield this.loadDefaultExportsForVersion(version, 'NormalizedFeeCalculator');
                const feeCalculator = new FeeCalculator(blockMetadataStore, config.genesisBlockNumber, initialNormalizedFeeInSatoshis, feeLookBackWindowInBlocks, feeMaxFluctuationMultiplierPerBlock);
                this.feeCalculators.set(version, feeCalculator);
            }
        });
    }
    /**
     * Gets the corresponding version of the `IFeeCalculator` based on the given block height.
     */
    getFeeCalculator(blockHeight) {
        const version = this.getVersionString(blockHeight);
        const feeCalculator = this.feeCalculators.get(version);
        return feeCalculator;
    }
    /**
     * Gets the corresponding version of the lock duration based on the given block height.
     */
    getLockDurationInBlocks(blockHeight) {
        const version = this.getVersionString(blockHeight);
        const protocolParameter = this.protocolParameters.get(version);
        return protocolParameter.valueTimeLockDurationInBlocks;
    }
    /**
     * Gets the corresponding implementation version string given the blockchain time.
     */
    getVersionString(blockHeight) {
        // Iterate through each version to find the right version.
        for (const versionModel of this.versionsReverseSorted) {
            if (blockHeight >= versionModel.startingBlockchainTime) {
                return versionModel.version;
            }
        }
        throw new SidetreeError_1.default(ErrorCode_1.default.VersionManagerVersionStringNotFound, `Unable to find version string for block ${blockHeight}.`);
    }
    loadDefaultExportsForVersion(version, className) {
        return __awaiter(this, void 0, void 0, function* () {
            const defaults = (yield Promise.resolve().then(() => require(`./versions/${version}/${className}`))).default;
            return defaults;
        });
    }
}
exports.default = VersionManager;
//# sourceMappingURL=VersionManager.js.map