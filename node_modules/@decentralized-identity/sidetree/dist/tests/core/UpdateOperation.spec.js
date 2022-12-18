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
const Encoder_1 = require("../../lib/core/versions/latest/Encoder");
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const OperationType_1 = require("../../lib/core/enums/OperationType");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
const UpdateOperation_1 = require("../../lib/core/versions/latest/UpdateOperation");
describe('UpdateOperation', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('parse()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('parse as expected', () => __awaiter(void 0, void 0, void 0, function* () {
            const [signingPublicKey, signingPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('key');
            const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequest('EiDyOQbbZAa3aiRzeCkV7LOx3SERjjH93EXoIM3UoN4oWg', signingPublicKey.publicKeyJwk, signingPrivateKey, OperationGenerator_1.default.generateRandomHash(), []);
            const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
            const result = yield UpdateOperation_1.default.parse(operationBuffer);
            expect(result).toBeDefined();
        }));
        it('should throw if didUniqueSuffix is not string.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [signingPublicKey, signingPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('key');
            const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequest('unused-DID-unique-suffix', signingPublicKey.publicKeyJwk, signingPrivateKey, 'unusedNextUpdateCommitmentHash', 'opaque-unused-document-patch');
            updateOperationRequest.didSuffix = 123; // Intentionally not string
            const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
            yield expectAsync(UpdateOperation_1.default
                .parse(operationBuffer))
                .toBeRejectedWith(new SidetreeError_1.default(`The update request didSuffix must be a string but is of number type.`));
        }));
        it('should throw if didUniqueSuffix is undefined.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [signingPublicKey, signingPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('key');
            const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequest('unused-DID-unique-suffix', signingPublicKey.publicKeyJwk, signingPrivateKey, 'unusedNextUpdateCommitmentHash', 'opaque-unused-document-patch');
            updateOperationRequest.didSuffix = undefined; // Intentionally undefined
            const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
            yield expectAsync(UpdateOperation_1.default
                .parse(operationBuffer))
                .toBeRejectedWith(new SidetreeError_1.default(`The update request didSuffix must be a string but is of undefined type.`));
        }));
        it('should throw if didUniqueSuffix is not multihash.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [signingPublicKey, signingPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('key');
            const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequest('unused-DID-unique-suffix', signingPublicKey.publicKeyJwk, signingPrivateKey, 'unusedNextUpdateCommitmentHash', 'opaque-unused-document-patch');
            updateOperationRequest.didSuffix = 'thisIsNotMultihash'; // Intentionally not multihash
            const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
            yield expectAsync(UpdateOperation_1.default
                .parse(operationBuffer))
                .toBeRejectedWith(new SidetreeError_1.default(`Given update request didSuffix string 'thisIsNotMultihash' is not a multihash.`));
        }));
        it('should throw if operation type is incorrect', () => __awaiter(void 0, void 0, void 0, function* () {
            const [signingPublicKey, signingPrivateKey] = yield OperationGenerator_1.default.generateKeyPair('key');
            const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequest('EiDyOQbbZAa3aiRzeCkV7LOx3SERjjH93EXoIM3UoN4oWg', signingPublicKey.publicKeyJwk, signingPrivateKey, 'unusedNextUpdateCommitmentHash', 'opaque-unused-document-patch');
            updateOperationRequest.type = OperationType_1.default.Deactivate;
            const operationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
            yield expectAsync(UpdateOperation_1.default.parse(operationBuffer)).toBeRejectedWith(new SidetreeError_1.default(ErrorCode_1.default.UpdateOperationTypeIncorrect));
        }));
    }));
    describe('parseObject()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw if operation contains an additional unknown property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateOperation = {
                type: OperationType_1.default.Update,
                didSuffix: 'unusedSuffix',
                signedData: 'unusedSignedData',
                delta: 'unusedDelta',
                extraProperty: 'thisPropertyShouldCauseErrorToBeThrown'
            };
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => UpdateOperation_1.default.parseObject(updateOperation, Buffer.from('anyValue')), ErrorCode_1.default.InputValidatorInputContainsNowAllowedProperty, 'update request');
        }));
        it('should throw if hash of `updateKey` does not match the revealValue.', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateRequestData = yield OperationGenerator_1.default.generateUpdateOperationRequest();
            const updateRequest = updateRequestData.request;
            // Intentionally have a mismatching reveal value.
            updateRequest.revealValue = OperationGenerator_1.default.generateRandomHash();
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => UpdateOperation_1.default.parseObject(updateRequest, Buffer.from('unused')), ErrorCode_1.default.CanonicalizedObjectHashMismatch, 'update request');
        }));
    }));
    describe('parseSignedDataPayload()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw if signedData is missing expected properties.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const signedData = {};
            const encodedSignedData = Encoder_1.default.encode(JSON.stringify(signedData));
            yield expectAsync(UpdateOperation_1.default.parseSignedDataPayload(encodedSignedData))
                .toBeRejectedWith(new SidetreeError_1.default(ErrorCode_1.default.UpdateOperationSignedDataHasMissingOrUnknownProperty));
            done();
        }));
        it('should throw if signedData contains an additional unknown property.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const signedData = {
                deltaHash: 'anyUnusedHash',
                extraProperty: 'An unknown extra property',
                updateKey: {}
            };
            const encodedSignedData = Encoder_1.default.encode(JSON.stringify(signedData));
            yield expectAsync(UpdateOperation_1.default.parseSignedDataPayload(encodedSignedData))
                .toBeRejectedWith(new SidetreeError_1.default(ErrorCode_1.default.UpdateOperationSignedDataHasMissingOrUnknownProperty));
            done();
        }));
    }));
}));
//# sourceMappingURL=UpdateOperation.spec.js.map