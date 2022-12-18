/// <reference types="node" />
import Jws from './util/Jws';
import ProvisionalProofFileModel from './models/ProvisionalProofFileModel';
import UpdateOperation from './UpdateOperation';
import UpdateSignedDataModel from './models/UpdateSignedDataModel';
/**
 * Defines operations related to a Provisional Proof File.
 */
export default class ProvisionalProofFile {
    readonly provisionalProofFileModel: ProvisionalProofFileModel;
    readonly updateProofs: {
        signedDataJws: Jws;
        signedDataModel: UpdateSignedDataModel;
    }[];
    /**
     * Class that represents a provisional proof file.
     * NOTE: this class is introduced as an internal structure that keeps useful states in replacement to `ProvisionalProofFileModel`
     * so that repeated computation can be avoided.
     */
    private constructor();
    /**
     * Creates the buffer of a Provisional Proof File.
     *
     * @returns `Buffer` if at least one operation is given, `undefined` otherwise.
     */
    static createBuffer(updateOperations: UpdateOperation[]): Promise<Buffer | undefined>;
    /**
     * Parses and validates the given provisional proof file buffer.
     * @param provisionalProofFileBuffer Compressed provisional proof file.
     * @throws `SidetreeError` if failed parsing or validation.
     */
    static parse(provisionalProofFileBuffer: Buffer): Promise<ProvisionalProofFile>;
}
