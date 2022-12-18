"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RequestError_1 = require("../../lib/bitcoin/RequestError");
const ResponseStatus_1 = require("../../lib/common/enums/ResponseStatus");
describe('RquestError', () => {
    describe('expose', () => {
        it('should return true if the code is defined', () => {
            const requestError = new RequestError_1.default(ResponseStatus_1.default.BadRequest, 'some code');
            expect(requestError.expose).toBeTruthy();
        });
        it('should return false if the code is defined', () => {
            const requestError = new RequestError_1.default(ResponseStatus_1.default.BadRequest, undefined);
            expect(requestError.expose).toBeFalsy();
        });
    });
});
//# sourceMappingURL=RequestError.spec.js.map