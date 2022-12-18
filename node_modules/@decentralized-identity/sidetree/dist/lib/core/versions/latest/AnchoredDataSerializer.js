"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorCode_1 = require("./ErrorCode");
const ProtocolParameters_1 = require("./ProtocolParameters");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Encapsulates functionality to serialize/deserialize data that read/write to
 * the blockchain.
 */
class AnchoredDataSerializer {
    /**
     * Converts the given inputs to the string that is to be written to the blockchain.
     *
     * @param dataToBeAnchored The data to serialize.
     */
    static serialize(dataToBeAnchored) {
        // Concatenate the inputs w/ the delimiter and return
        return `${dataToBeAnchored.numberOfOperations}${AnchoredDataSerializer.delimiter}${dataToBeAnchored.coreIndexFileUri}`;
    }
    /**
     * Deserializes the given string that is read from the blockchain into data.
     *
     * @param serializedData The data to be deserialized.
     */
    static deserialize(serializedData) {
        const splitData = serializedData.split(AnchoredDataSerializer.delimiter);
        if (splitData.length !== 2) {
            throw new SidetreeError_1.default(ErrorCode_1.default.AnchoredDataIncorrectFormat, `Input is not in correct format: ${serializedData}`);
        }
        const numberOfOperations = AnchoredDataSerializer.parsePositiveInteger(splitData[0]);
        if (numberOfOperations > ProtocolParameters_1.default.maxOperationsPerBatch) {
            throw new SidetreeError_1.default(ErrorCode_1.default.AnchoredDataNumberOfOperationsGreaterThanMax, `Number of operations ${numberOfOperations} must be less than or equal to ${ProtocolParameters_1.default.maxOperationsPerBatch}`);
        }
        return {
            coreIndexFileUri: splitData[1],
            numberOfOperations: numberOfOperations
        };
    }
    static parsePositiveInteger(input) {
        // NOTE:
        // /<expression>/ denotes regex.
        // ^ denotes beginning of string.
        // $ denotes end of string.
        // [1-9] denotes leading '0' not allowed.
        // \d* denotes followed by 0 or more decimal digits.
        const isPositiveInteger = /^[1-9]\d*$/.test(input);
        if (!isPositiveInteger) {
            throw new SidetreeError_1.default(ErrorCode_1.default.AnchoredDataNumberOfOperationsNotPositiveInteger, `Number of operations '${input}' is not a positive integer without leading zeros.`);
        }
        return Number(input);
    }
}
exports.default = AnchoredDataSerializer;
/** Delimiter between logical parts in anchor string. */
AnchoredDataSerializer.delimiter = '.';
//# sourceMappingURL=AnchoredDataSerializer.js.map