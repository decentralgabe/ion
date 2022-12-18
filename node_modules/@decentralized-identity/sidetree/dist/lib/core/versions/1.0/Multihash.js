"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const Encoder_1 = require("./Encoder");
const ErrorCode_1 = require("./ErrorCode");
const JsonCanonicalizer_1 = require("./util/JsonCanonicalizer");
const Logger_1 = require("../../../common/Logger");
const SidetreeError_1 = require("../../../common/SidetreeError");
const multihashes = require('multihashes');
/**
 * Class that performs hashing operations using the multihash format.
 */
class Multihash {
    /**
     * Hashes the content using the hashing algorithm specified.
     * @param hashAlgorithmInMultihashCode The hashing algorithm to use.
     * @returns A multihash buffer.
     */
    static hash(content, hashAlgorithmInMultihashCode) {
        const conventionalHash = this.hashAsNonMultihashBuffer(content, hashAlgorithmInMultihashCode);
        const multihash = multihashes.encode(conventionalHash, hashAlgorithmInMultihashCode);
        return multihash;
    }
    /**
     * Hashes the content using the hashing algorithm specified as a generic (non-multihash) hash.
     * @param hashAlgorithmInMultihashCode The hashing algorithm to use.
     * @returns A multihash buffer.
     */
    static hashAsNonMultihashBuffer(content, hashAlgorithmInMultihashCode) {
        let hash;
        switch (hashAlgorithmInMultihashCode) {
            case 18: // SHA256
                hash = crypto.createHash('sha256').update(content).digest();
                break;
            case 22: // SHA3-256
                hash = crypto.createHash('sha3-256').update(content).digest();
                break;
            default:
                throw new SidetreeError_1.default(ErrorCode_1.default.MultihashUnsupportedHashAlgorithm);
        }
        return hash;
    }
    /**
     * Canonicalize the given content, then double hashes the result using the latest supported hash algorithm, then encodes the multihash.
     * Mainly used for testing purposes.
     */
    static canonicalizeThenHashThenEncode(content, hashAlgorithmInMultihashCode) {
        const canonicalizedStringBuffer = JsonCanonicalizer_1.default.canonicalizeAsBuffer(content);
        if (hashAlgorithmInMultihashCode === undefined) {
            hashAlgorithmInMultihashCode = 18; // Default to SHA256.
        }
        const multihashEncodedString = Multihash.hashThenEncode(canonicalizedStringBuffer, hashAlgorithmInMultihashCode);
        return multihashEncodedString;
    }
    /**
     * Canonicalize the given content, then double hashes the result using the latest supported hash algorithm, then encodes the multihash.
     * Mainly used for testing purposes.
     */
    static canonicalizeThenDoubleHashThenEncode(content) {
        const contentBuffer = JsonCanonicalizer_1.default.canonicalizeAsBuffer(content);
        // Double hash.
        const hashAlgorithmInMultihashCode = 18; // Default to SHA256.
        const intermediateHashBuffer = Multihash.hashAsNonMultihashBuffer(contentBuffer, hashAlgorithmInMultihashCode);
        const multihashEncodedString = Multihash.hashThenEncode(intermediateHashBuffer, hashAlgorithmInMultihashCode);
        return multihashEncodedString;
    }
    /**
     * Hashes the content using the hashing algorithm specified then codes the multihash buffer.
     * @param hashAlgorithmInMultihashCode The hashing algorithm to use.
     */
    static hashThenEncode(content, hashAlgorithmInMultihashCode) {
        const multihashBuffer = Multihash.hash(content, hashAlgorithmInMultihashCode);
        const multihashEncodedString = Encoder_1.default.encode(multihashBuffer);
        return multihashEncodedString;
    }
    /**
     * Given a multihash, returns the code of the hash algorithm, and digest buffer.
     * @returns [hash algorithm code, digest buffer]
     * @throws `SidetreeError` if hash algorithm used for the given multihash is unsupported.
     */
    static decode(multihashBuffer) {
        const multihash = multihashes.decode(multihashBuffer);
        return {
            algorithm: multihash.code,
            hash: multihash.digest
        };
    }
    /**
     * Checks if the given hash is a multihash computed using one of the supported hash algorithms.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateHashComputedUsingSupportedHashAlgorithm(encodedMultihash, supportedHashAlgorithmsInMultihashCode, inputContextForErrorLogging) {
        const multihashBuffer = Encoder_1.default.decodeAsBuffer(encodedMultihash);
        let multihash;
        try {
            multihash = multihashes.decode(multihashBuffer);
        }
        catch (_a) {
            throw new SidetreeError_1.default(ErrorCode_1.default.MultihashStringNotAMultihash, `Given ${inputContextForErrorLogging} string '${encodedMultihash}' is not a multihash.`);
        }
        if (!supportedHashAlgorithmsInMultihashCode.includes(multihash.code)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.MultihashNotSupported, `Given ${inputContextForErrorLogging} uses unsupported multihash algorithm with code ${multihash.code}.`);
        }
    }
    /**
     * Verifies the given content against the given multihash.
     */
    static isValidHash(encodedContent, encodedMultihash) {
        if (encodedContent === undefined) {
            return false;
        }
        try {
            const contentBuffer = Encoder_1.default.decodeAsBuffer(encodedContent);
            return Multihash.verifyEncodedMultihashForContent(contentBuffer, encodedMultihash);
        }
        catch (error) {
            Logger_1.default.info(error);
            return false;
        }
    }
    /**
     * Canonicalizes the given content object, then validates the multihash of the canonicalized UTF8 object buffer against the expected multihash.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateCanonicalizeObjectHash(content, expectedEncodedMultihash, inputContextForErrorLogging) {
        const contentBuffer = JsonCanonicalizer_1.default.canonicalizeAsBuffer(content);
        const validHash = Multihash.verifyEncodedMultihashForContent(contentBuffer, expectedEncodedMultihash);
        if (!validHash) {
            throw new SidetreeError_1.default(ErrorCode_1.default.CanonicalizedObjectHashMismatch, `Canonicalized ${inputContextForErrorLogging} object hash does not match expected hash '${expectedEncodedMultihash}'.`);
        }
    }
    /**
     * Canonicalizes the given content object, then verifies the multihash as a "double hash"
     * (ie. the given multihash is the hash of a hash) against the canonicalized string as a UTF8 buffer.
     */
    static canonicalizeAndVerifyDoubleHash(content, encodedMultihash) {
        if (content === undefined) {
            return false;
        }
        try {
            const contentBuffer = JsonCanonicalizer_1.default.canonicalizeAsBuffer(content);
            return Multihash.verifyDoubleHash(contentBuffer, encodedMultihash);
        }
        catch (error) {
            Logger_1.default.info(error);
            return false;
        }
    }
    /**
     * Verifies the multihash as a "double hash" (ie. the given multihash is a hash of a hash) against the content `Buffer`.
     * Note that the intermediate hash is required to be a non-multihash hash by the same hash algorithm as the final multihash.
     */
    static verifyDoubleHash(content, encodedMultihash) {
        try {
            const expectedMultihashBuffer = Encoder_1.default.decodeAsBuffer(encodedMultihash);
            const hashAlgorithmCode = Multihash.decode(expectedMultihashBuffer).algorithm;
            const intermediateHashBuffer = Multihash.hashAsNonMultihashBuffer(content, hashAlgorithmCode);
            const actualMultihashBuffer = Multihash.hash(intermediateHashBuffer, hashAlgorithmCode);
            return Buffer.compare(actualMultihashBuffer, expectedMultihashBuffer) === 0;
        }
        catch (error) {
            Logger_1.default.info(error);
            return false;
        }
    }
    /**
     * Verifies the multihash against the content `Buffer`.
     */
    static verifyEncodedMultihashForContent(content, encodedMultihash) {
        try {
            const expectedMultihashBuffer = Encoder_1.default.decodeAsBuffer(encodedMultihash);
            const hashAlgorithmCode = Multihash.decode(expectedMultihashBuffer).algorithm;
            const actualMultihashBuffer = Multihash.hash(content, hashAlgorithmCode);
            // Compare the strings instead of buffers, because encoding schemes such as base64URL can allow two distinct strings to decode into the same buffer.
            // e.g. 'EiAJID5-y7rbEs7I3PPiMtwVf28LTkPFD4BWIZPCtb6AMg' and
            //      'EiAJID5-y7rbEs7I3PPiMtwVf28LTkPFD4BWIZPCtb6AMv' would decode into the same buffer.
            const actualMultihashString = Encoder_1.default.encode(actualMultihashBuffer);
            return actualMultihashString === encodedMultihash;
        }
        catch (error) {
            Logger_1.default.info(error);
            return false;
        }
    }
}
exports.default = Multihash;
//# sourceMappingURL=Multihash.js.map