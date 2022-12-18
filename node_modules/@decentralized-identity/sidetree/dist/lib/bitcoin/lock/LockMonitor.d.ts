import BitcoinClient from '../BitcoinClient';
import LockResolver from './LockResolver';
import MongoDbLockTransactionStore from './MongoDbLockTransactionStore';
import ValueTimeLockModel from './../../common/models/ValueTimeLockModel';
import VersionManager from '../VersionManager';
/**
 * Encapsulates functionality to monitor and create/remove amount locks on bitcoin.
 */
export default class LockMonitor {
    private bitcoinClient;
    private lockTransactionStore;
    private lockResolver;
    private pollPeriodInSeconds;
    private valueTimeLockUpdateEnabled;
    private desiredLockAmountInSatoshis;
    private transactionFeesAmountInSatoshis;
    private versionManager;
    private periodicPollTimeoutId;
    /**
     * Constructor for LockMonitor.
     * @param valueTimeLockUpdateEnabled When this parameter is set to `false`, parameters `transactionFeesAmountInSatoshis`
     *                                   and `desiredLockAmountInSatoshis` will be ignored.
     */
    constructor(bitcoinClient: BitcoinClient, lockTransactionStore: MongoDbLockTransactionStore, lockResolver: LockResolver, pollPeriodInSeconds: number, valueTimeLockUpdateEnabled: boolean, desiredLockAmountInSatoshis: number, transactionFeesAmountInSatoshis: number, versionManager: VersionManager);
    /**
     * Starts the periodic reading and updating of lock status.
     */
    startPeriodicProcessing(): Promise<void>;
    /**
     * Gets the current lock information if exist; undefined otherwise. Throws an error
     * if the lock information is not confirmed on the blockchain.
     */
    getCurrentValueTimeLock(): Promise<ValueTimeLockModel | undefined>;
    private periodicPoll;
    private handlePeriodicPolling;
    private getCurrentLockState;
    private rebroadcastTransaction;
    private isTransactionBroadcasted;
    private handleCreatingNewLock;
    /**
     * Performs the lock renewal routine.
     *
     * @param currentValueTimeLock The current value time lock if any.
     * @param latestSavedLockInfo The last saved locked info.
     * @param desiredLockAmountInSatoshis The desired lock amount.
     *
     * @returns true if any updates were made to the lock, false otherwise.
     */
    private handleExistingLockRenewal;
    /**
     * Performs the release lock routine.
     *
     * @param currentValueTimeLock The current value time lock
     * @param desiredLockAmountInSatoshis The desired lock amount
     *
     * @returns true if any updates were made to the lock, false otherwise.
     */
    private handleReleaseExistingLock;
    private renewLock;
    private releaseLock;
    private saveThenBroadcastTransaction;
    private isUnlockTimeReached;
}
