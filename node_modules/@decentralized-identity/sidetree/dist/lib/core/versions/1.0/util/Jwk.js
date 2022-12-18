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
const ErrorCode_1 = require("../ErrorCode");
const jose_1 = require("jose");
const SidetreeError_1 = require("../../../../common/SidetreeError");
/**
 * Class containing reusable JWK operations.
 */
class Jwk {
    /**
     * Generates SECP256K1 key pair.
     * Mainly used for testing.
     * @returns [publicKey, privateKey]
     */
    static generateEs256kKeyPair() {
        return __awaiter(this, void 0, void 0, function* () {
            const keyPair = yield jose_1.JWK.generate('EC', 'secp256k1');
            const publicKeyInternal = keyPair.toJWK();
            // Remove the auto-populated `kid` field.
            const publicKey = {
                kty: publicKeyInternal.kty,
                crv: publicKeyInternal.crv,
                x: publicKeyInternal.x,
                y: publicKeyInternal.y
            };
            const privateKey = Object.assign({ d: keyPair.d }, publicKey);
            return [publicKey, privateKey];
        });
    }
    /**
     * Validates the given key is a SECP256K1 public key in JWK format allowed by Sidetree.
     * @throws SidetreeError if given object is not a SECP256K1 public key in JWK format allowed by Sidetree.
     */
    static validateJwkEs256k(publicKeyJwk) {
        if (publicKeyJwk === undefined) {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwkEs256kUndefined);
        }
        const allowedProperties = new Set(['kty', 'crv', 'x', 'y']);
        for (const property in publicKeyJwk) {
            if (!allowedProperties.has(property)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.JwkEs256kHasUnknownProperty);
            }
        }
        if (publicKeyJwk.kty !== 'EC') {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwkEs256kMissingOrInvalidKty);
        }
        if (publicKeyJwk.crv !== 'secp256k1') {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwkEs256kMissingOrInvalidCrv);
        }
        if (typeof publicKeyJwk.x !== 'string') {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwkEs256kMissingOrInvalidTypeX);
        }
        if (typeof publicKeyJwk.y !== 'string') {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwkEs256kMissingOrInvalidTypeY);
        }
        // `x` and `y` need 43 Base64URL encoded bytes to contain 256 bits.
        if (publicKeyJwk.x.length !== 43) {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwkEs256kHasIncorrectLengthOfX, `SECP256K1 JWK 'x' property must be 43 bytes.`);
        }
        if (publicKeyJwk.y.length !== 43) {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwkEs256kHasIncorrectLengthOfY, `SECP256K1 JWK 'y' property must be 43 bytes.`);
        }
    }
    /**
     * Gets the public key given the private ES256K key.
     * Mainly used for testing purposes.
     */
    static getEs256kPublicKey(privateKey) {
        const keyCopy = Object.assign({}, privateKey);
        // Delete the private key portion.
        delete keyCopy.d;
        return keyCopy;
    }
}
exports.default = Jwk;
//# sourceMappingURL=Jwk.js.map