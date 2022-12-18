/// <reference types="node" />
import DeltaModel from './models/DeltaModel';
import OperationModel from './models/OperationModel';
import OperationType from '../../enums/OperationType';
import SuffixDataModel from './models/SuffixDataModel';
/**
 * A class that represents a create operation.
 */
export default class CreateOperation implements OperationModel {
    readonly operationBuffer: Buffer;
    readonly didUniqueSuffix: string;
    readonly suffixData: SuffixDataModel;
    readonly delta: DeltaModel | undefined;
    /** The type of operation. */
    readonly type: OperationType;
    /**
     * NOTE: should only be used by `parse()` and `parseObject()` else the constructed instance could be invalid.
     */
    private constructor();
    /**
     * Parses the given buffer as a `CreateOperation`.
     */
    static parse(operationBuffer: Buffer): Promise<CreateOperation>;
    /**
     * Parses the given operation object as a `CreateOperation`.
     * The `operationBuffer` given is assumed to be valid and is assigned to the `operationBuffer` directly.
     * NOTE: This method is purely intended to be used as an optimization method over the `parse` method in that
     * JSON parsing is not required to be performed more than once when an operation buffer of an unknown operation type is given.
     * @param operationObject The operationObject is a json object with no encoding
     * @param operationBuffer The buffer format of the operationObject
     */
    static parseObject(operationObject: any, operationBuffer: Buffer): CreateOperation;
}
