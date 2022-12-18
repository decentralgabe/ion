import CreateOperation from './CreateOperation';
import SuffixDataModel from './models/SuffixDataModel';
/**
 * Class containing reusable Sidetree DID related operations.
 */
export default class Did {
    /** `true` if DID is short form; `false` if DID is long-form. */
    isShortForm: boolean;
    /** DID method name. */
    didMethodName: string;
    /** DID unique suffix. */
    uniqueSuffix: string;
    /** The create operation if the DID given is long-form, `undefined` otherwise. */
    createOperation?: CreateOperation;
    /** The short form. */
    shortForm: string;
    /** The long form. */
    longForm: string | undefined;
    /**
     * Parses the input string as Sidetree DID.
     * NOTE: Must not call this constructor directly, use the factory `create` method instead.
     * @param did Short or long-form DID string.
     * @param didMethodName The expected DID method given in the DID string. The method throws SidetreeError if mismatch.
     */
    private constructor();
    /**
     * Parses the input string as Sidetree DID.
     * @param didString Short or long-form DID string.
     */
    static create(didString: string, didMethodName: string): Promise<Did>;
    /**
     * Computes the DID unique suffix given the suffix data object.
     */
    static computeUniqueSuffix(suffixDataModel: SuffixDataModel): string;
    private static getInitialStateFromDidStringWithExtraColon;
    private static constructCreateOperationFromEncodedJcs;
    /**
     * Make sure initial state is JCS
     */
    private static validateInitialStateJcs;
}
