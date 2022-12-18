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
const ErrorCode_1 = require("./ErrorCode");
const SidetreeError_1 = require("../common/SidetreeError");
/**
 * Represents a bitcoin wallet.
 */
class BitcoinWallet {
    constructor(bitcoinWalletImportString) {
        try {
            this.walletPrivateKey = bitcore_lib_1.PrivateKey.fromWIF(bitcoinWalletImportString);
        }
        catch (error) {
            throw SidetreeError_1.default.createFromError(ErrorCode_1.default.BitcoinWalletIncorrectImportString, error);
        }
        this.walletAddress = this.walletPrivateKey.toAddress();
        const walletPublicKey = this.walletPrivateKey.toPublicKey();
        this.walletPublicKeyAsBuffer = walletPublicKey.toBuffer();
        this.walletPublicKeyAsHex = this.walletPublicKeyAsBuffer.toString('hex');
    }
    getPublicKeyAsHex() {
        return this.walletPublicKeyAsHex;
    }
    getAddress() {
        return this.walletAddress;
    }
    signTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return transaction.sign(this.walletPrivateKey);
        });
    }
    signFreezeTransaction(transaction, _outputRedeemScript) {
        return __awaiter(this, void 0, void 0, function* () {
            // In this implementation of the wallet, we are not using the output-redeem-script parameter for anything. We'll
            // treat the signing of this transaction same as a regular non-freeze transaction.
            return this.signTransaction(transaction);
        });
    }
    signSpendFromFreezeTransaction(lockTransaction, inputRedeemScript, _outputRedeemScript) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create signature
            const signatureType = 0x1; // https://github.com/bitpay/bitcore-lib/blob/44eb5b264b9a28e376cdcf3506160a95cc499533/lib/crypto/signature.js#L308
            const inputIndexToSign = 0;
            const signature = bitcore_lib_1.Transaction.sighash.sign(lockTransaction, this.walletPrivateKey, signatureType, inputIndexToSign, inputRedeemScript);
            // Create a script and add it to the input.
            const inputScript = bitcore_lib_1.Script.empty()
                .add(signature.toTxFormat())
                .add(this.walletPublicKeyAsBuffer)
                .add(inputRedeemScript.toBuffer());
            lockTransaction.inputs[0].setScript(inputScript);
            return lockTransaction;
        });
    }
}
exports.default = BitcoinWallet;
//# sourceMappingURL=BitcoinWallet.js.map