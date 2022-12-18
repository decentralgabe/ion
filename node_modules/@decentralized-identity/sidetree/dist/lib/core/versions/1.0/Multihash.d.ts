/// <reference types="node" />
/**
 * Class that performs hashing operations using the multihash format.
 */
export default class Multihash {
    /**
     * Hashes the content using the hashing algorithm specified.
     * @param hashAlgorithmInMultihashCode The hashing algorithm to use.
     * @returns A multihash buffer.
     */
    static hash(content: Buffer, hashAlgorithmInMultihashCode: number): Buffer;
    /**
     * Hashes the content using the hashing algorithm specified as a generic (non-multihash) hash.
     * @param hashAlgorithmInMultihashCode The hashing algorithm to use.
     * @returns A multihash buffer.
     */
    static hashAsNonMultihashBuffer(content: Buffer, hashAlgorithmInMultihashCode: number): Buffer;
    /**
     * Canonicalize the given content, then double hashes the result using the latest supported hash algorithm, then encodes the multihash.
     * Mainly used for testing purposes.
     */
    static canonicalizeThenHashThenEncode(content: object, hashAlgorithmInMultihashCode?: number): string;
    /**
     * Canonicalize the given content, then double hashes the result using the latest supported hash algorithm, then encodes the multihash.
     * Mainly used for testing purposes.
     */
    static canonicalizeThenDoubleHashThenEncode(content: object): string;
    /**
     * Hashes the content using the hashing algorithm specified then codes the multihash buffer.
     * @param hashAlgorithmInMultihashCode The hashing algorithm to use.
     */
    static hashThenEncode(content: Buffer, hashAlgorithmInMultihashCode: number): string;
    /**
     * Given a multihash, returns the code of the hash algorithm, and digest buffer.
     * @returns [hash algorithm code, digest buffer]
     * @throws `SidetreeError` if hash algorithm used for the given multihash is unsupported.
     */
    static decode(multihashBuffer: Buffer): {
        algorithm: number;
        hash: Buffer;
    };
    /**
     * Checks if the given hash is a multihash computed using one of the supported hash algorithms.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateHashComputedUsingSupportedHashAlgorithm(encodedMultihash: string, supportedHashAlgorithmsInMultihashCode: number[], inputContextForErrorLogging: string): void;
    /**
     * Verifies the given content against the given multihash.
     */
    static isValidHash(encodedContent: string | undefined, encodedMultihash: string): boolean;
    /**
     * Canonicalizes the given content object, then validates the multihash of the canonicalized UTF8 object buffer against the expected multihash.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateCanonicalizeObjectHash(content: object, expectedEncodedMultihash: string, inputContextForErrorLogging: string): void;
    /**
     * Canonicalizes the given content object, then verifies the multihash as a "double hash"
     * (ie. the given multihash is the hash of a hash) against the canonicalized string as a UTF8 buffer.
     */
    static canonicalizeAndVerifyDoubleHash(content: object | undefined, encodedMultihash: string): boolean;
    /**
     * Verifies the multihash as a "double hash" (ie. the given multihash is a hash of a hash) against the content `Buffer`.
     * Note that the intermediate hash is required to be a non-multihash hash by the same hash algorithm as the final multihash.
     */
    private static verifyDoubleHash;
    /**
     * Verifies the multihash against the content `Buffer`.
     */
    static verifyEncodedMultihashForContent(content: Buffer, encodedMultihash: string): boolean;
}
