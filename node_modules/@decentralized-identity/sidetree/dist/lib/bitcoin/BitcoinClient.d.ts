import { Block } from 'bitcore-lib';
import BitcoinBlockModel from './models/BitcoinBlockModel';
import BitcoinLockTransactionModel from './models/BitcoinLockTransactionModel';
import BitcoinSidetreeTransactionModel from './models/BitcoinSidetreeTransactionModel';
import BitcoinTransactionModel from './models/BitcoinTransactionModel';
import IBitcoinWallet from './interfaces/IBitcoinWallet';
import { IBlockInfo } from './BitcoinProcessor';
/**
 * Encapsulates functionality for reading/writing to the bitcoin ledger.
 */
export default class BitcoinClient {
    private bitcoinPeerUri;
    readonly requestTimeout: number;
    readonly requestMaxRetries: number;
    private sidetreeTransactionFeeMarkupPercentage;
    private estimatedFeeSatoshiPerKB?;
    /** Bitcoin peer's RPC basic authorization credentials */
    private readonly bitcoinAuthorization?;
    private readonly bitcoinWallet;
    /** The wallet name that is created, loaded and used */
    private walletNameToUse;
    constructor(bitcoinPeerUri: string, bitcoinRpcUsername: string | undefined, bitcoinRpcPassword: string | undefined, bitcoinWalletOrImportString: IBitcoinWallet | string, requestTimeout: number, requestMaxRetries: number, sidetreeTransactionFeeMarkupPercentage: number, estimatedFeeSatoshiPerKB?: number | undefined);
    /**
     * Initialize this bitcoin client.
     */
    initialize(): Promise<void>;
    /**
     * Periodically polls Bitcoin Core status until it is ready.
     * @param pollingWindowInSeconds Time to wait between each status check. Mainly used for speeding up unit tests.
     */
    private waitUntilBitcoinCoreIsReady;
    /**
     * Initializes Bitcoin Core wallet required by the service.
     * NOTE: We only use the Bitcoin Core wallet for read/monitoring purposes. `this.bitcoinWallet` is the abstraction for writes/spends.
     * There is an opportunity here to disambiguate the two "wallets" by perhaps annotating the variables and interface with "WatchOnly/Spending".
     */
    private initializeBitcoinCore;
    /**
     * generates a private key in WIF format
     * @param network Which bitcoin network to generate this key for
     */
    static generatePrivateKey(network: 'mainnet' | 'livenet' | 'testnet' | undefined): string;
    /**
     * Converts the amount from BTC to satoshis.
     * @param amountInBtc The amount in BTC
     */
    static convertBtcToSatoshis(amountInBtc: number): number;
    /**
     * Broadcasts the specified data transaction.
     * @param bitcoinSidetreeTransaction The transaction object.
     */
    broadcastSidetreeTransaction(bitcoinSidetreeTransaction: BitcoinSidetreeTransactionModel): Promise<string>;
    /**
     * Broadcasts the specified lock transaction.
     *
     * @param bitcoinLockTransaction The transaction object.
     */
    broadcastLockTransaction(bitcoinLockTransaction: BitcoinLockTransactionModel): Promise<string>;
    /**
     * Creates (and NOT broadcasts) a transaction to write data to the bitcoin.
     *
     * @param transactionData The data to write in the transaction.
     * @param minimumFeeInSatoshis The minimum fee for the transaction in satoshis.
     */
    createSidetreeTransaction(transactionData: string, minimumFeeInSatoshis: number): Promise<BitcoinSidetreeTransactionModel>;
    /**
     * Creates (and NOT broadcasts) a lock transaction using the funds from the linked wallet.
     *
     * NOTE: if the linked wallet outputs are spent then this transaction cannot be broadcasted. So broadcast
     * this transaction before spending from the wallet.
     *
     * @param lockAmountInSatoshis The amount to lock.
     * @param lockDurationInBlocks  The number of blocks to lock the amount for; the amount becomes spendable AFTER this many blocks.
     */
    createLockTransaction(lockAmountInSatoshis: number, lockDurationInBlocks: number): Promise<BitcoinLockTransactionModel>;
    /**
     * Creates (and NOT broadcasts) a lock transaction using the funds from the previously locked transaction.
     *
     * @param existingLockTransactionId The existing transaction with locked output.
     * @param existingLockDurationInBlocks The duration of the existing lock.
     * @param newLockDurationInBlocks The duration for the new lock.
     */
    createRelockTransaction(existingLockTransactionId: string, existingLockDurationInBlocks: number, newLockDurationInBlocks: number): Promise<BitcoinLockTransactionModel>;
    /**
     * Creates (and NOT broadcasts) a transaction which outputs the previously locked amount into the linked
     * wallet.
     *
     * @param existingLockTransactionId The existing transaction with locked amount.
     * @param existingLockDurationInBlocks The lock duration for the existing lock.
     */
    createReleaseLockTransaction(existingLockTransactionId: string, existingLockDurationInBlocks: number): Promise<BitcoinLockTransactionModel>;
    private createWallet;
    private loadWallet;
    /**
     * Gets the block data for the given block hash.
     * @param hash The hash of the block
     * @returns the block data.
     */
    getBlock(hash: string): Promise<BitcoinBlockModel>;
    /**
     * Gets the block hash for a given block height.
     * @param height The height to get a hash for
     * @returns the block hash
     */
    getBlockHash(height: number): Promise<string>;
    /**
     * Gets the block info for the given block height.
     * @param height The height of the block
     * @returns the block info.
     */
    getBlockInfoFromHeight(height: number): Promise<IBlockInfo>;
    /**
     * Gets the block info for the given block hash.
     * @param hash The hash of the block
     * @returns the block info.
     */
    getBlockInfo(hash: string): Promise<IBlockInfo>;
    /**
     * Gets the current Bitcoin block height
     * @returns the latest block number
     */
    getCurrentBlockHeight(): Promise<number>;
    /**
     * Gets all unspent coins of the wallet which is being watched.
     * @returns the balance of the wallet
     */
    getBalanceInSatoshis(): Promise<number>;
    /**
     * Gets the transaction fee of a transaction in satoshis.
     * @param transactionId the id of the target transaction.
     * @returns the transaction fee in satoshis.
     */
    getTransactionFeeInSatoshis(transactionId: string): Promise<number>;
    private addWatchOnlyAddressToWallet;
    private broadcastTransactionRpc;
    private isAddressAddedToWallet;
    private getCurrentEstimatedFeeInSatoshisPerKB;
    /** Get the current estimated fee from RPC and update stored estimate */
    private updateEstimatedFeeInSatoshisPerKB;
    /** Get the transaction out value in satoshi, for a specified output index */
    private getTransactionOutValueInSatoshi;
    /**
     * Get the raw transaction data.
     * @param transactionId The target transaction id.
     */
    getRawTransaction(transactionId: string): Promise<BitcoinTransactionModel>;
    /**
     * Convert a block to bitcoin transaction models
     * @param block The block to convert
     */
    static convertToBitcoinTransactionModels(block: Block): BitcoinTransactionModel[];
    private getRawTransactionRpc;
    private static createTransactionFromBuffer;
    private static createBitcoreTransactionWrapper;
    private createTransaction;
    /**
     * Calculates an estimated fee for the given transaction. All the inputs and outputs MUST
     * be already set to get the estimate more accurate.
     *
     * @param transaction The transaction for which the fee is to be calculated.
     * @returns the transaction fee in satoshis.
     */
    private calculateTransactionFee;
    private createFreezeTransaction;
    private createSpendToFreezeTransaction;
    private createSpendToWalletTransaction;
    /**
     * Creates a spend transaction to spend the previously frozen output. The details
     * on how to create a spend transactions were taken from the BIP65 demo at:
     * https://github.com/mruddy/bip65-demos/blob/master/freeze.js.
     *
     * @param previousFreezeTransaction The previously frozen transaction.
     * @param previousFreezeDurationInBlocks The previously frozen transaction's freeze time in blocks.
     * @param paytoAddress The address where the spend transaction should go to.
     */
    private createSpendTransactionFromFrozenTransaction;
    private createUnspentOutputFromFrozenTransaction;
    private static createFreezeScript;
    private static serializeSignedTransaction;
    private static createBitcoinInputModel;
    private static createBitcoinOutputModel;
    /**
     * create internal bitcoin transaction model from bitcore transaction model
     * @param transactionWrapper the bitcore transaction model wrapper
     */
    private static createBitcoinTransactionModel;
    private getUnspentOutputs;
    /**
     *
     * @param request The request for the RPC call
     * @param timeout Should timeout or not
     * @param isWalletRpc Must set to `true` if the RPC is wallet-specific; `false` otherwise.
     */
    private rpcCall;
    /**
     * Calls `nodeFetch` and retries upon request time-out or HTTP 502/503/504 codes.
     * @param uri URI to fetch
     * @param requestParameters Request parameters to use
     * @param enableTimeout Set to `true` to have request timeout with exponential increase on timeout in subsequent retries.
     *                      Set to `false` to wait indefinitely for response (used for long running request such as importing a wallet).
     * @returns Buffer of the response body.
     */
    private fetchWithRetry;
}
