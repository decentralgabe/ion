"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Encoder_1 = require("./Encoder");
const ErrorCode_1 = require("./ErrorCode");
const Multihash_1 = require("./Multihash");
const ProtocolParameters_1 = require("./ProtocolParameters");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Class containing generic input validation methods.
 */
class InputValidator {
    /**
     * Validates that the given input is of a non-array object type.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateNonArrayObject(input, inputContextForErrorLogging) {
        if (typeof input !== 'object') {
            throw new SidetreeError_1.default(ErrorCode_1.default.InputValidatorInputIsNotAnObject, `Input ${inputContextForErrorLogging} is not an object.`);
        }
        if (Array.isArray(input)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.InputValidatorInputCannotBeAnArray, `Input ${inputContextForErrorLogging} object cannot be an array.`);
        }
    }
    /**
     * Validates that the given object only contains allowed properties.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateObjectContainsOnlyAllowedProperties(input, allowedProperties, inputContextForErrorLogging) {
        const allowedPropertiesSet = new Set(allowedProperties);
        for (const property in input) {
            if (!allowedPropertiesSet.has(property)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.InputValidatorInputContainsNowAllowedProperty, `Property '${property}' is not allowed in '${inputContextForErrorLogging}' object.`);
            }
        }
    }
    /**
     * Validates that the given input is a valid CAS File URI.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateCasFileUri(casFileUri, inputContextForErrorLogging) {
        const casFileUriType = typeof casFileUri;
        if (casFileUriType !== 'string') {
            throw new SidetreeError_1.default(ErrorCode_1.default.InputValidatorCasFileUriNotString, `Input ${inputContextForErrorLogging} CAS file URI '${casFileUri}' needs to be of string type, but is of ${casFileUriType} type instead.`);
        }
        if (casFileUri.length > ProtocolParameters_1.default.maxCasUriLength) {
            throw new SidetreeError_1.default(ErrorCode_1.default.InputValidatorCasFileUriExceedsMaxLength, `Input ${inputContextForErrorLogging} CAS file URI '${casFileUri}' length cannot exceed ${ProtocolParameters_1.default.maxCasUriLength}`);
        }
    }
    /**
     * Validates the given recover/deactivate/update operation references.
     */
    static validateOperationReferences(operationReferences, inputContextForErrorLogging) {
        for (const operationReference of operationReferences) {
            InputValidator.validateObjectContainsOnlyAllowedProperties(operationReference, ['didSuffix', 'revealValue'], inputContextForErrorLogging);
            InputValidator.validateEncodedMultihash(operationReference.didSuffix, `${inputContextForErrorLogging} didSuffix`);
            InputValidator.validateEncodedMultihash(operationReference.revealValue, `${inputContextForErrorLogging} revealValue`);
        }
    }
    /**
     * Validates the given suffix data.
     */
    static validateSuffixData(suffixData) {
        InputValidator.validateNonArrayObject(suffixData, 'suffix data');
        InputValidator.validateObjectContainsOnlyAllowedProperties(suffixData, ['deltaHash', 'recoveryCommitment', 'type'], `suffix data`);
        InputValidator.validateEncodedMultihash(suffixData.deltaHash, 'delta hash');
        InputValidator.validateEncodedMultihash(suffixData.recoveryCommitment, 'recovery commitment');
        InputValidator.validateDidType(suffixData.type);
    }
    /**
     * Validates that the given input is a multihash computed using a supported hash algorithm.
     * @param inputContextForErrorLogging This string is used for error logging purposes only. e.g. 'document', or 'suffix data'.
     */
    static validateEncodedMultihash(input, inputContextForErrorLogging) {
        const inputType = typeof input;
        if (inputType !== 'string') {
            throw new SidetreeError_1.default(ErrorCode_1.default.EncodedMultihashMustBeAString, `The ${inputContextForErrorLogging} must be a string but is of ${inputType} type.`);
        }
        const supportedHashAlgorithmsInMultihashCode = ProtocolParameters_1.default.hashAlgorithmsInMultihashCode;
        Multihash_1.default.validateHashComputedUsingSupportedHashAlgorithm(input, supportedHashAlgorithmsInMultihashCode, inputContextForErrorLogging);
    }
    static validateDidType(type) {
        // Nothing to verify if type is undefined, since it is an optional property.
        if (type === undefined) {
            return;
        }
        // `type` has to be max 4 character long string with only Base64URL character set.
        const typeOfType = typeof type;
        if (typeOfType !== 'string') {
            throw new SidetreeError_1.default(ErrorCode_1.default.SuffixDataTypeIsNotString, `DID type must be a string, but is of type ${typeOfType}.`);
        }
        if (type.length > 4) {
            throw new SidetreeError_1.default(ErrorCode_1.default.SuffixDataTypeLengthGreaterThanFour, `DID type string '${type}' cannot be longer than 4 characters.`);
        }
        if (!Encoder_1.default.isBase64UrlString(type)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.SuffixDataTypeInvalidCharacter, `DID type string '${type}' contains a non-Base64URL character.`);
        }
    }
}
exports.default = InputValidator;
//# sourceMappingURL=InputValidator.js.map