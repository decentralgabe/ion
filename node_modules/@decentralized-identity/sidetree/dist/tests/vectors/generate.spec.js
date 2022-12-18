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
const jwkEs256k1Private = require("./inputs/jwkEs256k1Private.json");
const jwkEs256k1Public = require("./inputs/jwkEs256k1Public.json");
const jwkEs256k2Private = require("./inputs/jwkEs256k2Private.json");
const jwkEs256k2Public = require("./inputs/jwkEs256k2Public.json");
const path = require("path");
const publicKeyModel1 = require("./inputs/publicKeyModel1.json");
const service1 = require("./inputs/service1.json");
const OperationGenerator_1 = require("../generators/OperationGenerator");
const OVERWRITE_TEST_VECTORS = false;
describe('Test Vectors', () => {
    let fixture = {};
    let updateOperationData;
    let recoverOperationData;
    let deactivateOperationData;
    it('can generate create', () => __awaiter(void 0, void 0, void 0, function* () {
        const recoveryKey = jwkEs256k1Public;
        const updateKey = jwkEs256k2Public;
        const otherKeys = [publicKeyModel1];
        const services = [service1];
        const operationRequest = yield OperationGenerator_1.default.createCreateOperationRequest(recoveryKey, updateKey, otherKeys, services);
        const did = yield OperationGenerator_1.default.createDid(recoveryKey, updateKey, operationRequest.delta.patches);
        fixture = Object.assign(Object.assign({}, fixture), { create: Object.assign(Object.assign({}, did), { operationRequest }) });
        // here is where you would assert that
        // no breaking changes have occurred for create operations
        // if test vector generation was deterministic
    }));
    it('can generate update', () => __awaiter(void 0, void 0, void 0, function* () {
        updateOperationData = yield OperationGenerator_1.default.generateUpdateOperation(fixture.create.didUniqueSuffix, jwkEs256k2Public, jwkEs256k2Private);
        const fixtureData = Object.assign({}, updateOperationData);
        // TODO: fix operation data structures so stuff like this is not required
        // to get consistent references to request objects.
        fixtureData.operationRequest = JSON.parse(fixtureData.updateOperation.operationBuffer.toString());
        delete fixtureData.updateOperation.operationBuffer;
        delete fixtureData.operationBuffer;
        fixture = Object.assign(Object.assign({}, fixture), { update: fixtureData });
        // here is where you would assert that
        // no breaking changes have occurred for update operations
        // if test vector generation was deterministic
    }));
    it('can generate recover', () => __awaiter(void 0, void 0, void 0, function* () {
        const input = {
            didUniqueSuffix: fixture.create.didUniqueSuffix,
            recoveryPrivateKey: jwkEs256k1Private
        };
        recoverOperationData = yield OperationGenerator_1.default.generateRecoverOperation(input);
        const fixtureData = Object.assign({}, recoverOperationData);
        // TODO: fix operation data structures so stuff like this is not required
        // to get consistent references to request objects.
        fixtureData.operationRequest = JSON.parse(fixtureData.recoverOperation.operationBuffer.toString());
        delete fixtureData.recoverOperation.operationBuffer;
        delete fixtureData.operationBuffer;
        fixture = Object.assign(Object.assign({}, fixture), { recover: fixtureData });
        // here is where you would assert that
        // no breaking changes have occurred for recover operations
        // if test vector generation was deterministic
    }));
    it('can generate deactivate', () => __awaiter(void 0, void 0, void 0, function* () {
        deactivateOperationData = yield OperationGenerator_1.default.createDeactivateOperation(fixture.create.didUniqueSuffix, recoverOperationData.recoveryPrivateKey);
        const fixtureData = Object.assign({}, deactivateOperationData);
        // TODO: fix operation data structures so stuff like this is not required
        // to get consistent references to request objects.
        fixtureData.operationRequest = JSON.parse(fixtureData.deactivateOperation.operationBuffer.toString());
        delete fixtureData.deactivateOperation.operationBuffer;
        delete fixtureData.operationBuffer;
        fixture = Object.assign(Object.assign({}, fixture), { deactivate: fixtureData });
        // here is where you would assert that
        // no breaking changes have occurred for deactivate operations
        // if test vector generation was deterministic
    }));
    it('should write fixture to disk', () => __awaiter(void 0, void 0, void 0, function* () {
        if (OVERWRITE_TEST_VECTORS) {
            fs.writeFileSync(path.resolve(__dirname, '../../../tests/vectors/generated.json'), JSON.stringify(fixture, null, 2));
        }
    }));
});
//# sourceMappingURL=generate.spec.js.map