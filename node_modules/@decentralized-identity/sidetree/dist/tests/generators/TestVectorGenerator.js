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
const jwkEs256k1Private = require("../vectors/inputs/jwkEs256k1Private.json");
const jwkEs256k1Public = require("../vectors/inputs/jwkEs256k1Public.json");
const jwkEs256k2Private = require("../vectors/inputs/jwkEs256k2Private.json");
const jwkEs256k2Public = require("../vectors/inputs/jwkEs256k2Public.json");
const path = require("path");
const publicKeyModel1 = require("../vectors/inputs/publicKeyModel1.json");
const service1 = require("../vectors/inputs/service1.json");
const Jwk_1 = require("../../lib/core/versions/latest/util/Jwk");
const Multihash_1 = require("../../lib/core/versions/latest/Multihash");
const OperationGenerator_1 = require("./OperationGenerator");
const PatchAction_1 = require("../../lib/core/versions/latest/PatchAction");
const saveLocation = path.resolve(__dirname, '../../../tests/vectors/inputs');
fs.mkdirSync(saveLocation, { recursive: true });
(() => __awaiter(void 0, void 0, void 0, function* () {
    // generate a create operation request
    const recoveryPublicKey = jwkEs256k1Public;
    const recoveryPrivateKey = jwkEs256k1Private;
    const updatePublicKey = jwkEs256k2Public;
    const updatePrivateKey = jwkEs256k2Private;
    const otherKeys = [publicKeyModel1];
    const services = [service1];
    const createOperationRequest = yield OperationGenerator_1.default.createCreateOperationRequest(recoveryPublicKey, updatePublicKey, otherKeys, services);
    const did = yield OperationGenerator_1.default.createDid(recoveryPublicKey, updatePublicKey, createOperationRequest.delta.patches);
    // derive an update operation request from the create
    const [nextUpdateKey] = yield OperationGenerator_1.default.generateKeyPair('nextUpdateKey');
    const nextUpdateCommitmentHash = Multihash_1.default.canonicalizeThenDoubleHashThenEncode(nextUpdateKey.publicKeyJwk);
    const [anyNewSigningKey] = yield OperationGenerator_1.default.generateKeyPair('newKeyId');
    const patches = [
        {
            action: PatchAction_1.default.AddPublicKeys,
            publicKeys: [
                anyNewSigningKey
            ]
        }
    ];
    const updateRequest = yield OperationGenerator_1.default.createUpdateOperationRequest(did.didUniqueSuffix, updatePublicKey, updatePrivateKey, nextUpdateCommitmentHash, patches);
    // derive a recover operation from the create operation
    const [newRecoveryPublicKey] = yield Jwk_1.default.generateEs256kKeyPair();
    const [newSigningPublicKey] = yield OperationGenerator_1.default.generateKeyPair('keyAfterRecover');
    const [documentKey] = yield OperationGenerator_1.default.generateKeyPair('newDocumentKey');
    const newServices = OperationGenerator_1.default.generateServices(['newId']);
    const recoverOperationRequest = yield OperationGenerator_1.default.generateRecoverOperationRequest(did.didUniqueSuffix, recoveryPrivateKey, newRecoveryPublicKey, newSigningPublicKey, newServices, [documentKey]);
    const deactivateRequest = yield OperationGenerator_1.default.createDeactivateOperationRequest(did.didUniqueSuffix, recoveryPrivateKey);
    const createRequestString = JSON.stringify(createOperationRequest, null, 2);
    const updateRequestString = JSON.stringify(updateRequest, null, 2);
    const recoverRequestString = JSON.stringify(recoverOperationRequest, null, 2);
    const deactivateRequestString = JSON.stringify(deactivateRequest);
    fs.writeFileSync(`${saveLocation}/create.json`, createRequestString);
    fs.writeFileSync(`${saveLocation}/update.json`, updateRequestString);
    fs.writeFileSync(`${saveLocation}/recover.json`, recoverRequestString);
    fs.writeFileSync(`${saveLocation}/deactivate.json`, deactivateRequestString);
}))();
//# sourceMappingURL=TestVectorGenerator.js.map