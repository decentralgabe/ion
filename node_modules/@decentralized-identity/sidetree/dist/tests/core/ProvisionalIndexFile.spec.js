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
const Compressor_1 = require("../../lib/core/versions/latest/util/Compressor");
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const ProvisionalIndexFile_1 = require("../../lib/core/versions/latest/ProvisionalIndexFile");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
describe('ProvisionalIndexFile', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('parse()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw if buffer given is not valid JSON.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fileBuffer = Buffer.from('NotJsonString');
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalIndexFile_1.default.parse(fileCompressed), ErrorCode_1.default.ProvisionalIndexFileNotJson);
        }));
        it('should throw if the buffer is not compressed', () => __awaiter(void 0, void 0, void 0, function* () {
            const provisionalIndexFileModel = {
                chunks: [{ chunkFileUri: 'EiB4ypIXxG9aFhXv2YC8I2tQvLEBbQAsNzHmph17vMfVYA' }]
            };
            const fileBuffer = Buffer.from(JSON.stringify(provisionalIndexFileModel));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalIndexFile_1.default.parse(fileBuffer), ErrorCode_1.default.ProvisionalIndexFileDecompressionFailure);
        }));
        it('should throw if has an unknown property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const provisionalIndexFile = {
                unknownProperty: 'Unknown property',
                chunks: [{ chunkFileUri: 'EiB4ypIXxG9aFhXv2YC8I2tQvLEBbQAsNzHmph17vMfVYA' }]
            };
            const fileBuffer = Buffer.from(JSON.stringify(provisionalIndexFile));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield expectAsync(ProvisionalIndexFile_1.default.parse(fileCompressed)).toBeRejectedWith(new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileHasUnknownProperty));
        }));
        it('should throw if missing chunk file hash.', () => __awaiter(void 0, void 0, void 0, function* () {
            const provisionalIndexFile = {
            // chunks: [{ chunkFileUri: 'EiB4ypIXxG9aFhXv2YC8I2tQvLEBbQAsNzHmph17vMfVYA' }], // Intentionally kept to show what the expected property should be.
            };
            const fileBuffer = Buffer.from(JSON.stringify(provisionalIndexFile));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield expectAsync(ProvisionalIndexFile_1.default.parse(fileCompressed))
                .toBeRejectedWith(new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileChunksPropertyMissingOrIncorrectType));
        }));
        it('should throw if there is no updates but a provisional proof file URI is given.', () => __awaiter(void 0, void 0, void 0, function* () {
            const provisionalIndexFile = {
                provisionalProofFileUri: 'EiBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
                chunks: [{ chunkFileUri: 'EiB4ypIXxG9aFhXv2YC8I2tQvLEBbQAsNzHmph17vMfVYA' }]
            };
            const fileBuffer = Buffer.from(JSON.stringify(provisionalIndexFile));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalIndexFile_1.default.parse(fileCompressed), ErrorCode_1.default.ProvisionalIndexFileProvisionalProofFileUriNotAllowed);
        }));
    }));
    describe('validateOperationsProperty()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw if there is more than one (update) property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateOperationData = yield OperationGenerator_1.default.generateUpdateOperationRequest();
            const updateOperationRequest = updateOperationData.request;
            const operationsProperty = {
                update: [
                    updateOperationRequest
                ],
                unexpectedProperty: 'anyValue'
            };
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalIndexFile_1.default.validateOperationsProperty(operationsProperty), ErrorCode_1.default.InputValidatorInputContainsNowAllowedProperty, 'provisional operation references');
        }));
        it('should throw if there is update property is not an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const operationsProperty = {
                update: 'not an array'
            };
            yield expect(() => ProvisionalIndexFile_1.default.validateOperationsProperty(operationsProperty))
                .toThrow(new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileUpdateOperationsNotArray));
        }));
        it('should throw if there are multiple update operations for the same DID.', () => __awaiter(void 0, void 0, void 0, function* () {
            const didSuffix = OperationGenerator_1.default.generateRandomHash();
            const operationsProperty = {
                update: [
                    { didSuffix, revealValue: OperationGenerator_1.default.generateRandomHash() },
                    { didSuffix, revealValue: OperationGenerator_1.default.generateRandomHash() } // Intentionally having another update reference with the same DID.
                ]
            };
            expect(() => ProvisionalIndexFile_1.default.validateOperationsProperty(operationsProperty))
                .toThrow(new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileMultipleOperationsForTheSameDid));
        }));
        it('should throw if a update operation reference has an invalid `didSuffix`.', () => __awaiter(void 0, void 0, void 0, function* () {
            const operationsProperty = {
                update: [
                    { didSuffix: 123, revealValue: 'unused' } // Intentionally having invalid `didSuffix`.
                ]
            };
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => ProvisionalIndexFile_1.default.validateOperationsProperty(operationsProperty), ErrorCode_1.default.EncodedMultihashMustBeAString, 'didSuffix');
        }));
        it('should throw if a update operation reference has an invalid `revealValue`.', () => __awaiter(void 0, void 0, void 0, function* () {
            const didSuffix = OperationGenerator_1.default.generateRandomHash();
            const operationsProperty = {
                update: [
                    { didSuffix, revealValue: 123 } // Intentionally having invalid `revealValue`.
                ]
            };
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => ProvisionalIndexFile_1.default.validateOperationsProperty(operationsProperty), ErrorCode_1.default.EncodedMultihashMustBeAString, 'update reference');
        }));
    }));
    describe('validateChunksProperty()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw if there is more than one chunk in chunks array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const chunks = [
                { chunkFileUri: 'anyValue1' },
                { chunkFileUri: 'anyValue2' } // Intentionally adding more than one element.
            ];
            expect(() => ProvisionalIndexFile_1.default.validateChunksProperty(chunks))
                .toThrow(new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileChunksPropertyDoesNotHaveExactlyOneElement));
        }));
        it('should throw if there is more than one property in a chunk element.', () => __awaiter(void 0, void 0, void 0, function* () {
            const chunks = [
                {
                    chunkFileUri: 'anyValue1',
                    unexpectedProperty: 'any value'
                }
            ];
            expect(() => ProvisionalIndexFile_1.default.validateChunksProperty(chunks))
                .toThrow(new SidetreeError_1.default(ErrorCode_1.default.ProvisionalIndexFileChunkHasMissingOrUnknownProperty));
        }));
    }));
}));
//# sourceMappingURL=ProvisionalIndexFile.spec.js.map