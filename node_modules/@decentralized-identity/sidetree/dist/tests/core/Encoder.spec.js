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
describe('Encoder', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('decodeAsBuffer()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should throw if input is not a string.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const input = undefined;
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => __awaiter(void 0, void 0, void 0, function* () { return Encoder_1.default.decodeAsBuffer(input); }), ErrorCode_1.default.EncoderValidateBase64UrlStringInputNotString);
            done();
        }));
        it('should throw if input string is not Base64URL string.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const input = 'inputStringContainingNonBase64UrlCharsLike#';
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => __awaiter(void 0, void 0, void 0, function* () { return Encoder_1.default.decodeAsBuffer(input); }), ErrorCode_1.default.EncoderValidateBase64UrlStringInputNotBase64UrlString);
            done();
        }));
    }));
}));
//# sourceMappingURL=Encoder.spec.js.map