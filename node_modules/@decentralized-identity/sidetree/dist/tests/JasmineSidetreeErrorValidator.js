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
const SidetreeError_1 = require("../lib/common/SidetreeError");
/**
 * Encapsulates the helper functions for the tests.
 */
class JasmineSidetreeErrorValidator {
    /**
     * Fails the current spec if the execution of the function does not throw the expected SidetreeError.
     *
     * @param functionToExecute The function to execute.
     * @param expectedErrorCode The expected error code.
     * @param expectedContainedStringInMessage The string expected to be part of (need not be full error message) the error message.
     */
    static expectSidetreeErrorToBeThrown(functionToExecute, expectedErrorCode, expectedContainedStringInMessage) {
        let validated = false;
        try {
            functionToExecute();
        }
        catch (e) {
            if (e instanceof SidetreeError_1.default) {
                expect(e.code).toEqual(expectedErrorCode);
                if (expectedContainedStringInMessage !== undefined) {
                    expect(e.message).toContain(expectedContainedStringInMessage);
                }
                validated = true;
            }
        }
        if (!validated) {
            fail(`Expected error '${expectedErrorCode}' did not occur.`);
        }
    }
    /**
     * Fails the current spec if the execution of the function does not throw the expected SidetreeError.
     *
     * @param functionToExecute The function to execute.
     * @param expectedErrorCode The expected error code.
     * @param expectedContainedStringInMessage The string expected to be part of (need not be full error message) the error message.
     */
    static expectSidetreeErrorToBeThrownAsync(functionToExecute, expectedErrorCode, expectedContainedStringInMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            let validated = false;
            let actualError;
            try {
                yield functionToExecute();
            }
            catch (e) {
                actualError = e;
                if (e instanceof SidetreeError_1.default) {
                    expect(e.code).toEqual(expectedErrorCode);
                    if (expectedContainedStringInMessage !== undefined) {
                        expect(e.message).toContain(expectedContainedStringInMessage);
                    }
                    validated = true;
                }
            }
            if (!validated) {
                fail(`Expected error '${expectedErrorCode}' did not occur. Instead got '${actualError.code}'`);
            }
        });
    }
}
exports.default = JasmineSidetreeErrorValidator;
//# sourceMappingURL=JasmineSidetreeErrorValidator.js.map