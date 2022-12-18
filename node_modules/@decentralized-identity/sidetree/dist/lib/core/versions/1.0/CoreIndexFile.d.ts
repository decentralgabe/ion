/// <reference types="node" />
import CoreIndexFileModel from './models/CoreIndexFileModel';
import CreateOperation from './CreateOperation';
import DeactivateOperation from './DeactivateOperation';
import RecoverOperation from './RecoverOperation';
/**
 * Class containing Core Index File related operations.
 */
export default class CoreIndexFile {
    readonly model: CoreIndexFileModel;
    readonly didUniqueSuffixes: string[];
    readonly createDidSuffixes: string[];
    readonly recoverDidSuffixes: string[];
    readonly deactivateDidSuffixes: string[];
    /**
     * Class that represents an core index file.
     * NOTE: this class is introduced as an internal structure in replacement to `CoreIndexFileModel`
     * to keep useful metadata so that repeated computation can be avoided.
     */
    private constructor();
    /**
     * Parses and validates the given core index file buffer.
     * @throws `SidetreeError` if failed parsing or validation.
     */
    static parse(coreIndexFileBuffer: Buffer): Promise<CoreIndexFile>;
    /**
     * Creates an `CoreIndexFileModel`.
     */
    static createModel(writerLockId: string | undefined, provisionalIndexFileUri: string | undefined, coreProofFileUri: string | undefined, createOperationArray: CreateOperation[], recoverOperationArray: RecoverOperation[], deactivateOperationArray: DeactivateOperation[]): Promise<CoreIndexFileModel>;
    /**
     * Creates an core index file buffer.
     */
    static createBuffer(writerLockId: string | undefined, provisionalIndexFileUri: string | undefined, coreProofFileUri: string | undefined, createOperations: CreateOperation[], recoverOperations: RecoverOperation[], deactivateOperations: DeactivateOperation[]): Promise<Buffer>;
    private static validateWriterLockId;
    /**
     * Validates the given create operation references.
     */
    private static validateCreateReferences;
}
