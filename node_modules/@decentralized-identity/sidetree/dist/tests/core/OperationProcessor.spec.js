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
const CreateOperation_1 = require("../../lib/core/versions/latest/CreateOperation");
const DeactivateOperation_1 = require("../../lib/core/versions/latest/DeactivateOperation");
const Document_1 = require("../utils/Document");
const DocumentComposer_1 = require("../../lib/core/versions/latest/DocumentComposer");
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const JsObject_1 = require("../../lib/core/versions/latest/util/JsObject");
const Jwk_1 = require("../../lib/core/versions/latest/util/Jwk");
const MockOperationStore_1 = require("../mocks/MockOperationStore");
const MockVersionManager_1 = require("../mocks/MockVersionManager");
const Multihash_1 = require("../../lib/core/versions/latest/Multihash");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const OperationProcessor_1 = require("../../lib/core/versions/latest/OperationProcessor");
const OperationType_1 = require("../../lib/core/enums/OperationType");
const PatchAction_1 = require("../../lib/core/versions/latest/PatchAction");
const RecoverOperation_1 = require("../../lib/core/versions/latest/RecoverOperation");
const Resolver_1 = require("../../lib/core/Resolver");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
const UpdateOperation_1 = require("../../lib/core/versions/latest/UpdateOperation");
function createUpdateSequence(didUniqueSuffix, createOp, numberOfUpdates, privateKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const ops = new Array(createOp);
        let currentUpdateKey = Jwk_1.default.getEs256kPublicKey(privateKey);
        let currentPrivateKey = privateKey;
        for (let i = 0; i < numberOfUpdates; ++i) {
            const [nextUpdateKey, nextPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('updateKey');
            const nextUpdateCommitmentHash = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(nextUpdateKey.publicKeyJwk);
            const patches = [
                {
                    action: PatchAction_1.default.RemoveServices,
                    ids: ['serviceId' + (i - 1)]
                },
                {
                    action: PatchAction_1.default.AddServices,
                    services: OperationGenerator_1.default.generateServices(['serviceId' + i])
                }
            ];
            const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequest(didUniqueSuffix, currentUpdateKey, currentPrivateKey, nextUpdateCommitmentHash, patches);
            // Now that the update payload is created, update the update reveal for the next operation generation to use.
            currentUpdateKey = nextUpdateKey.publicKeyJwk;
            currentPrivateKey = nextPrivateKey;
            const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
            const updateOp = {
                type: OperationType_1.default.Update,
                didUniqueSuffix,
                operationBuffer,
                transactionTime: i + 1,
                transactionNumber: i + 1,
                operationIndex: 0
            };
            ops.push(updateOp);
        }
        return ops;
    });
}
function getFactorial(n) {
    let factorial = 1;
    for (let i = 2; i <= n; ++i) {
        factorial *= i;
    }
    return factorial;
}
// Return a permutation of a given size with a specified index among
// all possible permutations. For example, there are 5! = 120 permutations
// of size 5, so by passing index values 0..119 we can enumerate all
// permutations
function getPermutation(size, index) {
    const permutation = [];
    for (let i = 0; i < size; ++i) {
        permutation.push(i);
    }
    for (let i = 0; i < size; ++i) {
        const j = i + Math.floor(index / getFactorial(size - i - 1));
        index = index % getFactorial(size - i - 1);
        const t = permutation[i];
        permutation[i] = permutation[j];
        permutation[j] = t;
    }
    return permutation;
}
function validateDocumentAfterUpdates(document, numberOfUpdates) {
    expect(document).toBeDefined();
    expect(document.services[0].id).toEqual('serviceId' + (numberOfUpdates - 1));
}
describe('OperationProcessor', () => __awaiter(void 0, void 0, void 0, function* () {
    let resolver;
    let operationStore;
    let versionManager;
    let operationProcessor;
    let createOp;
    let recoveryPublicKey;
    let recoveryPrivateKey;
    let signingKeyId;
    let signingPublicKey;
    let signingPrivateKey;
    let didUniqueSuffix;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        operationStore = new MockOperationStore_1.default();
        operationProcessor = new OperationProcessor_1.default();
        versionManager = new MockVersionManager_1.default();
        spyOn(versionManager, 'getOperationProcessor').and.returnValue(operationProcessor);
        resolver = new Resolver_1.default(versionManager, operationStore);
        // Generate a unique key-pair used for each test.
        signingKeyId = 'signingKey';
        [recoveryPublicKey, recoveryPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair();
        [signingPublicKey, signingPrivateKey] = yield OperationGenerator_1.default.generateKeyPair(signingKeyId);
        const services = OperationGenerator_1.default.generateServices(['serviceId0']);
        const createOperationBuffer = yield OperationGenerator_1.default.generateCreateOperationBuffer(recoveryPublicKey, signingPublicKey, services);
        const createOperation = yield CreateOperation_1.default.parse(createOperationBuffer);
        createOp = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(createOperation, 0, 0, 0);
        didUniqueSuffix = createOp.didUniqueSuffix;
    }));
    it('should return a DID Document for resolve(did) for a registered DID', () => __awaiter(void 0, void 0, void 0, function* () {
        yield operationStore.insertOrReplace([createOp]);
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        const document = didState.document;
        const signingKey = Document_1.default.getPublicKey(document, signingKeyId);
        expect(signingKey).toBeDefined();
    }));
    it('should ignore a duplicate create operation', () => __awaiter(void 0, void 0, void 0, function* () {
        yield operationStore.insertOrReplace([createOp]);
        // Insert a duplicate create op with a different transaction time.
        const duplicateOperation = yield CreateOperation_1.default.parse(createOp.operationBuffer);
        const duplicateNamedAnchoredCreateOperationModel = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(duplicateOperation, 1, 1, 0);
        yield operationStore.insertOrReplace([duplicateNamedAnchoredCreateOperationModel]);
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        const document = didState.document;
        const signingKey = Document_1.default.getPublicKey(document, signingKeyId);
        expect(signingKey).toBeDefined();
    }));
    it('should process update to remove a public key correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        yield operationStore.insertOrReplace([createOp]);
        const patches = [
            {
                action: PatchAction_1.default.RemovePublicKeys,
                ids: [signingKeyId]
            }
        ];
        const nextUpdateCommitmentHash = 'EiD_UnusedNextUpdateCommitmentHash_AAAAAAAAAAA';
        const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequest(didUniqueSuffix, signingPublicKey.publicKeyJwk, signingPrivateKey, nextUpdateCommitmentHash, patches);
        const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
        const updateOp = {
            type: OperationType_1.default.Update,
            didUniqueSuffix,
            operationBuffer,
            transactionTime: 1,
            transactionNumber: 1,
            operationIndex: 0
        };
        yield operationStore.insertOrReplace([updateOp]);
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        const document = didState.document;
        const signingKey = Document_1.default.getPublicKey(document, signingKeyId);
        expect(signingKey).not.toBeDefined(); // if update above went through, new key would be added.
    }));
    it('should process updates correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const numberOfUpdates = 10;
        const ops = yield createUpdateSequence(didUniqueSuffix, createOp, numberOfUpdates, signingPrivateKey);
        yield operationStore.insertOrReplace(ops);
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        validateDocumentAfterUpdates(didState.document, numberOfUpdates);
    }));
    it('should correctly process updates in reverse order', () => __awaiter(void 0, void 0, void 0, function* () {
        const numberOfUpdates = 10;
        const ops = yield createUpdateSequence(didUniqueSuffix, createOp, numberOfUpdates, signingPrivateKey);
        for (let i = numberOfUpdates; i >= 0; --i) {
            yield operationStore.insertOrReplace([ops[i]]);
        }
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        validateDocumentAfterUpdates(didState.document, numberOfUpdates);
    }));
    it('should correctly process updates in every (5! = 120) order', () => __awaiter(void 0, void 0, void 0, function* () {
        const numberOfUpdates = 4;
        const ops = yield createUpdateSequence(didUniqueSuffix, createOp, numberOfUpdates, signingPrivateKey);
        const numberOfOps = ops.length;
        const numberOfPermutations = getFactorial(numberOfOps);
        for (let i = 0; i < numberOfPermutations; ++i) {
            const permutation = getPermutation(numberOfOps, i);
            operationStore = new MockOperationStore_1.default();
            resolver = new Resolver_1.default(versionManager, operationStore);
            const permutedOps = permutation.map(i => ops[i]);
            yield operationStore.insertOrReplace(permutedOps);
            const didState = yield resolver.resolve(didUniqueSuffix);
            expect(didState).toBeDefined();
            validateDocumentAfterUpdates(didState.document, numberOfUpdates);
        }
    }));
    it('should process deactivate operation correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
        const numberOfUpdates = 10;
        const ops = yield createUpdateSequence(didUniqueSuffix, createOp, numberOfUpdates, signingPrivateKey);
        yield operationStore.insertOrReplace(ops);
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        validateDocumentAfterUpdates(didState.document, numberOfUpdates);
        const deactivateOperationData = yield OperationGenerator_1.default.createDeactivateOperation(didUniqueSuffix, recoveryPrivateKey);
        const anchoredDeactivateOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(deactivateOperationData.deactivateOperation, numberOfUpdates + 1, numberOfUpdates + 1, 0);
        yield operationStore.insertOrReplace([anchoredDeactivateOperation]);
        const deactivatedDidState = yield resolver.resolve(didUniqueSuffix);
        expect(deactivatedDidState).toBeDefined();
        expect(deactivatedDidState.nextRecoveryCommitmentHash).toBeUndefined();
        expect(deactivatedDidState.nextUpdateCommitmentHash).toBeUndefined();
        expect(deactivatedDidState.lastOperationTransactionNumber).toEqual(numberOfUpdates + 1);
    }));
    it('should ignore a deactivate operation of a non-existent did', () => __awaiter(void 0, void 0, void 0, function* () {
        const deactivateOperationData = yield OperationGenerator_1.default.createDeactivateOperation(didUniqueSuffix, recoveryPrivateKey);
        const anchoredDeactivateOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(deactivateOperationData.deactivateOperation, 1, 1, 0);
        yield operationStore.insertOrReplace([anchoredDeactivateOperation]);
        const didDocumentAfterDeactivate = yield resolver.resolve(didUniqueSuffix);
        expect(didDocumentAfterDeactivate).toBeUndefined();
    }));
    it('should ignore a deactivate operation with invalid signature', () => __awaiter(void 0, void 0, void 0, function* () {
        yield operationStore.insertOrReplace([createOp]);
        // Intentionally signing with signing (wrong) key.
        const deactivateOperationData = yield OperationGenerator_1.default.createDeactivateOperation(didUniqueSuffix, signingPrivateKey);
        const anchoredDeactivateOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(deactivateOperationData.deactivateOperation, 1, 1, 0);
        yield operationStore.insertOrReplace([anchoredDeactivateOperation]);
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        const document = didState.document;
        const signingKey = Document_1.default.getPublicKey(document, signingKeyId);
        expect(signingKey).toBeDefined();
    }));
    it('should ignore updates to DID that is not created', () => __awaiter(void 0, void 0, void 0, function* () {
        const numberOfUpdates = 10;
        const ops = yield createUpdateSequence(didUniqueSuffix, createOp, numberOfUpdates, signingPrivateKey);
        // elide i = 0, the create operation
        for (let i = 1; i < ops.length; ++i) {
            yield operationStore.insertOrReplace([ops[i]]);
        }
        const didDocument = yield resolver.resolve(didUniqueSuffix);
        expect(didDocument).toBeUndefined();
    }));
    it('should ignore update operation with the incorrect updateKey', () => __awaiter(void 0, void 0, void 0, function* () {
        yield operationStore.insertOrReplace([createOp]);
        const [anyPublicKey] = yield OperationGenerator_1.default.generateKeyPair(`additionalKey`);
        const [invalidKey] = yield OperationGenerator_1.default.generateKeyPair('invalidKey');
        const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, invalidKey.publicKeyJwk, signingPrivateKey, anyPublicKey, OperationGenerator_1.default.generateRandomHash());
        // Generate operation with an invalid key
        const updateOperationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
        const updateOperation = yield UpdateOperation_1.default.parse(updateOperationBuffer);
        const anchoredUpdateOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(updateOperation, 1, 1, 0);
        yield operationStore.insertOrReplace([anchoredUpdateOperation]);
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        const document = didState.document;
        const newKey = Document_1.default.getPublicKey(document, 'additionalKey');
        expect(newKey).not.toBeDefined(); // if update above went through, new key would be added.
    }));
    it('should ignore update operation with an invalid signature', () => __awaiter(void 0, void 0, void 0, function* () {
        yield operationStore.insertOrReplace([createOp]);
        const [, anyIncorrectSigningPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('key1');
        const [anyPublicKey] = yield OperationGenerator_1.default.generateKeyPair(`additionalKey`);
        const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, signingPublicKey.publicKeyJwk, anyIncorrectSigningPrivateKey, anyPublicKey, OperationGenerator_1.default.generateRandomHash());
        const updateOperationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
        const updateOperation = yield UpdateOperation_1.default.parse(updateOperationBuffer);
        const anchoredUpdateOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(updateOperation, 1, 1, 0);
        yield operationStore.insertOrReplace([anchoredUpdateOperation]);
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        const document = didState.document;
        const newKey = Document_1.default.getPublicKey(document, 'new-key');
        expect(newKey).not.toBeDefined(); // if update above went through, new key would be added.
    }));
    it('should resolve as undefined if all operation of a DID is rolled back.', () => __awaiter(void 0, void 0, void 0, function* () {
        const numberOfUpdates = 10;
        const ops = yield createUpdateSequence(didUniqueSuffix, createOp, numberOfUpdates, signingPrivateKey);
        yield operationStore.insertOrReplace(ops);
        const didState = yield resolver.resolve(didUniqueSuffix);
        expect(didState).toBeDefined();
        validateDocumentAfterUpdates(didState.document, numberOfUpdates);
        // rollback
        yield operationStore.delete();
        const didDocumentAfterRollback = yield resolver.resolve(didUniqueSuffix);
        expect(didDocumentAfterRollback).toBeUndefined();
    }));
    describe('apply()', () => {
        let recoveryPublicKey;
        let recoveryPrivateKey;
        let signingPublicKey;
        let signingPrivateKey;
        let namedAnchoredCreateOperationModel;
        let didState;
        let verifyEncodedMultihashForContentSpy;
        // Create a DID before each test.
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            verifyEncodedMultihashForContentSpy = spyOn(Multihash_1.default, 'verifyEncodedMultihashForContent');
            verifyEncodedMultihashForContentSpy.and.callThrough();
            // MUST reset the DID state back to `undefined` for each test.
            didState = undefined;
            // Generate key(s) and service(s) to be included in the DID Document.
            [recoveryPublicKey, recoveryPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair();
            [signingPublicKey, signingPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('signingKey');
            const services = OperationGenerator_1.default.generateServices(['dummyHubUri']);
            // Create the initial create operation.
            const createOperationBuffer = yield OperationGenerator_1.default.generateCreateOperationBuffer(recoveryPublicKey, signingPublicKey, services);
            const createOperation = yield CreateOperation_1.default.parse(createOperationBuffer);
            namedAnchoredCreateOperationModel = {
                type: OperationType_1.default.Create,
                didUniqueSuffix: createOperation.didUniqueSuffix,
                operationBuffer: createOperationBuffer,
                transactionNumber: 1,
                transactionTime: 1,
                operationIndex: 1
            };
            // Apply the initial create operation.
            didState = yield operationProcessor.apply(namedAnchoredCreateOperationModel, didState);
            // Sanity check the create operation.
            expect(didState).toBeDefined();
            expect(didState.document).toBeDefined();
        }));
        it('should return `undefined` if operation of unknown type is given.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a non-create operation.
            const anyDid = OperationGenerator_1.default.generateRandomHash();
            const [, anyRecoveryPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('anyRecoveryKey');
            const deactivateOperationData = yield OperationGenerator_1.default.createDeactivateOperation(anyDid, anyRecoveryPrivateKey);
            const anchoredDeactivateOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(deactivateOperationData.deactivateOperation, 1, 1, 1);
            const newDidState = yield operationProcessor.apply(anchoredDeactivateOperation, undefined);
            expect(newDidState).toBeUndefined();
        }));
        it('should throw if operation of unknown type is given.', () => __awaiter(void 0, void 0, void 0, function* () {
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 2, transactionNumber: 2, operationIndex: 2 });
            const anchoredOperationModel = createOperationData.anchoredOperationModel;
            anchoredOperationModel.type = 'UnknownType'; // Intentionally setting type to be an unknown type.
            yield expectAsync(operationProcessor.apply(createOperationData.anchoredOperationModel, didState))
                .toBeRejectedWith(new SidetreeError_1.default(ErrorCode_1.default.OperationProcessorUnknownOperationType));
        }));
        describe('applyCreateOperation()', () => {
            it('should not apply the create operation if a DID state already exists.', () => __awaiter(void 0, void 0, void 0, function* () {
                const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 2, transactionNumber: 2, operationIndex: 2 });
                const newDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, didState);
                expect(newDidState).toBeUndefined();
            }));
            it('should apply the create operation with { } as document if encoded data and suffix data do not match', () => __awaiter(void 0, void 0, void 0, function* () {
                verifyEncodedMultihashForContentSpy.and.returnValue(false);
                const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
                const newDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
                expect(newDidState.lastOperationTransactionNumber).toEqual(1);
                expect(newDidState.document).toEqual({});
                expect(newDidState.nextRecoveryCommitmentHash).toEqual(createOperationData.operationRequest.suffixData.recoveryCommitment);
            }));
            it('should apply the create operation with { } as document if delta does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
                const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
                spyOn(CreateOperation_1.default, 'parse').and.returnValue({ delta: undefined, suffixData: { recoveryCommitment: 'commitment' } }); // delta is undefined
                const newDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
                expect(newDidState.lastOperationTransactionNumber).toEqual(1);
                expect(newDidState.document).toEqual({});
                expect(newDidState.nextRecoveryCommitmentHash).toEqual('commitment');
            }));
            it('should apply the create operation with { } and advance update commitment as document if delta cannot be applied', () => __awaiter(void 0, void 0, void 0, function* () {
                const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
                spyOn(DocumentComposer_1.default, 'applyPatches').and.throwError('Expected test error');
                const newDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
                expect(newDidState.lastOperationTransactionNumber).toEqual(1);
                expect(newDidState.document).toEqual({});
                expect(newDidState.nextRecoveryCommitmentHash).toEqual(createOperationData.operationRequest.suffixData.recoveryCommitment);
                // advance update commitment
                expect(newDidState.nextUpdateCommitmentHash).toEqual(createOperationData.operationRequest.delta.updateCommitment);
            }));
            it('should apply the create operation with { } and undefined update commitment as document if delta is undefined', () => __awaiter(void 0, void 0, void 0, function* () {
                const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
                // modify parse to make delta undefined
                const parsedOperation = yield CreateOperation_1.default.parse(createOperationData.anchoredOperationModel.operationBuffer);
                parsedOperation.delta = undefined;
                spyOn(CreateOperation_1.default, 'parse').and.returnValue(Promise.resolve(parsedOperation));
                const newDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
                expect(newDidState.lastOperationTransactionNumber).toEqual(1);
                expect(newDidState.document).toEqual({});
                expect(newDidState.nextRecoveryCommitmentHash).toEqual(createOperationData.operationRequest.suffixData.recoveryCommitment);
                // update commitment is undefined
                expect(newDidState.nextUpdateCommitmentHash).toBeUndefined();
            }));
        });
        describe('applyUpdateOperation()', () => {
            it('should not apply update operation if update key and commitment are not pairs.', () => __awaiter(void 0, void 0, void 0, function* () {
                // Create an update using the create operation generated in `beforeEach()`.
                const [additionalKey] = yield OperationGenerator_1.default.generateKeyPair(`new-key1`);
                const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, (yield Jwk_1.default.generateEs256kKeyPair())[0], // this is a random bad key
                signingPrivateKey, additionalKey, OperationGenerator_1.default.generateRandomHash());
                const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
                const anchoredUpdateOperationModel = {
                    type: OperationType_1.default.Update,
                    didUniqueSuffix,
                    operationBuffer,
                    transactionTime: 2,
                    transactionNumber: 2,
                    operationIndex: 2
                };
                const newDidState = yield operationProcessor.apply(anchoredUpdateOperationModel, didState);
                expect(newDidState).toBeUndefined();
            }));
            it('should not apply update operation if signature is invalid.', () => __awaiter(void 0, void 0, void 0, function* () {
                // Create an update using the create operation generated in `beforeEach()`.
                const [additionalKey] = yield OperationGenerator_1.default.generateKeyPair(`new-key1`);
                const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, signingPublicKey.publicKeyJwk, recoveryPrivateKey, // NOTE: Using recovery private key to generate an invalid signature.
                additionalKey, OperationGenerator_1.default.generateRandomHash());
                const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
                const anchoredUpdateOperationModel = {
                    type: OperationType_1.default.Update,
                    didUniqueSuffix,
                    operationBuffer,
                    transactionTime: 2,
                    transactionNumber: 2,
                    operationIndex: 2
                };
                const newDidState = yield operationProcessor.apply(anchoredUpdateOperationModel, didState);
                expect(newDidState).toBeUndefined();
            }));
            it('should not apply update operation if updateKey is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
                // Create an update using the create operation generated in `beforeEach()`.
                const [additionalKey] = yield OperationGenerator_1.default.generateKeyPair(`new-key1`);
                const [invalidUpdateKey] = yield OperationGenerator_1.default.generateKeyPair('invalid');
                const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, invalidUpdateKey.publicKeyJwk, signingPrivateKey, additionalKey, OperationGenerator_1.default.generateRandomHash());
                const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
                const anchoredUpdateOperationModel = {
                    type: OperationType_1.default.Update,
                    didUniqueSuffix,
                    operationBuffer,
                    transactionTime: 2,
                    transactionNumber: 2,
                    operationIndex: 2
                };
                const newDidState = yield operationProcessor.apply(anchoredUpdateOperationModel, didState);
                expect(newDidState).toBeUndefined();
            }));
            it('should not apply update operation if delta is undefined', () => __awaiter(void 0, void 0, void 0, function* () {
                // Create an update using the create operation generated in `beforeEach()`.
                const [additionalKey] = yield OperationGenerator_1.default.generateKeyPair(`new-key1`);
                const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, signingPublicKey.publicKeyJwk, signingPrivateKey, additionalKey, OperationGenerator_1.default.generateRandomHash());
                const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
                const anchoredUpdateOperationModel = {
                    type: OperationType_1.default.Update,
                    didUniqueSuffix,
                    operationBuffer,
                    transactionTime: 2,
                    transactionNumber: 2,
                    operationIndex: 2
                };
                const modifiedUpdateOperation = yield UpdateOperation_1.default.parse(anchoredUpdateOperationModel.operationBuffer);
                // set to undefined to satisfy the test condition of it being undefined
                modifiedUpdateOperation.delta = undefined;
                // mock the function to return the modified result
                spyOn(UpdateOperation_1.default, 'parse').and.returnValue(Promise.resolve(modifiedUpdateOperation));
                const newDidState = yield operationProcessor.apply(anchoredUpdateOperationModel, didState);
                expect(newDidState).toBeUndefined();
            }));
            it('should not apply update operation if delta does not match delta hash', () => __awaiter(void 0, void 0, void 0, function* () {
                // Create an update using the create operation generated in `beforeEach()`.
                const [additionalKey] = yield OperationGenerator_1.default.generateKeyPair(`new-key1`);
                const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, signingPublicKey.publicKeyJwk, signingPrivateKey, additionalKey, OperationGenerator_1.default.generateRandomHash());
                const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
                const anchoredUpdateOperationModel = {
                    type: OperationType_1.default.Update,
                    didUniqueSuffix,
                    operationBuffer,
                    transactionTime: 2,
                    transactionNumber: 2,
                    operationIndex: 2
                };
                const modifiedUpdateOperation = yield UpdateOperation_1.default.parse(anchoredUpdateOperationModel.operationBuffer);
                // set to empty object to satisfy the test condition of not matching delta hash
                modifiedUpdateOperation.delta = {};
                // mock the function to return the modified result
                spyOn(UpdateOperation_1.default, 'parse').and.returnValue(Promise.resolve(modifiedUpdateOperation));
                const newDidState = yield operationProcessor.apply(anchoredUpdateOperationModel, didState);
                expect(newDidState).toBeUndefined();
            }));
            it('should treat update a success and increment update commitment if any patch failed to apply.', () => __awaiter(void 0, void 0, void 0, function* () {
                // Create an update using the create operation generated in `beforeEach()`.
                const [additionalKey] = yield OperationGenerator_1.default.generateKeyPair(`new-key1`);
                const nextUpdateCommitment = OperationGenerator_1.default.generateRandomHash();
                const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, signingPublicKey.publicKeyJwk, signingPrivateKey, additionalKey, nextUpdateCommitment);
                const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
                const anchoredUpdateOperationModel = {
                    type: OperationType_1.default.Update,
                    didUniqueSuffix,
                    operationBuffer,
                    transactionTime: 2,
                    transactionNumber: 2,
                    operationIndex: 2
                };
                // Intentionally modifying the document before failing update patches to test original document is not modified.
                spyOn(DocumentComposer_1.default, 'applyPatches').and.callFake((document, _patch) => {
                    document.publicKeys = [];
                    throw new Error('any error');
                });
                // The expected outcome of patch application failure (but all integrity checks including schema checks are passed )is:
                // 1. Operation is considered successful.
                // 2. Update commitment is updated/incremented.
                // 3. DID document state remains the unchanged (same as prior to the patches being applied).
                const deepCopyOriginalDocument = JsObject_1.default.deepCopyObject(didState.document);
                const newDidState = yield operationProcessor.apply(anchoredUpdateOperationModel, didState);
                expect(newDidState.lastOperationTransactionNumber).toEqual(2);
                expect(newDidState.nextUpdateCommitmentHash).toEqual(nextUpdateCommitment);
                // Expect the DID document to be unchanged.
                expect(newDidState.document).toEqual(deepCopyOriginalDocument);
            }));
        });
        describe('applyRecoverOperation()', () => {
            it('should not apply if recovery key hash is invalid.', () => __awaiter(void 0, void 0, void 0, function* () {
                const operationData = yield OperationGenerator_1.default.generateRecoverOperation({
                    didUniqueSuffix,
                    recoveryPrivateKey: signingPrivateKey // Intentionally an incorrect recovery key.
                });
                const anchoredRecoverOperationModel = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(operationData.recoverOperation, 2, 2, 2);
                const newDidState = yield operationProcessor.apply(anchoredRecoverOperationModel, didState);
                expect(newDidState).toBeUndefined();
            }));
            it('should not apply if recovery signature is invalid.', () => __awaiter(void 0, void 0, void 0, function* () {
                const operationData = yield OperationGenerator_1.default.generateRecoverOperation({
                    didUniqueSuffix,
                    recoveryPrivateKey
                });
                const anchoredRecoverOperationModel = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(operationData.recoverOperation, 2, 2, 2);
                const modifiedResult = yield RecoverOperation_1.default.parse(anchoredRecoverOperationModel.operationBuffer);
                // modify the result to make signature validation fail
                spyOn(modifiedResult.signedDataJws, 'verifySignature').and.returnValue(Promise.resolve(false));
                // mock updateOperation parse to return the modified result
                spyOn(RecoverOperation_1.default, 'parse').and.returnValue(Promise.resolve(modifiedResult));
                const newDidState = yield operationProcessor.apply(anchoredRecoverOperationModel, didState);
                expect(newDidState).toBeUndefined();
            }));
            it('should apply successfully with resultant document being { } and advanced commit reveal when document composer fails to apply patches.', () => __awaiter(void 0, void 0, void 0, function* () {
                const document = {};
                const [anyNewRecoveryPublicKey] = yield Jwk_1.default.generateEs256kKeyPair();
                const newUpdateCommitment = OperationGenerator_1.default.generateRandomHash();
                const recoverOperationRequest = yield OperationGenerator_1.default.createRecoverOperationRequest(didUniqueSuffix, recoveryPrivateKey, anyNewRecoveryPublicKey, newUpdateCommitment, document);
                const recoverOperation = yield RecoverOperation_1.default.parse(Buffer.from(JSON.stringify(recoverOperationRequest)));
                const anchoredRecoverOperationModel = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoverOperation, 2, 2, 2);
                spyOn(DocumentComposer_1.default, 'applyPatches').and.throwError('Expected test error');
                const newDidState = yield operationProcessor.apply(anchoredRecoverOperationModel, didState);
                expect(newDidState.lastOperationTransactionNumber).toEqual(2);
                expect(newDidState.document).toEqual({});
                const expectedNewRecoveryCommitment = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(anyNewRecoveryPublicKey);
                expect(newDidState.nextRecoveryCommitmentHash).toEqual(expectedNewRecoveryCommitment);
                expect(newDidState.nextUpdateCommitmentHash).toEqual(newUpdateCommitment);
            }));
            it('should still apply successfully with resultant document being { } if new document is in some unexpected format.', () => __awaiter(void 0, void 0, void 0, function* () {
                const document = 'unexpected document format';
                const [anyNewRecoveryPublicKey] = yield Jwk_1.default.generateEs256kKeyPair();
                const unusedNextUpdateCommitment = OperationGenerator_1.default.generateRandomHash();
                const recoverOperationRequest = yield OperationGenerator_1.default.createRecoverOperationRequest(didUniqueSuffix, recoveryPrivateKey, anyNewRecoveryPublicKey, unusedNextUpdateCommitment, document);
                const recoverOperation = yield RecoverOperation_1.default.parse(Buffer.from(JSON.stringify(recoverOperationRequest)));
                const anchoredRecoverOperationModel = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoverOperation, 2, 2, 2);
                const newDidState = yield operationProcessor.apply(anchoredRecoverOperationModel, didState);
                expect(newDidState.lastOperationTransactionNumber).toEqual(2);
                expect(newDidState.document).toEqual({});
                const expectedNewRecoveryCommitment = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(anyNewRecoveryPublicKey);
                expect(newDidState.nextRecoveryCommitmentHash).toEqual(expectedNewRecoveryCommitment);
            }));
            it('should still apply successfully with resultant document being { } if delta hash mismatch.', () => __awaiter(void 0, void 0, void 0, function* () {
                const document = { publicKeys: [] };
                const [anyNewRecoveryPublicKey] = yield Jwk_1.default.generateEs256kKeyPair();
                const unusedNextUpdateCommitment = OperationGenerator_1.default.generateRandomHash();
                const recoverOperationRequest = yield OperationGenerator_1.default.createRecoverOperationRequest(didUniqueSuffix, recoveryPrivateKey, anyNewRecoveryPublicKey, unusedNextUpdateCommitment, document);
                const recoverOperation = yield RecoverOperation_1.default.parse(Buffer.from(JSON.stringify(recoverOperationRequest)));
                const anchoredRecoverOperationModel = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoverOperation, 2, 2, 2);
                verifyEncodedMultihashForContentSpy.and.callFake((_content, expectedHash) => {
                    if (expectedHash === recoverOperation.signedData.deltaHash) {
                        // Intentionally failing recovery delta operation hash check.
                        return false;
                    }
                    else {
                        return true;
                    }
                });
                const newDidState = yield operationProcessor.apply(anchoredRecoverOperationModel, didState);
                expect(newDidState.lastOperationTransactionNumber).toEqual(2);
                expect(newDidState.document).toEqual({});
                const expectedNewRecoveryCommitment = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(anyNewRecoveryPublicKey);
                expect(newDidState.nextRecoveryCommitmentHash).toEqual(expectedNewRecoveryCommitment);
            }));
            it('should still apply successfully with resultant document being { } and update commitment not advanced if delta is undefined', () => __awaiter(void 0, void 0, void 0, function* () {
                const document = { publicKeys: [] };
                const [anyNewRecoveryPublicKey] = yield Jwk_1.default.generateEs256kKeyPair();
                const unusedNextUpdateCommitment = OperationGenerator_1.default.generateRandomHash();
                const recoverOperationRequest = yield OperationGenerator_1.default.createRecoverOperationRequest(didUniqueSuffix, recoveryPrivateKey, anyNewRecoveryPublicKey, unusedNextUpdateCommitment, document);
                const recoverOperation = yield RecoverOperation_1.default.parse(Buffer.from(JSON.stringify(recoverOperationRequest)));
                const anchoredRecoverOperationModel = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoverOperation, 2, 2, 2);
                // mock to make delta undefined
                const parsedRecoveryOperation = yield RecoverOperation_1.default.parse(anchoredRecoverOperationModel.operationBuffer);
                parsedRecoveryOperation.delta = undefined;
                spyOn(RecoverOperation_1.default, 'parse').and.returnValue(Promise.resolve(parsedRecoveryOperation));
                const newDidState = yield operationProcessor.apply(anchoredRecoverOperationModel, didState);
                expect(newDidState.lastOperationTransactionNumber).toEqual(2);
                expect(newDidState.document).toEqual({});
                const expectedNewRecoveryCommitment = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(anyNewRecoveryPublicKey);
                expect(newDidState.nextRecoveryCommitmentHash).toEqual(expectedNewRecoveryCommitment);
                expect(newDidState.nextUpdateCommitmentHash).toBeUndefined();
            }));
        });
        describe('applyDeactivateOperation()', () => {
            it('should not apply if calculated recovery key hash is invalid.', () => __awaiter(void 0, void 0, void 0, function* () {
                // Creating and signing a deactivate operation using an invalid/incorrect recovery key.
                const [, anyIncorrectRecoveryPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair();
                const deactivateOperationData = yield OperationGenerator_1.default.createDeactivateOperation(didUniqueSuffix, anyIncorrectRecoveryPrivateKey);
                const deactivateOperation = yield DeactivateOperation_1.default.parse(deactivateOperationData.operationBuffer);
                const anchoredDeactivateOperationModel = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(deactivateOperation, 2, 2, 2);
                const newDidState = yield operationProcessor.apply(anchoredDeactivateOperationModel, didState);
                // Expecting resulting DID state to still be the same as prior to attempting to apply the invalid deactivate operation.
                expect(newDidState).toBeUndefined();
            }));
            it('should not apply if signature is invalid.', () => __awaiter(void 0, void 0, void 0, function* () {
                // Creating and signing a deactivate operation using an invalid/incorrect recovery key.
                const deactivateOperationData = yield OperationGenerator_1.default.createDeactivateOperation(didUniqueSuffix, recoveryPrivateKey);
                const deactivateOperation = yield DeactivateOperation_1.default.parse(deactivateOperationData.operationBuffer);
                const anchoredDeactivateOperationModel = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(deactivateOperation, 2, 2, 2);
                // Mock to make signature validation fail
                const modifiedResult = yield DeactivateOperation_1.default.parse(anchoredDeactivateOperationModel.operationBuffer);
                spyOn(modifiedResult.signedDataJws, 'verifySignature').and.returnValue(Promise.resolve(false));
                spyOn(DeactivateOperation_1.default, 'parse').and.returnValue(Promise.resolve(modifiedResult));
                const newDidState = yield operationProcessor.apply(anchoredDeactivateOperationModel, didState);
                // Expecting resulting DID state to still be the same as prior to attempting to apply the invalid deactivate operation.
                expect(newDidState).toBeUndefined();
            }));
        });
    });
    describe('getMultihashRevealValue()', () => {
        it('should throw if a create operation is given.', () => __awaiter(void 0, void 0, void 0, function* () {
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            yield expectAsync(operationProcessor.getMultihashRevealValue(createOperationData.anchoredOperationModel))
                .toBeRejectedWith(new SidetreeError_1.default(ErrorCode_1.default.OperationProcessorCreateOperationDoesNotHaveRevealValue));
        }));
    });
}));
//# sourceMappingURL=OperationProcessor.spec.js.map