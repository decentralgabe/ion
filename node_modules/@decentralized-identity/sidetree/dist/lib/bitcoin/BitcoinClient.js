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
const httpStatus = require("http-status");
const bitcore_lib_1 = require("bitcore-lib");
const node_fetch_1 = require("node-fetch");
const BitcoinWallet_1 = require("./BitcoinWallet");
const ErrorCode_1 = require("./ErrorCode");
const LogColor_1 = require("../common/LogColor");
const Logger_1 = require("../common/Logger");
const ReadableStream_1 = require("../common/ReadableStream");
const SidetreeError_1 = require("../common/SidetreeError");
/**
 * Encapsulates functionality for reading/writing to the bitcoin ledger.
 */
class BitcoinClient {
    constructor(bitcoinPeerUri, bitcoinRpcUsername, bitcoinRpcPassword, bitcoinWalletOrImportString, requestTimeout, requestMaxRetries, sidetreeTransactionFeeMarkupPercentage, estimatedFeeSatoshiPerKB) {
        this.bitcoinPeerUri = bitcoinPeerUri;
        this.requestTimeout = requestTimeout;
        this.requestMaxRetries = requestMaxRetries;
        this.sidetreeTransactionFeeMarkupPercentage = sidetreeTransactionFeeMarkupPercentage;
        this.estimatedFeeSatoshiPerKB = estimatedFeeSatoshiPerKB;
        /** The wallet name that is created, loaded and used */
        this.walletNameToUse = 'sidetreeDefaultWallet';
        if (typeof bitcoinWalletOrImportString === 'string') {
            Logger_1.default.info('Creating bitcoin wallet using the import string passed in.');
            this.bitcoinWallet = new BitcoinWallet_1.default(bitcoinWalletOrImportString);
        }
        else {
            Logger_1.default.info(`Using the bitcoin wallet passed in.`);
            this.bitcoinWallet = bitcoinWalletOrImportString;
        }
        if (bitcoinRpcUsername && bitcoinRpcPassword) {
            this.bitcoinAuthorization = Buffer.from(`${bitcoinRpcUsername}:${bitcoinRpcPassword}`).toString('base64');
        }
    }
    /**
     * Initialize this bitcoin client.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // Periodically poll Bitcoin Core status until it is ready.
            const bitcoinCoreStatusPollingWindowInSeconds = 60;
            yield this.waitUntilBitcoinCoreIsReady(bitcoinCoreStatusPollingWindowInSeconds);
            yield this.initializeBitcoinCore();
        });
    }
    /**
     * Periodically polls Bitcoin Core status until it is ready.
     * @param pollingWindowInSeconds Time to wait between each status check. Mainly used for speeding up unit tests.
     */
    waitUntilBitcoinCoreIsReady(pollingWindowInSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                try {
                    Logger_1.default.info('Getting blockchain info...');
                    const request = {
                        method: 'getblockchaininfo'
                    };
                    const isWalletRpc = false;
                    const allowTimeout = true;
                    const response = yield this.rpcCall(request, allowTimeout, isWalletRpc);
                    const blockHeight = response.headers;
                    const syncedBlockHeight = response.blocks;
                    Logger_1.default.info(LogColor_1.default.lightBlue(`Bitcoin sync progress: block height ${LogColor_1.default.green(blockHeight)}, sync-ed: ${LogColor_1.default.green(syncedBlockHeight)}`));
                    if (blockHeight !== 0 && syncedBlockHeight === blockHeight) {
                        Logger_1.default.info(LogColor_1.default.lightBlue('Bitcoin Core fully synchronized'));
                        return;
                    }
                }
                catch (error) {
                    Logger_1.default.info(LogColor_1.default.yellow(`Bitcoin Core not ready or not available: ${error}.`));
                }
                Logger_1.default.info(`Recheck after ${pollingWindowInSeconds} seconds...`);
                yield new Promise(resolve => setTimeout(resolve, pollingWindowInSeconds * 1000));
            }
        });
    }
    /**
     * Initializes Bitcoin Core wallet required by the service.
     * NOTE: We only use the Bitcoin Core wallet for read/monitoring purposes. `this.bitcoinWallet` is the abstraction for writes/spends.
     * There is an opportunity here to disambiguate the two "wallets" by perhaps annotating the variables and interface with "WatchOnly/Spending".
     */
    initializeBitcoinCore() {
        return __awaiter(this, void 0, void 0, function* () {
            // Create and load wallet have to be called because as of bitcoin v0.21, a default wallet is no longer automatically created and loaded
            // https://github.com/bitcoin/bitcoin/pull/15454
            yield this.createWallet();
            yield this.loadWallet();
            const walletAddress = this.bitcoinWallet.getAddress();
            if (!(yield this.isAddressAddedToWallet(walletAddress.toString()))) {
                Logger_1.default.info(`Configuring Bitcoin Core to watch address ${walletAddress}. Requires parsing transactions starting from genesis, will take a while...`);
                const publicKeyAsHex = this.bitcoinWallet.getPublicKeyAsHex();
                yield this.addWatchOnlyAddressToWallet(publicKeyAsHex, true);
            }
            else {
                Logger_1.default.info(`Bitcoin Core wallet is already watching address: ${walletAddress}`);
            }
        });
    }
    /**
     * generates a private key in WIF format
     * @param network Which bitcoin network to generate this key for
     */
    static generatePrivateKey(network) {
        let bitcoreNetwork;
        switch (network) {
            case 'mainnet':
                bitcoreNetwork = bitcore_lib_1.Networks.mainnet;
                break;
            case 'livenet':
                bitcoreNetwork = bitcore_lib_1.Networks.livenet;
                break;
            case 'testnet':
                bitcoreNetwork = bitcore_lib_1.Networks.testnet;
                break;
        }
        return new bitcore_lib_1.PrivateKey(undefined, bitcoreNetwork).toWIF();
    }
    /**
     * Converts the amount from BTC to satoshis.
     * @param amountInBtc The amount in BTC
     */
    static convertBtcToSatoshis(amountInBtc) {
        return bitcore_lib_1.Unit.fromBTC(amountInBtc).toSatoshis();
    }
    /**
     * Broadcasts the specified data transaction.
     * @param bitcoinSidetreeTransaction The transaction object.
     */
    broadcastSidetreeTransaction(bitcoinSidetreeTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.broadcastTransactionRpc(bitcoinSidetreeTransaction.serializedTransactionObject);
        });
    }
    /**
     * Broadcasts the specified lock transaction.
     *
     * @param bitcoinLockTransaction The transaction object.
     */
    broadcastLockTransaction(bitcoinLockTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionHash = yield this.broadcastTransactionRpc(bitcoinLockTransaction.serializedTransactionObject);
            Logger_1.default.info(`Broadcasted lock transaction: ${transactionHash}`);
            return transactionHash;
        });
    }
    /**
     * Creates (and NOT broadcasts) a transaction to write data to the bitcoin.
     *
     * @param transactionData The data to write in the transaction.
     * @param minimumFeeInSatoshis The minimum fee for the transaction in satoshis.
     */
    createSidetreeTransaction(transactionData, minimumFeeInSatoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield this.createTransaction(transactionData, minimumFeeInSatoshis);
            const signedTransaction = yield this.bitcoinWallet.signTransaction(transaction);
            const serializedTransaction = BitcoinClient.serializeSignedTransaction(signedTransaction);
            return {
                transactionId: signedTransaction.id,
                transactionFee: transaction.getFee(),
                serializedTransactionObject: serializedTransaction
            };
        });
    }
    /**
     * Creates (and NOT broadcasts) a lock transaction using the funds from the linked wallet.
     *
     * NOTE: if the linked wallet outputs are spent then this transaction cannot be broadcasted. So broadcast
     * this transaction before spending from the wallet.
     *
     * @param lockAmountInSatoshis The amount to lock.
     * @param lockDurationInBlocks  The number of blocks to lock the amount for; the amount becomes spendable AFTER this many blocks.
     */
    createLockTransaction(lockAmountInSatoshis, lockDurationInBlocks) {
        return __awaiter(this, void 0, void 0, function* () {
            const unspentCoins = yield this.getUnspentOutputs(this.bitcoinWallet.getAddress());
            const [freezeTransaction, redeemScript] = yield this.createFreezeTransaction(unspentCoins, lockDurationInBlocks, lockAmountInSatoshis);
            const signedTransaction = yield this.bitcoinWallet.signFreezeTransaction(freezeTransaction, redeemScript);
            const serializedTransaction = BitcoinClient.serializeSignedTransaction(signedTransaction);
            return {
                transactionId: signedTransaction.id,
                transactionFee: freezeTransaction.getFee(),
                redeemScriptAsHex: redeemScript.toHex(),
                serializedTransactionObject: serializedTransaction
            };
        });
    }
    /**
     * Creates (and NOT broadcasts) a lock transaction using the funds from the previously locked transaction.
     *
     * @param existingLockTransactionId The existing transaction with locked output.
     * @param existingLockDurationInBlocks The duration of the existing lock.
     * @param newLockDurationInBlocks The duration for the new lock.
     */
    createRelockTransaction(existingLockTransactionId, existingLockDurationInBlocks, newLockDurationInBlocks) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingLockTransaction = yield this.getRawTransactionRpc(existingLockTransactionId);
            const [freezeTransaction, redeemScript] = yield this.createSpendToFreezeTransaction(existingLockTransaction, existingLockDurationInBlocks, newLockDurationInBlocks);
            // Now sign the transaction
            const previousFreezeScript = BitcoinClient.createFreezeScript(existingLockDurationInBlocks, this.bitcoinWallet.getAddress());
            const signedTransaction = yield this.bitcoinWallet.signSpendFromFreezeTransaction(freezeTransaction, previousFreezeScript, redeemScript);
            const serializedTransaction = BitcoinClient.serializeSignedTransaction(signedTransaction);
            return {
                transactionId: signedTransaction.id,
                transactionFee: freezeTransaction.getFee(),
                redeemScriptAsHex: redeemScript.toHex(),
                serializedTransactionObject: serializedTransaction
            };
        });
    }
    /**
     * Creates (and NOT broadcasts) a transaction which outputs the previously locked amount into the linked
     * wallet.
     *
     * @param existingLockTransactionId The existing transaction with locked amount.
     * @param existingLockDurationInBlocks The lock duration for the existing lock.
     */
    createReleaseLockTransaction(existingLockTransactionId, existingLockDurationInBlocks) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingLockTransaction = yield this.getRawTransactionRpc(existingLockTransactionId);
            const releaseLockTransaction = yield this.createSpendToWalletTransaction(existingLockTransaction, existingLockDurationInBlocks);
            // Now sign the transaction
            const previousFreezeScript = BitcoinClient.createFreezeScript(existingLockDurationInBlocks, this.bitcoinWallet.getAddress());
            const signedTransaction = yield this.bitcoinWallet.signSpendFromFreezeTransaction(releaseLockTransaction, previousFreezeScript, undefined);
            const serializedTransaction = BitcoinClient.serializeSignedTransaction(signedTransaction);
            return {
                transactionId: signedTransaction.id,
                transactionFee: releaseLockTransaction.getFee(),
                redeemScriptAsHex: '',
                serializedTransactionObject: serializedTransaction
            };
        });
    }
    createWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'createwallet',
                params: [this.walletNameToUse] // the wallet name
            };
            // Intentionally not throwing because bitcoin returns 500 when a wallet is already created
            // Logging and will fail down the line if the error causes an issue
            const isWalletRpc = false;
            try {
                yield this.rpcCall(request, true, isWalletRpc);
                Logger_1.default.info(`Wallet created with name "${this.walletNameToUse}".`);
            }
            catch (e) {
                // using error message because bitcoin core error code is not reliable as a single code can contain multiple errors
                const duplicateCreateString = 'already exists';
                if (e.toString().toLowerCase().includes(duplicateCreateString)) {
                    Logger_1.default.info(`Wallet with name ${this.walletNameToUse} already exists.`);
                }
                else {
                    throw e;
                }
            }
            ;
        });
    }
    loadWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'loadwallet',
                params: [this.walletNameToUse, true] // the wallet name
            };
            // Intentionally not throwing because bitcoin returns 500 when a wallet is already loaded
            // Logging and will fail down the line if the error causes an issue
            const isWalletRpc = false;
            try {
                yield this.rpcCall(request, true, isWalletRpc);
                Logger_1.default.info(`Wallet loaded with name "${this.walletNameToUse}".`);
            }
            catch (e) {
                // using error message because bitcoin core error code is not reliable as a single code can contain multiple errors
                const duplicateLoadString = 'already loaded';
                if (e.toString().toLowerCase().includes(duplicateLoadString)) {
                    Logger_1.default.info(`Wallet with name ${this.walletNameToUse} already loaded.`);
                }
                else {
                    throw e;
                }
            }
            ;
        });
    }
    /**
     * Gets the block data for the given block hash.
     * @param hash The hash of the block
     * @returns the block data.
     */
    getBlock(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'getblock',
                params: [
                    hash,
                    2 // verbosity value to get block + transactions' info
                ]
            };
            const isWalletRpc = false;
            const block = yield this.rpcCall(request, true, isWalletRpc);
            const transactionModels = block.tx.map((txn) => {
                const transactionBuffer = Buffer.from(txn.hex, 'hex');
                const bitcoreTransaction = BitcoinClient.createBitcoreTransactionWrapper(transactionBuffer, block.confirmations, hash);
                return BitcoinClient.createBitcoinTransactionModel(bitcoreTransaction);
            });
            return {
                hash: block.hash,
                height: block.height,
                previousHash: block.previousblockhash,
                transactions: transactionModels
            };
        });
    }
    /**
     * Gets the block hash for a given block height.
     * @param height The height to get a hash for
     * @returns the block hash
     */
    getBlockHash(height) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Getting hash for block ${height}`);
            const hashRequest = {
                method: 'getblockhash',
                params: [
                    height // height of the block
                ]
            };
            const isWalletRpc = false;
            return this.rpcCall(hashRequest, true, isWalletRpc);
        });
    }
    /**
     * Gets the block info for the given block height.
     * @param height The height of the block
     * @returns the block info.
     */
    getBlockInfoFromHeight(height) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getBlockInfo(yield this.getBlockHash(height));
        });
    }
    /**
     * Gets the block info for the given block hash.
     * @param hash The hash of the block
     * @returns the block info.
     */
    getBlockInfo(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'getblockheader',
                params: [
                    hash,
                    true // verbose
                ]
            };
            const isWalletRpc = false;
            const response = yield this.rpcCall(request, true, isWalletRpc);
            return {
                hash: hash,
                height: response.height,
                previousHash: response.previousblockhash
            };
        });
    }
    /**
     * Gets the current Bitcoin block height
     * @returns the latest block number
     */
    getCurrentBlockHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info('Getting current block height...');
            const request = {
                method: 'getblockcount'
            };
            const isWalletRpc = false;
            const response = yield this.rpcCall(request, true, isWalletRpc);
            return response;
        });
    }
    /**
     * Gets all unspent coins of the wallet which is being watched.
     * @returns the balance of the wallet
     */
    getBalanceInSatoshis() {
        return __awaiter(this, void 0, void 0, function* () {
            const unspentOutputs = yield this.getUnspentOutputs(this.bitcoinWallet.getAddress());
            const unspentSatoshis = unspentOutputs.reduce((total, unspentOutput) => {
                return total + unspentOutput.satoshis;
            }, 0);
            return unspentSatoshis;
        });
    }
    /**
     * Gets the transaction fee of a transaction in satoshis.
     * @param transactionId the id of the target transaction.
     * @returns the transaction fee in satoshis.
     */
    getTransactionFeeInSatoshis(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield this.getRawTransaction(transactionId);
            let inputSatoshiSum = 0;
            for (let i = 0; i < transaction.inputs.length; i++) {
                const currentInput = transaction.inputs[i];
                const transactionOutValue = yield this.getTransactionOutValueInSatoshi(currentInput.previousTransactionId, currentInput.outputIndexInPreviousTransaction);
                inputSatoshiSum += transactionOutValue;
            }
            // transaction outputs in satoshis
            const transactionOutputs = transaction.outputs.map((output) => output.satoshis);
            const outputSatoshiSum = transactionOutputs.reduce((sum, value) => sum + value, 0);
            return (inputSatoshiSum - outputSatoshiSum);
        });
    }
    addWatchOnlyAddressToWallet(publicKeyAsHex, rescan) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'importpubkey',
                params: [
                    publicKeyAsHex,
                    'sidetree',
                    rescan
                ]
            };
            const isWalletRpc = true;
            yield this.rpcCall(request, false, isWalletRpc);
        });
    }
    broadcastTransactionRpc(rawTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'sendrawtransaction',
                params: [
                    rawTransaction
                ]
            };
            const isWalletRpc = false;
            return this.rpcCall(request, true, isWalletRpc);
        });
    }
    isAddressAddedToWallet(address) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Checking if bitcoin wallet for ${address} exists`);
            const request = {
                method: 'getaddressinfo',
                params: [
                    address
                ]
            };
            const isWalletRpc = true;
            const response = yield this.rpcCall(request, true, isWalletRpc);
            return response.labels.length > 0 || response.iswatchonly;
        });
    }
    getCurrentEstimatedFeeInSatoshisPerKB() {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'estimatesmartfee',
                params: [
                    1 // Number of confirmation targets
                ]
            };
            const isWalletRpc = false;
            const response = yield this.rpcCall(request, true, isWalletRpc);
            if (!response.feerate ||
                (response.errors && response.errors.length > 0)) {
                const error = response.errors ? JSON.stringify(response.errors) : `Feerate is undefined`;
                throw new Error(`Fee rate could not be estimated. Error: ${error}`);
            }
            const feerateInBtc = response.feerate;
            return BitcoinClient.convertBtcToSatoshis(feerateInBtc);
        });
    }
    /** Get the current estimated fee from RPC and update stored estimate */
    updateEstimatedFeeInSatoshisPerKB() {
        return __awaiter(this, void 0, void 0, function* () {
            let estimatedFeeSatoshiPerKB;
            try {
                estimatedFeeSatoshiPerKB = yield this.getCurrentEstimatedFeeInSatoshisPerKB();
                this.estimatedFeeSatoshiPerKB = estimatedFeeSatoshiPerKB;
            }
            catch (error) {
                estimatedFeeSatoshiPerKB = this.estimatedFeeSatoshiPerKB;
                if (!estimatedFeeSatoshiPerKB) {
                    throw error;
                }
            }
            return estimatedFeeSatoshiPerKB;
        });
    }
    /** Get the transaction out value in satoshi, for a specified output index */
    getTransactionOutValueInSatoshi(transactionId, outputIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield this.getRawTransaction(transactionId);
            // output with the desired index
            const vout = transaction.outputs[outputIndex];
            return vout.satoshis;
        });
    }
    /**
     * Get the raw transaction data.
     * @param transactionId The target transaction id.
     */
    getRawTransaction(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const bitcoreTransaction = yield this.getRawTransactionRpc(transactionId);
            return BitcoinClient.createBitcoinTransactionModel(bitcoreTransaction);
        });
    }
    /**
     * Convert a block to bitcoin transaction models
     * @param block The block to convert
     */
    static convertToBitcoinTransactionModels(block) {
        const transactionModels = block.transactions.map((transaction) => {
            const bitcoreTransaction = {
                id: transaction.id,
                blockHash: block.hash,
                confirmations: 1,
                inputs: transaction.inputs,
                outputs: transaction.outputs
            };
            return BitcoinClient.createBitcoinTransactionModel(bitcoreTransaction);
        });
        return transactionModels;
    }
    getRawTransactionRpc(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'getrawtransaction',
                params: [
                    transactionId,
                    true // verbose output
                ]
            };
            const isWalletRpc = false;
            const rawTransactionData = yield this.rpcCall(request, true, isWalletRpc);
            const hexEncodedTransaction = rawTransactionData.hex;
            const transactionBuffer = Buffer.from(hexEncodedTransaction, 'hex');
            // The confirmations and the blockhash parameters can both be undefined if the transaction is not yet
            // written to the blockchain. In that case, just pass in 0 for the confirmations. With the confirmations
            // being 0, the blockhash can be understood to be undefined.
            const confirmations = rawTransactionData.confirmations ? rawTransactionData.confirmations : 0;
            return BitcoinClient.createBitcoreTransactionWrapper(transactionBuffer, confirmations, rawTransactionData.blockhash);
        });
    }
    // This function is specifically created to help with unit testing.
    static createTransactionFromBuffer(buffer) {
        return new bitcore_lib_1.Transaction(buffer);
    }
    static createBitcoreTransactionWrapper(buffer, confirmations, blockHash) {
        const transaction = BitcoinClient.createTransactionFromBuffer(buffer);
        return {
            id: transaction.id,
            blockHash: blockHash,
            confirmations: confirmations,
            inputs: transaction.inputs,
            outputs: transaction.outputs
        };
    }
    createTransaction(transactionData, minFeeInSatoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            const walletAddress = this.bitcoinWallet.getAddress();
            const unspentOutputs = yield this.getUnspentOutputs(walletAddress);
            const transaction = new bitcore_lib_1.Transaction();
            transaction.from(unspentOutputs);
            transaction.addOutput(new bitcore_lib_1.Transaction.Output({
                script: bitcore_lib_1.Script.buildDataOut(transactionData),
                satoshis: 0
            }));
            transaction.change(walletAddress);
            const estimatedFeeInSatoshis = yield this.calculateTransactionFee(transaction);
            // choose the max between bitcoin estimated fee or passed in min fee to pay
            let feeToPay = Math.max(minFeeInSatoshis, estimatedFeeInSatoshis);
            // mark up the fee by specified percentage
            feeToPay += (feeToPay * this.sidetreeTransactionFeeMarkupPercentage / 100);
            // round up to the nearest integer because satoshis don't have floating points
            feeToPay = Math.ceil(feeToPay);
            transaction.fee(feeToPay);
            return transaction;
        });
    }
    /**
     * Calculates an estimated fee for the given transaction. All the inputs and outputs MUST
     * be already set to get the estimate more accurate.
     *
     * @param transaction The transaction for which the fee is to be calculated.
     * @returns the transaction fee in satoshis.
     */
    calculateTransactionFee(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get estimated fee from RPC
            const estimatedFeePerKB = yield this.updateEstimatedFeeInSatoshisPerKB();
            // Estimate the size of the transaction
            const estimatedSizeInBytes = (transaction.inputs.length * 150) + (transaction.outputs.length * 50);
            const estimatedSizeInKB = estimatedSizeInBytes / 1000;
            const estimatedFee = estimatedSizeInKB * estimatedFeePerKB;
            // Add a percentage to the fee (trying to be on the higher end of the estimate)
            const estimatedFeeWithPercentage = estimatedFee * 1.4;
            // Make sure that there are no decimals in the fee as it is not supported
            return Math.ceil(estimatedFeeWithPercentage);
        });
    }
    createFreezeTransaction(unspentCoins, freezeDurationInBlocks, freezeAmountInSatoshis) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Creating a freeze transaction for amount: ${freezeAmountInSatoshis} satoshis with freeze time in blocks: ${freezeDurationInBlocks}`);
            const walletAddress = this.bitcoinWallet.getAddress();
            const freezeScript = BitcoinClient.createFreezeScript(freezeDurationInBlocks, walletAddress);
            const payToScriptHashOutput = bitcore_lib_1.Script.buildScriptHashOut(freezeScript);
            const payToScriptAddress = new bitcore_lib_1.Address(payToScriptHashOutput);
            const freezeTransaction = new bitcore_lib_1.Transaction()
                .from(unspentCoins)
                .to(payToScriptAddress, freezeAmountInSatoshis)
                .change(walletAddress);
            const transactionFee = yield this.calculateTransactionFee(freezeTransaction);
            freezeTransaction.fee(transactionFee);
            const payToScriptAddressString = payToScriptAddress.toString();
            Logger_1.default.info(`Created freeze transaction and locked BTC at new script address '${payToScriptAddressString}' with fee of ${transactionFee}.`);
            return [freezeTransaction, freezeScript];
        });
    }
    createSpendToFreezeTransaction(previousFreezeTransaction, previousFreezeDurationInBlocks, newFreezeDurationInBlocks) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line max-len
            Logger_1.default.info(`Creating a freeze transaction with freeze time of ${newFreezeDurationInBlocks} blocks, from previously frozen transaction with id: ${previousFreezeTransaction.id}`);
            const freezeScript = BitcoinClient.createFreezeScript(newFreezeDurationInBlocks, this.bitcoinWallet.getAddress());
            const payToScriptHashOutput = bitcore_lib_1.Script.buildScriptHashOut(freezeScript);
            const payToScriptAddress = new bitcore_lib_1.Address(payToScriptHashOutput);
            // We are creating a spend transaction and are paying to another freeze script.
            // So essentially we are re-freezing ...
            const reFreezeTransaction = yield this.createSpendTransactionFromFrozenTransaction(previousFreezeTransaction, previousFreezeDurationInBlocks, payToScriptAddress);
            const payToScriptAddressString = payToScriptAddress.toString();
            Logger_1.default.info(`Created refreeze transaction and locked BTC at new script address '${payToScriptAddressString}'.`);
            return [reFreezeTransaction, freezeScript];
        });
    }
    createSpendToWalletTransaction(previousFreezeTransaction, previousFreezeDurationInBlocks) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line max-len
            Logger_1.default.info(`Creating a transaction to return (to the wallet) the previously frozen amount from transaction with id: ${previousFreezeTransaction.id} which was frozen for block duration: ${previousFreezeDurationInBlocks}`);
            return this.createSpendTransactionFromFrozenTransaction(previousFreezeTransaction, previousFreezeDurationInBlocks, this.bitcoinWallet.getAddress());
        });
    }
    /**
     * Creates a spend transaction to spend the previously frozen output. The details
     * on how to create a spend transactions were taken from the BIP65 demo at:
     * https://github.com/mruddy/bip65-demos/blob/master/freeze.js.
     *
     * @param previousFreezeTransaction The previously frozen transaction.
     * @param previousFreezeDurationInBlocks The previously frozen transaction's freeze time in blocks.
     * @param paytoAddress The address where the spend transaction should go to.
     */
    createSpendTransactionFromFrozenTransaction(previousFreezeTransaction, previousFreezeDurationInBlocks, paytoAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            // First create an input from the previous frozen transaction output. Note that we update
            // this input later to add the relevant information required for a pay-to-script-hash output.
            const frozenOutputAsInput = this.createUnspentOutputFromFrozenTransaction(previousFreezeTransaction, previousFreezeDurationInBlocks);
            const previousFreezeAmountInSatoshis = frozenOutputAsInput.satoshis;
            // Now create a spend transaction using the frozen output. Create the transaction with all
            // inputs and outputs as they are needed to calculate the fee.
            const spendTransaction = new bitcore_lib_1.Transaction()
                .from([frozenOutputAsInput])
                .to(paytoAddress, previousFreezeAmountInSatoshis);
            // The check-sequence-verify lock requires transaction version 2
            spendTransaction.version = 2;
            // When spending from freeze, we need to set the sequence number of the input correctly.
            // See the bitcoin documentation on relative-lock and the sequence number for more info:
            //   relative lock: https://github.com/bitcoin/bips/blob/master/bip-0112.mediawiki
            //   sequence number: https://github.com/bitcoin/bips/blob/master/bip-0068.mediawiki
            spendTransaction.inputs[0].sequenceNumber = previousFreezeDurationInBlocks;
            const transactionFee = yield this.calculateTransactionFee(spendTransaction);
            // We need to set the transaction fee and subtract that fee from the freeze amount.
            // We cannot just update the existing output (it's readonly), so we need to first remove it,
            // and add another one with the correct amount.
            spendTransaction.outputs.shift();
            spendTransaction.to(paytoAddress, previousFreezeAmountInSatoshis - transactionFee)
                .fee(transactionFee);
            return spendTransaction;
        });
    }
    createUnspentOutputFromFrozenTransaction(previousFreezeTransaction, previousfreezeDurationInBlocks) {
        const previousFreezeAmountInSatoshis = previousFreezeTransaction.outputs[0].satoshis;
        const previousFreezeRedeemScript = BitcoinClient.createFreezeScript(previousfreezeDurationInBlocks, this.bitcoinWallet.getAddress());
        const scriptPubKey = bitcore_lib_1.Script.buildScriptHashOut(previousFreezeRedeemScript);
        // This output mimics the transaction output and that is why it has inputs such as
        // txid, vout, scriptPubKey etc ...
        const frozenOutputAsUnspentOutput = bitcore_lib_1.Transaction.UnspentOutput.fromObject({
            txid: previousFreezeTransaction.id,
            vout: 0,
            scriptPubKey: scriptPubKey,
            satoshis: previousFreezeAmountInSatoshis
        });
        return frozenOutputAsUnspentOutput;
    }
    static createFreezeScript(freezeDurationInBlocks, walletAddress) {
        const lockBuffer = bitcore_lib_1.crypto.BN.fromNumber(freezeDurationInBlocks).toScriptNumBuffer();
        const publicKeyHashOut = bitcore_lib_1.Script.buildPublicKeyHashOut(walletAddress);
        const redeemScript = bitcore_lib_1.Script.empty()
            .add(lockBuffer)
            .add(178) // OP_CSV (https://github.com/bitcoin/bips/blob/master/bip-0112.mediawiki)
            .add(117) // OP_DROP
            .add(publicKeyHashOut);
        return redeemScript;
    }
    static serializeSignedTransaction(signedTransaction) {
        // The signed transaction is returned by the IBitcoinWallet implementation and could be created via serialized hex
        // input. In that case, the bitcore-lib Transaction does not distinguish the inputs and serialization fails with an
        // "unsigned-inputs" failure. So for serialization, we will pass in special options to disable those checks.
        return signedTransaction.serialize({ disableAll: true });
    }
    static createBitcoinInputModel(bitcoreInput) {
        return {
            previousTransactionId: bitcoreInput.prevTxId.toString('hex'),
            outputIndexInPreviousTransaction: bitcoreInput.outputIndex,
            scriptAsmAsString: bitcoreInput.script ? bitcoreInput.script.toASM() : ''
        };
    }
    static createBitcoinOutputModel(bitcoreOutput) {
        return {
            satoshis: bitcoreOutput.satoshis,
            // Some transaction outputs do not have a script, such as coinbase transactions.
            scriptAsmAsString: bitcoreOutput.script ? bitcoreOutput.script.toASM() : ''
        };
    }
    /**
     * create internal bitcoin transaction model from bitcore transaction model
     * @param transactionWrapper the bitcore transaction model wrapper
     */
    static createBitcoinTransactionModel(transactionWrapper) {
        const bitcoinInputs = transactionWrapper.inputs.map((input) => { return BitcoinClient.createBitcoinInputModel(input); });
        const bitcoinOutputs = transactionWrapper.outputs.map((output) => { return BitcoinClient.createBitcoinOutputModel(output); });
        return {
            inputs: bitcoinInputs,
            outputs: bitcoinOutputs,
            id: transactionWrapper.id,
            blockHash: transactionWrapper.blockHash,
            confirmations: transactionWrapper.confirmations
        };
    }
    getUnspentOutputs(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const addressToSearch = address.toString();
            Logger_1.default.info(`Getting unspent coins for ${addressToSearch}`);
            // We are setting minimum required confirmations when fetching unspent transactions to 0
            // so that transaction(s) waiting to be confirmed are included. This allows:
            // 1. Accurate calculation of wallet balance (otherwise no transaction returned by the `listunspent` call yields balance of 0).
            // 2. Both lock monitor and core to write a transaction using the UTXO in the unconfirmed transaction generated by each other.
            const request = {
                method: 'listunspent',
                params: [
                    0,
                    null,
                    [addressToSearch]
                ]
            };
            const isWalletRpc = true;
            const response = yield this.rpcCall(request, true, isWalletRpc);
            const unspentTransactions = response.map((coin) => {
                return new bitcore_lib_1.Transaction.UnspentOutput(coin);
            });
            Logger_1.default.info(`Returning ${unspentTransactions.length} coins`);
            return unspentTransactions;
        });
    }
    /**
     *
     * @param request The request for the RPC call
     * @param timeout Should timeout or not
     * @param isWalletRpc Must set to `true` if the RPC is wallet-specific; `false` otherwise.
     */
    rpcCall(request, timeout, isWalletRpc) {
        return __awaiter(this, void 0, void 0, function* () {
            // Append some standard RPC parameters.
            request.jsonrpc = '1.0';
            request.id = Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(32);
            const requestString = JSON.stringify(request);
            Logger_1.default.info(`Sending RPC request: ${requestString}`);
            const requestOptions = {
                body: requestString,
                method: 'post'
            };
            if (this.bitcoinAuthorization) {
                requestOptions.headers = {
                    Authorization: `Basic ${this.bitcoinAuthorization}`
                };
            }
            // Specify the wallet to use if it is a wallet rpc call
            // List of rpc calls categorized by type: https://developer.bitcoin.org/reference/rpc/
            const rpcUrl = isWalletRpc ? `${this.bitcoinPeerUri}/wallet/${this.walletNameToUse}` : this.bitcoinPeerUri;
            const bodyBuffer = yield this.fetchWithRetry(rpcUrl, requestOptions, timeout);
            const responseJson = JSON.parse(bodyBuffer.toString());
            if ('error' in responseJson && responseJson.error !== null) {
                const error = new Error(`RPC failed: ${JSON.stringify(responseJson.error)}`);
                Logger_1.default.error(error);
                throw error;
            }
            return responseJson.result;
        });
    }
    /**
     * Calls `nodeFetch` and retries upon request time-out or HTTP 502/503/504 codes.
     * @param uri URI to fetch
     * @param requestParameters Request parameters to use
     * @param enableTimeout Set to `true` to have request timeout with exponential increase on timeout in subsequent retries.
     *                      Set to `false` to wait indefinitely for response (used for long running request such as importing a wallet).
     * @returns Buffer of the response body.
     */
    fetchWithRetry(uri, requestParameters, enableTimeout) {
        return __awaiter(this, void 0, void 0, function* () {
            let retryCount = 0;
            let networkError;
            let requestTimeout = enableTimeout ? this.requestTimeout : 0; // 0 = disabling timeout.
            do {
                // If we are retrying (not initial attempt).
                if (networkError !== undefined) {
                    retryCount++;
                    // Double the request timeout. NOTE: if timeout is disabled, then `requestTimeout` will always be 0;
                    requestTimeout *= 2;
                    Logger_1.default.info(`Retrying attempt count: ${retryCount} with request timeout of ${requestTimeout} ms...`);
                }
                let response;
                try {
                    // Clone the request parameters passed in, then set timeout value if needed.
                    const params = Object.assign({}, requestParameters);
                    params.timeout = requestTimeout;
                    response = yield node_fetch_1.default(uri, params);
                }
                catch (error) {
                    // Retry-able if request is timed out.
                    if (error instanceof node_fetch_1.FetchError && error.type === 'request-timeout') {
                        networkError = error;
                        Logger_1.default.info(`Attempt ${retryCount} timed-out.`);
                        continue;
                    }
                    throw error;
                }
                const bodyBuffer = yield ReadableStream_1.default.readAll(response.body);
                if (response.status === httpStatus.OK) {
                    return bodyBuffer;
                }
                else {
                    networkError = new SidetreeError_1.default(ErrorCode_1.default.BitcoinClientFetchHttpCodeWithNetworkIssue, `Network issue with HTTP response: [${response.status}]: ${bodyBuffer}`);
                    // Retry-able if one of these HTTP codes.
                    if (response.status === httpStatus.BAD_GATEWAY ||
                        response.status === httpStatus.GATEWAY_TIMEOUT ||
                        response.status === httpStatus.SERVICE_UNAVAILABLE) {
                        Logger_1.default.info(`Attempt ${retryCount} resulted in ${response.status}`);
                        continue;
                    }
                    // All other error code, not connectivity related issue, fail straight away.
                    throw new SidetreeError_1.default(ErrorCode_1.default.BitcoinClientFetchUnexpectedError, `Unexpected fetch HTTP response: [${response.status}]: ${bodyBuffer}`);
                }
                // Else we can retry
            } while (retryCount < this.requestMaxRetries);
            Logger_1.default.info('Max retries reached without success.');
            throw networkError;
        });
    }
}
exports.default = BitcoinClient;
//# sourceMappingURL=BitcoinClient.js.map