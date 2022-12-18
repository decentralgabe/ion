/// <reference types="node" />
import AnchoredOperationModel from '../../models/AnchoredOperationModel';
import DidState from '../../models/DidState';
import IOperationProcessor from '../../interfaces/IOperationProcessor';
/**
 * Implementation of IOperationProcessor.
 */
export default class OperationProcessor implements IOperationProcessor {
    apply(anchoredOperationModel: AnchoredOperationModel, didState: DidState | undefined): Promise<DidState | undefined>;
    getMultihashRevealValue(anchoredOperationModel: AnchoredOperationModel): Promise<Buffer>;
    /**
     * @returns new DID state if operation is applied successfully; the given DID state otherwise.
     */
    private applyCreateOperation;
    /**
     * @returns new DID state if operation is applied successfully; the given DID state otherwise.
     */
    private applyUpdateOperation;
    /**
     * @returns new DID state if operation is applied successfully; the given DID state otherwise.
     */
    private applyRecoverOperation;
    /**
     * @returns new DID state if operation is applied successfully; the given DID state otherwise.
     */
    private applyDeactivateOperation;
}
