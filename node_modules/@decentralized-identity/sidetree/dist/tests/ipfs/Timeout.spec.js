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
const IpfsErrorCode_1 = require("../../lib/ipfs/IpfsErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const Timeout_1 = require("../../lib/ipfs/Util/Timeout");
describe('Timeout', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('timeout()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should timeout if given task took too long.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // A 10 second running promise.
            const longRunningPromise = new Promise((resolve) => {
                setTimeout(() => { resolve(1); }, 10);
            });
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => Timeout_1.default.timeout(longRunningPromise, 1), IpfsErrorCode_1.default.TimeoutPromiseTimedOut);
            done();
        }));
        it('should return error thrown by the task.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error('some bad error');
            const aPromiseThatThrowsError = new Promise(() => {
                throw error;
            });
            yield expectAsync(Timeout_1.default.timeout(aPromiseThatThrowsError, 1000)).toBeRejected(error);
            done();
        }));
    }));
}));
//# sourceMappingURL=Timeout.spec.js.map