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
const LockIdentifierSerializer_1 = require("./LockIdentifierSerializer");
const Logger_1 = require("../../common/Logger");
const bitcore_lib_1 = require("bitcore-lib");
const SidetreeError_1 = require("../../common/SidetreeError");
/**
 * Encapsulates functionality for verifying a bitcoin lock created by this service.
 */
class LockResolver {
    constructor(versionManager, bitcoinClient) {
        this.versionManager = versionManager;
        this.bitcoinClient = bitcoinClient;
    }
    /**
     * Gets the corresponding lock information represented by the specified lock identifier.
     * @param serializedLockIdentifier The serialized lock identifier.
     */
    resolveSerializedLockIdentifierAndThrowOnError(serializedLockIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const lockIdentifier = LockIdentifierSerializer_1.default.deserialize(serializedLockIdentifier);
            return this.resolveLockIdentifierAndThrowOnError(lockIdentifier);
        });
    }
    /**
     * Gets the corresponding lock information represented by the specified lock identifier. It also verifies
     * the lock by making sure that the corresponding transaction is indeed a lock transaction paying to the
     * wallet in the lockIdentifier upon lock expiry.
     *
     * @param lockIdentifier The lock identifier.
     * @returns The blockchain lock model if the specified identifier is verified; throws if verification fails.
     */
    resolveLockIdentifierAndThrowOnError(lockIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Starting lock resolution for identifier: ${JSON.stringify(lockIdentifier)}`);
            // The verification of a lock-identifier has the following steps:
            //   (A). The redeem script in the lock-identifier is actually a 'locking' script
            //   (B). The transaction in the lock-identifier is paying to the redeem script in the lock-identifier
            //   (C). The lock duration is valid
            //
            // With above, we can verify that the amount is/was locked for the specified wallet in
            // the specified transaction.
            // (A). verify redeem script is a lock script
            const redeemScriptObj = LockResolver.createScript(lockIdentifier.redeemScriptAsHex);
            const scriptVerifyResult = LockResolver.isRedeemScriptALockScript(redeemScriptObj);
            if (!scriptVerifyResult.isScriptValid) {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockResolverRedeemScriptIsNotLock, `${redeemScriptObj.toASM()}`);
            }
            // (B). verify that the transaction is paying to the target redeem script
            const lockTransaction = yield this.getTransaction(lockIdentifier.transactionId);
            const transactionIsPayingToTargetRedeemScript = lockTransaction.outputs.length > 0 &&
                LockResolver.isOutputPayingToTargetScript(lockTransaction.outputs[0], redeemScriptObj);
            if (!transactionIsPayingToTargetRedeemScript) {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockResolverTransactionIsNotPayingToScript, `Transaction id: ${lockIdentifier.transactionId} Script: ${redeemScriptObj.toASM()}`);
            }
            // Now that the lock identifier has been verified, return the lock information
            const serializedLockIdentifier = LockIdentifierSerializer_1.default.serialize(lockIdentifier);
            const lockStartBlock = yield this.calculateLockStartingBlock(lockTransaction);
            // (C). verify that the lock duration is valid
            const unlockAtBlock = lockStartBlock + scriptVerifyResult.lockDurationInBlocks;
            const lockDurationInBlocks = this.versionManager.getLockDurationInBlocks(lockStartBlock);
            if (this.versionManager.getLockDurationInBlocks(lockStartBlock) !== scriptVerifyResult.lockDurationInBlocks) {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockResolverDurationIsInvalid, 
                // eslint-disable-next-line max-len
                `Lock start block: ${lockStartBlock}. Unlock block: ${unlockAtBlock}. Invalid duration: ${scriptVerifyResult.lockDurationInBlocks}. Allowed duration: ${lockDurationInBlocks}`);
            }
            const normalizedFee = yield this.versionManager.getFeeCalculator(lockStartBlock).getNormalizedFee(lockStartBlock);
            return {
                identifier: serializedLockIdentifier,
                amountLocked: lockTransaction.outputs[0].satoshis,
                lockTransactionTime: lockStartBlock,
                unlockTransactionTime: unlockAtBlock,
                normalizedFee: normalizedFee,
                owner: scriptVerifyResult.publicKeyHash
            };
        });
    }
    /**
     * Checks whether the redeem script is indeed a lock script.
     * @param redeemScript The script to check.
     * @returns The verify result object.
     */
    static isRedeemScriptALockScript(redeemScript) {
        // Split the script into parts and verify each part
        const scriptAsmParts = redeemScript.toASM().split(' ');
        // Verify different parts; [0] & [5] indices are parsed only if the script is valid
        const isScriptValid = scriptAsmParts.length === 8 &&
            scriptAsmParts[1] === 'OP_NOP3' &&
            scriptAsmParts[2] === 'OP_DROP' &&
            scriptAsmParts[3] === 'OP_DUP' &&
            scriptAsmParts[4] === 'OP_HASH160' &&
            scriptAsmParts[6] === 'OP_EQUALVERIFY' &&
            scriptAsmParts[7] === 'OP_CHECKSIG';
        let lockDurationInBlocks;
        let publicKeyHash;
        if (isScriptValid) {
            const lockDurationInBlocksBuffer = Buffer.from(scriptAsmParts[0], 'hex');
            lockDurationInBlocks = lockDurationInBlocksBuffer.readIntLE(0, lockDurationInBlocksBuffer.length);
            publicKeyHash = scriptAsmParts[5];
        }
        return {
            isScriptValid: isScriptValid,
            publicKeyHash: publicKeyHash,
            lockDurationInBlocks: lockDurationInBlocks
        };
    }
    /**
     * Checks whether the specified output is a "paytoscript" type output to the specified script.
     * @param bitcoinOutput The freeze output from the bitcoin transaction.
     * @param targetScript The expected redeem script.
     */
    static isOutputPayingToTargetScript(bitcoinOutput, targetScript) {
        const targetScriptHashOut = bitcore_lib_1.Script.buildScriptHashOut(targetScript);
        return bitcoinOutput.scriptAsmAsString === targetScriptHashOut.toASM();
    }
    static createScript(redeemScriptAsHex) {
        try {
            const redeemScriptAsBuffer = Buffer.from(redeemScriptAsHex, 'hex');
            return new bitcore_lib_1.Script(redeemScriptAsBuffer);
        }
        catch (e) {
            throw SidetreeError_1.default.createFromError(ErrorCode_1.default.LockResolverRedeemScriptIsInvalid, e);
        }
    }
    getTransaction(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.bitcoinClient.getRawTransaction(transactionId);
            }
            catch (e) {
                throw SidetreeError_1.default.createFromError(ErrorCode_1.default.LockResolverTransactionNotFound, e);
            }
        });
    }
    calculateLockStartingBlock(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (transaction.confirmations <= 0) {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockResolverTransactionNotConfirmed, `transaction id: ${transaction.id}`);
            }
            const blockInfo = yield this.bitcoinClient.getBlockInfo(transaction.blockHash);
            return blockInfo.height;
        });
    }
}
exports.default = LockResolver;
//# sourceMappingURL=LockResolver.js.map