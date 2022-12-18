"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractVersionMetadata_1 = require("../../../../lib/core/abstracts/AbstractVersionMetadata");
const protocolParameters = require('./protocol-parameters.json');
/**
 * Implementation of the abstract VersionMetadata.
 */
class VersionMetadata extends AbstractVersionMetadata_1.default {
    constructor() {
        super();
        this.normalizedFeeToPerOperationFeeMultiplier = protocolParameters.normalizedFeeToPerOperationFeeMultiplier;
        this.hashAlgorithmInMultihashCode = protocolParameters.hashAlgorithmInMultihashCode;
        this.valueTimeLockAmountMultiplier = protocolParameters.valueTimeLockAmountMultiplier;
    }
}
exports.default = VersionMetadata;
//# sourceMappingURL=VersionMetadata.js.map