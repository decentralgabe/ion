"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Document {
    static getPublicKey(document, keyId) {
        if (Array.isArray(document.publicKeys)) {
            for (let i = 0; i < document.publicKeys.length; i++) {
                const publicKey = document.publicKeys[i];
                if (publicKey.id === keyId) {
                    return publicKey;
                }
            }
        }
        return undefined;
    }
    ;
}
exports.default = Document;
//# sourceMappingURL=Document.js.map