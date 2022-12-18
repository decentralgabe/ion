import CoreIndexFile from '../../lib/core/versions/latest/CoreIndexFile';
import CoreProofFile from '../../lib/core/versions/latest/CoreProofFile';
import DeactivateOperation from '../../lib/core/versions/latest/DeactivateOperation';
import ProvisionalIndexFile from '../../lib/core/versions/latest/ProvisionalIndexFile';
import ProvisionalProofFile from '../../lib/core/versions/latest/ProvisionalProofFile';
import RecoverOperation from '../../lib/core/versions/latest/RecoverOperation';
import UpdateOperation from '../../lib/core/versions/latest/UpdateOperation';
/**
 * A class containing methods for generating various Sidetree files.
 * Mainly useful for testing purposes.
 */
export default class FileGenerator {
    /**
     * Generates a `CoreIndexFile`, mainly used for testing purposes.
     */
    static generateCoreIndexFile(): Promise<CoreIndexFile>;
    /**
     * Generates a `ProvisionalIndexFile`, mainly used for testing purposes.
     */
    static generateProvisionalIndexFile(): Promise<ProvisionalIndexFile>;
    /**
     * Creates a `CoreProofFile`, mainly used for testing purposes.
     */
    static createCoreProofFile(recoverOperations: RecoverOperation[], deactivateOperations: DeactivateOperation[]): Promise<CoreProofFile | undefined>;
    /**
     * Creates a `ProvisionalProofFile`, mainly used for testing purposes.
     */
    static createProvisionalProofFile(updateOperations: UpdateOperation[]): Promise<ProvisionalProofFile | undefined>;
}
