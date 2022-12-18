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
const yieldableJson = require('yieldable-json');
/**
 * A JSON library that performs operations asynchronously.
 */
class JsonAsync {
    /**
     * Parses the given operation into a JavaScript object asynchronously,
     * to allow the event loop a chance to handle requests.
     * NOTE: Use only when the JSON data buffer is expected to exceed 200 KB as shown in statistics in https://github.com/ibmruntimes/yieldable-json
     */
    static parse(jsonData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create a promise to wrap the successful/failed read events.
            const jsonParsePromise = new Promise((resolve, reject) => {
                yieldableJson.parseAsync(jsonData, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
            // Wait until the JSON parsing is completed.
            const result = yield jsonParsePromise;
            return result;
        });
    }
}
exports.default = JsonAsync;
//# sourceMappingURL=JsonAsync.js.map