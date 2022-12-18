"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Response_1 = require("../common/Response");
/**
 * Error class used as a response to external requests.
 */
class RequestError extends Error {
    constructor(responseCode, code) {
        super(code ? JSON.stringify({ code }) : undefined);
        this.responseCode = responseCode;
        this.code = code;
        // NOTE: Extending 'Error' breaks prototype chain since TypeScript 2.1.
        // The following line restores prototype chain.
        Object.setPrototypeOf(this, new.target.prototype);
    }
    /**
     * Gets an HTTP status number according to the response code.
     * This is used by some middleware solutions on error handling.
     */
    get status() {
        return Response_1.default.toHttpStatus(this.responseCode);
    }
    /** Koa property used to determine if the error message should be returned */
    get expose() {
        return this.code !== undefined;
    }
}
exports.default = RequestError;
//# sourceMappingURL=RequestError.js.map