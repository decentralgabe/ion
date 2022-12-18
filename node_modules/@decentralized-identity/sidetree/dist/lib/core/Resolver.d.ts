import DidState from './models/DidState';
import IOperationStore from './interfaces/IOperationStore';
import IVersionManager from './interfaces/IVersionManager';
/**
 * NOTE: Resolver cannot be versioned because it needs to be aware of `VersionManager` to fetch versioned operation processors.
 */
export default class Resolver {
    private versionManager;
    private operationStore;
    constructor(versionManager: IVersionManager, operationStore: IOperationStore);
    /**
     * Resolve the given DID unique suffix to its latest DID state.
     * @param didUniqueSuffix The unique suffix of the DID to resolve. e.g. if 'did:sidetree:abc123' is the DID, the unique suffix would be 'abc123'
     * @returns Final DID state of the DID. Undefined if the unique suffix of the DID is not found or the DID state is not constructable.
     */
    resolve(didUniqueSuffix: string): Promise<DidState | undefined>;
    private static categorizeOperationsByType;
    /**
     * Iterate through all duplicates of creates until we can construct an initial DID state (some creates maybe incomplete. eg. without `delta`).
     */
    private applyCreateOperation;
    /**
     * Apply recovery/deactivate operations until an operation matching the next recovery commitment cannot be found.
     */
    private applyRecoverAndDeactivateOperations;
    /**
     * Apply update operations until an operation matching the next update commitment cannot be found.
     */
    private applyUpdateOperations;
    /**
     * Applies the given operation to the given DID state.
     * @param operation The operation to be applied.
     * @param didState The DID state to apply the operation on top of.
     * @returns The resultant `DidState`. undefined if the given operation cannot be applied.
     */
    private applyOperation;
    /**
     * @returns The new DID State if a valid operation is applied, `undefined` otherwise.
     */
    private applyFirstValidOperation;
    /**
     * Checks if the new DID state references a commitment hash that is already in use.
     */
    private static isCommitValueReused;
    /**
     * Checks if the new DID state references an update commitment hash that is already in use.
     */
    private static isUpdateCommitValueReused;
    /**
     * Checks if the new DID state references a recover commitment hash that is already in use.
     */
    private static isRecoverCommitValueReused;
    /**
     * Constructs a single commit value -> operation lookup map by hashing each operation's reveal value as key, then adding the result to a map.
     */
    private constructCommitValueToOperationLookupMap;
}
