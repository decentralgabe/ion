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
const ErrorCode_1 = require("../../../lib/bitcoin/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../../JasmineSidetreeErrorValidator");
const LockIdentifierSerializer_1 = require("../../../lib/bitcoin/lock/LockIdentifierSerializer");
const base64url_1 = require("base64url");
describe('LockIdentifierSerializer', () => {
    describe('serialize', () => {
        it('should serialize and deserialize it correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            const identifier = {
                transactionId: 'some transaction id',
                redeemScriptAsHex: 'redeem script -- input'
            };
            const serialized = LockIdentifierSerializer_1.default.serialize(identifier);
            expect(serialized).toBeDefined();
            const deserializedObj = LockIdentifierSerializer_1.default.deserialize(serialized);
            expect(deserializedObj).toEqual(identifier);
        }));
    });
    describe('deserialize', () => {
        it('should throw if the input is not delimited correctly.', () => __awaiter(void 0, void 0, void 0, function* () {
            const delimiter = LockIdentifierSerializer_1.default['delimiter'];
            const incorrectInput = `value1${delimiter}value2${delimiter}value3`;
            const incorrectInputEncoded = base64url_1.default.encode(incorrectInput);
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => { LockIdentifierSerializer_1.default.deserialize(incorrectInputEncoded); }, ErrorCode_1.default.LockIdentifierIncorrectFormat);
        }));
    });
});
//# sourceMappingURL=LockIdentifierSerializer.spec.js.map