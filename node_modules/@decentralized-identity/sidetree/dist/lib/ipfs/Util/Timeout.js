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
const IpfsErrorCode_1 = require("../IpfsErrorCode");
const SidetreeError_1 = require("../../common/SidetreeError");
/**
 * Class containing code execution timeout/timing utilities.
 */
class Timeout {
    /**
     * Monitors the given promise to see if it runs to completion within the specified timeout duration.
     * @param task Promise to apply a timeout to.
     * @returns The value that the task returns if the task completed execution within the timeout duration.
     * @throws `TimeoutPromiseTimedOut` Error task timed out. Rethrows the error that the given task throws.
     */
    static timeout(task, timeoutInMilliseconds) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line promise/param-names
            const timeoutPromise = new Promise((_resolve, reject) => {
                setTimeout(() => { reject(new SidetreeError_1.default(IpfsErrorCode_1.default.TimeoutPromiseTimedOut, `Promise timed out after ${timeoutInMilliseconds} milliseconds.`)); }, timeoutInMilliseconds);
            });
            const content = yield Promise.race([task, timeoutPromise]);
            return content;
        });
    }
}
exports.default = Timeout;
//# sourceMappingURL=Timeout.js.map