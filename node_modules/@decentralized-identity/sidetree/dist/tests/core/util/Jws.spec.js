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
const Encoder_1 = require("../../../lib/core/versions/latest/Encoder");
const ErrorCode_1 = require("../../../lib/core/versions/latest/ErrorCode");
const Jwk_1 = require("../../../lib/core/versions/latest/util/Jwk");
const Jws_1 = require("../../../lib/core/versions/latest/util/Jws");
const SidetreeError_1 = require("../../../lib/common/SidetreeError");
describe('Jws', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('parseCompactJws()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw error if given input to parse is not a string.', () => __awaiter(void 0, void 0, void 0, function* () {
            const anyObject = { a: 'abc' };
            expect(() => { Jws_1.default.parseCompactJws(anyObject); }).toThrow(new SidetreeError_1.default(ErrorCode_1.default.JwsCompactJwsNotString));
        }));
        it('should throw error if given input string has more than 3 parts separated by a "." character.', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidCompactJwsString = 'aaa.bbb.ccc.ddd';
            expect(() => { Jws_1.default.parseCompactJws(invalidCompactJwsString); }).toThrow(new SidetreeError_1.default(ErrorCode_1.default.JwsCompactJwsInvalid));
        }));
        it('should throw error if protected header contains unexpected property.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [, signingPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair();
            const protectedHeader = {
                unknownProperty: 'anyValue',
                alg: 'ES256K'
            };
            const payload = { anyProperty: 'anyValue' };
            const jws = Jws_1.default.signAsCompactJws(payload, signingPrivateKey, protectedHeader);
            expect(() => { Jws_1.default.parseCompactJws(jws); }).toThrow(new SidetreeError_1.default(ErrorCode_1.default.JwsProtectedHeaderMissingOrUnknownProperty));
        }));
        it('should throw error if `alg` in header is missing or is in incorrect type.', () => __awaiter(void 0, void 0, void 0, function* () {
            const [, signingPrivateKey] = yield Jwk_1.default.generateEs256kKeyPair();
            const protectedHeader = {
                alg: 'ES256K'
            };
            const payload = { anyProperty: 'anyValue' };
            const jws = yield Jws_1.default.sign(protectedHeader, payload, signingPrivateKey);
            // Replace the protected header with an invalid alg type.
            const invalidProtectedHeader = {
                alg: true // Invalid type.
            };
            const invalidEncodedProtectedHeader = Encoder_1.default.encode(JSON.stringify(invalidProtectedHeader));
            const compactJws = Jws_1.default.createCompactJws(invalidEncodedProtectedHeader, jws.payload, jws.signature);
            expect(() => { Jws_1.default.parseCompactJws(compactJws); }).toThrow(new SidetreeError_1.default(ErrorCode_1.default.JwsProtectedHeaderMissingOrIncorrectAlg));
        }));
        it('should throw error if payload is not Base64URL string.', () => __awaiter(void 0, void 0, void 0, function* () {
            const protectedHeader = {
                alg: 'ES256K'
            };
            const encodedProtectedHeader = Encoder_1.default.encode(JSON.stringify(protectedHeader));
            const compactJws = Jws_1.default.createCompactJws(encodedProtectedHeader, '***InvalidPayloadString****', 'anyValidBase64UrlStringAsSignature');
            expect(() => { Jws_1.default.parseCompactJws(compactJws); }).toThrow(new SidetreeError_1.default(ErrorCode_1.default.JwsPayloadNotBase64UrlString));
        }));
        it('should throw error if signature is not Base64URL string.', () => __awaiter(void 0, void 0, void 0, function* () {
            const protectedHeader = {
                alg: 'ES256K'
            };
            const encodedProtectedHeader = Encoder_1.default.encode(JSON.stringify(protectedHeader));
            const compactJws = Jws_1.default.createCompactJws(encodedProtectedHeader, 'anyValidBase64UrlStringAsPayload', '***InvalidSignatureString****');
            expect(() => { Jws_1.default.parseCompactJws(compactJws); }).toThrow(new SidetreeError_1.default(ErrorCode_1.default.JwsSignatureNotBase64UrlString));
        }));
    }));
    describe('verifyCompactJws()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return true if given compact JWS string has a valid signature.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const [publicKey, privateKey] = yield Jwk_1.default.generateEs256kKeyPair();
            const payload = { abc: 'unused value' };
            const compactJws = Jws_1.default.signAsCompactJws(payload, privateKey);
            expect(Jws_1.default.verifyCompactJws(compactJws, publicKey)).toBeTruthy();
            done();
        }));
        it('should return false if given compact JWS string has an ivalid signature.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const [publicKey1] = yield Jwk_1.default.generateEs256kKeyPair();
            const [, privateKey2] = yield Jwk_1.default.generateEs256kKeyPair();
            const payload = { abc: 'some value' };
            const compactJws = Jws_1.default.signAsCompactJws(payload, privateKey2); // Intentionally signing with a different key.
            expect(Jws_1.default.verifyCompactJws(compactJws, publicKey1)).toBeFalsy();
            done();
        }));
        it('should return false if input is not a valid JWS string', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const input = 'some invalid string';
            const [publicKey] = yield Jwk_1.default.generateEs256kKeyPair();
            expect(Jws_1.default.verifyCompactJws(input, publicKey)).toBeFalsy();
            done();
        }));
    }));
}));
//# sourceMappingURL=Jws.spec.js.map