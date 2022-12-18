"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Delta_1 = require("../../lib/core/versions/latest/Delta");
const ErrorCode_1 = require("../../lib/core/versions/latest/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
function generateLongString(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result = result + 'a';
    }
    return result;
}
describe('Delta', () => {
    describe('validateDelta', () => {
        it('should throw sidetree error if delta size exceeds max limit', () => {
            const mockDelta = {
                someKey: generateLongString(2000)
            };
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => { Delta_1.default.validateDelta(mockDelta); }, ErrorCode_1.default.DeltaExceedsMaximumSize);
        });
        it('should throw sidetree error if delta is null', () => {
            const mockDelta = null;
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => { Delta_1.default.validateDelta(mockDelta); }, ErrorCode_1.default.DeltaIsNullOrUndefined);
        });
        it('should throw sidetree error if delta is undefined', () => {
            const mockDelta = undefined;
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => { Delta_1.default.validateDelta(mockDelta); }, ErrorCode_1.default.DeltaIsNullOrUndefined);
        });
    });
});
//# sourceMappingURL=Delta.spec.js.map