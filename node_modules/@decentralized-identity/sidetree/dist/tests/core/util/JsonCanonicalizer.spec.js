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
const JsonCanonicalizer_1 = require("../../../lib/core/versions/latest/util/JsonCanonicalizer");
describe('JsonCanonicalizer', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('canonicalizeAsBuffer()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should match test vector.', () => __awaiter(void 0, void 0, void 0, function* () {
            const publicKeyJwk = {
                kty: 'EC',
                crv: 'secp256k1',
                x: '5s3-bKjD1Eu_3NJu8pk7qIdOPl1GBzU_V8aR3xiacoM',
                y: 'v0-Q5H3vcfAfQ4zsebJQvMrIg3pcsaJzRvuIYZ3_UOY'
            };
            const canonicalizedBuffer = JsonCanonicalizer_1.default.canonicalizeAsBuffer(publicKeyJwk);
            const expectedCanonicalizedString = '{"crv":"secp256k1","kty":"EC","x":"5s3-bKjD1Eu_3NJu8pk7qIdOPl1GBzU_V8aR3xiacoM","y":"v0-Q5H3vcfAfQ4zsebJQvMrIg3pcsaJzRvuIYZ3_UOY"}';
            expect(canonicalizedBuffer.toString()).toEqual(expectedCanonicalizedString);
        }));
    }));
}));
//# sourceMappingURL=JsonCanonicalizer.spec.js.map