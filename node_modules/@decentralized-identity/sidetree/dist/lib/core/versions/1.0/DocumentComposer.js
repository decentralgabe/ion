"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const URI = require("uri-js");
const ArrayMethods_1 = require("./util/ArrayMethods");
const Encoder_1 = require("./Encoder");
const ErrorCode_1 = require("./ErrorCode");
const InputValidator_1 = require("./InputValidator");
const JsObject_1 = require("./util/JsObject");
const PatchAction_1 = require("./PatchAction");
const PublicKeyPurpose_1 = require("./PublicKeyPurpose");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Class that handles the composition of operations into final external-facing document.
 */
class DocumentComposer {
    /**
     * Transforms the given DID state into a DID Document.
     */
    static transformToExternalDocument(didState, did, published) {
        // If the DID is deactivated.
        // Return required metadata and a document with only context and id if so
        if (didState.nextRecoveryCommitmentHash === undefined) {
            return DocumentComposer.createDeactivatedResolutionResult(did.shortForm, published);
        }
        const document = didState.document;
        // Put each public key in verificationMethod
        // then populate the verification relationships by reference if a key has purposes,
        const verificationRelationships = new Map();
        const verificationMethod = [];
        if (Array.isArray(document.publicKeys)) {
            for (const publicKey of document.publicKeys) {
                const id = '#' + publicKey.id;
                const didDocumentPublicKey = {
                    id: id,
                    controller: did.isShortForm ? did.shortForm : did.longForm,
                    type: publicKey.type,
                    publicKeyJwk: publicKey.publicKeyJwk
                };
                const purposeSet = new Set(publicKey.purposes);
                // add to verificationMethod no matter what,
                // then look at purpose to decide what verification relationship to add to
                verificationMethod.push(didDocumentPublicKey);
                if (purposeSet.size > 0) {
                    const reference = didDocumentPublicKey.id;
                    for (const purpose of purposeSet) {
                        if (!verificationRelationships.has(purpose)) {
                            verificationRelationships.set(purpose, [reference]);
                        }
                        else {
                            verificationRelationships.get(purpose).push(reference);
                        }
                    }
                }
            }
        }
        // Only update `service` if the array is present
        let services;
        if (Array.isArray(document.services)) {
            services = [];
            for (const service of document.services) {
                const didDocumentService = {
                    id: '#' + service.id,
                    type: service.type,
                    serviceEndpoint: service.serviceEndpoint
                };
                services.push(didDocumentService);
            }
        }
        const baseId = did.isShortForm ? did.shortForm : did.longForm;
        const didDocument = {
            id: baseId,
            '@context': [DocumentComposer.didDocumentContextUrl, { '@base': baseId }],
            service: services
        };
        if (verificationMethod.length !== 0) {
            didDocument.verificationMethod = verificationMethod;
        }
        verificationRelationships.forEach((value, key) => {
            didDocument[key] = value;
        });
        const didResolutionResult = {
            '@context': DocumentComposer.resolutionObjectContextUrl,
            didDocument: didDocument,
            didDocumentMetadata: {
                method: {
                    published,
                    recoveryCommitment: didState.nextRecoveryCommitmentHash,
                    updateCommitment: didState.nextUpdateCommitmentHash
                }
            }
        };
        if (did.isShortForm) {
            didResolutionResult.didDocumentMetadata.canonicalId = did.shortForm;
        }
        else {
            didResolutionResult.didDocumentMetadata.equivalentId = [did.shortForm];
            if (published) {
                didResolutionResult.didDocumentMetadata.canonicalId = did.shortForm;
            }
        }
        return didResolutionResult;
    }
    static createDeactivatedResolutionResult(did, published) {
        const didDocument = {
            id: did,
            '@context': [DocumentComposer.didDocumentContextUrl, { '@base': did }]
        };
        const didDocumentMetadata = {
            method: {
                published
            },
            canonicalId: did,
            deactivated: true
        };
        return {
            '@context': DocumentComposer.resolutionObjectContextUrl,
            didDocument,
            didDocumentMetadata
        };
    }
    /**
     * Validates the schema of the given full document state.
     * @throws SidetreeError if given document patch fails validation.
     */
    static validateDocument(document) {
        if (document === undefined) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerDocumentMissing);
        }
        const allowedProperties = new Set(['publicKeys', 'services']);
        for (const property in document) {
            if (!allowedProperties.has(property)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerUnknownPropertyInDocument, `Unexpected property ${property} in document.`);
            }
        }
        // Verify 'publicKeys' property if it exists.
        if (('publicKeys' in document)) {
            DocumentComposer.validatePublicKeys(document.publicKeys);
        }
        // Verify 'services' property if it exists.
        if (('services' in document)) {
            // Verify each entry in services array.
            DocumentComposer.validateServices(document.services);
        }
    }
    /**
     * Validates the schema of the given update document patch.
     * @throws SidetreeError if given document patch fails validation.
     */
    static validateDocumentPatches(patches) {
        if (!Array.isArray(patches)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerUpdateOperationDocumentPatchesNotArray);
        }
        for (const patch of patches) {
            DocumentComposer.validatePatch(patch);
        }
    }
    static validatePatch(patch) {
        const action = patch.action;
        switch (action) {
            case PatchAction_1.default.Replace:
                DocumentComposer.validateDocument(patch.document);
                break;
            case PatchAction_1.default.AddPublicKeys:
                DocumentComposer.validateAddPublicKeysPatch(patch);
                break;
            case PatchAction_1.default.RemovePublicKeys:
                DocumentComposer.validateRemovePublicKeysPatch(patch);
                break;
            case PatchAction_1.default.AddServices:
                DocumentComposer.validateAddServicesPatch(patch);
                break;
            case PatchAction_1.default.RemoveServices:
                DocumentComposer.validateRemoveServicesPatch(patch);
                break;
            default:
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchMissingOrUnknownAction);
        }
    }
    static validateAddPublicKeysPatch(patch) {
        const patchProperties = Object.keys(patch);
        if (patchProperties.length !== 2) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchMissingOrUnknownProperty);
        }
        DocumentComposer.validatePublicKeys(patch.publicKeys);
    }
    static validatePublicKeys(publicKeys) {
        if (!Array.isArray(publicKeys)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeysNotArray);
        }
        const publicKeyIdSet = new Set();
        for (const publicKey of publicKeys) {
            const allowedProperties = new Set(['id', 'type', 'purposes', 'publicKeyJwk']);
            for (const property in publicKey) {
                if (!allowedProperties.has(property)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyUnknownProperty, `Unexpected property, ${property}, in publicKey.`);
                }
            }
            InputValidator_1.default.validateNonArrayObject(publicKey.publicKeyJwk, 'publicKeyJwk');
            if (typeof publicKey.type !== 'string') {
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyTypeMissingOrIncorrectType);
            }
            DocumentComposer.validateId(publicKey.id);
            // 'id' must be unique
            if (publicKeyIdSet.has(publicKey.id)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyIdDuplicated);
            }
            publicKeyIdSet.add(publicKey.id);
            if ('purposes' in publicKey) {
                if (!Array.isArray(publicKey.purposes)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyPurposesIncorrectType);
                }
                if (ArrayMethods_1.default.hasDuplicates(publicKey.purposes)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyPurposesDuplicated);
                }
                const validPurposes = new Set(Object.values(PublicKeyPurpose_1.default));
                // Purpose must be one of the valid ones in PublicKeyPurpose
                for (const purpose of publicKey.purposes) {
                    if (!validPurposes.has(purpose)) {
                        throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyInvalidPurpose);
                    }
                }
            }
        }
    }
    static validateRemovePublicKeysPatch(patch) {
        const allowedProperties = new Set(['action', 'ids']);
        for (const property in patch) {
            if (!allowedProperties.has(property)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerUnknownPropertyInRemovePublicKeysPatch, `Unexpected property ${property} in remove-public-keys patch.`);
            }
        }
        if (!Array.isArray(patch.ids)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchPublicKeyIdsNotArray);
        }
        for (const id of patch.ids) {
            DocumentComposer.validateId(id);
        }
    }
    /**
     * validate update patch for removing services
     */
    static validateRemoveServicesPatch(patch) {
        const allowedProperties = new Set(['action', 'ids']);
        for (const property in patch) {
            if (!allowedProperties.has(property)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerUnknownPropertyInRemoveServicesPatch, `Unexpected property ${property} in remove-services patch.`);
            }
        }
        if (!Array.isArray(patch.ids)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceIdsNotArray);
        }
        for (const id of patch.ids) {
            DocumentComposer.validateId(id);
        }
    }
    /**
     * Validates update patch for adding services.
     */
    static validateAddServicesPatch(patch) {
        const patchProperties = Object.keys(patch);
        if (patchProperties.length !== 2) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchMissingOrUnknownProperty);
        }
        if (!Array.isArray(patch.services)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServicesNotArray);
        }
        DocumentComposer.validateServices(patch.services);
    }
    /**
     * Validates and parses services.
     * @param services The services to validate and parse.
     */
    static validateServices(services) {
        if (!Array.isArray(services)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServicesNotArray);
        }
        const serviceIdSet = new Set();
        for (const service of services) {
            const serviceProperties = Object.keys(service);
            if (serviceProperties.length !== 3) { // type, id, and serviceEndpoint
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerServiceHasMissingOrUnknownProperty);
            }
            DocumentComposer.validateId(service.id);
            if (serviceIdSet.has(service.id)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceIdNotUnique, 'Service id has to be unique');
            }
            serviceIdSet.add(service.id);
            if (typeof service.type !== 'string') {
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceTypeNotString);
            }
            if (service.type.length > 30) {
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceTypeTooLong);
            }
            // `serviceEndpoint` validations.
            const serviceEndpoint = service.serviceEndpoint;
            if (typeof serviceEndpoint === 'string') {
                const uri = URI.parse(service.serviceEndpoint);
                if (uri.error !== undefined) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceEndpointStringNotValidUri, `Service endpoint string '${serviceEndpoint}' is not a valid URI.`);
                }
            }
            else if (typeof serviceEndpoint === 'object') {
                // Allow `object` type only if it is not an array.
                if (Array.isArray(serviceEndpoint)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceEndpointCannotBeAnArray);
                }
            }
            else {
                throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceEndpointMustBeStringOrNonArrayObject);
            }
        }
    }
    static validateId(id) {
        if (typeof id !== 'string') {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerIdNotString, `ID not string: ${JSON.stringify(id)} is of type '${typeof id}'`);
        }
        if (id.length > 50) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerIdTooLong);
        }
        if (!Encoder_1.default.isBase64UrlString(id)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerIdNotUsingBase64UrlCharacterSet);
        }
    }
    /**
     * Applies the given patches in order to the given document.
     * NOTE: Assumes no schema validation is needed, since validation should've already occurred at the time of the operation being parsed.
     */
    static applyPatches(document, patches) {
        // Loop through and apply all patches.
        for (const patch of patches) {
            DocumentComposer.applyPatchToDidDocument(document, patch);
        }
    }
    /**
     * Applies the given patch to the given DID Document.
     */
    static applyPatchToDidDocument(document, patch) {
        if (patch.action === PatchAction_1.default.Replace) {
            // In-place replacement of the document.
            JsObject_1.default.clearObject(document);
            Object.assign(document, patch.document);
        }
        else if (patch.action === PatchAction_1.default.AddPublicKeys) {
            DocumentComposer.addPublicKeys(document, patch);
        }
        else if (patch.action === PatchAction_1.default.RemovePublicKeys) {
            DocumentComposer.removePublicKeys(document, patch);
        }
        else if (patch.action === PatchAction_1.default.AddServices) {
            DocumentComposer.addServices(document, patch);
        }
        else if (patch.action === PatchAction_1.default.RemoveServices) {
            DocumentComposer.removeServices(document, patch);
        }
        else {
            throw new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerApplyPatchUnknownAction, `Cannot apply invalid action: ${patch.action}`);
        }
    }
    /**
     * Adds public keys to document.
     */
    static addPublicKeys(document, patch) {
        const publicKeyMap = new Map((document.publicKeys || []).map(publicKey => [publicKey.id, publicKey]));
        // Loop through all given public keys and add them.
        // NOTE: If a key ID already exists, we will just replace the existing key.
        // Not throwing error will minimize the need (thus risk) of reusing exposed update reveal value.
        for (const publicKey of patch.publicKeys) {
            publicKeyMap.set(publicKey.id, publicKey);
        }
        document.publicKeys = [...publicKeyMap.values()];
    }
    /**
     * Removes public keys from document.
     */
    static removePublicKeys(document, patch) {
        if (document.publicKeys === undefined) {
            return;
        }
        const idsOfKeysToRemove = new Set(patch.ids);
        // Keep only keys that are not in the removal list.
        document.publicKeys = document.publicKeys.filter(publicKey => !idsOfKeysToRemove.has(publicKey.id));
    }
    static addServices(document, patch) {
        const services = patch.services;
        if (document.services === undefined) {
            // create a new array if `services` does not exist
            document.services = [];
        }
        const idToIndexMapper = new Map();
        // map all id and their index
        for (const index in document.services) {
            idToIndexMapper.set(document.services[index].id, index);
        }
        for (const service of services) {
            if (idToIndexMapper.has(service.id)) {
                const idx = idToIndexMapper.get(service.id);
                document.services[idx] = service;
            }
            else {
                document.services.push(service);
            }
        }
    }
    static removeServices(document, patch) {
        if (document.services === undefined) {
            return;
        }
        const idsToRemove = new Set(patch.ids);
        document.services = document.services.filter(service => !idsToRemove.has(service.id));
    }
}
exports.default = DocumentComposer;
DocumentComposer.resolutionObjectContextUrl = 'https://w3id.org/did-resolution/v1';
DocumentComposer.didDocumentContextUrl = 'https://www.w3.org/ns/did/v1';
//# sourceMappingURL=DocumentComposer.js.map