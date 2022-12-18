/// <reference types="node" />
import AnchoredOperationModel from '../../../../lib/core/models/AnchoredOperationModel';
import DidState from '../../../../lib/core/models/DidState';
import IOperationProcessor from '../../../../lib/core/interfaces/IOperationProcessor';
/**
 * Operation processor.
 */
export default class OperationProcessor implements IOperationProcessor {
    apply(operation: AnchoredOperationModel, didState: DidState | undefined): Promise<DidState | undefined>;
    getMultihashRevealValue(anchoredOperationModel: AnchoredOperationModel): Promise<Buffer>;
}
