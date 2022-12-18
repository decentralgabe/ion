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
const JsonCanonicalizer_1 = require("../../lib/core/versions/latest/util/JsonCanonicalizer");
const Multihash_1 = require("../../lib/core/versions/latest/Multihash");
describe('Multihash', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('isValidHash()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return false if content is undefined', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = Multihash_1.default.isValidHash(undefined, 'anyCommitment');
            expect(result).toBeFalsy();
        }));
        it('should return false if encountered an unexpected error.', () => __awaiter(void 0, void 0, void 0, function* () {
            const multihashHashSpy = spyOn(Multihash_1.default, 'verifyEncodedMultihashForContent').and.throwError('Simulated error message.');
            const result = Multihash_1.default.isValidHash('revealValue', 'commitmentHash');
            expect(multihashHashSpy).toHaveBeenCalled();
            expect(result).toBeFalsy();
        }));
    }));
    describe('hash()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throws if given an unsupported hash algorithm.', () => __awaiter(void 0, void 0, void 0, function* () {
            const unsupportedHashAlgorithm = 19; // SHA2-512
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => Multihash_1.default.hash(Buffer.from('any content'), unsupportedHashAlgorithm), ErrorCode_1.default.MultihashUnsupportedHashAlgorithm);
        }));
    }));
    describe('canonicalizeAndVerifyDoubleHash()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return false if `undefined` is given as content.', () => __awaiter(void 0, void 0, void 0, function* () {
            const validHash = Multihash_1.default.canonicalizeAndVerifyDoubleHash(undefined, 'unusedMultihashValue');
            expect(validHash).toBeFalsy();
        }));
        it('should return false if unexpected error is caught.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simulate an error thrown.
            spyOn(JsonCanonicalizer_1.default, 'canonicalizeAsBuffer').and.throwError('any error');
            const validHash = Multihash_1.default.canonicalizeAndVerifyDoubleHash({ unused: 'unused' }, 'unusedMultihashValue');
            expect(validHash).toBeFalsy();
        }));
    }));
    describe('verify()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return false if unexpected error is caught.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simulate an error thrown.
            spyOn(Encoder_1.default, 'decodeAsBuffer').and.throwError('any error');
            const validHash = Multihash_1.default.verifyEncodedMultihashForContent(Buffer.from('anyValue'), 'unusedMultihashValue');
            expect(validHash).toBeFalsy();
        }));
        it('should return false if given encoded multihash is not using the canonical encoding.', () => __awaiter(void 0, void 0, void 0, function* () {
            const anyContent = Buffer.from('any content');
            // Canonical encoded multihash of 'any content' is 'EiDDidVHVekuMIYV3HI5nfp8KP6s3_W44Pd-MO5b-XK5iQ'
            const defaultContentEncodedMultihash = 'EiDDidVHVekuMIYV3HI5nfp8KP6s3_W44Pd-MO5b-XK5iQ';
            const modifiedContentEncodedMultihash = 'EiDDidVHVekuMIYV3HI5nfp8KP6s3_W44Pd-MO5b-XK5iR';
            // Two multihash strings decodes into the same buffer.
            expect(Encoder_1.default.decodeAsBuffer(defaultContentEncodedMultihash)).toEqual(Encoder_1.default.decodeAsBuffer(modifiedContentEncodedMultihash));
            const validHashCheckResult = Multihash_1.default.verifyEncodedMultihashForContent(anyContent, defaultContentEncodedMultihash);
            const invalidHashCheckResult = Multihash_1.default.verifyEncodedMultihashForContent(anyContent, modifiedContentEncodedMultihash);
            expect(validHashCheckResult).toBeTruthy();
            expect(invalidHashCheckResult).toBeFalsy();
        }));
    }));
    describe('verifyDoubleHash()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return false if unexpected error is caught.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simulate an error thrown.
            spyOn(Encoder_1.default, 'decodeAsBuffer').and.throwError('any error');
            const validHash = Multihash_1.default.verifyDoubleHash(Buffer.from('anyValue'), 'unusedMultihashValue');
            expect(validHash).toBeFalsy();
        }));
    }));
}));
//# sourceMappingURL=Multihash.spec.js.map