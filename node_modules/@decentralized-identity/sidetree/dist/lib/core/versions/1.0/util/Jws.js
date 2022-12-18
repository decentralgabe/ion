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
const Encoder_1 = require("../Encoder");
const ErrorCode_1 = require("../ErrorCode");
const jose_1 = require("jose");
const Logger_1 = require("../../../../common/Logger");
const SidetreeError_1 = require("../../../../common/SidetreeError");
/**
 * Class containing reusable JWS operations.
 */
class Jws {
    /**
     * Constructs a JWS object.
     * @param compactJws Input should be a compact JWS string.
     */
    constructor(compactJws) {
        if (typeof compactJws !== 'string') {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwsCompactJwsNotString);
        }
        const parts = compactJws.split('.');
        if (parts.length !== 3) {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwsCompactJwsInvalid);
        }
        const protectedHeader = parts[0];
        const payload = parts[1];
        const signature = parts[2];
        const decodedProtectedHeadJsonString = Encoder_1.default.decodeBase64UrlAsString(protectedHeader);
        const decodedProtectedHeader = JSON.parse(decodedProtectedHeadJsonString);
        const expectedHeaderPropertyCount = 1; // By default we must have header property is `alg`.
        const headerProperties = Object.keys(decodedProtectedHeader);
        if (headerProperties.length !== expectedHeaderPropertyCount) {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwsProtectedHeaderMissingOrUnknownProperty);
        }
        // Protected header must contain 'alg' property with value 'ES256K'.
        if (decodedProtectedHeader.alg !== 'ES256K') {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwsProtectedHeaderMissingOrIncorrectAlg);
        }
        // Must contain Base64URL string 'signature' property.
        if (!Encoder_1.default.isBase64UrlString(signature)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwsSignatureNotBase64UrlString);
        }
        // Must contain Base64URL string 'payload' property.
        if (!Encoder_1.default.isBase64UrlString(payload)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.JwsPayloadNotBase64UrlString);
        }
        this.protected = protectedHeader;
        this.payload = payload;
        this.signature = signature;
    }
    /**
     * Converts this object to a compact JWS string.
     */
    toCompactJws() {
        return Jws.createCompactJws(this.protected, this.payload, this.signature);
    }
    /**
     * Verifies the JWS signature.
     * @returns true if signature is successfully verified, false otherwise.
     */
    verifySignature(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return Jws.verifySignature(this.protected, this.payload, this.signature, publicKey);
        });
    }
    /**
     * Verifies the JWS signature.
     * @returns true if signature is successfully verified, false otherwise.
     */
    static verifySignature(encodedProtectedHeader, encodedPayload, signature, publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const jwsSigningInput = encodedProtectedHeader + '.' + encodedPayload + '.' + signature;
            const signatureValid = Jws.verifyCompactJws(jwsSigningInput, publicKey);
            return signatureValid;
        });
    }
    /**
     * Verifies the compact JWS string using the given JWK key.
     * @returns true if signature is valid; else otherwise.
     */
    static verifyCompactJws(compactJws, publicKeyJwk) {
        try {
            jose_1.JWS.verify(compactJws, publicKeyJwk);
            return true;
        }
        catch (error) {
            Logger_1.default.info(`Input '${compactJws}' failed signature verification: ${SidetreeError_1.default.createFromError(ErrorCode_1.default.JwsFailedSignatureValidation, error)}`);
            return false;
        }
    }
    /**
     * Signs the given protected header and payload as a JWS.
     * NOTE: this is mainly used by tests to create valid test data.
     *
     * @param payload If the given payload is of string type, it is assumed to be encoded string;
     *                else the object will be stringified and encoded.
     */
    static sign(protectedHeader, payload, privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const flattenedJws = jose_1.JWS.sign.flattened(payload, privateKey, protectedHeader);
            const jws = {
                protected: flattenedJws.protected,
                payload: flattenedJws.payload,
                signature: flattenedJws.signature
            };
            return jws;
        });
    }
    /**
     * Signs the given payload as a compact JWS string.
     * This is mainly used by tests to create valid test data.
     */
    static signAsCompactJws(payload, privateKey, protectedHeader) {
        const compactJws = jose_1.JWS.sign(payload, privateKey, protectedHeader);
        return compactJws;
    }
    /**
     * Parses the input as a `Jws` object.
     */
    static parseCompactJws(compactJws) {
        return new Jws(compactJws);
    }
    /**
     * Creates a compact JWS string using the given input. No string validation is performed.
     */
    static createCompactJws(protectedHeader, payload, signature) {
        return protectedHeader + '.' + payload + '.' + signature;
    }
}
exports.default = Jws;
//# sourceMappingURL=Jws.js.map