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
const CoreIndexFile_1 = require("../../lib/core/versions/latest/CoreIndexFile");
const CoreProofFile_1 = require("../../lib/core/versions/latest/CoreProofFile");
const OperationGenerator_1 = require("./OperationGenerator");
const ProvisionalIndexFile_1 = require("../../lib/core/versions/latest/ProvisionalIndexFile");
const ProvisionalProofFile_1 = require("../../lib/core/versions/latest/ProvisionalProofFile");
/**
 * A class containing methods for generating various Sidetree files.
 * Mainly useful for testing purposes.
 */
class FileGenerator {
    /**
     * Generates a `CoreIndexFile`, mainly used for testing purposes.
     */
    static generateCoreIndexFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const createOperationData = yield OperationGenerator_1.default.generateCreateOperation();
            const provisionalIndexFileUri = OperationGenerator_1.default.generateRandomHash();
            const coreProofFileUri = undefined;
            const coreIndexFileBuffer = yield CoreIndexFile_1.default.createBuffer('writerLockId', provisionalIndexFileUri, coreProofFileUri, [createOperationData.createOperation], [], []);
            const coreIndexFile = yield CoreIndexFile_1.default.parse(coreIndexFileBuffer);
            return coreIndexFile;
        });
    }
    /**
     * Generates a `ProvisionalIndexFile`, mainly used for testing purposes.
     */
    static generateProvisionalIndexFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const updateRequestData = yield OperationGenerator_1.default.generateUpdateOperationRequest();
            const chunkFileUri = OperationGenerator_1.default.generateRandomHash();
            const provisionalProofFileUri = OperationGenerator_1.default.generateRandomHash();
            const provisionalIndexFileBuffer = yield ProvisionalIndexFile_1.default.createBuffer(chunkFileUri, provisionalProofFileUri, [updateRequestData.updateOperation]);
            const provisionalIndexFile = yield ProvisionalIndexFile_1.default.parse(provisionalIndexFileBuffer);
            return provisionalIndexFile;
        });
    }
    /**
     * Creates a `CoreProofFile`, mainly used for testing purposes.
     */
    static createCoreProofFile(recoverOperations, deactivateOperations) {
        return __awaiter(this, void 0, void 0, function* () {
            const deactivatedDidUniqueSuffixes = deactivateOperations.map(operation => operation.didUniqueSuffix);
            const coreProofFileBuffer = yield CoreProofFile_1.default.createBuffer(recoverOperations, deactivateOperations);
            if (coreProofFileBuffer === undefined) {
                return undefined;
            }
            const coreProofFile = yield CoreProofFile_1.default.parse(coreProofFileBuffer, deactivatedDidUniqueSuffixes);
            return coreProofFile;
        });
    }
    /**
     * Creates a `ProvisionalProofFile`, mainly used for testing purposes.
     */
    static createProvisionalProofFile(updateOperations) {
        return __awaiter(this, void 0, void 0, function* () {
            const provisionalProofFileBuffer = yield ProvisionalProofFile_1.default.createBuffer(updateOperations);
            if (provisionalProofFileBuffer === undefined) {
                return undefined;
            }
            const provisionalProofFile = yield ProvisionalProofFile_1.default.parse(provisionalProofFileBuffer);
            return provisionalProofFile;
        });
    }
}
exports.default = FileGenerator;
//# sourceMappingURL=FileGenerator.js.map