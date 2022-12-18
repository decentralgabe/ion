"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorCode_1 = require("./ErrorCode");
const SidetreeError_1 = require("../../../common/SidetreeError");
const base64url_1 = require("base64url");
/**
 * Class that encodes binary blobs into strings.
 * Note that the encode/decode methods may change underlying encoding scheme.
 */
class Encoder {
    /**
     * Encodes given Buffer into a Base64URL string.
     */
    static encode(content) {
        const encodedContent = base64url_1.default.encode(content);
        return encodedContent;
    }
    /**
     * Decodes the given Base64URL string into a Buffer.
     */
    static decodeAsBuffer(encodedContent) {
        Encoder.validateBase64UrlString(encodedContent);
        const content = base64url_1.default.toBuffer(encodedContent);
        return content;
    }
    /**
     * Decodes the given input into the original string.
     */
    static decodeAsString(encodedContent) {
        return Encoder.decodeBase64UrlAsString(encodedContent);
    }
    /**
     * Decodes the given Base64URL string into the original string.
     */
    static decodeBase64UrlAsString(input) {
        Encoder.validateBase64UrlString(input);
        const content = base64url_1.default.decode(input);
        return content;
    }
    /**
     * Validates if the given input is a Base64URL string.
     * undefined is considered not a valid Base64URL string.
     * NOTE: input is `any` type to handle cases when caller passes input directly from JSON.parse() as `any`.
     * @throws SidetreeError if input is not a Base64URL string.
     */
    static validateBase64UrlString(input) {
        if (typeof input !== 'string') {
            throw new SidetreeError_1.default(ErrorCode_1.default.EncoderValidateBase64UrlStringInputNotString, `Input '${JSON.stringify(input)}' not a string.`);
        }
        const isBase64UrlString = Encoder.isBase64UrlString(input);
        if (!isBase64UrlString) {
            throw new SidetreeError_1.default(ErrorCode_1.default.EncoderValidateBase64UrlStringInputNotBase64UrlString, `Input '${JSON.stringify(input)}' not a Base64URL string.`);
        }
    }
    /**
     * Tests if the given string is a Base64URL string.
     */
    static isBase64UrlString(input) {
        // NOTE:
        // /<expression>/ denotes regex.
        // ^ denotes beginning of string.
        // $ denotes end of string.
        // + denotes one or more characters.
        const isBase64UrlString = /^[A-Za-z0-9_-]+$/.test(input);
        return isBase64UrlString;
    }
}
exports.default = Encoder;
//# sourceMappingURL=Encoder.js.map