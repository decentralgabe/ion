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
const ErrorCode_1 = require("../ErrorCode");
const EventCode_1 = require("../EventCode");
const EventEmitter_1 = require("../../common/EventEmitter");
const LockIdentifierSerializer_1 = require("./LockIdentifierSerializer");
const LogColor_1 = require("../../common/LogColor");
const Logger_1 = require("../../common/Logger");
const SavedLockType_1 = require("../enums/SavedLockType");
const SidetreeError_1 = require("../../common/SidetreeError");
/* global NodeJS */
/** Enum (internal to this class) to track the status of the lock. */
var LockStatus;
(function (LockStatus) {
    LockStatus["Confirmed"] = "confirmed";
    LockStatus["None"] = "none";
    LockStatus["Pending"] = "pending";
})(LockStatus || (LockStatus = {}));
/**
 * Encapsulates functionality to monitor and create/remove amount locks on bitcoin.
 */
class LockMonitor {
    /**
     * Constructor for LockMonitor.
     * @param valueTimeLockUpdateEnabled When this parameter is set to `false`, parameters `transactionFeesAmountInSatoshis`
     *                                   and `desiredLockAmountInSatoshis` will be ignored.
     */
    constructor(bitcoinClient, lockTransactionStore, lockResolver, pollPeriodInSeconds, valueTimeLockUpdateEnabled, desiredLockAmountInSatoshis, transactionFeesAmountInSatoshis, versionManager) {
        this.bitcoinClient = bitcoinClient;
        this.lockTransactionStore = lockTransactionStore;
        this.lockResolver = lockResolver;
        this.pollPeriodInSeconds = pollPeriodInSeconds;
        this.valueTimeLockUpdateEnabled = valueTimeLockUpdateEnabled;
        this.desiredLockAmountInSatoshis = desiredLockAmountInSatoshis;
        this.transactionFeesAmountInSatoshis = transactionFeesAmountInSatoshis;
        this.versionManager = versionManager;
        if (!Number.isInteger(desiredLockAmountInSatoshis)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.LockMonitorDesiredLockAmountIsNotWholeNumber, `${desiredLockAmountInSatoshis}`);
        }
        if (!Number.isInteger(transactionFeesAmountInSatoshis)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.LockMonitorTransactionFeesAmountIsNotWholeNumber, `${transactionFeesAmountInSatoshis}`);
        }
    }
    /**
     * Starts the periodic reading and updating of lock status.
     */
    startPeriodicProcessing() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.periodicPoll();
        });
    }
    /**
     * Gets the current lock information if exist; undefined otherwise. Throws an error
     * if the lock information is not confirmed on the blockchain.
     */
    getCurrentValueTimeLock() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentLockState = yield this.getCurrentLockState();
            // If there's no lock then return undefined
            if (currentLockState.status === LockStatus.None) {
                return undefined;
            }
            if (currentLockState.status === LockStatus.Pending) {
                // Throw a very specific error so that the caller can do something
                // about it if they have to
                throw new SidetreeError_1.default(ErrorCode_1.default.LockMonitorCurrentValueTimeLockInPendingState);
            }
            return currentLockState.activeValueTimeLock;
        });
    }
    periodicPoll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Defensive programming to prevent multiple polling loops even if this method is externally called multiple times.
                if (this.periodicPollTimeoutId) {
                    clearTimeout(this.periodicPollTimeoutId);
                }
                Logger_1.default.info(`Starting periodic polling for the lock monitor.`);
                yield this.handlePeriodicPolling();
                EventEmitter_1.default.emit(EventCode_1.default.BitcoinLockMonitorLoopSuccess);
            }
            catch (e) {
                EventEmitter_1.default.emit(EventCode_1.default.BitcoinLockMonitorLoopFailure);
                const message = `An error occurred during periodic poll: ${SidetreeError_1.default.stringify(e)}`;
                Logger_1.default.error(message);
            }
            finally {
                this.periodicPollTimeoutId = setTimeout(this.periodicPoll.bind(this), 1000 * this.pollPeriodInSeconds);
            }
            Logger_1.default.info(`Ending periodic polling for the lock monitor.`);
        });
    }
    handlePeriodicPolling() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentLockState = yield this.getCurrentLockState();
            Logger_1.default.info(`Refreshed the in-memory value time lock state.`);
            // If lock update is disabled, then no further action needs to be taken.
            if (this.valueTimeLockUpdateEnabled === false) {
                Logger_1.default.info(`Value time lock update is disabled, will not attempt to update the value time lock.`);
                return;
            }
            // If the current lock is in pending state then we cannot do anything other than rebroadcast the transaction again.
            if (currentLockState.status === LockStatus.Pending) {
                Logger_1.default.info(`The current lock status is in pending state, rebroadcast the transaction again in case the transaction is lost in the previous broadcast.`);
                yield this.rebroadcastTransaction(currentLockState.latestSavedLockInfo);
                return;
            }
            // Now that we are not pending, check what do we have to do about the lock next.
            const validCurrentLockExist = currentLockState.status === LockStatus.Confirmed;
            const lockRequired = this.desiredLockAmountInSatoshis > 0;
            if (lockRequired && !validCurrentLockExist) {
                yield this.handleCreatingNewLock(this.desiredLockAmountInSatoshis);
            }
            if (lockRequired && validCurrentLockExist) {
                // The routine will true only if there were any changes made to the lock
                yield this.handleExistingLockRenewal(currentLockState.activeValueTimeLock, currentLockState.latestSavedLockInfo, this.desiredLockAmountInSatoshis);
            }
            if (!lockRequired && validCurrentLockExist) {
                Logger_1.default.info(LogColor_1.default.lightBlue(`Value time lock no longer needed.`));
                yield this.handleReleaseExistingLock(currentLockState.activeValueTimeLock, this.desiredLockAmountInSatoshis);
            }
        });
    }
    getCurrentLockState() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastSavedLock = yield this.lockTransactionStore.getLastLock();
            // Nothing to do if there's nothing found.
            if (!lastSavedLock) {
                return {
                    activeValueTimeLock: undefined,
                    latestSavedLockInfo: undefined,
                    status: LockStatus.None
                };
            }
            Logger_1.default.info(`Found last saved lock of type: ${lastSavedLock.type} with transaction id: ${lastSavedLock.transactionId}.`);
            // Make sure that the last lock txn is actually broadcasted to the blockchain. Rebroadcast
            // if it is not as we don't want to do anything until last lock information is at least
            // broadcasted.
            if (!(yield this.isTransactionBroadcasted(lastSavedLock.transactionId))) {
                return {
                    activeValueTimeLock: undefined,
                    latestSavedLockInfo: lastSavedLock,
                    status: LockStatus.Pending
                };
            }
            if (lastSavedLock.type === SavedLockType_1.default.ReturnToWallet) {
                // This means that there's no current lock for this node. Just return
                return {
                    activeValueTimeLock: undefined,
                    latestSavedLockInfo: lastSavedLock,
                    status: LockStatus.None
                };
            }
            // If we're here then it means that we have saved some information about a lock
            // which is at least broadcasted to blockchain. Let's resolve it.
            const lastLockIdentifier = {
                transactionId: lastSavedLock.transactionId,
                redeemScriptAsHex: lastSavedLock.redeemScriptAsHex
            };
            try {
                const currentValueTimeLock = yield this.lockResolver.resolveLockIdentifierAndThrowOnError(lastLockIdentifier);
                Logger_1.default.info(`Found a valid current lock: ${JSON.stringify(currentValueTimeLock)}`);
                return {
                    activeValueTimeLock: currentValueTimeLock,
                    latestSavedLockInfo: lastSavedLock,
                    status: LockStatus.Confirmed
                };
            }
            catch (e) {
                if (e instanceof SidetreeError_1.default &&
                    (e.code === ErrorCode_1.default.LockResolverTransactionNotConfirmed || e.code === ErrorCode_1.default.NormalizedFeeCalculatorBlockNotFound)) {
                    // This means that the transaction was broadcasted but hasn't been written on the blockchain yet, or
                    // transaction was broadcasted, but hasn't been observed by `BitcoinProcessor` yet.
                    return {
                        activeValueTimeLock: undefined,
                        latestSavedLockInfo: lastSavedLock,
                        status: LockStatus.Pending
                    };
                }
                // Else this is an unexpected exception rethrow
                throw e;
            }
        });
    }
    rebroadcastTransaction(lastSavedLock) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Rebroadcasting the transaction id: ${lastSavedLock.transactionId}`);
            // So we had some transaction information saved but the transaction was never found on the
            // blockchain. Either the transaction was broadcasted and we're just waiting for it to be
            // actually written or maybe this node died before it could actually broadcast the transaction.
            // Since we don't know which case it is and bitcoin will prevent 'double-spending' the same
            // transaction, we can just rebroadcast the same transaction.
            const lockTransactionFromLastSavedLock = {
                redeemScriptAsHex: lastSavedLock.redeemScriptAsHex,
                serializedTransactionObject: lastSavedLock.rawTransaction,
                transactionId: lastSavedLock.transactionId,
                // Setting a 'fake' fee because the model requires it but broadcasting does not really
                // require it so this is not going to have any effect when trying to broadcast.
                transactionFee: 0
            };
            yield this.bitcoinClient.broadcastLockTransaction(lockTransactionFromLastSavedLock);
        });
    }
    isTransactionBroadcasted(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.bitcoinClient.getRawTransaction(transactionId);
                // no exception thrown == transaction found == it was broadcasted even if it is only in the mempool.
                return true;
            }
            catch (e) {
                Logger_1.default.warn(`Transaction with id: ${transactionId} was not found on the bitcoin. Error: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
            }
            return false;
        });
    }
    handleCreatingNewLock(desiredLockAmountInSatoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            // When creating the first lock, we are going to lock an amount more than the desired-amount
            // to account for the fee(s) required when relocking etc. So check whether the target
            // wallet has enough balance.
            const totalLockAmount = desiredLockAmountInSatoshis + this.transactionFeesAmountInSatoshis;
            const walletBalance = yield this.bitcoinClient.getBalanceInSatoshis();
            if (walletBalance <= totalLockAmount) {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockMonitorNotEnoughBalanceForFirstLock, `Lock amount: ${totalLockAmount}; Wallet balance: ${walletBalance}`);
            }
            Logger_1.default.info(LogColor_1.default.lightBlue(`Current wallet balance: ${LogColor_1.default.green(walletBalance)}`));
            Logger_1.default.info(LogColor_1.default.lightBlue(`Creating a new lock for amount: ${LogColor_1.default.green(totalLockAmount)} satoshis.`));
            const height = yield this.bitcoinClient.getCurrentBlockHeight();
            const lockTransaction = yield this.bitcoinClient.createLockTransaction(totalLockAmount, this.versionManager.getLockDurationInBlocks(height));
            const savedLockModel = yield this.saveThenBroadcastTransaction(lockTransaction, SavedLockType_1.default.Create, desiredLockAmountInSatoshis);
            EventEmitter_1.default.emit(EventCode_1.default.BitcoinLockMonitorNewLock);
            return savedLockModel;
        });
    }
    /**
     * Performs the lock renewal routine.
     *
     * @param currentValueTimeLock The current value time lock if any.
     * @param latestSavedLockInfo The last saved locked info.
     * @param desiredLockAmountInSatoshis The desired lock amount.
     *
     * @returns true if any updates were made to the lock, false otherwise.
     */
    handleExistingLockRenewal(currentValueTimeLock, latestSavedLockInfo, desiredLockAmountInSatoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            // Just return if we haven't reached the unlock block yet
            if (!(yield this.isUnlockTimeReached(currentValueTimeLock.unlockTransactionTime))) {
                return false;
            }
            // If the desired lock amount is different from previous then just return the amount to
            // the wallet and let the next poll iteration start a new lock.
            if (latestSavedLockInfo.desiredLockAmountInSatoshis !== desiredLockAmountInSatoshis) {
                Logger_1.default.info(LogColor_1.default.lightBlue(`Current desired lock amount ${LogColor_1.default.green(desiredLockAmountInSatoshis)} satoshis is different from the previous `) +
                    LogColor_1.default.lightBlue(`desired lock amount ${LogColor_1.default.green(latestSavedLockInfo.desiredLockAmountInSatoshis)} satoshis. Going to release the lock.`));
                yield this.releaseLock(currentValueTimeLock, desiredLockAmountInSatoshis);
                return true;
            }
            // If we have gotten to here then we need to try renew.
            try {
                yield this.renewLock(currentValueTimeLock, desiredLockAmountInSatoshis);
                EventEmitter_1.default.emit(EventCode_1.default.BitcoinLockMonitorLockRenewed);
            }
            catch (e) {
                // If there is not enough balance for the relock then just release the lock. Let the next
                // iteration of the polling to try and create a new lock.
                if (e instanceof SidetreeError_1.default && e.code === ErrorCode_1.default.LockMonitorNotEnoughBalanceForRelock) {
                    Logger_1.default.warn(LogColor_1.default.yellow(`There is not enough balance for relocking so going to release the lock. Error: ${e.message}`));
                    yield this.releaseLock(currentValueTimeLock, desiredLockAmountInSatoshis);
                }
                else {
                    // This is an unexpected error at this point ... rethrow as this is needed to be investigated.
                    throw (e);
                }
            }
            return true;
        });
    }
    /**
     * Performs the release lock routine.
     *
     * @param currentValueTimeLock The current value time lock
     * @param desiredLockAmountInSatoshis The desired lock amount
     *
     * @returns true if any updates were made to the lock, false otherwise.
     */
    handleReleaseExistingLock(currentValueTimeLock, desiredLockAmountInSatoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            // Don't continue unless the current lock time model is actually reached
            if (!(yield this.isUnlockTimeReached(currentValueTimeLock.unlockTransactionTime))) {
                return false;
            }
            Logger_1.default.info(LogColor_1.default.lightBlue(`Value time lock no longer needed and unlock time reached, releasing lock...`));
            yield this.releaseLock(currentValueTimeLock, desiredLockAmountInSatoshis);
            Logger_1.default.info(LogColor_1.default.lightBlue(`Value time lock released.`));
            return true;
        });
    }
    renewLock(currentValueTimeLock, desiredLockAmountInSatoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentLockIdentifier = LockIdentifierSerializer_1.default.deserialize(currentValueTimeLock.identifier);
            const currentLockDuration = currentValueTimeLock.unlockTransactionTime - currentValueTimeLock.lockTransactionTime;
            const newLockDuration = this.versionManager.getLockDurationInBlocks(yield this.bitcoinClient.getCurrentBlockHeight());
            const relockTransaction = yield this.bitcoinClient.createRelockTransaction(currentLockIdentifier.transactionId, currentLockDuration, newLockDuration);
            // If the transaction fee is making the relock amount less than the desired amount
            if (currentValueTimeLock.amountLocked - relockTransaction.transactionFee < desiredLockAmountInSatoshis) {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockMonitorNotEnoughBalanceForRelock, 
                // eslint-disable-next-line max-len
                `The current locked amount (${currentValueTimeLock.amountLocked} satoshis) minus the relocking fee (${relockTransaction.transactionFee} satoshis) is causing the relock amount to go below the desired lock amount: ${desiredLockAmountInSatoshis}`);
            }
            return this.saveThenBroadcastTransaction(relockTransaction, SavedLockType_1.default.Relock, desiredLockAmountInSatoshis);
        });
    }
    releaseLock(currentValueTimeLock, desiredLockAmountInSatoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentLockIdentifier = LockIdentifierSerializer_1.default.deserialize(currentValueTimeLock.identifier);
            const currentLockDuration = currentValueTimeLock.unlockTransactionTime - currentValueTimeLock.lockTransactionTime;
            const releaseLockTransaction = yield this.bitcoinClient.createReleaseLockTransaction(currentLockIdentifier.transactionId, currentLockDuration);
            const savedLockModel = yield this.saveThenBroadcastTransaction(releaseLockTransaction, SavedLockType_1.default.ReturnToWallet, desiredLockAmountInSatoshis);
            EventEmitter_1.default.emit(EventCode_1.default.BitcoinLockMonitorLockReleased);
            return savedLockModel;
        });
    }
    saveThenBroadcastTransaction(lockTransaction, lockType, desiredLockAmountInSatoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            const lockInfoToSave = {
                desiredLockAmountInSatoshis: desiredLockAmountInSatoshis,
                rawTransaction: lockTransaction.serializedTransactionObject,
                transactionId: lockTransaction.transactionId,
                redeemScriptAsHex: lockTransaction.redeemScriptAsHex,
                createTimestamp: Date.now(),
                type: lockType
            };
            Logger_1.default.info(`Saving the ${lockType} type lock with transaction id: ${lockTransaction.transactionId}.`);
            // Make sure that we save the lock info to the db BEFORE trying to broadcast it. The reason being is
            // that if the service crashes right after saving then we can just rebroadcast. But if we broadcast first
            // and the service crashes then we won't have anything saved and will try to create yet another txn.
            yield this.lockTransactionStore.addLock(lockInfoToSave);
            Logger_1.default.info(`Broadcasting the transaction id: ${lockTransaction.transactionId}`);
            yield this.bitcoinClient.broadcastLockTransaction(lockTransaction);
            return lockInfoToSave;
        });
    }
    isUnlockTimeReached(unlockTransactionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentBlockTime = yield this.bitcoinClient.getCurrentBlockHeight();
            Logger_1.default.info(`Current block: ${currentBlockTime}; Current lock's unlock block: ${unlockTransactionTime}`);
            return currentBlockTime >= unlockTransactionTime;
        });
    }
}
exports.default = LockMonitor;
//# sourceMappingURL=LockMonitor.js.map