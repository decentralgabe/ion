/// <reference types="node" />
import Jws from './util/Jws';
import OperationModel from './models/OperationModel';
import OperationType from '../../enums/OperationType';
import SignedDataModel from './models/DeactivateSignedDataModel';
/**
 * A class that represents a deactivate operation.
 */
export default class DeactivateOperation implements OperationModel {
    readonly operationBuffer: Buffer;
    readonly didUniqueSuffix: string;
    readonly revealValue: string;
    readonly signedDataJws: Jws;
    readonly signedData: SignedDataModel;
    /** The type of operation. */
    readonly type: OperationType;
    /**
     * NOTE: should only be used by `parse()` and `parseObject()` else the constructed instance could be invalid.
     */
    private constructor();
    /**
     * Parses the given buffer as a `UpdateOperation`.
     */
    static parse(operationBuffer: Buffer): Promise<DeactivateOperation>;
    /**
     * Parses the given operation object as a `DeactivateOperation`.
     * The `operationBuffer` given is assumed to be valid and is assigned to the `operationBuffer` directly.
     * NOTE: This method is purely intended to be used as an optimization method over the `parse` method in that
     * JSON parsing is not required to be performed more than once when an operation buffer of an unknown operation type is given.
     */
    static parseObject(operationObject: any, operationBuffer: Buffer): Promise<DeactivateOperation>;
    /**
     * Parses the signed data payload of a deactivate operation.
     */
    static parseSignedDataPayload(signedDataEncodedString: string, expectedDidUniqueSuffix: string): Promise<SignedDataModel>;
}
