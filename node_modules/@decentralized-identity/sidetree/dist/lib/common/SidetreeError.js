"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Standardized error class for throwing generic errors internal to this project.
 * NOTE: Not to be confused with RequestError which is used as a response to external requests.
 */
class SidetreeError extends Error {
    constructor(code, message) {
        super(message ? message : code);
        this.code = code;
        // NOTE: Extending 'Error' breaks prototype chain since TypeScript 2.1.
        // The following line restores prototype chain.
        Object.setPrototypeOf(this, new.target.prototype);
    }
    /**
     * Returns a new SidetreeError object using the inputs.
     *
     * @param code The error code.
     * @param err The error exception thrown.
     */
    static createFromError(code, err) {
        return new SidetreeError(code, err.message);
    }
    /**
     * Converts the given `Error` into a string.
     */
    static stringify(error) {
        return JSON.stringify(error, Object.getOwnPropertyNames(error));
    }
}
exports.default = SidetreeError;
//# sourceMappingURL=SidetreeError.js.map