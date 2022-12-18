import AbstractVersionMetadata from '../../../../lib/core/abstracts/AbstractVersionMetadata';
/**
 * Implementation of the abstract VersionMetadata.
 */
export default class VersionMetadata extends AbstractVersionMetadata {
    hashAlgorithmInMultihashCode: number;
    normalizedFeeToPerOperationFeeMultiplier: number;
    valueTimeLockAmountMultiplier: number;
    constructor();
}
