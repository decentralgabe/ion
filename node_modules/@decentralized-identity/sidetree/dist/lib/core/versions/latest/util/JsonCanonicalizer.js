"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const canonicalize = require('canonicalize');
/**
 * Class containing reusable JSON canonicalization operations using JSON Canonicalization Scheme (JCS).
 */
class JsonCanonicalizer {
    /**
     * Canonicalizes the given content as a UTF8 buffer.
     */
    static canonicalizeAsBuffer(content) {
        const canonicalizedString = canonicalize(content);
        const contentBuffer = Buffer.from(canonicalizedString);
        return contentBuffer;
    }
}
exports.default = JsonCanonicalizer;
//# sourceMappingURL=JsonCanonicalizer.js.map