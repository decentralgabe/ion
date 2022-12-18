"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bitcore_lib_1 = require("bitcore-lib");
const BitcoinClient_1 = require("../../lib/bitcoin/BitcoinClient");
/**
 * Encapsulates the functions that help with generating the test data for the Bitcoin blockchain.
 */
class BitcoinDataGenerator {
    static randomString(length = 16) {
        return Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(16).substring(0, length);
    }
    static randomNumber(max = 256) {
        return Math.round(Math.random() * max);
    }
    /**
     * Generates a new bitcoin transaction.
     * @param wif Input to generate the private key.
     * @param satoshis The amount of satoshis to include in the transaction
     */
    static generateBitcoinTransaction(wif, satoshis = 1) {
        const keyObject = bitcore_lib_1.PrivateKey.fromWIF(wif);
        const address = keyObject.toAddress();
        const transaction = new bitcore_lib_1.Transaction();
        transaction.to(address, satoshis);
        transaction.change(address);
        return transaction;
    }
    /**
     * Generates test unspent coins data.
     * @param wif Input to generate the private key.
     * @param satoshis The amount of satoshis to include in the transaction
     */
    static generateUnspentCoin(wif, satoshis) {
        const transaction = BitcoinDataGenerator.generateBitcoinTransaction(wif, satoshis);
        return new bitcore_lib_1.Transaction.UnspentOutput({
            txid: transaction.id,
            vout: 0,
            address: transaction.outputs[0].script.getAddressInfo(),
            amount: transaction.outputs[0].satoshis * 0.00000001,
            script: transaction.outputs[0].script
        });
    }
    /**
     * Generates test block for bitcoin.
     */
    static generateBlock(blockHeight, data) {
        const tx = [];
        const count = BitcoinDataGenerator.randomNumber(100) + 10;
        for (let i = 0; i < count; i++) {
            const transaction = BitcoinDataGenerator.generateBitcoinTransaction(BitcoinClient_1.default.generatePrivateKey('testnet'), 1);
            // data generation
            if (data) {
                const hasData = data();
                // if the data returned is an array then add each value one by one.
                // otherwise add the single value
                if (hasData instanceof Array) {
                    hasData.forEach(element => {
                        transaction.addData(Buffer.from(element));
                    });
                }
                else if (hasData) {
                    transaction.addData(Buffer.from(hasData));
                }
            }
            tx.push(transaction);
        }
        const blockHash = BitcoinDataGenerator.randomString();
        return {
            hash: blockHash,
            height: blockHeight,
            previousHash: BitcoinDataGenerator.randomString(),
            transactions: tx.map((txn) => {
                return {
                    id: txn.id,
                    blockHash: blockHash,
                    confirmations: BitcoinDataGenerator.randomNumber(),
                    inputs: txn.inputs.map((input) => { return BitcoinClient_1.default['createBitcoinInputModel'](input); }),
                    outputs: txn.outputs.map((output) => { return BitcoinClient_1.default['createBitcoinOutputModel'](output); })
                };
            })
        };
    }
}
exports.default = BitcoinDataGenerator;
//# sourceMappingURL=BitcoinDataGenerator.js.map