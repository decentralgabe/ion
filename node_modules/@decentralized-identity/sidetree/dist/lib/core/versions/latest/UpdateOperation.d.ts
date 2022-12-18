/// <reference types="node" />
import DeltaModel from './models/DeltaModel';
import Jws from './util/Jws';
import OperationModel from './models/OperationModel';
import OperationType from '../../enums/OperationType';
import SignedDataModel from './models/UpdateSignedDataModel';
/**
 * A class that represents an update operation.
 */
export default class UpdateOperation implements OperationModel {
    readonly operationBuffer: Buffer;
    readonly didUniqueSuffix: string;
    readonly revealValue: string;
    readonly signedDataJws: Jws;
    readonly signedData: SignedDataModel;
    readonly delta: DeltaModel | undefined;
    /** The type of operation. */
    readonly type: OperationType;
    /**
     * NOTE: should only be used by `parse()` and `parseObject()` else the constructed instance could be invalid.
     */
    private constructor();
    /**
     * Parses the given buffer as a `UpdateOperation`.
     */
    static parse(operationBuffer: Buffer): Promise<UpdateOperation>;
    /**
     * Parses the given operation object as a `UpdateOperation`.
     * The `operationBuffer` given is assumed to be valid and is assigned to the `operationBuffer` directly.
     * NOTE: This method is purely intended to be used as an optimization method over the `parse` method in that
     * JSON parsing is not required to be performed more than once when an operation buffer of an unknown operation type is given.
     */
    static parseObject(operationObject: any, operationBuffer: Buffer): Promise<UpdateOperation>;
    /**
     * Parses the signed data payload of an update operation.
     */
    static parseSignedDataPayload(signedDataEncodedString: string): Promise<SignedDataModel>;
}
