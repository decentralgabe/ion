/// <reference types="node" />
import ProvisionalIndexFileModel from './models/ProvisionalIndexFileModel';
import UpdateOperation from './UpdateOperation';
/**
 * Class containing Map File related operations.
 */
export default class ProvisionalIndexFile {
    readonly model: ProvisionalIndexFileModel;
    readonly didUniqueSuffixes: string[];
    /**
     * Class that represents a provisional index file.
     * NOTE: this class is introduced as an internal structure in replacement to `ProvisionalIndexFileModel`
     * to keep useful metadata so that repeated computation can be avoided.
     */
    private constructor();
    /**
     * Parses and validates the given provisional index file buffer.
     * @throws `SidetreeError` if failed parsing or validation.
     */
    static parse(provisionalIndexFileBuffer: Buffer): Promise<ProvisionalIndexFile>;
    /**
     * Validates the given `operations` property, throws error if the property fails validation.
     *
     * @returns The of array of unique DID suffixes if validation succeeds.
     */
    private static validateOperationsProperty;
    /**
     * Validates the given `chunks` property, throws error if the property fails validation.
     */
    private static validateChunksProperty;
    /**
     * Creates the Map File buffer.
     */
    static createBuffer(chunkFileUri: string, provisionalProofFileUri: string | undefined, updateOperationArray: UpdateOperation[]): Promise<Buffer>;
}
