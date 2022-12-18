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
const CoreProofFile_1 = require("../../lib/core/versions/latest/CoreProofFile");
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const Jwk_1 = require("../../lib/core/versions/latest/util/Jwk");
const OperationGenerator_1 = require("../generators/OperationGenerator");
describe('CoreProofFile', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('parse()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should parse a valid core proof file successfully.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [, anyPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair(); // Used in multiple signed data for testing purposes.
            const didOfDeactivate1 = OperationGenerator_1.default.generateRandomHash();
            const didOfDeactivate2 = OperationGenerator_1.default.generateRandomHash();
            const recoverOperationData = yield OperationGenerator_1.default.generateRecoverOperation({ didUniqueSuffix: 'EiDyOQbbZAa3aiRzeCkV7LOx3SERjjH93EXoIM3UoN4oWg', recoveryPrivateKey: anyPrivateKey });
            const deactivateOperationData1 = yield OperationGenerator_1.default.createDeactivateOperation(didOfDeactivate1, anyPrivateKey);
            const deactivateOperationData2 = yield OperationGenerator_1.default.createDeactivateOperation(didOfDeactivate2, anyPrivateKey);
            const recoverOperation = recoverOperationData.recoverOperation;
            const deactivateOperation1 = deactivateOperationData1.deactivateOperation;
            const deactivateOperation2 = deactivateOperationData2.deactivateOperation;
            const coreProofFileBuffer = yield CoreProofFile_1.default.createBuffer([recoverOperation], [deactivateOperation1, deactivateOperation2]);
            const parsedCoreFile = yield CoreProofFile_1.default.parse(coreProofFileBuffer, [didOfDeactivate1, didOfDeactivate2]);
            expect(parsedCoreFile.recoverProofs.length).toEqual(1);
            expect(parsedCoreFile.deactivateProofs.length).toEqual(2);
            expect(parsedCoreFile.recoverProofs[0].signedDataModel).toEqual(recoverOperation.signedData);
            expect(parsedCoreFile.deactivateProofs[0].signedDataModel).toEqual(deactivateOperation1.signedData);
            expect(parsedCoreFile.deactivateProofs[1].signedDataModel).toEqual(deactivateOperation2.signedData);
        }));
        it('should throw if buffer given is not valid JSON.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fileBuffer = Buffer.from('NotJsonString');
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => CoreProofFile_1.default.parse(fileCompressed, ['unused array']), ErrorCode_1.default.CoreProofFileNotJson);
        }));
        it('should throw if the buffer is not compressed', () => __awaiter(void 0, void 0, void 0, function* () {
            const coreProofFileModel = { anything: 'anything' };
            const fileBuffer = Buffer.from(JSON.stringify(coreProofFileModel));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => CoreProofFile_1.default.parse(fileBuffer, ['unused array']), ErrorCode_1.default.CoreProofFileDecompressionFailure);
        }));
        it('should throw if `operations` property does not exist.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fileBuffer = Buffer.from(JSON.stringify({}));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => CoreProofFile_1.default.parse(fileCompressed, ['unused array']), ErrorCode_1.default.CoreProofFileOperationsNotFound);
        }));
        it('should throw if `operations` has an unknown property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const coreProofFileModel = {
                operations: {
                    unknownProperty: 'unknownProperty'
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(coreProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => CoreProofFile_1.default.parse(fileCompressed, ['unused array']), ErrorCode_1.default.InputValidatorInputContainsNowAllowedProperty, 'core proof file');
        }));
        it('should throw if `operations.recover` is not an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const coreProofFileModel = {
                operations: {
                    recover: 'not an array'
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(coreProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => CoreProofFile_1.default.parse(fileCompressed, ['unused array']), ErrorCode_1.default.CoreProofFileRecoverPropertyNotAnArray);
        }));
        it('should throw if a proof object in `operations.recover` array has a not-allowed property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const coreProofFileModel = {
                operations: {
                    recover: [{ notAllowedProperty: 'not allowed' }]
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(coreProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => CoreProofFile_1.default.parse(fileCompressed, ['unused array']), ErrorCode_1.default.InputValidatorInputContainsNowAllowedProperty);
        }));
        it('should throw if `operations.deactivate` is not an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const coreProofFileModel = {
                operations: {
                    deactivate: 'not an array'
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(coreProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => CoreProofFile_1.default.parse(fileCompressed, ['unused array']), ErrorCode_1.default.CoreProofFileDeactivatePropertyNotAnArray);
        }));
        it('should throw if a proof object in `operations.deactivate` array has a not-allowed property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const coreProofFileModel = {
                operations: {
                    deactivate: [{ notAllowedProperty: 'not allowed' }]
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(coreProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => CoreProofFile_1.default.parse(fileCompressed, ['unused array']), ErrorCode_1.default.InputValidatorInputContainsNowAllowedProperty);
        }));
        it('should throw if there is no proof in the core proof file.', () => __awaiter(void 0, void 0, void 0, function* () {
            const coreProofFileModel = {
                operations: {
                    recover: []
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(coreProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => CoreProofFile_1.default.parse(fileCompressed, ['unused array']), ErrorCode_1.default.CoreProofFileHasNoProofs);
        }));
    }));
}));
//# sourceMappingURL=CoreProofFile.spec.js.map