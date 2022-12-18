"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class containing JavaScript object operations.
 */
class JsObject {
    /**
     * Deep copies the given input.
     */
    static deepCopyObject(input) {
        if (typeof input !== 'object') {
            return input;
        }
        const deepCopy = Array.isArray(input) ? [] : {};
        for (const key in input) {
            const value = input[key];
            // Recursively deep copy properties.
            deepCopy[key] = JsObject.deepCopyObject(value);
        }
        return deepCopy;
    }
    /**
     * Clears all the properties in the given object.
     */
    static clearObject(input) {
        for (const key in input) {
            delete input[key];
        }
    }
}
exports.default = JsObject;
//# sourceMappingURL=JsObject.js.map