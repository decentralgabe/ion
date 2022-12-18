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
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const InputValidator_1 = require("../../lib/core/versions/latest/InputValidator");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
describe('InputValidator', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('validateNonArrayObject()', () => {
        it('should throws if input is an array.', () => __awaiter(void 0, void 0, void 0, function* () {
            const array = [];
            const inputObjectContext = 'anyObjectContext';
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => InputValidator_1.default.validateNonArrayObject(array, inputObjectContext), ErrorCode_1.default.InputValidatorInputCannotBeAnArray, inputObjectContext);
        }));
    });
    describe('validateDidType', () => {
        it('should not throw if type is undefined', () => {
            try {
                InputValidator_1.default['validateDidType'](undefined);
            }
            catch (e) {
                fail(`Expect not to throw but got ${e}`);
            }
        });
        it('should throw sidetree error if type is not a string', () => {
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => {
                InputValidator_1.default['validateDidType'](123);
            }, ErrorCode_1.default.SuffixDataTypeIsNotString);
        });
        it('should throw sidetree error if type length is greater than 4', () => {
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => {
                InputValidator_1.default['validateDidType']('12345');
            }, ErrorCode_1.default.SuffixDataTypeLengthGreaterThanFour);
        });
        it('should throw sidetree error if type is not base64url', () => {
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => {
                InputValidator_1.default['validateDidType']('?=');
            }, ErrorCode_1.default.SuffixDataTypeInvalidCharacter);
        });
        it('should not throw if type is valid', () => {
            try {
                InputValidator_1.default['validateDidType']('abcd');
            }
            catch (e) {
                fail(`Expect not to throw but got ${e}`);
            }
        });
    });
}));
//# sourceMappingURL=InputValidator.spec.js.map