/// <reference types="node" />
import OperationModel from './models/OperationModel';
/**
 * A class that contains Sidetree operation utility methods.
 */
export default class Operation {
    /** Maximum allowed encoded reveal value string length. */
    static readonly maxEncodedRevealValueLength = 50;
    /**
     * Parses the given buffer into an `OperationModel`.
     */
    static parse(operationBuffer: Buffer): Promise<OperationModel>;
    /**
     * validate delta and throw if invalid
     * @param delta the delta to validate
     */
    static validateDelta(delta: any): void;
}
