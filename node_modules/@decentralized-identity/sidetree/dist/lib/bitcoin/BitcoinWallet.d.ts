import { Address, Script, Transaction } from 'bitcore-lib';
import IBitcoinWallet from './interfaces/IBitcoinWallet';
/**
 * Represents a bitcoin wallet.
 */
export default class BitcoinWallet implements IBitcoinWallet {
    private readonly walletPrivateKey;
    private readonly walletAddress;
    private readonly walletPublicKeyAsBuffer;
    private readonly walletPublicKeyAsHex;
    constructor(bitcoinWalletImportString: string);
    getPublicKeyAsHex(): string;
    getAddress(): Address;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signFreezeTransaction(transaction: Transaction, _outputRedeemScript: Script): Promise<Transaction>;
    signSpendFromFreezeTransaction(lockTransaction: Transaction, inputRedeemScript: Script, _outputRedeemScript: Script | undefined): Promise<Transaction>;
}
