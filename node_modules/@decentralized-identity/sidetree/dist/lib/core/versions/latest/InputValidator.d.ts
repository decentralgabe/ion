/**
 * Class containing generic input validation methods.
 */
export default class InputValidator {
    /**
     * Validates that the given input is of a non-array object type.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateNonArrayObject(input: any, inputContextForErrorLogging: string): void;
    /**
     * Validates that the given object only contains allowed properties.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateObjectContainsOnlyAllowedProperties(input: object, allowedProperties: string[], inputContextForErrorLogging: string): void;
    /**
     * Validates that the given input is a valid CAS File URI.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateCasFileUri(casFileUri: any, inputContextForErrorLogging: string): void;
    /**
     * Validates the given recover/deactivate/update operation references.
     */
    static validateOperationReferences(operationReferences: any[], inputContextForErrorLogging: string): void;
    /**
     * Validates the given suffix data.
     */
    static validateSuffixData(suffixData: any): void;
    /**
     * Validates that the given input is a multihash computed using a supported hash algorithm.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateEncodedMultihash(input: any, inputContextForErrorLogging: string): void;
    private static validateDidType;
}
