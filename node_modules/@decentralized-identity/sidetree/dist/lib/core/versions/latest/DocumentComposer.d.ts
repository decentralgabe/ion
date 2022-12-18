import Did from './Did';
import DidState from '../../models/DidState';
/**
 * Class that handles the composition of operations into final external-facing document.
 */
export default class DocumentComposer {
    private static resolutionObjectContextUrl;
    private static didDocumentContextUrl;
    /**
     * Transforms the given DID state into a DID Document.
     */
    static transformToExternalDocument(didState: DidState, did: Did, published: boolean): any;
    private static createDeactivatedResolutionResult;
    /**
     * Validates the schema of the given full document state.
     * @throws SidetreeError if given document patch fails validation.
     */
    private static validateDocument;
    /**
     * Validates the schema of the given update document patch.
     * @throws SidetreeError if given document patch fails validation.
     */
    static validateDocumentPatches(patches: any): void;
    private static validatePatch;
    private static validateAddPublicKeysPatch;
    private static validatePublicKeys;
    private static validateRemovePublicKeysPatch;
    /**
     * validate update patch for removing services
     */
    private static validateRemoveServicesPatch;
    /**
     * Validates update patch for adding services.
     */
    private static validateAddServicesPatch;
    /**
     * Validates and parses services.
     * @param services The services to validate and parse.
     */
    private static validateServices;
    private static validateId;
    /**
     * Applies the given patches in order to the given document.
     * NOTE: Assumes no schema validation is needed, since validation should've already occurred at the time of the operation being parsed.
     */
    static applyPatches(document: any, patches: any[]): void;
    /**
     * Applies the given patch to the given DID Document.
     */
    private static applyPatchToDidDocument;
    /**
     * Adds public keys to document.
     */
    private static addPublicKeys;
    /**
     * Removes public keys from document.
     */
    private static removePublicKeys;
    private static addServices;
    private static removeServices;
}
