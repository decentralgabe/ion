/// <reference types="node" />
import ChunkFileModel from './models/ChunkFileModel';
import CreateOperation from './CreateOperation';
import RecoverOperation from './RecoverOperation';
import UpdateOperation from './UpdateOperation';
/**
 * Defines operations related to a Chunk File.
 */
export default class ChunkFile {
    /**
     * Parses and validates the given chunk file buffer and all the operations within it.
     * @throws SidetreeError if failed parsing or validation.
     */
    static parse(chunkFileBuffer: Buffer): Promise<ChunkFileModel>;
    private static validateDeltasProperty;
    /**
     * Creates chunk file buffer.
     * @returns Chunk file buffer. Returns `undefined` if arrays passed in contains no operations.
     */
    static createBuffer(createOperations: CreateOperation[], recoverOperations: RecoverOperation[], updateOperations: UpdateOperation[]): Promise<Buffer | undefined>;
}
