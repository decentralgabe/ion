/**
 * DID Document public key purpose.
 */
declare enum PublicKeyPurpose {
    Authentication = "authentication",
    AssertionMethod = "assertionMethod",
    CapabilityInvocation = "capabilityInvocation",
    CapabilityDelegation = "capabilityDelegation",
    KeyAgreement = "keyAgreement"
}
export default PublicKeyPurpose;
