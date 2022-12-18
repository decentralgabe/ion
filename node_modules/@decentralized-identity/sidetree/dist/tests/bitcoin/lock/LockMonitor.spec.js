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
const BitcoinClient_1 = require("../../../lib/bitcoin/BitcoinClient");
const ErrorCode_1 = require("../../../lib/bitcoin/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../../JasmineSidetreeErrorValidator");
const LockIdentifierSerializer_1 = require("../../../lib/bitcoin/lock/LockIdentifierSerializer");
const LockMonitor_1 = require("../../../lib/bitcoin/lock/LockMonitor");
const LockResolver_1 = require("../../../lib/bitcoin/lock/LockResolver");
const MockBlockMetadataStore_1 = require("../../mocks/MockBlockMetadataStore");
const MongoDbLockTransactionStore_1 = require("../../../lib/bitcoin/lock/MongoDbLockTransactionStore");
const SavedLockType_1 = require("../../../lib/bitcoin/enums/SavedLockType");
const SidetreeError_1 = require("../../../lib/common/SidetreeError");
const VersionManager_1 = require("../../../lib/bitcoin/VersionManager");
function createLockState(latestSavedLockInfo, activeValueTimeLock, status) {
    return {
        activeValueTimeLock: activeValueTimeLock,
        latestSavedLockInfo: latestSavedLockInfo,
        status: status
    };
}
describe('LockMonitor', () => {
    const validTestWalletImportString = 'cTpKFwqu2HqW4y5ByMkNRKAvkPxEcwpax5Qr33ibYvkp1KSxdji6';
    const bitcoinClient = new BitcoinClient_1.default('uri:test', 'u', 'p', validTestWalletImportString, 10, 1, 0);
    const mongoDbLockStore = new MongoDbLockTransactionStore_1.default('server-url', 'db');
    const lockDuration = 2000;
    const versionModels = [{ startingBlockchainTime: 0, version: 'latest', protocolParameters: { valueTimeLockDurationInBlocks: lockDuration, initialNormalizedFeeInSatoshis: 1, feeLookBackWindowInBlocks: 1, feeMaxFluctuationMultiplierPerBlock: 1 } }];
    const versionManager = new VersionManager_1.default();
    const lockResolver = new LockResolver_1.default(versionManager, bitcoinClient);
    let lockMonitor;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield versionManager.initialize(versionModels, { genesisBlockNumber: 1 }, new MockBlockMetadataStore_1.default());
    }));
    beforeEach(() => {
        lockMonitor = new LockMonitor_1.default(bitcoinClient, mongoDbLockStore, lockResolver, 60, true, 1200, 100, versionManager);
    });
    describe('constructor', () => {
        it('should throw if the desired lock amount is not a whole number', () => {
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => new LockMonitor_1.default(bitcoinClient, mongoDbLockStore, lockResolver, 10, true, 1000.34, 25, versionManager), ErrorCode_1.default.LockMonitorDesiredLockAmountIsNotWholeNumber);
        });
        it('should throw if the txn fees amount is not a whole number', () => {
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => new LockMonitor_1.default(bitcoinClient, mongoDbLockStore, lockResolver, 10, true, 1000, 1234.56, versionManager), ErrorCode_1.default.LockMonitorTransactionFeesAmountIsNotWholeNumber);
        });
    });
    describe('startPeriodicProcessing', () => {
        it('should call the periodic poll function', () => __awaiter(void 0, void 0, void 0, function* () {
            const pollSpy = spyOn(lockMonitor, 'periodicPoll').and.returnValue(Promise.resolve());
            yield lockMonitor.startPeriodicProcessing();
            expect(pollSpy).toHaveBeenCalled();
        }));
    });
    describe('periodicPoll', () => {
        it('should call setTimeout() at the end of the execution.', () => __awaiter(void 0, void 0, void 0, function* () {
            const clearTimeoutSpy = spyOn(global, 'clearTimeout').and.returnValue();
            const handlePollingSpy = spyOn(lockMonitor, 'handlePeriodicPolling').and.returnValue(Promise.resolve());
            const setTimeoutOutput = 12344;
            const setTimeoutSpy = spyOn(global, 'setTimeout').and.returnValue(setTimeoutOutput);
            const mockPeriodicPollTimeoutId = 98765;
            lockMonitor['periodicPollTimeoutId'] = mockPeriodicPollTimeoutId;
            yield lockMonitor['periodicPoll']();
            expect(clearTimeoutSpy).toHaveBeenCalledBefore(setTimeoutSpy);
            expect(clearTimeoutSpy).toHaveBeenCalledWith(mockPeriodicPollTimeoutId);
            expect(handlePollingSpy).toHaveBeenCalled();
            expect(setTimeoutSpy).toHaveBeenCalled();
            expect(lockMonitor['periodicPollTimeoutId']).toEqual(setTimeoutOutput);
        }));
        it('should call setTimeout() at the end of the execution even if an exception is thrown.', () => __awaiter(void 0, void 0, void 0, function* () {
            const handlePollingSpy = spyOn(lockMonitor, 'handlePeriodicPolling').and.throwError('unhandled exception');
            const setTimeoutOutput = 985023;
            const setTimeoutSpy = spyOn(global, 'setTimeout').and.returnValue(setTimeoutOutput);
            lockMonitor['periodicPollTimeoutId'] = undefined;
            yield lockMonitor['periodicPoll']();
            expect(handlePollingSpy).toHaveBeenCalled();
            expect(setTimeoutSpy).toHaveBeenCalled();
        }));
    });
    describe('getCurrentValueTimeLock', () => {
        it('should return undefined if there is no current lock', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCurrentLockState = createLockState(undefined, undefined, 'none');
            spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(Promise.resolve(mockCurrentLockState));
            const actual = yield lockMonitor.getCurrentValueTimeLock();
            expect(actual).toBeUndefined();
        }));
        it('should throw if the current lock status is pending', () => {
            const mockCurrentLockState = createLockState(undefined, undefined, 'pending');
            spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(Promise.resolve(mockCurrentLockState));
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockMonitor.getCurrentValueTimeLock(), ErrorCode_1.default.LockMonitorCurrentValueTimeLockInPendingState);
        });
        it('should return the current value time lock', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCurrentValueLock = {
                amountLocked: 300,
                identifier: 'identifier',
                owner: 'owner',
                unlockTransactionTime: 12323,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockCurrentLockState = createLockState(undefined, mockCurrentValueLock, 'confirmed');
            spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(mockCurrentLockState);
            const actual = yield lockMonitor.getCurrentValueTimeLock();
            expect(actual).toEqual(mockCurrentValueLock);
        }));
    });
    describe('handlePeriodicPolling', () => {
        it('should only refresh the lock state if lock update is disabled.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCurrentValueLock = {
                amountLocked: 300,
                identifier: 'identifier',
                owner: 'owner',
                unlockTransactionTime: 12323,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockCurrentLockInfo = createLockState(undefined, mockCurrentValueLock, 'confirmed');
            const resolveCurrentLockSpy = spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(mockCurrentLockInfo);
            const createNewLockSpy = spyOn(lockMonitor, 'handleCreatingNewLock');
            const existingLockSpy = spyOn(lockMonitor, 'handleExistingLockRenewal');
            const releaseLockSpy = spyOn(lockMonitor, 'handleReleaseExistingLock');
            lockMonitor['valueTimeLockUpdateEnabled'] = false;
            yield lockMonitor['handlePeriodicPolling']();
            expect(resolveCurrentLockSpy).toHaveBeenCalled();
            expect(createNewLockSpy).not.toHaveBeenCalled();
            expect(existingLockSpy).not.toHaveBeenCalled();
            expect(releaseLockSpy).not.toHaveBeenCalled();
        }));
        it('should rebroadcast if the last lock transaction is still pending.', () => __awaiter(void 0, void 0, void 0, function* () {
            const rebroadcastTransactionSpy = spyOn(lockMonitor, 'rebroadcastTransaction').and.returnValue(Promise.resolve());
            const mockCurrentValueLock = {
                amountLocked: 300,
                identifier: 'identifier',
                owner: 'owner',
                unlockTransactionTime: 12323,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockCurrentLockInfo = createLockState(undefined, mockCurrentValueLock, 'pending');
            const getCurrentLockStateSpy = spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(mockCurrentLockInfo);
            yield lockMonitor['handlePeriodicPolling']();
            expect(getCurrentLockStateSpy).toHaveBeenCalled();
            expect(rebroadcastTransactionSpy).toHaveBeenCalled();
        }));
        it('should not do anything if a lock is not required and none exist.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCurrentLockInfo = createLockState(undefined, undefined, 'none');
            const resolveCurrentLockSpy = spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(mockCurrentLockInfo);
            const createNewLockSpy = spyOn(lockMonitor, 'handleCreatingNewLock');
            const existingLockSpy = spyOn(lockMonitor, 'handleExistingLockRenewal');
            const releaseLockSpy = spyOn(lockMonitor, 'handleReleaseExistingLock');
            lockMonitor['desiredLockAmountInSatoshis'] = 0;
            yield lockMonitor['handlePeriodicPolling']();
            expect(resolveCurrentLockSpy).toHaveBeenCalled();
            expect(createNewLockSpy).not.toHaveBeenCalled();
            expect(existingLockSpy).not.toHaveBeenCalled();
            expect(releaseLockSpy).not.toHaveBeenCalled();
        }));
        it('should call the new lock routine if a lock is required but does not exist.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCurrentLockInfo = createLockState(undefined, undefined, 'none');
            const resolveCurrentLockSpy = spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(Promise.resolve(mockCurrentLockInfo));
            const mockSavedLock = {
                createTimestamp: 1212,
                desiredLockAmountInSatoshis: 300,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            const createNewLockSpy = spyOn(lockMonitor, 'handleCreatingNewLock').and.returnValue(Promise.resolve(mockSavedLock));
            const existingLockSpy = spyOn(lockMonitor, 'handleExistingLockRenewal');
            const releaseLockSpy = spyOn(lockMonitor, 'handleReleaseExistingLock');
            lockMonitor['desiredLockAmountInSatoshis'] = 50;
            yield lockMonitor['handlePeriodicPolling']();
            expect(createNewLockSpy).toHaveBeenCalled();
            expect(existingLockSpy).not.toHaveBeenCalled();
            expect(releaseLockSpy).not.toHaveBeenCalled();
            expect(resolveCurrentLockSpy).toHaveBeenCalled();
        }));
        it('should call the renew lock routine if a lock is required and one does exist.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSavedLock = {
                createTimestamp: 1212,
                desiredLockAmountInSatoshis: 300,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            const mockCurrentValueLock = {
                amountLocked: 300,
                identifier: 'identifier',
                owner: 'owner',
                unlockTransactionTime: 12323,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockCurrentLockInfo = createLockState(mockSavedLock, mockCurrentValueLock, 'confirmed');
            const resolveCurrentLockSpy = spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(Promise.resolve(mockCurrentLockInfo));
            const createNewLockSpy = spyOn(lockMonitor, 'handleCreatingNewLock');
            const existingLockSpy = spyOn(lockMonitor, 'handleExistingLockRenewal').and.returnValue(Promise.resolve(true));
            const releaseLockSpy = spyOn(lockMonitor, 'handleReleaseExistingLock');
            lockMonitor['desiredLockAmountInSatoshis'] = 50;
            yield lockMonitor['handlePeriodicPolling']();
            expect(createNewLockSpy).not.toHaveBeenCalled();
            expect(existingLockSpy).toHaveBeenCalled();
            expect(releaseLockSpy).not.toHaveBeenCalled();
            expect(resolveCurrentLockSpy).toHaveBeenCalled();
        }));
        it('should not resolve the current lock information if the renew routine returns false.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSavedLock = {
                createTimestamp: 1212,
                desiredLockAmountInSatoshis: 300,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            const mockCurrentValueLock = {
                amountLocked: 300,
                identifier: 'identifier',
                owner: 'owner',
                unlockTransactionTime: 12323,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockCurrentLockInfo = createLockState(mockSavedLock, mockCurrentValueLock, 'confirmed');
            const resolveCurrentLockSpy = spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(Promise.resolve(mockCurrentLockInfo));
            const createNewLockSpy = spyOn(lockMonitor, 'handleCreatingNewLock');
            const existingLockSpy = spyOn(lockMonitor, 'handleExistingLockRenewal').and.returnValue(Promise.resolve(false));
            const releaseLockSpy = spyOn(lockMonitor, 'handleReleaseExistingLock');
            lockMonitor['desiredLockAmountInSatoshis'] = 50;
            yield lockMonitor['handlePeriodicPolling']();
            expect(resolveCurrentLockSpy).toHaveBeenCalled();
            expect(createNewLockSpy).not.toHaveBeenCalled();
            expect(existingLockSpy).toHaveBeenCalled();
            expect(releaseLockSpy).not.toHaveBeenCalled();
        }));
        it('should call the release lock routine if a lock is not required but one does exist.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSavedLock = {
                createTimestamp: 1212,
                desiredLockAmountInSatoshis: 300,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            const mockCurrentValueLock = {
                amountLocked: 300,
                identifier: 'identifier',
                owner: 'owner',
                unlockTransactionTime: 12323,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockCurrentLockInfo = createLockState(mockSavedLock, mockCurrentValueLock, 'confirmed');
            const resolveCurrentLockSpy = spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(Promise.resolve(mockCurrentLockInfo));
            const createNewLockSpy = spyOn(lockMonitor, 'handleCreatingNewLock');
            const existingLockSpy = spyOn(lockMonitor, 'handleExistingLockRenewal');
            const releaseLockSpy = spyOn(lockMonitor, 'handleReleaseExistingLock').and.returnValue(Promise.resolve(true));
            lockMonitor['desiredLockAmountInSatoshis'] = 0;
            yield lockMonitor['handlePeriodicPolling']();
            expect(createNewLockSpy).not.toHaveBeenCalled();
            expect(existingLockSpy).not.toHaveBeenCalled();
            expect(releaseLockSpy).toHaveBeenCalled();
            expect(resolveCurrentLockSpy).toHaveBeenCalled();
        }));
        it('should always refresh the lock state even if the the release lock routine returns false.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSavedLock = {
                createTimestamp: 1212,
                desiredLockAmountInSatoshis: 300,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            const mockCurrentValueLock = {
                amountLocked: 300,
                identifier: 'identifier',
                owner: 'owner',
                unlockTransactionTime: 12323,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockCurrentLockInfo = createLockState(mockSavedLock, mockCurrentValueLock, 'confirmed');
            const getCurrentLockStateSpy = spyOn(lockMonitor, 'getCurrentLockState').and.returnValue(Promise.resolve(mockCurrentLockInfo));
            const createNewLockSpy = spyOn(lockMonitor, 'handleCreatingNewLock');
            const existingLockSpy = spyOn(lockMonitor, 'handleExistingLockRenewal');
            const releaseLockSpy = spyOn(lockMonitor, 'handleReleaseExistingLock').and.returnValue(Promise.resolve(false));
            lockMonitor['desiredLockAmountInSatoshis'] = 0;
            yield lockMonitor['handlePeriodicPolling']();
            expect(getCurrentLockStateSpy).toHaveBeenCalled();
            expect(createNewLockSpy).not.toHaveBeenCalled();
            expect(existingLockSpy).not.toHaveBeenCalled();
            expect(releaseLockSpy).toHaveBeenCalled();
        }));
    });
    describe('getCurrentLockState', () => {
        it('should return an empty object if no locks were found in the db.', () => __awaiter(void 0, void 0, void 0, function* () {
            const rebroadcastSpy = spyOn(lockMonitor, 'rebroadcastTransaction');
            const resolveLockSpy = spyOn(lockResolver, 'resolveLockIdentifierAndThrowOnError');
            spyOn(lockMonitor['lockTransactionStore'], 'getLastLock').and.returnValue(Promise.resolve(undefined));
            const expected = createLockState(undefined, undefined, 'none');
            const actual = yield lockMonitor['getCurrentLockState']();
            expect(actual).toEqual(expected);
            expect(rebroadcastSpy).not.toHaveBeenCalled();
            expect(resolveLockSpy).not.toHaveBeenCalled();
        }));
        it('should return lock status as pending if the last lock transaction is not yet broadcasted.', () => __awaiter(void 0, void 0, void 0, function* () {
            const resolveLockSpy = spyOn(lockResolver, 'resolveLockIdentifierAndThrowOnError');
            const mockLastLock = {
                createTimestamp: 121314,
                desiredLockAmountInSatoshis: 98974,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            spyOn(lockMonitor['lockTransactionStore'], 'getLastLock').and.returnValue(Promise.resolve(mockLastLock));
            spyOn(lockMonitor, 'isTransactionBroadcasted').and.returnValue(Promise.resolve(false));
            const expected = createLockState(mockLastLock, undefined, 'pending');
            const actual = yield lockMonitor['getCurrentLockState']();
            expect(actual).toEqual(expected);
            expect(resolveLockSpy).not.toHaveBeenCalled();
        }));
        it('should just return without resolving anything if the last transaction was return-to-wallet.', () => __awaiter(void 0, void 0, void 0, function* () {
            const rebroadcastSpy = spyOn(lockMonitor, 'rebroadcastTransaction').and.returnValue(Promise.resolve());
            const resolveLockSpy = spyOn(lockResolver, 'resolveLockIdentifierAndThrowOnError');
            const mockLastLock = {
                createTimestamp: 121314,
                desiredLockAmountInSatoshis: 98974,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.ReturnToWallet
            };
            spyOn(lockMonitor['lockTransactionStore'], 'getLastLock').and.returnValue(Promise.resolve(mockLastLock));
            spyOn(lockMonitor, 'isTransactionBroadcasted').and.returnValue(Promise.resolve(true));
            const expected = createLockState(mockLastLock, undefined, 'none');
            const actual = yield lockMonitor['getCurrentLockState']();
            expect(actual).toEqual(expected);
            expect(rebroadcastSpy).not.toHaveBeenCalled();
            expect(resolveLockSpy).not.toHaveBeenCalled();
        }));
        it('should return the resolved output.', () => __awaiter(void 0, void 0, void 0, function* () {
            const rebroadcastSpy = spyOn(lockMonitor, 'rebroadcastTransaction').and.returnValue(Promise.resolve());
            const mockValueTimeLock = {
                amountLocked: 5000,
                identifier: 'identifier',
                owner: 'owner',
                unlockTransactionTime: 1234,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const resolveLockSpy = spyOn(lockResolver, 'resolveLockIdentifierAndThrowOnError').and.returnValue(Promise.resolve(mockValueTimeLock));
            const mockLastLock = {
                createTimestamp: 121314,
                desiredLockAmountInSatoshis: 98974,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Relock
            };
            spyOn(lockMonitor['lockTransactionStore'], 'getLastLock').and.returnValue(Promise.resolve(mockLastLock));
            spyOn(lockMonitor, 'isTransactionBroadcasted').and.returnValue(Promise.resolve(true));
            const expected = createLockState(mockLastLock, mockValueTimeLock, 'confirmed');
            const actual = yield lockMonitor['getCurrentLockState']();
            expect(actual).toEqual(expected);
            expect(rebroadcastSpy).not.toHaveBeenCalled();
            expect(resolveLockSpy).toHaveBeenCalled();
        }));
        it('should return pending if the lock resolver throws not-confirmed error.', () => __awaiter(void 0, void 0, void 0, function* () {
            const rebroadcastSpy = spyOn(lockMonitor, 'rebroadcastTransaction').and.returnValue(Promise.resolve());
            const resolveLockSpy = spyOn(lockResolver, 'resolveLockIdentifierAndThrowOnError').and.callFake(() => {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockResolverTransactionNotConfirmed);
            });
            const mockLastLock = {
                createTimestamp: 121314,
                desiredLockAmountInSatoshis: 98974,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Relock
            };
            spyOn(lockMonitor['lockTransactionStore'], 'getLastLock').and.returnValue(Promise.resolve(mockLastLock));
            spyOn(lockMonitor, 'isTransactionBroadcasted').and.returnValue(Promise.resolve(true));
            const expected = createLockState(mockLastLock, undefined, 'pending');
            const actual = yield lockMonitor['getCurrentLockState']();
            expect(actual).toEqual(expected);
            expect(rebroadcastSpy).not.toHaveBeenCalled();
            expect(resolveLockSpy).toHaveBeenCalled();
        }));
        it('should bubble up any unhandled exceptions.', () => __awaiter(void 0, void 0, void 0, function* () {
            const rebroadcastSpy = spyOn(lockMonitor, 'rebroadcastTransaction').and.returnValue(Promise.resolve());
            const mockErrorCode = 'some other unhandled error code';
            const resolveLockSpy = spyOn(lockResolver, 'resolveLockIdentifierAndThrowOnError').and.callFake(() => {
                throw new SidetreeError_1.default(mockErrorCode);
            });
            const mockLastLock = {
                createTimestamp: 121314,
                desiredLockAmountInSatoshis: 98974,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Relock
            };
            spyOn(lockMonitor['lockTransactionStore'], 'getLastLock').and.returnValue(Promise.resolve(mockLastLock));
            spyOn(lockMonitor, 'isTransactionBroadcasted').and.returnValue(Promise.resolve(true));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockMonitor['getCurrentLockState'](), mockErrorCode);
            expect(rebroadcastSpy).not.toHaveBeenCalled();
            expect(resolveLockSpy).toHaveBeenCalled();
        }));
    });
    describe('rebroadcastTransaction', () => {
        it('should broadcast the txn via bitcoin-client', () => __awaiter(void 0, void 0, void 0, function* () {
            const lastSavedLockInput = {
                createTimestamp: 1212,
                desiredLockAmountInSatoshis: 500,
                rawTransaction: 'raw txn',
                redeemScriptAsHex: 'redeem script',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            const broadcastSpy = spyOn(lockMonitor['bitcoinClient'], 'broadcastLockTransaction').and.returnValue(Promise.resolve(''));
            yield lockMonitor['rebroadcastTransaction'](lastSavedLockInput);
            const expectedRebroadcastLockTxn = {
                redeemScriptAsHex: lastSavedLockInput.redeemScriptAsHex,
                serializedTransactionObject: lastSavedLockInput.rawTransaction,
                transactionId: lastSavedLockInput.transactionId,
                transactionFee: 0
            };
            expect(broadcastSpy).toHaveBeenCalledWith(expectedRebroadcastLockTxn);
        }));
    });
    describe('isTransactionBroadcasted', () => {
        it('should return true if the bitcoin client returns the transaction', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTxn = { id: 'id', blockHash: 'block hash', confirmations: 5, inputs: [], outputs: [] };
            spyOn(lockMonitor['bitcoinClient'], 'getRawTransaction').and.returnValue(Promise.resolve(mockTxn));
            const actual = yield lockMonitor['isTransactionBroadcasted']('input id');
            expect(actual).toBeTruthy();
        }));
        it('should return false if there is an exception thrown by the bitcoin client', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(lockMonitor['bitcoinClient'], 'getRawTransaction').and.throwError('not found error.');
            const actual = yield lockMonitor['isTransactionBroadcasted']('input id');
            expect(actual).toBeFalsy();
        }));
    });
    describe('handleCreatingNewLock', () => {
        it('should create the first lock', () => __awaiter(void 0, void 0, void 0, function* () {
            // Make sure that there's enough wallet balance available
            const mockWalletBalance = 32430234 + lockMonitor['transactionFeesAmountInSatoshis'] + 200;
            spyOn(lockMonitor['bitcoinClient'], 'getBalanceInSatoshis').and.returnValue(Promise.resolve(mockWalletBalance));
            spyOn(lockMonitor['versionManager'], 'getLockDurationInBlocks').and.returnValue(lockDuration);
            const mockLockTxn = {
                redeemScriptAsHex: 'renew lock txn redeem script',
                serializedTransactionObject: 'serialized txn',
                transactionId: 'transaction id',
                transactionFee: 100
            };
            const createLockTxnSpy = spyOn(lockMonitor['bitcoinClient'], 'createLockTransaction').and.returnValue(Promise.resolve(mockLockTxn));
            const mockLockInfoSaved = {
                desiredLockAmountInSatoshis: 125,
                createTimestamp: Date.now(),
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            const saveBroadcastSpy = spyOn(lockMonitor, 'saveThenBroadcastTransaction').and.returnValue(Promise.resolve(mockLockInfoSaved));
            const desiredLockAmount = mockWalletBalance - (mockWalletBalance * 0.5);
            spyOn(lockMonitor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(12345));
            const actual = yield lockMonitor['handleCreatingNewLock'](desiredLockAmount);
            expect(actual).toEqual(mockLockInfoSaved);
            const expectedLockAmount = desiredLockAmount + lockMonitor['transactionFeesAmountInSatoshis'];
            expect(createLockTxnSpy).toHaveBeenCalledWith(expectedLockAmount, lockDuration);
            expect(saveBroadcastSpy).toHaveBeenCalledWith(mockLockTxn, SavedLockType_1.default.Create, desiredLockAmount);
        }));
        it('should throw if the wallet balance is less than the desired lock amount', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockWalletBalance = 32430234;
            spyOn(lockMonitor['bitcoinClient'], 'getBalanceInSatoshis').and.returnValue(Promise.resolve(mockWalletBalance));
            const desiredLockAmount = mockWalletBalance - lockMonitor['transactionFeesAmountInSatoshis'];
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockMonitor['handleCreatingNewLock'](desiredLockAmount), ErrorCode_1.default.LockMonitorNotEnoughBalanceForFirstLock);
        }));
    });
    describe('handleExistingLockRenewal', () => {
        it('should return if the we have not reached the unlock block yet.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUnlockTxnTime = 4500;
            const currentValueTimeLockInput = {
                amountLocked: 5000,
                identifier: 'some identifier',
                owner: 'owner',
                unlockTransactionTime: mockUnlockTxnTime,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const lastSavedLockInfoInput = {
                createTimestamp: 21323,
                desiredLockAmountInSatoshis: currentValueTimeLockInput.amountLocked,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            // Make sure we mock not reaching the unlock time just yet.
            spyOn(lockMonitor, 'isUnlockTimeReached').and.returnValue(Promise.resolve(false));
            const releaseLockSpy = spyOn(lockMonitor, 'releaseLock');
            const renewLockSpy = spyOn(lockMonitor, 'renewLock');
            const actual = yield lockMonitor['handleExistingLockRenewal'](currentValueTimeLockInput, lastSavedLockInfoInput, 50);
            expect(actual).toBeFalsy();
            expect(releaseLockSpy).not.toHaveBeenCalled();
            expect(renewLockSpy).not.toHaveBeenCalled();
        }));
        it('should call release lock if the new desired lock amount is different than the previously saved one.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUnlockTxnTime = 4500;
            const currentValueTimeLockInput = {
                amountLocked: 5000,
                identifier: 'some identifier',
                owner: 'owner',
                unlockTransactionTime: mockUnlockTxnTime,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockLastSavedDesiredLockAmount = 500;
            const lastSavedLockInfoInput = {
                createTimestamp: 21323,
                desiredLockAmountInSatoshis: mockLastSavedDesiredLockAmount,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            spyOn(lockMonitor, 'isUnlockTimeReached').and.returnValue(Promise.resolve(true));
            const releaseLockSpy = spyOn(lockMonitor, 'releaseLock').and.returnValue(Promise.resolve());
            const renewLockSpy = spyOn(lockMonitor, 'renewLock');
            const actual = yield lockMonitor['handleExistingLockRenewal'](currentValueTimeLockInput, lastSavedLockInfoInput, mockLastSavedDesiredLockAmount - 1);
            expect(actual).toBeTruthy();
            expect(releaseLockSpy).toHaveBeenCalled();
            expect(renewLockSpy).not.toHaveBeenCalled();
        }));
        it('should call renew lock if we are at the unlock block and the desired lock amount is same as the last time.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUnlockTxnTime = 4500;
            const currentValueTimeLockInput = {
                amountLocked: 5000,
                identifier: 'some identifier',
                owner: 'owner',
                unlockTransactionTime: mockUnlockTxnTime,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockLastSavedDesiredLockAmount = 500;
            const lastSavedLockInfoInput = {
                createTimestamp: 21323,
                desiredLockAmountInSatoshis: mockLastSavedDesiredLockAmount,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            spyOn(lockMonitor, 'isUnlockTimeReached').and.returnValue(Promise.resolve(true));
            const releaseLockSpy = spyOn(lockMonitor, 'releaseLock');
            const renewLockSpy = spyOn(lockMonitor, 'renewLock').and.returnValue(Promise.resolve());
            const actual = yield lockMonitor['handleExistingLockRenewal'](currentValueTimeLockInput, lastSavedLockInfoInput, mockLastSavedDesiredLockAmount);
            expect(actual).toBeTruthy();
            expect(releaseLockSpy).not.toHaveBeenCalled();
            expect(renewLockSpy).toHaveBeenCalled();
        }));
        it('should call release lock if we do not have enough balance for relock.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUnlockTxnTime = 4500;
            const currentValueTimeLockInput = {
                amountLocked: 5000,
                identifier: 'some identifier',
                owner: 'owner',
                unlockTransactionTime: mockUnlockTxnTime,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockLastSavedDesiredLockAmount = 500;
            const lastSavedLockInfoInput = {
                createTimestamp: 21323,
                desiredLockAmountInSatoshis: mockLastSavedDesiredLockAmount,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            spyOn(lockMonitor, 'isUnlockTimeReached').and.returnValue(Promise.resolve(true));
            const releaseLockSpy = spyOn(lockMonitor, 'releaseLock').and.returnValue(Promise.resolve());
            const renewLockSpy = spyOn(lockMonitor, 'renewLock');
            renewLockSpy.and.callFake(() => {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockMonitorNotEnoughBalanceForRelock);
            });
            const actual = yield lockMonitor['handleExistingLockRenewal'](currentValueTimeLockInput, lastSavedLockInfoInput, mockLastSavedDesiredLockAmount);
            expect(actual).toBeTruthy();
            expect(renewLockSpy).toHaveBeenCalledBefore(releaseLockSpy);
            expect(releaseLockSpy).toHaveBeenCalled();
        }));
        it('should just bubble up any unhandled errors.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUnlockTxnTime = 4500;
            const currentValueTimeLockInput = {
                amountLocked: 5000,
                identifier: 'some identifier',
                owner: 'owner',
                unlockTransactionTime: mockUnlockTxnTime,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const mockLastSavedDesiredLockAmount = 500;
            const lastSavedLockInfoInput = {
                createTimestamp: 21323,
                desiredLockAmountInSatoshis: mockLastSavedDesiredLockAmount,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            spyOn(lockMonitor, 'isUnlockTimeReached').and.returnValue(Promise.resolve(true));
            const releaseLockSpy = spyOn(lockMonitor, 'releaseLock');
            const mockUnhandledError = new SidetreeError_1.default('some unhandled error');
            const renewLockSpy = spyOn(lockMonitor, 'renewLock');
            renewLockSpy.and.callFake(() => {
                throw mockUnhandledError;
            });
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockMonitor['handleExistingLockRenewal'](currentValueTimeLockInput, lastSavedLockInfoInput, mockLastSavedDesiredLockAmount), mockUnhandledError.code);
            expect(renewLockSpy).toHaveBeenCalled();
            expect(releaseLockSpy).not.toHaveBeenCalled();
        }));
    });
    describe('handleReleaseExistingLock', () => {
        it('should not call the renew lock routine if the lock time has not reached.', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(lockMonitor, 'isUnlockTimeReached').and.returnValue(Promise.resolve(false));
            const releaseLockSpy = spyOn(lockMonitor, 'releaseLock');
            const currentValueTimeLockInput = {
                amountLocked: 5000,
                identifier: 'some identifier',
                owner: 'owner',
                unlockTransactionTime: 12345,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const actual = yield lockMonitor['handleReleaseExistingLock'](currentValueTimeLockInput, 400);
            expect(actual).toBeFalsy();
            expect(releaseLockSpy).not.toHaveBeenCalled();
        }));
        it('should call the renew lock routine if the lock time has reached.', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(lockMonitor, 'isUnlockTimeReached').and.returnValue(Promise.resolve(true));
            const mockLastSavedLockInfo = {
                createTimestamp: 21323,
                desiredLockAmountInSatoshis: 3455,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.Create
            };
            const releaseLockSpy = spyOn(lockMonitor, 'releaseLock').and.returnValue(Promise.resolve(mockLastSavedLockInfo));
            const lastSavedDesiredLockAmountInput = 500;
            const currentValueTimeLockInput = {
                amountLocked: 5000,
                identifier: 'some identifier',
                owner: 'owner',
                unlockTransactionTime: 12345,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const actual = yield lockMonitor['handleReleaseExistingLock'](currentValueTimeLockInput, lastSavedDesiredLockAmountInput);
            expect(actual).toBeTruthy();
            expect(releaseLockSpy).toHaveBeenCalledWith(currentValueTimeLockInput, lastSavedDesiredLockAmountInput);
        }));
    });
    describe('renewLock', () => {
        it('should renew the existing lock and save the updated information to the db', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCurrentLockId = {
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id'
            };
            spyOn(lockMonitor['versionManager'], 'getLockDurationInBlocks').and.returnValue(lockDuration);
            spyOn(lockMonitor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(123));
            spyOn(LockIdentifierSerializer_1.default, 'deserialize').and.returnValue(mockCurrentLockId);
            const mockRenewLockTxn = {
                redeemScriptAsHex: 'renew lock txn redeem script',
                serializedTransactionObject: 'serialized txn',
                transactionId: 'transaction id',
                transactionFee: 100
            };
            const createRelockTxnSpy = spyOn(lockMonitor['bitcoinClient'], 'createRelockTransaction').and.returnValue(Promise.resolve(mockRenewLockTxn));
            const mockLockInfo = {
                desiredLockAmountInSatoshis: 2345,
                createTimestamp: 12323425,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.ReturnToWallet
            };
            const saveBroadcastSpy = spyOn(lockMonitor, 'saveThenBroadcastTransaction').and.returnValue(mockLockInfo);
            const currentLockInfoInput = {
                amountLocked: 1234,
                identifier: 'abc',
                unlockTransactionTime: 1234,
                normalizedFee: 100,
                owner: 'some - owner',
                lockTransactionTime: 1220
            };
            // Ensure that the desired lock amount is not too much.
            const desiredLockAmountInput = currentLockInfoInput.amountLocked - mockRenewLockTxn.transactionFee;
            const actual = yield lockMonitor['renewLock'](currentLockInfoInput, desiredLockAmountInput);
            expect(actual).toEqual(mockLockInfo);
            const existingLockDuration = currentLockInfoInput.unlockTransactionTime - currentLockInfoInput.lockTransactionTime;
            expect(createRelockTxnSpy).toHaveBeenCalledWith(mockCurrentLockId.transactionId, existingLockDuration, lockDuration);
            expect(saveBroadcastSpy).toHaveBeenCalledWith(mockRenewLockTxn, SavedLockType_1.default.Relock, desiredLockAmountInput);
        }));
        it('should throw if the renew fees are causing the new lock amount to be less than the desired lock.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCurrentLockId = {
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id'
            };
            spyOn(LockIdentifierSerializer_1.default, 'deserialize').and.returnValue(mockCurrentLockId);
            spyOn(lockMonitor['versionManager'], 'getLockDurationInBlocks').and.returnValue(14);
            spyOn(lockMonitor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(123));
            const mockRenewLockTxn = {
                redeemScriptAsHex: 'renew lock txn redeem script',
                serializedTransactionObject: 'serialized txn',
                transactionId: 'transaction id',
                transactionFee: 100
            };
            spyOn(lockMonitor['bitcoinClient'], 'createRelockTransaction').and.returnValue(Promise.resolve(mockRenewLockTxn));
            const saveBroadcastSpy = spyOn(lockMonitor, 'saveThenBroadcastTransaction');
            const currentLockInfoInput = {
                amountLocked: 1234,
                identifier: 'abc',
                owner: 'wallet address',
                unlockTransactionTime: 1234,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            // Ensure that the desired lock amount is more to cause the error
            const desiredLockAmountInput = currentLockInfoInput.amountLocked + mockRenewLockTxn.transactionFee;
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockMonitor['renewLock'](currentLockInfoInput, desiredLockAmountInput), ErrorCode_1.default.LockMonitorNotEnoughBalanceForRelock);
            expect(saveBroadcastSpy).not.toHaveBeenCalled();
        }));
    });
    describe('releaseLock', () => {
        it('should release the lock and save the updated information to the db', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCurrentLockId = {
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id'
            };
            spyOn(LockIdentifierSerializer_1.default, 'deserialize').and.returnValue(mockCurrentLockId);
            const mockReleaseLockTxn = {
                redeemScriptAsHex: 'release lock txn redeem script',
                serializedTransactionObject: 'serialized txn',
                transactionId: 'transaction id',
                transactionFee: 100
            };
            spyOn(lockMonitor['bitcoinClient'], 'createReleaseLockTransaction').and.returnValue(Promise.resolve(mockReleaseLockTxn));
            const mockLockInfo = {
                desiredLockAmountInSatoshis: 2345,
                createTimestamp: 12323425,
                rawTransaction: 'raw transaction',
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id',
                type: SavedLockType_1.default.ReturnToWallet
            };
            const saveBroadcastSpy = spyOn(lockMonitor, 'saveThenBroadcastTransaction').and.returnValue(mockLockInfo);
            const currentLockInfoInput = {
                amountLocked: 123,
                identifier: 'abc',
                owner: 'wallet address',
                unlockTransactionTime: 1234,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            const desiredLockAmountInput = 2500;
            const actual = yield lockMonitor['releaseLock'](currentLockInfoInput, desiredLockAmountInput);
            expect(actual).toEqual(mockLockInfo);
            expect(saveBroadcastSpy).toHaveBeenCalledWith(mockReleaseLockTxn, SavedLockType_1.default.ReturnToWallet, desiredLockAmountInput);
        }));
    });
    describe('saveThenBroadcastTransaction', () => {
        it('save the transaction first and then broadcast it.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockBitcoinLockTxn = {
                redeemScriptAsHex: 'redeem script hex',
                serializedTransactionObject: 'serialized txn object',
                transactionFee: 132,
                transactionId: 'transaction id'
            };
            const mockDateValue = Date.now();
            spyOn(Date, 'now').and.returnValue(mockDateValue);
            const lockStoreSpy = spyOn(lockMonitor['lockTransactionStore'], 'addLock').and.returnValue(Promise.resolve());
            const broadcastTxnSpy = spyOn(lockMonitor['bitcoinClient'], 'broadcastLockTransaction').and.returnValue(Promise.resolve('id'));
            const desiredLockAmtInput = 98985;
            const lockTxnTypeInput = SavedLockType_1.default.Relock;
            const actual = yield lockMonitor['saveThenBroadcastTransaction'](mockBitcoinLockTxn, lockTxnTypeInput, desiredLockAmtInput);
            const expectedLockSaved = {
                desiredLockAmountInSatoshis: desiredLockAmtInput,
                rawTransaction: mockBitcoinLockTxn.serializedTransactionObject,
                createTimestamp: mockDateValue,
                redeemScriptAsHex: mockBitcoinLockTxn.redeemScriptAsHex,
                transactionId: mockBitcoinLockTxn.transactionId,
                type: lockTxnTypeInput
            };
            expect(actual).toEqual(expectedLockSaved);
            expect(lockStoreSpy).toHaveBeenCalledWith(expectedLockSaved);
            expect(lockStoreSpy).toHaveBeenCalledBefore(broadcastTxnSpy);
            expect(broadcastTxnSpy).toHaveBeenCalledWith(mockBitcoinLockTxn);
        }));
    });
    describe('isUnlockTimeReached', () => {
        it('should return true if we at the unlock block', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockUnlockTime = 12345;
            spyOn(lockMonitor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(mockUnlockTime));
            const actual = yield lockMonitor['isUnlockTimeReached'](mockUnlockTime);
            expect(actual).toBeTruthy();
            done();
        }));
        it('should return false if we are below the unlock block', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockUnlockTime = 12345;
            spyOn(lockMonitor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(mockUnlockTime - 1));
            const actual = yield lockMonitor['isUnlockTimeReached'](mockUnlockTime);
            expect(actual).toBeFalsy();
            done();
        }));
    });
});
//# sourceMappingURL=LockMonitor.spec.js.map