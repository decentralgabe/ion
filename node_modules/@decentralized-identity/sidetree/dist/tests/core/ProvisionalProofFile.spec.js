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
const Jwk_1 = require("../../lib/core/versions/latest/util/Jwk");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const ProvisionalProofFile_1 = require("../../lib/core/versions/latest/ProvisionalProofFile");
describe('ProvisionalProofFile', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('parse()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should parse a valid provisional proof file successfully.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [anyPublicKey, anyPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair(); // Used in multiple signed data for testing purposes.
            const updateOperationData1 = yield OperationGenerator_1.default.generateUpdateOperation('EiDyOQbbZAa3aiRzeCkV7LOx3SERjjH93EXoIM3UoN4oWg', anyPublicKey, anyPrivateKey);
            const updateOperationData2 = yield OperationGenerator_1.default.generateUpdateOperation('EiDyOQbbZAa3aiRzeCkV7LOx3SERjjH93EXoIM3UoN4oWg', anyPublicKey, anyPrivateKey);
            const updateOperation1 = updateOperationData1.updateOperation;
            const updateOperation2 = updateOperationData2.updateOperation;
            const provisionalProofFileBuffer = yield ProvisionalProofFile_1.default.createBuffer([updateOperation1, updateOperation2]);
            const parsedProvisionalFile = yield ProvisionalProofFile_1.default.parse(provisionalProofFileBuffer);
            expect(parsedProvisionalFile.updateProofs.length).toEqual(2);
            expect(parsedProvisionalFile.updateProofs[0].signedDataModel).toEqual(updateOperation1.signedData);
            expect(parsedProvisionalFile.updateProofs[1].signedDataModel).toEqual(updateOperation2.signedData);
        }));
        it('should throw if buffer given is not valid JSON.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fileBuffer = Buffer.from('NotJsonString');
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalProofFile_1.default.parse(fileCompressed), ErrorCode_1.default.ProvisionalProofFileNotJson);
        }));
        it('should throw if the buffer is not compressed', () => __awaiter(void 0, void 0, void 0, function* () {
            const provisionalProofFileModel = { anything: 'anything' };
            const fileBuffer = Buffer.from(JSON.stringify(provisionalProofFileModel));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalProofFile_1.default.parse(fileBuffer), ErrorCode_1.default.ProvisionalProofFileDecompressionFailure);
        }));
        it('should throw if `operations` property does not exist.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fileBuffer = Buffer.from(JSON.stringify({}));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalProofFile_1.default.parse(fileCompressed), ErrorCode_1.default.ProvisionalProofFileOperationsNotFound);
        }));
        it('should throw if `operations` has an unknown property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const provisionalProofFileModel = {
                operations: {
                    unknownProperty: 'unknownProperty'
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(provisionalProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalProofFile_1.default.parse(fileCompressed), ErrorCode_1.default.InputValidatorInputContainsNowAllowedProperty, 'provisional proof file');
        }));
        it('should throw if `operations.update` is not an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const provisionalProofFileModel = {
                operations: {
                    update: 'not an array'
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(provisionalProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalProofFile_1.default.parse(fileCompressed), ErrorCode_1.default.ProvisionalProofFileUpdatePropertyNotAnArray);
        }));
        it('should throw if a proof object in `operations.update` array has a not-allowed property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const provisionalProofFileModel = {
                operations: {
                    update: [{ notAllowedProperty: 'not allowed' }]
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(provisionalProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalProofFile_1.default.parse(fileCompressed), ErrorCode_1.default.InputValidatorInputContainsNowAllowedProperty);
        }));
        it('should throw if there is no proof in the provisional proof file.', () => __awaiter(void 0, void 0, void 0, function* () {
            const provisionalProofFileModel = {
                operations: {
                    update: []
                }
            };
            const fileBuffer = Buffer.from(JSON.stringify(provisionalProofFileModel));
            const fileCompressed = yield Compressor_1.default.compress(fileBuffer);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ProvisionalProofFile_1.default.parse(fileCompressed), ErrorCode_1.default.ProvisionalProofFileHasNoProofs);
        }));
    }));
}));
//# sourceMappingURL=ProvisionalProofFile.spec.js.map