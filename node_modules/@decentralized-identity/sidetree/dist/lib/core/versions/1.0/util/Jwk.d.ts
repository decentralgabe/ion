import JwkEs256k from '../../../models/JwkEs256k';
/**
 * Class containing reusable JWK operations.
 */
export default class Jwk {
    /**
     * Generates SECP256K1 key pair.
     * Mainly used for testing.
     * @returns [publicKey, privateKey]
     */
    static generateEs256kKeyPair(): Promise<[JwkEs256k, JwkEs256k]>;
    /**
     * Validates the given key is a SECP256K1 public key in JWK format allowed by Sidetree.
     * @throws SidetreeError if given object is not a SECP256K1 public key in JWK format allowed by Sidetree.
     */
    static validateJwkEs256k(publicKeyJwk: any): void;
    /**
     * Gets the public key given the private ES256K key.
     * Mainly used for testing purposes.
     */
    static getEs256kPublicKey(privateKey: JwkEs256k): JwkEs256k;
}
