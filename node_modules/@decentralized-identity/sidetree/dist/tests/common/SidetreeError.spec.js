"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SidetreeError_1 = require("../../lib/common/SidetreeError");
describe('SidetreeError', () => {
    describe('createFromError', () => {
        it('should create with given message', () => {
            const actual = SidetreeError_1.default.createFromError('code', new Error('This is the message'));
            expect(actual.code).toEqual('code');
            expect(actual.message).toEqual('This is the message');
        });
        it('should create use code as the message if message is not passed in', () => {
            const actual = SidetreeError_1.default.createFromError('code', new Error());
            expect(actual.code).toEqual('code');
            expect(actual.message).toEqual('code');
        });
    });
});
//# sourceMappingURL=SidetreeError.spec.js.map