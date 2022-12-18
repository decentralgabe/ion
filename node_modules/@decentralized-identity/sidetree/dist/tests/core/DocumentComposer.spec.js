"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Did_1 = require("../../lib/core/versions/latest/Did");
const DocumentComposer_1 = require("../../lib/core/versions/latest/DocumentComposer");
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const JsObject_1 = require("../../lib/core/versions/latest/util/JsObject");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const PatchAction_1 = require("../../lib/core/versions/latest/PatchAction");
const PublicKeyPurpose_1 = require("../../lib/core/versions/latest/PublicKeyPurpose");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
describe('DocumentComposer', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('transformToExternalDocument', () => {
        it('should output the expected resolution result with a shortForm identifier given key(s) across all purpose types.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [anySigningPublicKey] = yield OperationGenerator_1.default.generateKeyPair('anySigningKey'); // All purposes will be included by default.
            const [noPurposePublicKey] = yield OperationGenerator_1.default.generateKeyPair('noPurposePublicKey', []);
            const [authPublicKey] = yield OperationGenerator_1.default.generateKeyPair('authPublicKey', [PublicKeyPurpose_1.default.Authentication]);
            const document = {
                publicKeys: [anySigningPublicKey, authPublicKey, noPurposePublicKey]
            };
            const didState = {
                document,
                lastOperationTransactionNumber: 123,
                nextRecoveryCommitmentHash: 'anyCommitmentHash',
                nextUpdateCommitmentHash: 'anyCommitmentHash'
            };
            const published = true;
            const did = yield Did_1.default.create('did:method:suffix', 'method');
            const result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result['@context']).toEqual('https://w3id.org/did-resolution/v1');
            expect(result.didDocumentMetadata).toEqual({
                canonicalId: 'did:method:suffix',
                method: {
                    published: true,
                    recoveryCommitment: 'anyCommitmentHash',
                    updateCommitment: 'anyCommitmentHash'
                }
            });
            expect(result.didDocument).toEqual({
                id: 'did:method:suffix',
                '@context': ['https://www.w3.org/ns/did/v1', { '@base': 'did:method:suffix' }],
                service: undefined,
                verificationMethod: [
                    {
                        id: '#anySigningKey',
                        controller: did.shortForm,
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: { kty: 'EC', crv: 'secp256k1', x: anySigningPublicKey.publicKeyJwk.x, y: anySigningPublicKey.publicKeyJwk.y }
                    },
                    {
                        id: '#authPublicKey',
                        controller: did.shortForm,
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: { kty: 'EC', crv: 'secp256k1', x: authPublicKey.publicKeyJwk.x, y: authPublicKey.publicKeyJwk.y }
                    },
                    {
                        id: '#noPurposePublicKey',
                        controller: did.shortForm,
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: { kty: 'EC', crv: 'secp256k1', x: noPurposePublicKey.publicKeyJwk.x, y: noPurposePublicKey.publicKeyJwk.y }
                    }
                ],
                assertionMethod: ['#anySigningKey'],
                authentication: [
                    '#anySigningKey',
                    '#authPublicKey'
                ],
                capabilityDelegation: ['#anySigningKey'],
                capabilityInvocation: ['#anySigningKey'],
                keyAgreement: ['#anySigningKey']
            });
        }));
        it('should output the expected resolution result with a longForm identifier given key(s) across all purpose types.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [anySigningPublicKey] = yield OperationGenerator_1.default.generateKeyPair('anySigningKey'); // All purposes will be included by default.
            const [noPurposePublicKey] = yield OperationGenerator_1.default.generateKeyPair('noPurposePublicKey', []);
            const [authPublicKey] = yield OperationGenerator_1.default.generateKeyPair('authPublicKey', [PublicKeyPurpose_1.default.Authentication]);
            const document = {
                publicKeys: [anySigningPublicKey, authPublicKey, noPurposePublicKey]
            };
            const didState = {
                document,
                lastOperationTransactionNumber: 123,
                nextRecoveryCommitmentHash: 'EiBfOZdMtU6OBw8Pk879QtZ-2J-9FbbjSZyoaA_bqD4zhA',
                nextUpdateCommitmentHash: 'EiDKIkwqO69IPG3pOlHkdb86nYt0aNxSHZu2r-bhEznjdA'
            };
            const published = false;
            const did = yield Did_1.default.create('did:sidetree:EiDyOQbbZAa3aiRzeCkV7LOx3SERjjH93EXoIM3UoN4oWg:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJwdWJsaWNLZXlNb2RlbDFJZCIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsIngiOiJ0WFNLQl9ydWJYUzdzQ2pYcXVwVkpFelRjVzNNc2ptRXZxMVlwWG45NlpnIiwieSI6ImRPaWNYcWJqRnhvR0otSzAtR0oxa0hZSnFpY19EX09NdVV3a1E3T2w2bmsifSwicHVycG9zZXMiOlsiYXV0aGVudGljYXRpb24iLCJrZXlBZ3JlZW1lbnQiXSwidHlwZSI6IkVjZHNhU2VjcDI1NmsxVmVyaWZpY2F0aW9uS2V5MjAxOSJ9XSwic2VydmljZXMiOlt7ImlkIjoic2VydmljZTFJZCIsInNlcnZpY2VFbmRwb2ludCI6Imh0dHA6Ly93d3cuc2VydmljZTEuY29tIiwidHlwZSI6InNlcnZpY2UxVHlwZSJ9XX19XSwidXBkYXRlQ29tbWl0bWVudCI6IkVpREtJa3dxTzY5SVBHM3BPbEhrZGI4Nm5ZdDBhTnhTSFp1MnItYmhFem5qZEEifSwic3VmZml4RGF0YSI6eyJkZWx0YUhhc2giOiJFaUNmRFdSbllsY0Q5RUdBM2RfNVoxQUh1LWlZcU1iSjluZmlxZHo1UzhWRGJnIiwicmVjb3ZlcnlDb21taXRtZW50IjoiRWlCZk9aZE10VTZPQnc4UGs4NzlRdFotMkotOUZiYmpTWnlvYUFfYnFENHpoQSJ9fQ', 'sidetree');
            const result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result['@context']).toEqual('https://w3id.org/did-resolution/v1');
            expect(result.didDocumentMetadata).toEqual({
                equivalentId: ['did:sidetree:EiDyOQbbZAa3aiRzeCkV7LOx3SERjjH93EXoIM3UoN4oWg'],
                method: {
                    published: false,
                    recoveryCommitment: 'EiBfOZdMtU6OBw8Pk879QtZ-2J-9FbbjSZyoaA_bqD4zhA',
                    updateCommitment: 'EiDKIkwqO69IPG3pOlHkdb86nYt0aNxSHZu2r-bhEznjdA'
                }
            });
            expect(result.didDocument).toEqual({
                id: did.longForm,
                '@context': ['https://www.w3.org/ns/did/v1', { '@base': did.longForm }],
                service: undefined,
                verificationMethod: [
                    {
                        id: '#anySigningKey',
                        controller: did.longForm,
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: { kty: 'EC', crv: 'secp256k1', x: anySigningPublicKey.publicKeyJwk.x, y: anySigningPublicKey.publicKeyJwk.y }
                    },
                    {
                        id: '#authPublicKey',
                        controller: did.longForm,
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: { kty: 'EC', crv: 'secp256k1', x: authPublicKey.publicKeyJwk.x, y: authPublicKey.publicKeyJwk.y }
                    },
                    {
                        id: '#noPurposePublicKey',
                        controller: did.longForm,
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: { kty: 'EC', crv: 'secp256k1', x: noPurposePublicKey.publicKeyJwk.x, y: noPurposePublicKey.publicKeyJwk.y }
                    }
                ],
                assertionMethod: ['#anySigningKey'],
                authentication: [
                    '#anySigningKey',
                    '#authPublicKey'
                ],
                capabilityDelegation: ['#anySigningKey'],
                capabilityInvocation: ['#anySigningKey'],
                keyAgreement: ['#anySigningKey']
            });
        }));
        it('should output method metadata with the given `published` value.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [anySigningPublicKey] = yield OperationGenerator_1.default.generateKeyPair('anySigningKey'); // All purposes will be included by default.
            const [authPublicKey] = yield OperationGenerator_1.default.generateKeyPair('authPublicKey', [PublicKeyPurpose_1.default.Authentication]);
            const document = {
                publicKeys: [anySigningPublicKey, authPublicKey]
            };
            const didState = {
                document,
                lastOperationTransactionNumber: 123,
                nextRecoveryCommitmentHash: 'anyCommitmentHash',
                nextUpdateCommitmentHash: 'anyCommitmentHash'
            };
            let published = false;
            const did = new Did_1.default('did:method:suffix:initialState', 'method');
            let result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result.didDocumentMetadata.method.published).toEqual(published);
            published = true;
            result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result.didDocumentMetadata.method.published).toEqual(published);
        }));
        it('should output DID document metadata with canonicalId only if published.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [anySigningPublicKey] = yield OperationGenerator_1.default.generateKeyPair('anySigningKey'); // All purposes will be included by default.
            const [authPublicKey] = yield OperationGenerator_1.default.generateKeyPair('authPublicKey', [PublicKeyPurpose_1.default.Authentication]);
            const document = {
                publicKeys: [anySigningPublicKey, authPublicKey]
            };
            const didState = {
                document,
                lastOperationTransactionNumber: 123,
                nextRecoveryCommitmentHash: 'anyCommitmentHash',
                nextUpdateCommitmentHash: 'anyCommitmentHash'
            };
            let published = false;
            // long form unpublished
            let did = new Did_1.default('did:method:suffix:initialState', 'method');
            let result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result.didDocumentMetadata.canonicalId).toBeUndefined();
            published = true;
            // long form published
            result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result.didDocumentMetadata.canonicalId).toEqual('did:method:suffix');
            did = yield Did_1.default.create('did:somethingelse:method:suffix', 'somethingelse:method');
            // short form published
            result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result.didDocumentMetadata.canonicalId).toEqual('did:somethingelse:method:suffix');
        }));
        it('should output DID document metadata with equivalentId only if is not short form.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [anySigningPublicKey] = yield OperationGenerator_1.default.generateKeyPair('anySigningKey'); // All purposes will be included by default.
            const [authPublicKey] = yield OperationGenerator_1.default.generateKeyPair('authPublicKey', [PublicKeyPurpose_1.default.Authentication]);
            const document = {
                publicKeys: [anySigningPublicKey, authPublicKey]
            };
            const didState = {
                document,
                lastOperationTransactionNumber: 123,
                nextRecoveryCommitmentHash: 'anyCommitmentHash',
                nextUpdateCommitmentHash: 'anyCommitmentHash'
            };
            const published = true;
            // short form
            let did = yield Did_1.default.create('did:method:suffix', 'method');
            let result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result.didDocumentMetadata.equivalentId).toBeUndefined();
            // long form
            did = new Did_1.default('did:method:suffix:inistialState', 'method');
            result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result.didDocumentMetadata.equivalentId).toEqual(['did:method:suffix']);
        }));
        it('should return status deactivated if next recovery commit hash is undefined', () => __awaiter(void 0, void 0, void 0, function* () {
            const [anySigningPublicKey] = yield OperationGenerator_1.default.generateKeyPair('anySigningKey');
            const [authPublicKey] = yield OperationGenerator_1.default.generateKeyPair('authPublicKey', [PublicKeyPurpose_1.default.Authentication]);
            const document = {
                publicKeys: [anySigningPublicKey, authPublicKey]
            };
            const didState = {
                document,
                lastOperationTransactionNumber: 123,
                nextRecoveryCommitmentHash: undefined,
                nextUpdateCommitmentHash: 'anyCommitmentHash'
            };
            const published = true;
            const did = yield Did_1.default.create('did:method:suffix', 'method');
            const result = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            expect(result.didDocument).toEqual({
                id: 'did:method:suffix',
                '@context': ['https://www.w3.org/ns/did/v1', { '@base': 'did:method:suffix' }]
            });
            expect(result.didDocumentMetadata).toEqual({
                method: {
                    published
                },
                canonicalId: 'did:method:suffix',
                deactivated: true
            });
        }));
    });
    describe('addServices', () => {
        it('should add expected services to document', () => {
            const document = {
                publicKeys: [{ id: 'aRepeatingId', type: 'someType', publicKeyJwk: 'any value' }]
            };
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        id: 'someId',
                        type: 'someType',
                        serviceEndpoint: 'someEndpoint'
                    }]
            };
            DocumentComposer_1.default['addServices'](document, patch);
            expect(document.services).toEqual([{ id: 'someId', type: 'someType', serviceEndpoint: 'someEndpoint' }]);
        });
    });
    describe('removePublicKeys()', () => {
        it('should leave document unchanged if it does not have `publicKeys` property.', () => {
            const document = {
                services: OperationGenerator_1.default.generateServices(['anyServiceId'])
            };
            const deepCopyOriginalDocument = JsObject_1.default.deepCopyObject(document);
            const patch = {
                action: PatchAction_1.default.RemovePublicKeys,
                ids: ['1', '3']
            };
            DocumentComposer_1.default['removePublicKeys'](document, patch);
            expect(document).toEqual(deepCopyOriginalDocument);
        });
    });
    describe('removeServices()', () => {
        it('should remove the expected elements from services', () => {
            const document = {
                publicKeys: [{ id: 'aRepeatingId', type: 'someType', publicKeyJwk: 'any value' }],
                services: [
                    { id: '1', type: 't', serviceEndpoint: 'se' },
                    { id: '2', type: 't', serviceEndpoint: 'se' },
                    { id: '3', type: 't', serviceEndpoint: 'se' },
                    { id: '4', type: 't', serviceEndpoint: 'se' }
                ]
            };
            const patch = {
                action: PatchAction_1.default.RemoveServices,
                ids: ['1', '3']
            };
            DocumentComposer_1.default['removeServices'](document, patch);
            const expected = {
                publicKeys: [{ id: 'aRepeatingId', type: 'someType', publicKeyJwk: 'any value' }],
                services: [
                    { id: '2', type: 't', serviceEndpoint: 'se' },
                    { id: '4', type: 't', serviceEndpoint: 'se' }
                ]
            };
            expect(document).toEqual(expected);
        });
        it('should leave document unchanged if it does not have `services` property', () => {
            const document = {
                publicKeys: [{ id: 'aRepeatingId', type: 'someType', publicKeyJwk: 'any value' }]
            };
            const deepCopyOriginalDocument = JsObject_1.default.deepCopyObject(document);
            const patch = {
                action: PatchAction_1.default.RemoveServices,
                ids: ['1', '3']
            };
            DocumentComposer_1.default['removeServices'](document, patch);
            expect(document).toEqual(deepCopyOriginalDocument);
        });
    });
    describe('validateRemoveServicesPatch', () => {
        it('should throw error if a remove-services patch contains additional unknown property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patch = {
                extra: 'unknown value',
                action: PatchAction_1.default.RemoveServices,
                ids: 'not an array'
            };
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => DocumentComposer_1.default['validateRemoveServicesPatch'](patch), ErrorCode_1.default.DocumentComposerUnknownPropertyInRemoveServicesPatch);
        }));
        it('should throw DocumentComposerPatchServiceIdsNotArray if ids is not an array', () => {
            const patch = {
                action: PatchAction_1.default.RemoveServices,
                ids: 'not an array'
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceIdsNotArray);
            expect(() => { DocumentComposer_1.default['validateRemoveServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('should throw DocumentComposerIdTooLong if an id is not a string', () => {
            const patch = {
                action: PatchAction_1.default.RemoveServices,
                ids: [1234]
            };
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => { DocumentComposer_1.default['validateRemoveServicesPatch'](patch); }, ErrorCode_1.default.DocumentComposerIdNotString);
        });
        it('should throw DocumentComposerIdTooLong if an id is too long', () => {
            const patch = {
                action: PatchAction_1.default.RemoveServices,
                ids: ['super long super long super long super long super long super long super long super long super long']
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerIdTooLong);
            expect(() => { DocumentComposer_1.default['validateRemoveServicesPatch'](patch); }).toThrow(expectedError);
        });
    });
    describe('validateAddServicesPatch', () => {
        it('should detect missing error and throw', () => {
            const patch = {};
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchMissingOrUnknownProperty);
            expect(() => { DocumentComposer_1.default['validateAddServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('should detect unknown error and throw', () => {
            const patch = {
                extra: 'unknown value',
                action: PatchAction_1.default.AddServices,
                services: 'not an array'
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchMissingOrUnknownProperty);
            expect(() => { DocumentComposer_1.default['validateAddServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('should throw DocumentComposerIdTooLong if id is too long', () => {
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        id: 'super long super long super long super long super long super long super long super long super long',
                        type: undefined,
                        serviceEndpoint: 'something'
                    }]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerIdTooLong);
            expect(() => { DocumentComposer_1.default['validateAddServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('should throw DocumentComposerServiceHasMissingOrUnknownProperty if service has unknown property', () => {
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        extra: 'property',
                        id: 'someId',
                        type: undefined,
                        serviceEndpoint: 'something'
                    }]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerServiceHasMissingOrUnknownProperty);
            expect(() => { DocumentComposer_1.default['validateAddServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('should throw DocumentComposerServiceHasMissingOrUnknownProperty if `serviceEndpoint` is missing', () => {
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        id: 'someId',
                        type: undefined
                    }]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerServiceHasMissingOrUnknownProperty);
            expect(() => { DocumentComposer_1.default['validateAddServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('should throw DocumentComposerPatchServiceTypeNotString if type is not a string', () => {
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        id: 'someId',
                        type: undefined,
                        serviceEndpoint: 'something'
                    }]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceTypeNotString);
            expect(() => { DocumentComposer_1.default['validateAddServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('should throw DocumentComposerPatchServiceTypeTooLong if type too long', () => {
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        id: 'someId',
                        type: '1234567890123456789012345678901234567890',
                        serviceEndpoint: 'something'
                    }]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceTypeTooLong);
            expect(() => { DocumentComposer_1.default['validateAddServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('should allow an non-array object as `serviceEndpoint`.', () => {
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        id: 'someId',
                        type: 'someType',
                        serviceEndpoint: { anyObject: '123' }
                    }]
            };
            // Expecting this call to succeed without errors.
            DocumentComposer_1.default['validateAddServicesPatch'](patch);
        });
        it('should throw error if `serviceEndpoint` is an array.', () => {
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        id: 'someId',
                        type: 'someType',
                        serviceEndpoint: []
                    }]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceEndpointCannotBeAnArray);
            expect(() => { DocumentComposer_1.default['validateAddServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('should throw error if `serviceEndpoint` has an invalid type.', () => {
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        id: 'someId',
                        type: 'someType',
                        serviceEndpoint: 123 // Invalid serviceEndpoint type.
                    }]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceEndpointMustBeStringOrNonArrayObject);
            expect(() => { DocumentComposer_1.default['validateAddServicesPatch'](patch); }).toThrow(expectedError);
        });
        it('Should throw if `serviceEndpoint` is not valid URI.', () => {
            const patch = {
                action: PatchAction_1.default.AddServices,
                services: [{
                        id: 'someId',
                        type: 'someType',
                        serviceEndpoint: 'http://' // Invalid URI.
                    }]
            };
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => DocumentComposer_1.default['validateAddServicesPatch'](patch), ErrorCode_1.default.DocumentComposerPatchServiceEndpointStringNotValidUri);
        });
    });
    describe('validateDocumentPatches()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw error if `patches` is not an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = 'shouldNotBeAString';
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerUpdateOperationDocumentPatchesNotArray);
            expect(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }).toThrow(expectedError);
        }));
        it('should throw error if given `action` is unknown.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[0].action = 'invalidAction';
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchMissingOrUnknownAction);
            expect(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }).toThrow(expectedError);
        }));
        it('should throw error if an add-public-keys patch contains additional unknown property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[0].unknownProperty = 'unknownProperty';
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchMissingOrUnknownProperty);
            expect(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }).toThrow(expectedError);
        }));
        it('should throw error if `publicKeys` in an add-public-keys patch is not an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[0].publicKeys = 'incorrectType';
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeysNotArray);
            expect(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }).toThrow(expectedError);
        }));
        it('should throw error if an entry in `publicKey` in an add-public-keys patch contains additional unknown property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[0].publicKeys[0].unknownProperty = 'unknownProperty';
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyUnknownProperty, 'Unexpected property, unknownProperty, in publicKey.');
            expect(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }).toThrow(expectedError);
        }));
        it('should throw error if `id` of a public key in an add-public-keys patch is not a string.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[0].publicKeys[0].id = { invalidType: true };
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }, ErrorCode_1.default.DocumentComposerIdNotString);
        }));
        it('should throw error if the a secp256k1 public key in an add-public-keys patch is not specified in `publicKeyJwk` property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            // Simulate that `publicKeyJwk` is missing.
            delete patches[0].publicKeys[0].publicKeyJwk;
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => DocumentComposer_1.default.validateDocumentPatches(patches), ErrorCode_1.default.InputValidatorInputIsNotAnObject, 'publicKeyJwk');
        }));
        it('should throw error if `type` of a public key is not a string.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            // Simulate that a `type` has an incorrect type.
            patches[0].publicKeys[0].type = 123;
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyTypeMissingOrIncorrectType);
            expect(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }).toThrow(expectedError);
        }));
        it('should throw error if a remove-public-keys patch contains additional unknown property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[1].unknownProperty = 'unknownProperty';
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => DocumentComposer_1.default.validateDocumentPatches(patches), ErrorCode_1.default.DocumentComposerUnknownPropertyInRemovePublicKeysPatch);
        }));
        it('should throw error if `ids` in an remove-public-keys patch is not an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[1].ids = 'incorrectType';
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchPublicKeyIdsNotArray);
            expect(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }).toThrow(expectedError);
        }));
        it('should throw error if any of the entries in `ids` in a remove-public-keys patch is not a string.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[1].ids[0] = { invalidType: true };
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => DocumentComposer_1.default.validateDocumentPatches(patches), ErrorCode_1.default.DocumentComposerIdNotString);
        }));
        it('should throw error if `services` in an add-services patch is not an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[2].services = 'incorrectType';
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServicesNotArray);
            expect(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }).toThrow(expectedError);
        }));
        it('should throw error if any of the `services` entry in the add-services patch is not a valid DID.', () => __awaiter(void 0, void 0, void 0, function* () {
            const patches = generatePatchesForPublicKeys();
            patches[2].services[0] = 111;
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerServiceHasMissingOrUnknownProperty);
            expect(() => { DocumentComposer_1.default.validateDocumentPatches(patches); }).toThrow(expectedError);
        }));
    }));
    describe('applyPatches()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should add a key even if no keys exist yet.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {};
            const newKey = { id: 'aNonRepeatingId', type: 'someType', publicKeyJwk: {} };
            const patches = [
                {
                    action: PatchAction_1.default.AddPublicKeys,
                    publicKeys: [newKey]
                }
            ];
            DocumentComposer_1.default.applyPatches(document, patches);
            expect(document.publicKeys).toEqual([newKey]);
        }));
        it('should replace old state entirely if the patch action is a replace.', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const document = {
                publicKeys: [{ id: 'anyKeyId', type: 'someType', publicKeyJwk: 'any value' }],
                services: []
            };
            // A replace patch that will remove all public keys and add a service endpoint.
            const patches = [{
                    action: PatchAction_1.default.Replace,
                    document: {
                        publicKeys: [],
                        services: [
                            {
                                id: 'key1',
                                type: 'URL',
                                serviceEndpoint: 'https://ion.is.cool/'
                            }
                        ]
                    }
                }];
            DocumentComposer_1.default.applyPatches(document, patches);
            expect((_a = document.publicKeys) === null || _a === void 0 ? void 0 : _a.length).toEqual(0);
            expect((_b = document.services) === null || _b === void 0 ? void 0 : _b.length).toEqual(1);
        }));
        it('should replace old key with the same ID with new values.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {
                publicKeys: [{ id: 'aRepeatingId', type: 'someType', publicKeyJwk: 'any value' }],
                services: []
            };
            const newKeys = [
                { id: 'aRepeatingId', type: 'newTypeValue', publicKeyJwk: 'any new value' },
                { id: 'aNonRepeatingId', type: 'someType', publicKeyJwk: 'any value' }
            ];
            const patches = [
                {
                    action: PatchAction_1.default.AddPublicKeys,
                    publicKeys: newKeys
                }
            ];
            DocumentComposer_1.default.applyPatches(document, patches);
            expect(document.publicKeys).toEqual(newKeys);
        }));
        it('should throw if action is not a valid patch action', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {};
            const patches = [
                {
                    action: 'invalid action',
                    publicKeys: [
                        { id: 'aNonRepeatingId', type: 'someType' }
                    ]
                }
            ];
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => {
                DocumentComposer_1.default.applyPatches(document, patches);
            }, ErrorCode_1.default.DocumentComposerApplyPatchUnknownAction, 'Cannot apply invalid action: invalid action');
        }));
    }));
    describe('validateId()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw if ID given is not using characters from Base64URL character set.', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidId = 'AnInvalidIdWith#';
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerIdNotUsingBase64UrlCharacterSet);
            expect(() => { DocumentComposer_1.default.validateId(invalidId); }).toThrow(expectedError);
        }));
    }));
    describe('validateDocument()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw DocumentComposerDocumentMissing if document is undefined', () => {
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerDocumentMissing);
            expect(() => { DocumentComposer_1.default['validateDocument'](undefined); }).toThrow(expectedError);
        });
        it('should throw DocumentComposerPatchServicesNotArray if `services` is not an array', () => {
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServicesNotArray);
            const document = {
                publicKeys: [{ id: 'aRepeatingId', type: 'someType', controller: 'someId' }],
                services: 'this is not an array'
            };
            spyOn(DocumentComposer_1.default, 'validatePublicKeys').and.returnValue(1);
            expect(() => { DocumentComposer_1.default['validateDocument'](document); }).toThrow(expectedError);
        });
        it('should throw if document contains 2 services with the same ID.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {
                services: [
                    {
                        id: 'key1',
                        type: 'URL',
                        serviceEndpoint: 'https://ion.is.cool/'
                    },
                    {
                        id: 'key1',
                        type: 'URL',
                        serviceEndpoint: 'https://ion.is.still.cool/'
                    }
                ]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPatchServiceIdNotUnique, 'Service id has to be unique');
            expect(() => { DocumentComposer_1.default['validateDocument'](document); }).toThrow(expectedError);
        }));
        it('should throw if document contains 2 keys with the same ID.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {
                publicKeys: [
                    {
                        id: 'key1',
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: { a: 'unused a' },
                        purposes: ['assertionMethod']
                    },
                    {
                        id: 'key1',
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: { b: 'unused b' },
                        purposes: ['assertionMethod']
                    }
                ]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyIdDuplicated);
            expect(() => { DocumentComposer_1.default['validateDocument'](document); }).toThrow(expectedError);
        }));
        it('should process as expected if document public key purposes is empty array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {
                publicKeys: [
                    {
                        id: 'key1',
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: {},
                        purposes: []
                    }
                ]
            };
            DocumentComposer_1.default['validateDocument'](document);
        }));
        it('should process as expected if document public key purposes is undefined.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {
                publicKeys: [
                    {
                        id: 'key1',
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: {}
                    }
                ]
            };
            DocumentComposer_1.default['validateDocument'](document);
        }));
        it('should throw if document public key purposes is not an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {
                publicKeys: [
                    {
                        id: 'key1',
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: {},
                        purposes: undefined
                    }
                ]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyPurposesIncorrectType);
            expect(() => { DocumentComposer_1.default['validateDocument'](document); }).toThrow(expectedError);
        }));
        it('should throw if document public key purposes is bigger than expected length.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {
                publicKeys: [
                    {
                        id: 'key1',
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: {},
                        purposes: ['verificationMethod', 'verificationMethod']
                    }
                ]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyPurposesDuplicated);
            expect(() => { DocumentComposer_1.default['validateDocument'](document); }).toThrow(expectedError);
        }));
        it('should throw if document public key contains invalid purpose.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {
                publicKeys: [
                    {
                        id: 'key1',
                        type: 'EcdsaSecp256k1VerificationKey2019',
                        publicKeyJwk: {},
                        purposes: ['verificationMethod', 'somethingInvalid']
                    }
                ]
            };
            const expectedError = new SidetreeError_1.default(ErrorCode_1.default.DocumentComposerPublicKeyInvalidPurpose);
            expect(() => { DocumentComposer_1.default['validateDocument'](document); }).toThrow(expectedError);
        }));
        it('should throw if document contains unknown property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const document = {
                unknownProperty: 'any value'
            };
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => __awaiter(void 0, void 0, void 0, function* () { DocumentComposer_1.default['validateDocument'](document); }), ErrorCode_1.default.DocumentComposerUnknownPropertyInDocument);
        }));
    }));
}));
/**
 * Generates a document patch containing an array of patches:
 * patches[0] is an add-public-keys
 * patches[1] is a remove-public-keys
 * patches[2] is an add-services
 */
function generatePatchesForPublicKeys() {
    return [
        {
            action: PatchAction_1.default.AddPublicKeys,
            publicKeys: [
                {
                    id: 'keyX',
                    type: 'EcdsaSecp256k1VerificationKey2019',
                    publicKeyJwk: {
                        kty: 'EC',
                        crv: 'secp256k1',
                        x: '5s3-bKjD1Eu_3NJu8pk7qIdOPl1GBzU_V8aR3xiacoM',
                        y: 'v0-Q5H3vcfAfQ4zsebJQvMrIg3pcsaJzRvuIYZ3_UOY'
                    }
                }
            ]
        },
        {
            action: PatchAction_1.default.RemovePublicKeys,
            ids: ['keyY']
        },
        {
            action: PatchAction_1.default.AddServices,
            services: OperationGenerator_1.default.generateServices(['EiBQilmIz0H8818Cmp-38Fl1ao03yOjOh03rd9znsK2-8B'])
        }
    ];
}
//# sourceMappingURL=DocumentComposer.spec.js.map