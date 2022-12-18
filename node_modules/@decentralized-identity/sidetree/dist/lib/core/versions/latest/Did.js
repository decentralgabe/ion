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
const CreateOperation_1 = require("./CreateOperation");
const Delta_1 = require("./Delta");
const Encoder_1 = require("./Encoder");
const ErrorCode_1 = require("./ErrorCode");
const JsonCanonicalizer_1 = require("./util/JsonCanonicalizer");
const Multihash_1 = require("./Multihash");
const OperationType_1 = require("../../enums/OperationType");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Class containing reusable Sidetree DID related operations.
 */
class Did {
    /**
     * Parses the input string as Sidetree DID.
     * NOTE: Must not call this constructor directly, use the factory `create` method instead.
     * @param did Short or long-form DID string.
     * @param didMethodName The expected DID method given in the DID string. The method throws SidetreeError if mismatch.
     */
    constructor(did, didMethodName) {
        this.didMethodName = didMethodName;
        const didPrefix = `did:${didMethodName}:`;
        // TODO https://github.com/decentralized-identity/sidetree/issues/470 add network prefix to the didPrefix string
        if (!did.startsWith(didPrefix)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DidIncorrectPrefix, `Expected DID prefix ${didPrefix} not given in DID.`);
        }
        const didWithoutPrefix = did.split(didPrefix)[1];
        // split by : and if there is 1 element, then it's short form. Long form has 2 elements
        const didSplitLength = didWithoutPrefix.split(':').length;
        if (didSplitLength === 1) {
            this.isShortForm = true;
        }
        else {
            this.isShortForm = false;
        }
        if (this.isShortForm) {
            this.uniqueSuffix = did.substring(didPrefix.length);
        }
        else {
            // Long-form DID looks like:
            // 'did:<methodName>:<unique-portion>:Base64url(JCS({suffix-data, delta}))'
            this.uniqueSuffix = did.substring(didPrefix.length, did.lastIndexOf(':'));
            this.longForm = did;
        }
        if (this.uniqueSuffix.length === 0) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DidNoUniqueSuffix);
        }
        this.shortForm = didPrefix + this.uniqueSuffix;
    }
    /**
     * Parses the input string as Sidetree DID.
     * @param didString Short or long-form DID string.
     */
    static create(didString, didMethodName) {
        return __awaiter(this, void 0, void 0, function* () {
            const did = new Did(didString, didMethodName);
            // If DID is long-form, ensure the unique suffix constructed from the suffix data matches the short-form DID and populate the `createOperation` property.
            if (!did.isShortForm) {
                const initialStateEncodedJcs = Did.getInitialStateFromDidStringWithExtraColon(didString);
                const createOperation = Did.constructCreateOperationFromEncodedJcs(initialStateEncodedJcs);
                // NOTE: we cannot use the unique suffix directly from `createOperation.didUniqueSuffix` for comparison,
                // because a given long-form DID may have been created long ago,
                // thus this version of `CreateOperation.parse()` maybe using a different hashing algorithm than that of the unique DID suffix (short-form).
                // So we compute the suffix data hash again using the hashing algorithm used by the given unique DID suffix (short-form).
                const suffixDataJcsBuffer = JsonCanonicalizer_1.default.canonicalizeAsBuffer(createOperation.suffixData);
                const suffixDataHashMatchesUniqueSuffix = Multihash_1.default.verifyEncodedMultihashForContent(suffixDataJcsBuffer, did.uniqueSuffix);
                // If the computed suffix data hash is not the same as the unique suffix given in the DID string, the DID is not valid.
                if (!suffixDataHashMatchesUniqueSuffix) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.DidUniqueSuffixFromInitialStateMismatch);
                }
                did.createOperation = createOperation;
            }
            return did;
        });
    }
    /**
     * Computes the DID unique suffix given the suffix data object.
     */
    static computeUniqueSuffix(suffixDataModel) {
        // TODO: #965 - Need to decide on what hash algorithm to use when hashing suffix data - https://github.com/decentralized-identity/sidetree/issues/965
        const hashAlgorithmInMultihashCode = 18;
        const suffixDataBuffer = JsonCanonicalizer_1.default.canonicalizeAsBuffer(suffixDataModel);
        const multihash = Multihash_1.default.hash(suffixDataBuffer, hashAlgorithmInMultihashCode);
        const encodedMultihash = Encoder_1.default.encode(multihash);
        return encodedMultihash;
    }
    static getInitialStateFromDidStringWithExtraColon(didString) {
        // DID example: 'did:<methodName>:<unique-portion>:Base64url(JCS({suffix-data, delta}))'
        const lastColonIndex = didString.lastIndexOf(':');
        const initialStateValue = didString.substring(lastColonIndex + 1);
        return initialStateValue;
    }
    static constructCreateOperationFromEncodedJcs(initialStateEncodedJcs) {
        // Initial state should be in the format base64url(JCS(initialState))
        const initialStateDecodedJcs = Encoder_1.default.decodeAsString(initialStateEncodedJcs);
        let initialStateObject;
        try {
            initialStateObject = JSON.parse(initialStateDecodedJcs);
        }
        catch (_a) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DidInitialStateJcsIsNotJson, 'Long form initial state should be encoded jcs.');
        }
        Did.validateInitialStateJcs(initialStateEncodedJcs, initialStateObject);
        Delta_1.default.validateDelta(initialStateObject.delta);
        const createOperationRequest = {
            type: OperationType_1.default.Create,
            suffixData: initialStateObject.suffixData,
            delta: initialStateObject.delta
        };
        const createOperationBuffer = Buffer.from(JSON.stringify(createOperationRequest));
        const createOperation = CreateOperation_1.default.parseObject(createOperationRequest, createOperationBuffer);
        return createOperation;
    }
    /**
     * Make sure initial state is JCS
     */
    static validateInitialStateJcs(initialStateEncodedJcs, initialStateObject) {
        const expectedInitialState = Encoder_1.default.encode(JsonCanonicalizer_1.default.canonicalizeAsBuffer(initialStateObject));
        if (expectedInitialState !== initialStateEncodedJcs) {
            throw new SidetreeError_1.default(ErrorCode_1.default.DidInitialStateJcsIsNotJcs, 'Initial state object and JCS string mismatch.');
        }
    }
}
exports.default = Did;
//# sourceMappingURL=Did.js.map