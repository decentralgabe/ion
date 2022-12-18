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
const fs = require("fs");
const Jwk_1 = require("../../lib/core/versions/latest/util/Jwk");
const Multihash_1 = require("../../lib/core/versions/latest/Multihash");
const OperationGenerator_1 = require("./OperationGenerator");
/**
 * Class for generating files used for load testing using Vegeta.
 */
class VegetaLoadGenerator {
    /**
     * Creates a Create request followed by an Update request for each DID.
     * Following targets files will be generated:
     *   One targets file containing all Create requests
     *   One targets file containing all Update requests
     *   One targets file containing all recovery requests
     *   One targets file containing all deactivate requests
     * @param uniqueDidCount The number of unique DID to be generated.
     * @param endpointUrl The URL that the requests will be sent to.
     * @param absoluteFolderPath The folder that all the generated files will be saved to.
     * @param hashAlgorithmInMultihashCode The hash algorithm in Multihash code in DEC (not in HEX).
     */
    static generateLoadFiles(uniqueDidCount, endpointUrl, absoluteFolderPath) {
        return __awaiter(this, void 0, void 0, function* () {
            // Make directories needed by the request generator.
            fs.mkdirSync(absoluteFolderPath);
            fs.mkdirSync(absoluteFolderPath + '/keys');
            fs.mkdirSync(absoluteFolderPath + '/requests');
            for (let i = 0; i < uniqueDidCount; i++) {
                const createOperationData = yield OperationGenerator_1.default.generateCreateOperation();
                // Generate a random pair of public-private key pair and save them on disk.
                fs.writeFileSync(absoluteFolderPath + `/keys/recoveryPrivateKey${i}.json`, JSON.stringify(createOperationData.recoveryPrivateKey));
                fs.writeFileSync(absoluteFolderPath + `/keys/recoveryPublicKey${i}.json`, JSON.stringify(createOperationData.recoveryPublicKey));
                fs.writeFileSync(absoluteFolderPath + `/keys/updatePrivateKey${i}.json`, JSON.stringify(createOperationData.updatePrivateKey));
                fs.writeFileSync(absoluteFolderPath + `/keys/updatePublicKey${i}.json`, JSON.stringify(createOperationData.updatePublicKey));
                fs.writeFileSync(absoluteFolderPath + `/keys/signingPrivateKey${i}.json`, JSON.stringify(createOperationData.signingPrivateKey));
                fs.writeFileSync(absoluteFolderPath + `/keys/signingPublicKey${i}.json`, JSON.stringify(createOperationData.signingPublicKey));
                // Save the create operation request on disk.
                fs.writeFileSync(absoluteFolderPath + `/requests/create${i}.json`, createOperationData.createOperation.operationBuffer);
                const [newUpdatePublicKey] = yield Jwk_1.default.generateEs256kKeyPair();
                const newUpdateCommitmentHash = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(newUpdatePublicKey);
                // Generate an update operation
                const [additionalKey] = yield OperationGenerator_1.default.generateKeyPair(`additionalKey`);
                const updateOperationRequest = yield OperationGenerator_1.default.createUpdateOperationRequestForAddingAKey(createOperationData.createOperation.didUniqueSuffix, createOperationData.updatePublicKey, createOperationData.updatePrivateKey, additionalKey, newUpdateCommitmentHash);
                // Save the update operation request on disk.
                const updateOperationBuffer = Buffer.from(JSON.stringify(updateOperationRequest));
                fs.writeFileSync(absoluteFolderPath + `/requests/update${i}.json`, updateOperationBuffer);
                // Generate a recover operation request.
                const [newRecoveryPublicKey] = yield Jwk_1.default.generateEs256kKeyPair();
                const [newSigningPublicKey] = yield OperationGenerator_1.default.generateKeyPair('newSigningKey');
                const recoverOperationRequest = yield OperationGenerator_1.default.generateRecoverOperationRequest(createOperationData.createOperation.didUniqueSuffix, createOperationData.recoveryPrivateKey, newRecoveryPublicKey, newSigningPublicKey, OperationGenerator_1.default.generateServices(['newDummyEndpoint']), [newSigningPublicKey]);
                // Save the recover operation request on disk.
                const recoverOperationBuffer = Buffer.from(JSON.stringify(recoverOperationRequest));
                fs.writeFileSync(`${absoluteFolderPath}/requests/recovery${i}.json`, recoverOperationBuffer);
                // Generate a deactivate operation request.
                // NOTE: generated deactivate operation request is mutually exclusive with the recover operation counter part,
                // ie. one can only choose to submit either recovery or deactivate request but not both.
                const deactivateOperationRequest = yield OperationGenerator_1.default.createDeactivateOperationRequest(createOperationData.createOperation.didUniqueSuffix, createOperationData.recoveryPrivateKey);
                // Save the deactivate operation request on disk.
                const deactivateOperationBuffer = Buffer.from(JSON.stringify(deactivateOperationRequest));
                fs.writeFileSync(`${absoluteFolderPath}/requests/deactivate${i}.json`, deactivateOperationBuffer);
            }
            // Operations URL.
            const operationsUrl = new URL('operations', endpointUrl).toString(); // e.g. http://localhost:3000/operations
            // Generate Create API calls in a targets file.
            let createTargetsFileString = '';
            for (let i = 0; i < uniqueDidCount; i++) {
                createTargetsFileString += `POST ${operationsUrl}\n`;
                createTargetsFileString += `@${absoluteFolderPath}/requests/create${i}.json\n\n`;
            }
            fs.writeFileSync(absoluteFolderPath + '/createTargets.txt', createTargetsFileString);
            // Add Update API calls in a targets file.
            let updateTargetsFileString = '';
            for (let i = 0; i < uniqueDidCount; i++) {
                updateTargetsFileString += `POST ${operationsUrl}\n`;
                updateTargetsFileString += `@${absoluteFolderPath}/requests/update${i}.json\n\n`;
            }
            fs.writeFileSync(absoluteFolderPath + '/updateTargets.txt', updateTargetsFileString);
            // Add Recovery API calls in a targets file.
            let recoveryTargetsFileString = '';
            for (let i = 0; i < uniqueDidCount; i++) {
                recoveryTargetsFileString += `POST ${operationsUrl}\n`;
                recoveryTargetsFileString += `@${absoluteFolderPath}/requests/recovery${i}.json\n\n`;
            }
            fs.writeFileSync(absoluteFolderPath + '/recoveryTargets.txt', recoveryTargetsFileString);
            // Add Deactivate API calls in a targets file.
            let deactivateTargetsFileString = '';
            for (let i = 0; i < uniqueDidCount; i++) {
                deactivateTargetsFileString += `POST ${operationsUrl}\n`;
                deactivateTargetsFileString += `@${absoluteFolderPath}/requests/deactivate${i}.json\n\n`;
            }
            fs.writeFileSync(absoluteFolderPath + '/deactivateTargets.txt', deactivateTargetsFileString);
        });
    }
}
exports.default = VegetaLoadGenerator;
//# sourceMappingURL=VegetaLoadGenerator.js.map