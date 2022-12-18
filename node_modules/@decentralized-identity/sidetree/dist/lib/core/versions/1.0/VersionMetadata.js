"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractVersionMetadata_1 = require("../../abstracts/AbstractVersionMetadata");
const ProtocolParameters_1 = require("./ProtocolParameters");
/**
 * Implementation of the abstract VersionMetadata.
 */
class VersionMetadata extends AbstractVersionMetadata_1.default {
    constructor() {
        super();
        this.normalizedFeeToPerOperationFeeMultiplier = ProtocolParameters_1.default.normalizedFeeToPerOperationFeeMultiplier;
        this.valueTimeLockAmountMultiplier = ProtocolParameters_1.default.valueTimeLockAmountMultiplier;
    }
}
exports.default = VersionMetadata;
//# sourceMappingURL=VersionMetadata.js.map