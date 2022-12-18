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
const bitcore_lib_1 = require("bitcore-lib");
const BitcoinClient_1 = require("../../../lib/bitcoin/BitcoinClient");
const ErrorCode_1 = require("../../../lib/bitcoin/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../../JasmineSidetreeErrorValidator");
const LockIdentifierSerializer_1 = require("../../../lib/bitcoin/lock/LockIdentifierSerializer");
const LockResolver_1 = require("../../../lib/bitcoin/lock/LockResolver");
const MockBlockMetadataStore_1 = require("../../mocks/MockBlockMetadataStore");
const VersionManager_1 = require("../../../lib/bitcoin/VersionManager");
function createValidLockRedeemScript(lockDurationInBlocks, targetWalletAddress) {
    const lockDurationInBlocksBuffer = Buffer.alloc(3);
    lockDurationInBlocksBuffer.writeIntLE(lockDurationInBlocks, 0, 3);
    return bitcore_lib_1.Script.empty()
        .add(lockDurationInBlocksBuffer)
        .add(178) // OP_CSV
        .add(117) // OP_DROP
        .add(bitcore_lib_1.Script.buildPublicKeyHashOut(targetWalletAddress));
}
function createLockScriptVerifyResult(isScriptValid, owner, lockDurationInBlocks) {
    return {
        isScriptValid: isScriptValid,
        publicKeyHash: owner,
        lockDurationInBlocks: lockDurationInBlocks
    };
}
describe('LockResolver', () => {
    const versionModels = [{ startingBlockchainTime: 0, version: 'latest', protocolParameters: { valueTimeLockDurationInBlocks: 5, initialNormalizedFeeInSatoshis: 1, feeLookBackWindowInBlocks: 1, feeMaxFluctuationMultiplierPerBlock: 1 } }];
    const versionManager = new VersionManager_1.default();
    versionManager.initialize(versionModels, { genesisBlockNumber: 0 }, new MockBlockMetadataStore_1.default());
    const validTestPrivateKey = new bitcore_lib_1.PrivateKey(undefined, bitcore_lib_1.Networks.testnet);
    const validTestWalletAddress = validTestPrivateKey.toAddress();
    const validTestPublicKey = validTestPrivateKey.toPublicKey();
    const validPublicKeyHashOutBuffer = bitcore_lib_1.crypto.Hash.sha256ripemd160(validTestPublicKey.toBuffer());
    const validPublicKeyHashOutString = validPublicKeyHashOutBuffer.toString('hex');
    const validTestWalletImportString = validTestPrivateKey.toWIF();
    let lockResolver;
    beforeEach(() => {
        const bitcoinClient = new BitcoinClient_1.default('uri:test', 'u', 'p', validTestWalletImportString, 10, 1, 0);
        lockResolver = new LockResolver_1.default(versionManager, bitcoinClient);
    });
    describe('resolveSerializedLockIdentifierAndThrowOnError', () => {
        it('should deserialize the identifier and call the other function', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockLockIdentifier = {
                redeemScriptAsHex: 'redeem script as hex',
                transactionId: 'transaction id'
            };
            const deserializeSpy = spyOn(LockIdentifierSerializer_1.default, 'deserialize').and.returnValue(mockLockIdentifier);
            const mockLockStartBlock = 12345;
            spyOn(lockResolver, 'calculateLockStartingBlock').and.returnValue(Promise.resolve(12345));
            const mockValueTimeLock = {
                amountLocked: 1000,
                identifier: 'identifier',
                owner: 'owner',
                unlockTransactionTime: 1900,
                normalizedFee: 100,
                lockTransactionTime: mockLockStartBlock
            };
            const resolveSpy = spyOn(lockResolver, 'resolveLockIdentifierAndThrowOnError').and.returnValue(Promise.resolve(mockValueTimeLock));
            const serializedIdInput = 'mock serialized identifier';
            const actual = yield lockResolver.resolveSerializedLockIdentifierAndThrowOnError(serializedIdInput);
            expect(actual).toEqual(mockValueTimeLock);
            expect(deserializeSpy).toHaveBeenCalledWith(serializedIdInput);
            expect(resolveSpy).toHaveBeenCalled();
            done();
        }));
    });
    describe('resolveLockIdentifierAndThrowOnError', () => {
        it('should correctly resolve a valid lock identifier.', () => __awaiter(void 0, void 0, void 0, function* () {
            const lockDurationInput = 166;
            const validScript = createValidLockRedeemScript(lockDurationInput, validTestWalletAddress);
            const mockLockIdentifier = {
                transactionId: 'some transactoin id',
                redeemScriptAsHex: validScript.toHex()
            };
            const mockTransaction = {
                id: 'some transaction id',
                blockHash: 'block hash',
                confirmations: 5,
                inputs: [],
                outputs: [
                    { satoshis: 10000, scriptAsmAsString: 'mock script asm' }
                ]
            };
            const mockLockScriptVerifyResult = createLockScriptVerifyResult(true, validPublicKeyHashOutString, lockDurationInput);
            const getTxnSpy = spyOn(lockResolver, 'getTransaction').and.returnValue(Promise.resolve(mockTransaction));
            const createScriptSpy = spyOn(LockResolver_1.default, 'createScript').and.returnValue(validScript);
            const checkLockScriptSpy = spyOn(LockResolver_1.default, 'isRedeemScriptALockScript').and.returnValue(mockLockScriptVerifyResult);
            const payToScriptSpy = spyOn(LockResolver_1.default, 'isOutputPayingToTargetScript').and.returnValue(true);
            const mockSerializedLockIdentifier = 'mocked-locked-identifier';
            spyOn(LockIdentifierSerializer_1.default, 'serialize').and.returnValue(mockSerializedLockIdentifier);
            const mockLockStartBlock = 12345;
            spyOn(lockResolver, 'calculateLockStartingBlock').and.returnValue(Promise.resolve(mockLockStartBlock));
            const mockNormalizedFee = 87654;
            const mockFeeCalculator = {
                calculateNormalizedTransactionFeeFromBlock(block) { return Math.floor(block.normalizedFee); },
                getNormalizedFee() {
                    return __awaiter(this, void 0, void 0, function* () { return mockNormalizedFee; });
                },
                addNormalizedFeeToBlockMetadata(block) {
                    return __awaiter(this, void 0, void 0, function* () { return Object.assign({ normalizedFee: mockNormalizedFee }, block); });
                }
            };
            const getFeeCalculatorSpy = spyOn(lockResolver['versionManager'], 'getFeeCalculator').and.returnValue(mockFeeCalculator);
            spyOn(lockResolver['versionManager'], 'getLockDurationInBlocks').and.returnValue(lockDurationInput);
            const expectedUnlockTransactionTime = mockLockStartBlock + lockDurationInput;
            const expectedOutput = {
                identifier: mockSerializedLockIdentifier,
                amountLocked: mockTransaction.outputs[0].satoshis,
                lockTransactionTime: mockLockStartBlock,
                unlockTransactionTime: expectedUnlockTransactionTime,
                normalizedFee: mockNormalizedFee,
                owner: validPublicKeyHashOutString
            };
            const actual = yield lockResolver.resolveLockIdentifierAndThrowOnError(mockLockIdentifier);
            expect(expectedOutput).toEqual(actual);
            expect(getTxnSpy).toHaveBeenCalledWith(mockLockIdentifier.transactionId);
            expect(createScriptSpy).toHaveBeenCalledWith(mockLockIdentifier.redeemScriptAsHex);
            expect(checkLockScriptSpy).toHaveBeenCalled();
            expect(payToScriptSpy).toHaveBeenCalledWith(mockTransaction.outputs[0], validScript);
            expect(getFeeCalculatorSpy).toHaveBeenCalledWith(mockLockStartBlock);
        }));
        it('should throw if redeem script is not a lock script.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockLockIdentifier = {
                transactionId: 'some transactoin id',
                redeemScriptAsHex: 'some mock script as hex'
            };
            const mockLockScriptVerifyResult = createLockScriptVerifyResult(false, undefined, undefined);
            const getTxnSpy = spyOn(lockResolver, 'getTransaction');
            spyOn(LockResolver_1.default, 'createScript').and.returnValue(bitcore_lib_1.Script.empty());
            spyOn(LockResolver_1.default, 'isRedeemScriptALockScript').and.returnValue(mockLockScriptVerifyResult);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockResolver.resolveLockIdentifierAndThrowOnError(mockLockIdentifier), ErrorCode_1.default.LockResolverRedeemScriptIsNotLock);
            expect(getTxnSpy).not.toHaveBeenCalled();
        }));
        it('should throw if the transaction output is not paying to the linked wallet.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockLockIdentifier = {
                transactionId: 'some transactoin id',
                redeemScriptAsHex: 'validScript to - Hex'
            };
            const mockTransaction = {
                id: 'some transaction id',
                blockHash: 'block hash',
                confirmations: 5,
                inputs: [],
                outputs: [
                    { satoshis: 10000, scriptAsmAsString: 'mock script asm' }
                ]
            };
            const mockLockScriptVerifyResult = createLockScriptVerifyResult(true, validPublicKeyHashOutString, 123);
            spyOn(lockResolver, 'getTransaction').and.returnValue(Promise.resolve(mockTransaction));
            spyOn(LockResolver_1.default, 'createScript').and.returnValue(bitcore_lib_1.Script.empty());
            spyOn(LockResolver_1.default, 'isRedeemScriptALockScript').and.returnValue(mockLockScriptVerifyResult);
            spyOn(LockResolver_1.default, 'isOutputPayingToTargetScript').and.returnValue(false);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockResolver.resolveLockIdentifierAndThrowOnError(mockLockIdentifier), ErrorCode_1.default.LockResolverTransactionIsNotPayingToScript);
        }));
        it('should throw if the lock duration is invalid.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockLockIdentifier = {
                transactionId: 'some transactoin id',
                redeemScriptAsHex: 'validScript to - Hex'
            };
            const mockTransaction = {
                id: 'some transaction id',
                blockHash: 'block hash',
                confirmations: 5,
                inputs: [],
                outputs: [
                    { satoshis: 10000, scriptAsmAsString: 'mock script asm' }
                ]
            };
            const mockLockScriptVerifyResult = createLockScriptVerifyResult(true, validPublicKeyHashOutString, 123);
            spyOn(lockResolver, 'getTransaction').and.returnValue(Promise.resolve(mockTransaction));
            spyOn(LockResolver_1.default, 'createScript').and.returnValue(bitcore_lib_1.Script.empty());
            spyOn(LockResolver_1.default, 'isRedeemScriptALockScript').and.returnValue(mockLockScriptVerifyResult);
            spyOn(LockResolver_1.default, 'isOutputPayingToTargetScript').and.returnValue(true);
            spyOn(lockResolver, 'calculateLockStartingBlock').and.returnValue(Promise.resolve(1234));
            spyOn(lockResolver['versionManager'], 'getLockDurationInBlocks').and.returnValue(1);
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockResolver.resolveLockIdentifierAndThrowOnError(mockLockIdentifier), ErrorCode_1.default.LockResolverDurationIsInvalid);
        }));
    });
    describe('isRedeemScriptALockScript', () => {
        it('should validate and return the correct block if the script is valid.', () => __awaiter(void 0, void 0, void 0, function* () {
            const lockDurationInput = 424;
            const validScript = createValidLockRedeemScript(lockDurationInput, validTestWalletAddress);
            const expectedOutput = createLockScriptVerifyResult(true, validPublicKeyHashOutString, lockDurationInput);
            const actual = LockResolver_1.default['isRedeemScriptALockScript'](validScript);
            expect(actual).toEqual(expectedOutput);
        }));
        it('should return false and 0 for block height if the script is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            const validScript = createValidLockRedeemScript(1234, validTestWalletAddress);
            const invalidScript = validScript.add(114); // add an invalid op code
            const expectedOutput = createLockScriptVerifyResult(false, undefined, undefined);
            const actual = LockResolver_1.default['isRedeemScriptALockScript'](invalidScript);
            expect(actual).toEqual(expectedOutput);
        }));
    });
    describe('isOutputPayingToTargetScript', () => {
        it('should return true if the output is paying to the target script.', () => __awaiter(void 0, void 0, void 0, function* () {
            const validScript = createValidLockRedeemScript(4758759, validTestWalletAddress);
            const validScriptAsPayToScriptHashOut = bitcore_lib_1.Script.buildScriptHashOut(validScript);
            const mockOutput = {
                satoshis: 1000, scriptAsmAsString: validScriptAsPayToScriptHashOut.toASM()
            };
            const result = LockResolver_1.default['isOutputPayingToTargetScript'](mockOutput, validScript);
            expect(result).toBeTruthy();
        }));
        it('should return false for any other script.', () => __awaiter(void 0, void 0, void 0, function* () {
            const validScript = createValidLockRedeemScript(4758759, validTestWalletAddress);
            const validScript2 = createValidLockRedeemScript(987654, validTestWalletAddress);
            const mockOutput = {
                satoshis: 1000, scriptAsmAsString: validScript2.toASM()
            };
            const result = LockResolver_1.default['isOutputPayingToTargetScript'](mockOutput, validScript);
            expect(result).toBeFalsy();
        }));
    });
    describe('createScript', () => {
        it('should return script from the hex.', () => __awaiter(void 0, void 0, void 0, function* () {
            const validScript = createValidLockRedeemScript(12345, validTestWalletAddress);
            validScript.add(114);
            const actual = LockResolver_1.default['createScript'](validScript.toHex());
            expect(actual.toASM()).toEqual(validScript.toASM());
        }));
        it('should throw if script creation throws.', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(Buffer, 'from').and.throwError('som error');
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrown(() => LockResolver_1.default['createScript']('some input'), ErrorCode_1.default.LockResolverRedeemScriptIsInvalid);
        }));
    });
    describe('getTransaction', () => {
        it('should return true if the bitcoin client returns the transaction', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTxn = { id: 'id', blockHash: 'block hash', confirmations: 5, inputs: [], outputs: [] };
            spyOn(lockResolver['bitcoinClient'], 'getRawTransaction').and.returnValue(Promise.resolve(mockTxn));
            const actual = yield lockResolver['getTransaction']('input id');
            expect(actual).toBeTruthy();
        }));
        it('should throw not-found error if there is an exception thrown by the bitcoin client', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(lockResolver['bitcoinClient'], 'getRawTransaction').and.throwError('not found custom error.');
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockResolver['getTransaction']('input id'), ErrorCode_1.default.LockResolverTransactionNotFound);
        }));
    });
    describe('calculateLockStartingBlock', () => {
        it('should calculate the correct starting block', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransaction = {
                id: 'some id',
                blockHash: 'block hash',
                confirmations: 23,
                inputs: [],
                outputs: []
            };
            const mockBlockInfo = {
                hash: 'some hash',
                height: 989347,
                previousHash: 'previous hash'
            };
            spyOn(lockResolver['bitcoinClient'], 'getBlockInfo').and.returnValue(Promise.resolve(mockBlockInfo));
            const actual = yield lockResolver['calculateLockStartingBlock'](mockTransaction);
            expect(actual).toEqual(mockBlockInfo.height);
            done();
        }));
        it('should throw if the number of confirmations on the input is < 0', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransaction = {
                id: 'some id',
                blockHash: 'block hash',
                confirmations: -2,
                inputs: [],
                outputs: []
            };
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockResolver['calculateLockStartingBlock'](mockTransaction), ErrorCode_1.default.LockResolverTransactionNotConfirmed);
            done();
        }));
        it('should throw if the number of confirmations on the input is 0', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransaction = {
                id: 'some id',
                blockHash: 'block hash',
                confirmations: 0,
                inputs: [],
                outputs: []
            };
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => lockResolver['calculateLockStartingBlock'](mockTransaction), ErrorCode_1.default.LockResolverTransactionNotConfirmed);
            done();
        }));
    });
});
//# sourceMappingURL=LockResolver.spec.js.map