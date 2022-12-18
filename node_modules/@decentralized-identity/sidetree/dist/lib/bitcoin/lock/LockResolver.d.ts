import BitcoinClient from '../BitcoinClient';
import LockIdentifierModel from '../models/LockIdentifierModel';
import ValueTimeLockModel from '../../common/models/ValueTimeLockModel';
import VersionManager from '../VersionManager';
/**
 * Encapsulates functionality for verifying a bitcoin lock created by this service.
 */
export default class LockResolver {
    private versionManager;
    private bitcoinClient;
    constructor(versionManager: VersionManager, bitcoinClient: BitcoinClient);
    /**
     * Gets the corresponding lock information represented by the specified lock identifier.
     * @param serializedLockIdentifier The serialized lock identifier.
     */
    resolveSerializedLockIdentifierAndThrowOnError(serializedLockIdentifier: string): Promise<ValueTimeLockModel>;
    /**
     * Gets the corresponding lock information represented by the specified lock identifier. It also verifies
     * the lock by making sure that the corresponding transaction is indeed a lock transaction paying to the
     * wallet in the lockIdentifier upon lock expiry.
     *
     * @param lockIdentifier The lock identifier.
     * @returns The blockchain lock model if the specified identifier is verified; throws if verification fails.
     */
    resolveLockIdentifierAndThrowOnError(lockIdentifier: LockIdentifierModel): Promise<ValueTimeLockModel>;
    /**
     * Checks whether the redeem script is indeed a lock script.
     * @param redeemScript The script to check.
     * @returns The verify result object.
     */
    private static isRedeemScriptALockScript;
    /**
     * Checks whether the specified output is a "paytoscript" type output to the specified script.
     * @param bitcoinOutput The freeze output from the bitcoin transaction.
     * @param targetScript The expected redeem script.
     */
    private static isOutputPayingToTargetScript;
    private static createScript;
    private getTransaction;
    private calculateLockStartingBlock;
}
