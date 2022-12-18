import { Transaction } from 'bitcore-lib';
import BitcoinBlockModel from '../../lib/bitcoin/models/BitcoinBlockModel';
/**
 * Encapsulates the functions that help with generating the test data for the Bitcoin blockchain.
 */
export default class BitcoinDataGenerator {
    private static randomString;
    private static randomNumber;
    /**
     * Generates a new bitcoin transaction.
     * @param wif Input to generate the private key.
     * @param satoshis The amount of satoshis to include in the transaction
     */
    static generateBitcoinTransaction(wif: string, satoshis?: number): Transaction;
    /**
     * Generates test unspent coins data.
     * @param wif Input to generate the private key.
     * @param satoshis The amount of satoshis to include in the transaction
     */
    static generateUnspentCoin(wif: string, satoshis: number): Transaction.UnspentOutput;
    /**
     * Generates test block for bitcoin.
     */
    static generateBlock(blockHeight: number, data?: () => string | string[] | undefined): BitcoinBlockModel;
}
