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
const afterCreate = require("../vectors/resolution/afterCreate.json");
const afterDeactivate = require("../vectors/resolution/afterDeactivate.json");
const afterRecover = require("../vectors/resolution/afterRecover.json");
const afterUpdate = require("../vectors/resolution/afterUpdate.json");
const generatedFixture = require("../vectors/generated.json");
const CreateOperation_1 = require("../../lib/core/versions/latest/CreateOperation");
const DeactivateOperation_1 = require("../../lib/core/versions/latest/DeactivateOperation");
const Did_1 = require("../../lib/core/versions/latest/Did");
const Document_1 = require("../utils/Document");
const DocumentComposer_1 = require("../../lib/core/versions/latest/DocumentComposer");
const Fixture_1 = require("../utils/Fixture");
const Jwk_1 = require("../../lib/core/versions/latest/util/Jwk");
const MockOperationStore_1 = require("../mocks/MockOperationStore");
const MockVersionManager_1 = require("../mocks/MockVersionManager");
const Multihash_1 = require("../../lib/core/versions/latest/Multihash");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const OperationProcessor_1 = require("../../lib/core/versions/latest/OperationProcessor");
const OperationType_1 = require("../../lib/core/enums/OperationType");
const PatchAction_1 = require("../../lib/core/versions/latest/PatchAction");
const ProtocolParameters_1 = require("../../lib/core/versions/latest/ProtocolParameters");
const RecoverOperation_1 = require("../../lib/core/versions/latest/RecoverOperation");
const Resolver_1 = require("../../lib/core/Resolver");
const OVERWRITE_FIXTURES = false;
describe('Resolver', () => {
    let resolver;
    let operationProcessor;
    let operationStore;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Make sure the mock version manager always returns the same operation processor in the test.
        operationProcessor = new OperationProcessor_1.default();
        const versionManager = new MockVersionManager_1.default();
        spyOn(versionManager, 'getOperationProcessor').and.returnValue(operationProcessor);
        operationStore = new MockOperationStore_1.default();
        resolver = new Resolver_1.default(versionManager, operationStore);
    }));
    describe('Resolving against test vectors', () => {
        it('should resolve create operation', () => __awaiter(void 0, void 0, void 0, function* () {
            const operationBuffer = Buffer.from(JSON.stringify(generatedFixture.create.operationRequest));
            const createOperation = yield CreateOperation_1.default.parse(operationBuffer);
            const didUniqueSuffix = createOperation.didUniqueSuffix;
            const anchoredOperationModel = {
                type: OperationType_1.default.Create,
                didUniqueSuffix: didUniqueSuffix,
                operationBuffer,
                transactionNumber: 1,
                transactionTime: 1,
                operationIndex: 1
            };
            yield operationStore.insertOrReplace([anchoredOperationModel]);
            const published = true;
            const didState = yield resolver.resolve(didUniqueSuffix);
            const did = yield Did_1.default.create(`did:sidetree:${didUniqueSuffix}`, 'sidetree');
            const resultingDocument = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            Fixture_1.default.fixtureDriftHelper(resultingDocument, afterCreate, 'resolution/afterCreate.json', OVERWRITE_FIXTURES);
            expect(resultingDocument).toEqual(afterCreate);
        }));
        it('should resolve DID that has an update operation', () => __awaiter(void 0, void 0, void 0, function* () {
            const operationBuffer = Buffer.from(JSON.stringify(generatedFixture.create.operationRequest));
            const createOperation = yield CreateOperation_1.default.parse(operationBuffer);
            const didUniqueSuffix = createOperation.didUniqueSuffix;
            const anchoredOperationModel = {
                type: OperationType_1.default.Create,
                didUniqueSuffix: didUniqueSuffix,
                operationBuffer,
                transactionNumber: 1,
                transactionTime: 1,
                operationIndex: 1
            };
            yield operationStore.insertOrReplace([anchoredOperationModel]);
            const updateOperation = Buffer.from(JSON.stringify(generatedFixture.update.operationRequest));
            const anchoredUpdateOperation = {
                type: OperationType_1.default.Update,
                didUniqueSuffix,
                operationBuffer: updateOperation,
                transactionTime: 2,
                transactionNumber: 2,
                operationIndex: 2
            };
            yield operationStore.insertOrReplace([anchoredUpdateOperation]);
            const published = true;
            const didState = yield resolver.resolve(didUniqueSuffix);
            const did = yield Did_1.default.create(`did:sidetree:${didUniqueSuffix}`, 'sidetree');
            const resultingDocument = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            Fixture_1.default.fixtureDriftHelper(resultingDocument, afterUpdate, 'resolution/afterUpdate.json', OVERWRITE_FIXTURES);
            expect(resultingDocument).toEqual(afterUpdate);
        }));
        it('should resolve DID that has a recover operation', () => __awaiter(void 0, void 0, void 0, function* () {
            const operationBuffer = Buffer.from(JSON.stringify(generatedFixture.create.operationRequest));
            const createOperation = yield CreateOperation_1.default.parse(operationBuffer);
            const didUniqueSuffix = createOperation.didUniqueSuffix;
            const anchoredOperationModel = {
                type: OperationType_1.default.Create,
                didUniqueSuffix: didUniqueSuffix,
                operationBuffer,
                transactionNumber: 1,
                transactionTime: 1,
                operationIndex: 1
            };
            yield operationStore.insertOrReplace([anchoredOperationModel]);
            const recoverOperationBuffer = Buffer.from(JSON.stringify(generatedFixture.recover.operationRequest));
            const recoverOperation = yield RecoverOperation_1.default.parse(recoverOperationBuffer);
            const anchoredRecoverOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoverOperation, 2, 2, 2);
            yield operationStore.insertOrReplace([anchoredRecoverOperation]);
            const published = true;
            const didState = yield resolver.resolve(didUniqueSuffix);
            const did = yield Did_1.default.create(`did:sidetree:${didUniqueSuffix}`, 'sidetree');
            const resultingDocument = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            Fixture_1.default.fixtureDriftHelper(resultingDocument, afterRecover, 'resolution/afterRecover.json', OVERWRITE_FIXTURES);
            expect(resultingDocument).toEqual(afterRecover);
        }));
        it('should resolve DID that has a deactivate operation', () => __awaiter(void 0, void 0, void 0, function* () {
            const operationBuffer = Buffer.from(JSON.stringify(generatedFixture.create.operationRequest));
            const createOperation = yield CreateOperation_1.default.parse(operationBuffer);
            const didUniqueSuffix = createOperation.didUniqueSuffix;
            const anchoredOperationModel = {
                type: OperationType_1.default.Create,
                didUniqueSuffix: didUniqueSuffix,
                operationBuffer,
                transactionNumber: 1,
                transactionTime: 1,
                operationIndex: 1
            };
            yield operationStore.insertOrReplace([anchoredOperationModel]);
            const updateOperation = Buffer.from(JSON.stringify(generatedFixture.update.operationRequest));
            const anchoredUpdateOperation = {
                type: OperationType_1.default.Update,
                didUniqueSuffix,
                operationBuffer: updateOperation,
                transactionTime: 2,
                transactionNumber: 2,
                operationIndex: 2
            };
            yield operationStore.insertOrReplace([anchoredUpdateOperation]);
            const recoverOperationBuffer = Buffer.from(JSON.stringify(generatedFixture.recover.operationRequest));
            const recoverOperation0 = yield RecoverOperation_1.default.parse(recoverOperationBuffer);
            const anchoredRecoverOperation0 = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoverOperation0, 3, 3, 3);
            yield operationStore.insertOrReplace([anchoredRecoverOperation0]);
            const deactivateOperationBuffer = Buffer.from(JSON.stringify(generatedFixture.deactivate.operationRequest));
            const deactivateOperation = yield DeactivateOperation_1.default.parse(deactivateOperationBuffer);
            const anchoredDeactivateOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(deactivateOperation, 4, 4, 4);
            yield operationStore.insertOrReplace([anchoredDeactivateOperation]);
            const didState = yield resolver.resolve(didUniqueSuffix);
            const published = true;
            const did = yield Did_1.default.create(`did:sidetree:${didUniqueSuffix}`, 'sidetree');
            const resultingDocument = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            Fixture_1.default.fixtureDriftHelper(resultingDocument, afterDeactivate, 'resolution/afterDeactivate.json', OVERWRITE_FIXTURES);
            expect(resultingDocument).toEqual(afterDeactivate);
        }));
    });
    describe('Recovery operation', () => {
        it('should apply correctly with updates that came before and after the recover operation.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Generate key(s) and service(s) to be included in the DID Document.
            const [recoveryPublicKey, recoveryPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair();
            const [signingPublicKey, signingPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('signingKey');
            const services = OperationGenerator_1.default.generateServices(['dummyHubUri1']);
            // Create the initial create operation and insert it to the operation store.
            const operationBuffer = yield OperationGenerator_1.default.generateCreateOperationBuffer(recoveryPublicKey, signingPublicKey, services);
            const createOperation = yield CreateOperation_1.default.parse(operationBuffer);
            const anchoredOperationModel = {
                type: OperationType_1.default.Create,
                didUniqueSuffix: createOperation.didUniqueSuffix,
                operationBuffer,
                transactionNumber: 1,
                transactionTime: 1,
                operationIndex: 1
            };
            const didUniqueSuffix = createOperation.didUniqueSuffix;
            yield operationStore.insertOrReplace([anchoredOperationModel]);
            // Create an update operation and insert it to the operation store.
            const [additionalKey] = yield OperationGenerator_1.default.generateKeyPair(`new-key1`);
            let [nextUpdateKey, nextUpdatePrivateKey] = yield OperationGenerator_1.default.generateKeyPair(`next-update-key`);
            const updateOperation1PriorRecovery = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, signingPublicKey.publicKeyJwk, signingPrivateKey, additionalKey, Multihash_1.default.canonicalizeThenDoubleHashThenEncode(nextUpdateKey.publicKeyJwk));
            const updateOperation1BufferPriorRecovery = Buffer.from(JSON.stringify(updateOperation1PriorRecovery));
            const anchoredUpdateOperation1PriorRecovery = {
                type: OperationType_1.default.Update,
                didUniqueSuffix,
                operationBuffer: updateOperation1BufferPriorRecovery,
                transactionTime: 2,
                transactionNumber: 2,
                operationIndex: 2
            };
            yield operationStore.insertOrReplace([anchoredUpdateOperation1PriorRecovery]);
            // Create another update operation and insert it to the operation store.
            const updatePayload2PriorRecovery = yield OperationGenerator_1.default.generateUpdateOperationRequestForServices(didUniqueSuffix, nextUpdateKey.publicKeyJwk, nextUpdatePrivateKey, OperationGenerator_1.default.generateRandomHash(), 'dummyUri2', []);
            const updateOperation2BufferPriorRecovery = Buffer.from(JSON.stringify(updatePayload2PriorRecovery));
            const anchoredUpdateOperation2PriorRecovery = {
                type: OperationType_1.default.Update,
                didUniqueSuffix,
                operationBuffer: updateOperation2BufferPriorRecovery,
                transactionTime: 3,
                transactionNumber: 3,
                operationIndex: 3
            };
            yield operationStore.insertOrReplace([anchoredUpdateOperation2PriorRecovery]);
            // Sanity check to make sure the DID Document with update is resolved correctly.
            let didState = yield resolver.resolve(didUniqueSuffix);
            expect(didState.document.publicKeys.length).toEqual(2);
            expect(didState.document.services.length).toEqual(2);
            // Create new keys used for new document for recovery request.
            const [newRecoveryPublicKey] = yield Jwk_1.default.generateEs256kKeyPair();
            const [newSigningPublicKey, newSigningPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('newSigningKey');
            const newServices = OperationGenerator_1.default.generateServices(['newDummyHubUri1']);
            // Create the recover operation and insert it to the operation store.
            const recoverOperationJson = yield OperationGenerator_1.default.generateRecoverOperationRequest(didUniqueSuffix, recoveryPrivateKey, newRecoveryPublicKey, newSigningPublicKey, newServices, [newSigningPublicKey]);
            const recoverOperationBuffer = Buffer.from(JSON.stringify(recoverOperationJson));
            const recoverOperation = yield RecoverOperation_1.default.parse(recoverOperationBuffer);
            const anchoredRecoverOperation = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoverOperation, 4, 4, 4);
            yield operationStore.insertOrReplace([anchoredRecoverOperation]);
            // Create an update operation after the recover operation.
            const [newKey2ForUpdate1AfterRecovery] = yield OperationGenerator_1.default.generateKeyPair(`newKey2Updte1PostRec`);
            [nextUpdateKey, nextUpdatePrivateKey] = yield OperationGenerator_1.default.generateKeyPair(`next-update-key`);
            const updateOperation1AfterRecovery = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(didUniqueSuffix, newSigningPublicKey.publicKeyJwk, newSigningPrivateKey, newKey2ForUpdate1AfterRecovery, Multihash_1.default.canonicalizeThenDoubleHashThenEncode(nextUpdateKey.publicKeyJwk));
            const updateOperation1BufferAfterRecovery = Buffer.from(JSON.stringify(updateOperation1AfterRecovery));
            const anchoredUpdateOperation1AfterRecovery = {
                type: OperationType_1.default.Update,
                didUniqueSuffix,
                operationBuffer: updateOperation1BufferAfterRecovery,
                transactionTime: 5,
                transactionNumber: 5,
                operationIndex: 5
            };
            yield operationStore.insertOrReplace([anchoredUpdateOperation1AfterRecovery]);
            // Create another update and insert it to the operation store.
            const updatePayload2AfterRecovery = yield OperationGenerator_1.default.generateUpdateOperationRequestForServices(didUniqueSuffix, nextUpdateKey.publicKeyJwk, nextUpdatePrivateKey, OperationGenerator_1.default.generateRandomHash(), 'newDummyHubUri2', ['newDummyHubUri1']);
            const updateOperation2BufferAfterRecovery = Buffer.from(JSON.stringify(updatePayload2AfterRecovery));
            const anchoredUpdateOperation2AfterRecovery = {
                type: OperationType_1.default.Update,
                didUniqueSuffix,
                operationBuffer: updateOperation2BufferAfterRecovery,
                transactionTime: 6,
                transactionNumber: 6,
                operationIndex: 6
            };
            yield operationStore.insertOrReplace([anchoredUpdateOperation2AfterRecovery]);
            // Validate recover operation getting applied.
            didState = (yield resolver.resolve(didUniqueSuffix));
            const document = didState.document;
            expect(document).toBeDefined();
            const actualNewSigningPublicKey1 = Document_1.default.getPublicKey(document, 'newSigningKey');
            const actualNewSigningPublicKey2 = Document_1.default.getPublicKey(document, 'newKey2Updte1PostRec');
            expect(actualNewSigningPublicKey1).toBeDefined();
            expect(actualNewSigningPublicKey2).toBeDefined();
            expect(document.publicKeys.length).toEqual(2);
            expect(actualNewSigningPublicKey1.publicKeyJwk).toEqual(newSigningPublicKey.publicKeyJwk);
            expect(actualNewSigningPublicKey2.publicKeyJwk).toEqual(newKey2ForUpdate1AfterRecovery.publicKeyJwk);
            expect(document.services).toBeDefined();
            expect(document.services.length).toEqual(1);
            expect(document.services[0].serviceEndpoint).toBeDefined();
            expect(document.services[0].id).toEqual('newDummyHubUri2');
        }));
    });
    describe('Hash algorithm change between operations', () => {
        it('should apply a subsequent update that uses a different hash algorithm correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            ProtocolParameters_1.default.hashAlgorithmsInMultihashCode = [18, 22];
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            yield operationStore.insertOrReplace([createOperationData.anchoredOperationModel]);
            // Create an update operation with a DIFFERENT hash algorithm.
            const didSuffix = createOperationData.anchoredOperationModel.didUniqueSuffix;
            const multihashAlgorithmCodeToUse = 22; // SHA3
            const multihashAlgorithmForRevealValue = 18; // SHA2
            const updateOperationData = yield OperationGenerator_1.default.generateUpdateOperation(didSuffix, createOperationData.updatePublicKey, createOperationData.updatePrivateKey, multihashAlgorithmCodeToUse, multihashAlgorithmForRevealValue);
            const anchoredUpdateOperation = yield OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(updateOperationData.updateOperation, 2, 2, 2);
            yield operationStore.insertOrReplace([anchoredUpdateOperation]);
            const didState = yield resolver.resolve(didSuffix);
            expect(didState.document.publicKeys.length).toEqual(2);
            expect(didState.document.publicKeys[1].id).toEqual(updateOperationData.additionalKeyId);
        }));
    });
    describe('applyRecoverAndDeactivateOperations()', () => {
        it('should apply earliest recover operations if multiple operations are valid with same reveal.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setting up initial DID state for the test.
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            const initialDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
            // Generate 3 anchored recover operations with the same reveal value but different anchored time.
            const recoveryOperation1Data = yield OperationGenerator_1.default.generateRecoverOperation({
                didUniqueSuffix: createOperationData.createOperation.didUniqueSuffix,
                recoveryPrivateKey: createOperationData.recoveryPrivateKey
            });
            const recoveryOperation2Data = yield OperationGenerator_1.default.generateRecoverOperation({
                didUniqueSuffix: createOperationData.createOperation.didUniqueSuffix,
                recoveryPrivateKey: createOperationData.recoveryPrivateKey
            });
            const recoveryOperation3Data = yield OperationGenerator_1.default.generateRecoverOperation({
                didUniqueSuffix: createOperationData.createOperation.didUniqueSuffix,
                recoveryPrivateKey: createOperationData.recoveryPrivateKey
            });
            const recoveryOperation1 = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoveryOperation1Data.recoverOperation, 2, 2, 2);
            const recoveryOperation2 = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoveryOperation2Data.recoverOperation, 3, 3, 3);
            const recoveryOperation3 = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoveryOperation3Data.recoverOperation, 4, 4, 4);
            // Intentionally insert earliest valid recover operation in between the other two operations to test sorting.
            const recoveryCommitValueToOperationMap = new Map();
            const nextRecoveryCommitment = createOperationData.createOperation.suffixData.recoveryCommitment;
            recoveryCommitValueToOperationMap.set(nextRecoveryCommitment, [recoveryOperation3, recoveryOperation1, recoveryOperation2]);
            const newDidState = yield resolver.applyRecoverAndDeactivateOperations(initialDidState, recoveryCommitValueToOperationMap);
            // Expecting the new state to contain info of the first recovery operation.
            expect(newDidState.lastOperationTransactionNumber).toEqual(2);
            expect(newDidState.nextRecoveryCommitmentHash).toEqual(recoveryOperation1Data.recoverOperation.signedData.recoveryCommitment);
            done();
        }));
        it('should short circuit and return as soon as the end of the recovery/deactivate operation chain is reached.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setting up initial DID state for the test.
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            const initialDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
            const recoveryOperation1Data = yield OperationGenerator_1.default.generateRecoverOperation({
                didUniqueSuffix: createOperationData.createOperation.didUniqueSuffix,
                recoveryPrivateKey: createOperationData.recoveryPrivateKey
            });
            const recoveryOperation1 = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(recoveryOperation1Data.recoverOperation, 2, 2, 2);
            const recoveryCommitValueToOperationMap = new Map();
            const nextRecoveryCommitment = createOperationData.createOperation.suffixData.recoveryCommitment;
            recoveryCommitValueToOperationMap.set(nextRecoveryCommitment, [recoveryOperation1]);
            spyOn(resolver, 'applyFirstValidOperation').and.returnValue(Promise.resolve(undefined));
            const newDidState = yield resolver.applyRecoverAndDeactivateOperations(initialDidState, recoveryCommitValueToOperationMap);
            expect(newDidState.lastOperationTransactionNumber).toEqual(1);
            expect(newDidState.nextRecoveryCommitmentHash).toEqual(createOperationData.operationRequest.suffixData.recoveryCommitment);
            done();
        }));
        it('should not allow reuse of commit value - operation referencing itself.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setting up initial DID state for the test.
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            const initialDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
            const didSuffix = createOperationData.createOperation.didUniqueSuffix;
            // Create the 1st recover operation.
            const documentFor1stRecovery = {};
            const recovery1Request = yield OperationGenerator_1.default.createRecoverOperationRequest(createOperationData.createOperation.didUniqueSuffix, createOperationData.recoveryPrivateKey, createOperationData.recoveryPublicKey, // Intentionally reuse the same recovery key causing a commit-reveal value loop.
            OperationGenerator_1.default.generateRandomHash(), documentFor1stRecovery);
            const anchoredRecovery1 = OperationGenerator_1.default.createAnchoredOperationModelFromRequest(didSuffix, recovery1Request, 2, 2, 2);
            const recoveryCommitValueToOperationMap = yield resolver.constructCommitValueToOperationLookupMap([anchoredRecovery1]);
            const newDidState = yield resolver.applyRecoverAndDeactivateOperations(initialDidState, recoveryCommitValueToOperationMap);
            // Expecting the new state to contain info of the initial create operation only,
            // because the 2nd operation is invalid due to its reuse/circular reference of commitment hash.
            expect(newDidState.lastOperationTransactionNumber).toEqual(1);
            done();
        }));
        it('should not allow reuse of commit value - operation referencing an earlier operation.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setting up initial DID state for the test.
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            const initialDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
            const didSuffix = createOperationData.createOperation.didUniqueSuffix;
            // Create the 1st recover operation.
            const [publicKeyFor2ndRecovery, privateKeyFor2ndRecovery] = yield Jwk_1.default.generateEs256kKeyPair();
            const recovery1Request = yield OperationGenerator_1.default.createRecoverOperationRequest(createOperationData.createOperation.didUniqueSuffix, createOperationData.recoveryPrivateKey, publicKeyFor2ndRecovery, OperationGenerator_1.default.generateRandomHash(), // Unused next update commitment.
            {});
            const anchoredRecovery1 = OperationGenerator_1.default.createAnchoredOperationModelFromRequest(didSuffix, recovery1Request, 11, 11, 11);
            // Create the 2nd recovery.
            const recovery2Request = yield OperationGenerator_1.default.createRecoverOperationRequest(createOperationData.createOperation.didUniqueSuffix, privateKeyFor2ndRecovery, createOperationData.recoveryPublicKey, // Intentionally reuse the same recovery key in the create operation causing a commit-reveal value loop.
            OperationGenerator_1.default.generateRandomHash(), // Unused next update commitment.
            {});
            const anchoredRecovery2 = OperationGenerator_1.default.createAnchoredOperationModelFromRequest(didSuffix, recovery2Request, 22, 22, 22);
            const commitValueToOperationMap = yield resolver.constructCommitValueToOperationLookupMap([anchoredRecovery1, anchoredRecovery2]);
            const newDidState = yield resolver.applyRecoverAndDeactivateOperations(initialDidState, commitValueToOperationMap);
            // Expecting the new state to contain info of the first recover operation only,
            // because the 2nd recover operation is invalid due to its reuse/circular reference of commitment hash.
            expect(newDidState.lastOperationTransactionNumber).toEqual(11);
            done();
        }));
    });
    describe('applyUpdateOperations()', () => {
        it('should apply earliest update operations if multiple operations are valid with same reveal.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setting up initial DID state for the test.
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            const initialDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
            // Generate 3 anchored update operations with the same reveal value but different anchored time.
            const updateOperation1Data = yield OperationGenerator_1.default.generateUpdateOperation(createOperationData.createOperation.didUniqueSuffix, createOperationData.updatePublicKey, createOperationData.updatePrivateKey);
            const updateOperation2Data = yield OperationGenerator_1.default.generateUpdateOperation(createOperationData.createOperation.didUniqueSuffix, createOperationData.updatePublicKey, createOperationData.updatePrivateKey);
            const updateOperation3Data = yield OperationGenerator_1.default.generateUpdateOperation(createOperationData.createOperation.didUniqueSuffix, createOperationData.updatePublicKey, createOperationData.updatePrivateKey);
            const updateOperation1 = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(updateOperation1Data.updateOperation, 2, 2, 2);
            const updateOperation2 = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(updateOperation2Data.updateOperation, 3, 3, 3);
            const updateOperation3 = OperationGenerator_1.default.createAnchoredOperationModelFromOperationModel(updateOperation3Data.updateOperation, 4, 4, 4);
            // Intentionally insert earliest valid update operation in between the other two operations to test sorting.
            // Intentionally using the resolver's map construction method to test operations with the same reveal value are placed in the same array.
            const updateCommitValueToOperationMap = yield resolver.constructCommitValueToOperationLookupMap([updateOperation3, updateOperation1, updateOperation2]);
            const nextUpdateCommitment = createOperationData.createOperation.delta.updateCommitment;
            const updatesWithSameReveal = updateCommitValueToOperationMap.get(nextUpdateCommitment);
            expect(updatesWithSameReveal).toBeDefined();
            expect(updatesWithSameReveal.length).toEqual(3);
            const newDidState = yield resolver.applyUpdateOperations(initialDidState, updateCommitValueToOperationMap);
            // Expecting the new state to contain info of the first update operation.
            expect(newDidState.lastOperationTransactionNumber).toEqual(2);
            expect(newDidState.nextUpdateCommitmentHash).toEqual(updateOperation1Data.updateOperation.delta.updateCommitment);
            done();
        }));
        it('should not allow reuse of commit value - operation referencing itself.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setting up initial DID state for the test.
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            const initialDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
            const didSuffix = createOperationData.createOperation.didUniqueSuffix;
            // Create the 1st update.
            // Intentionally reuse the same update key causing a commit-reveal value loop.
            const commitmentHashFor2ndUpdate = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(createOperationData.updatePublicKey);
            const patchesFor1stUpdate = [{
                    action: PatchAction_1.default.Replace,
                    document: {
                        services: [{
                                id: 'someService',
                                type: 'someServiceType',
                                serviceEndpoint: 'https://www.service1.com'
                            }]
                    }
                }];
            const update1Request = yield OperationGenerator_1.default.createUpdateOperationRequest(createOperationData.createOperation.didUniqueSuffix, createOperationData.updatePublicKey, createOperationData.updatePrivateKey, commitmentHashFor2ndUpdate, patchesFor1stUpdate);
            const anchoredUpdate1 = OperationGenerator_1.default.createAnchoredOperationModelFromRequest(didSuffix, update1Request, 2, 2, 2);
            const updateCommitValueToOperationMap = yield resolver.constructCommitValueToOperationLookupMap([anchoredUpdate1]);
            const newDidState = yield resolver.applyUpdateOperations(initialDidState, updateCommitValueToOperationMap);
            // Expecting the new state to contain info of the initial create operation only,
            // because the 2nd operation is invalid due to its reuse/circular reference of commitment hash.
            expect(newDidState.lastOperationTransactionNumber).toEqual(1);
            done();
        }));
        it('should not allow reuse of commit value - operation referencing an earlier operation.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Setting up initial DID state for the test.
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            const initialDidState = yield operationProcessor.apply(createOperationData.anchoredOperationModel, undefined);
            const didSuffix = createOperationData.createOperation.didUniqueSuffix;
            // Create the 1st update.
            const [publicKeyFor2ndUpdate, privateKeyFor2ndUpdate] = yield Jwk_1.default.generateEs256kKeyPair();
            const commitmentHashFor2ndUpdate = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(publicKeyFor2ndUpdate);
            const patchesFor1stUpdate = [{
                    action: PatchAction_1.default.Replace,
                    document: {
                        services: [{
                                id: 'someService',
                                type: 'someServiceType',
                                serviceEndpoint: 'https://www.service1.com'
                            }]
                    }
                }];
            const update1Request = yield OperationGenerator_1.default.createUpdateOperationRequest(createOperationData.createOperation.didUniqueSuffix, createOperationData.updatePublicKey, createOperationData.updatePrivateKey, commitmentHashFor2ndUpdate, patchesFor1stUpdate);
            const anchoredUpdate1 = OperationGenerator_1.default.createAnchoredOperationModelFromRequest(didSuffix, update1Request, 11, 11, 11);
            // Create the 2nd update.
            // Intentionally reuse the same update key causing a commit-reveal value loop.
            const commitmentHashFor3rdUpdate = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(createOperationData.updatePublicKey);
            const patchesFor2ndUpdate = [{
                    action: PatchAction_1.default.Replace,
                    document: {
                        services: [{
                                id: 'someService',
                                type: 'someServiceType',
                                serviceEndpoint: 'https://www.service2.com'
                            }]
                    }
                }];
            const update2Request = yield OperationGenerator_1.default.createUpdateOperationRequest(createOperationData.createOperation.didUniqueSuffix, publicKeyFor2ndUpdate, privateKeyFor2ndUpdate, commitmentHashFor3rdUpdate, patchesFor2ndUpdate);
            const anchoredUpdate2 = OperationGenerator_1.default.createAnchoredOperationModelFromRequest(didSuffix, update2Request, 22, 22, 22);
            const updateCommitValueToOperationMap = yield resolver.constructCommitValueToOperationLookupMap([anchoredUpdate1, anchoredUpdate2]);
            const newDidState = yield resolver.applyUpdateOperations(initialDidState, updateCommitValueToOperationMap);
            // Expecting the new state to contain info of the first update operation only,
            // because the 2nd update operation is invalid due to its reuse/circular reference of commitment hash.
            expect(newDidState.lastOperationTransactionNumber).toEqual(11);
            done();
        }));
    });
    describe('applyOperation()', () => {
        it('should not throw error even if an error is thrown internally.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(operationProcessor, 'apply').and.throwError('any error');
            const createOperationData = yield OperationGenerator_1.default.generateAnchoredCreateOperation({ transactionTime: 1, transactionNumber: 1, operationIndex: 1 });
            const initialDidState = yield resolver.applyOperation(createOperationData.anchoredOperationModel, undefined);
            // Expecting undefined to be returned instead of error being thrown.
            expect(initialDidState).toBeUndefined();
            done();
        }));
    });
    describe('applyCreateOperation()', () => {
        it('should continue applying until did state is not undefined', () => __awaiter(void 0, void 0, void 0, function* () {
            let callCount = 0;
            // should return undefined the first time and an object the second time
            const applyOperationSpy = spyOn(resolver, 'applyOperation').and.callFake(() => {
                callCount++;
                if (callCount === 2) {
                    return {
                        document: {},
                        nextRecoveryCommitmentHash: 'string',
                        nextUpdateCommitmentHash: 'string',
                        lastOperationTransactionNumber: 123
                    };
                }
                return undefined;
            });
            yield resolver['applyCreateOperation']([1, 2]);
            expect(applyOperationSpy).toHaveBeenCalledTimes(2);
        }));
    });
});
//# sourceMappingURL=Resolver.spec.js.map