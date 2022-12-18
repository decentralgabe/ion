/// <reference types="node" />
import CoreProofFileModel from './models/CoreProofFileModel';
import DeactivateOperation from './DeactivateOperation';
import DeactivateSignedDataModel from './models/DeactivateSignedDataModel';
import Jws from './util/Jws';
import RecoverOperation from './RecoverOperation';
import RecoverSignedDataModel from './models/RecoverSignedDataModel';
/**
 * Defines operations related to a Core Proof File.
 */
export default class CoreProofFile {
    readonly coreProofFileModel: CoreProofFileModel;
    readonly recoverProofs: {
        signedDataJws: Jws;
        signedDataModel: RecoverSignedDataModel;
    }[];
    readonly deactivateProofs: {
        signedDataJws: Jws;
        signedDataModel: DeactivateSignedDataModel;
    }[];
    /**
     * Class that represents a core proof file.
     * NOTE: this class is introduced as an internal structure that keeps useful states in replacement to `CoreProofFileModel`
     * so that repeated computation can be avoided.
     */
    private constructor();
    /**
     * Creates the buffer of a Core Proof File.
     *
     * @returns `Buffer` if at least one operation is given, `undefined` otherwise.
     */
    static createBuffer(recoverOperations: RecoverOperation[], deactivateOperations: DeactivateOperation[]): Promise<Buffer | undefined>;
    /**
     * Parses and validates the given core proof file buffer.
     * @param coreProofFileBuffer Compressed core proof file.
     * @throws `SidetreeError` if failed parsing or validation.
     */
    static parse(coreProofFileBuffer: Buffer, expectedDeactivatedDidUniqueSuffixes: string[]): Promise<CoreProofFile>;
}
