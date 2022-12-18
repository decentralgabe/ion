import JwkEs256k from '../../../models/JwkEs256k';
import JwsModel from '../models/JwsModel';
/**
 * Class containing reusable JWS operations.
 */
export default class Jws {
    /** Protected header. */
    readonly protected: string;
    /** Payload. */
    readonly payload: string;
    /** Signature. */
    readonly signature: string;
    /**
     * Constructs a JWS object.
     * @param compactJws Input should be a compact JWS string.
     */
    private constructor();
    /**
     * Converts this object to a compact JWS string.
     */
    toCompactJws(): string;
    /**
     * Verifies the JWS signature.
     * @returns true if signature is successfully verified, false otherwise.
     */
    verifySignature(publicKey: JwkEs256k): Promise<boolean>;
    /**
     * Verifies the JWS signature.
     * @returns true if signature is successfully verified, false otherwise.
     */
    static verifySignature(encodedProtectedHeader: string, encodedPayload: string, signature: string, publicKey: JwkEs256k): Promise<boolean>;
    /**
     * Verifies the compact JWS string using the given JWK key.
     * @returns true if signature is valid; else otherwise.
     */
    static verifyCompactJws(compactJws: string, publicKeyJwk: any): boolean;
    /**
     * Signs the given protected header and payload as a JWS.
     * NOTE: this is mainly used by tests to create valid test data.
     *
     * @param payload If the given payload is of string type, it is assumed to be encoded string;
     *                else the object will be stringified and encoded.
     */
    static sign(protectedHeader: any, payload: any, privateKey: JwkEs256k): Promise<JwsModel>;
    /**
     * Signs the given payload as a compact JWS string.
     * This is mainly used by tests to create valid test data.
     */
    static signAsCompactJws(payload: object, privateKey: any, protectedHeader?: object): string;
    /**
     * Parses the input as a `Jws` object.
     */
    static parseCompactJws(compactJws: any): Jws;
    /**
     * Creates a compact JWS string using the given input. No string validation is performed.
     */
    static createCompactJws(protectedHeader: string, payload: string, signature: string): string;
}
