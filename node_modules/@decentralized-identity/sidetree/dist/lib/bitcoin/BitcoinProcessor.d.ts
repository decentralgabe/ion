import { ISidetreeEventEmitter, ISidetreeLogger } from '..';
import BitcoinVersionModel from './models/BitcoinVersionModel';
import IBitcoinConfig from './IBitcoinConfig';
import Monitor from './Monitor';
import ServiceVersionModel from '../common/models/ServiceVersionModel';
import TransactionFeeModel from '../common/models/TransactionFeeModel';
import TransactionModel from '../common/models/TransactionModel';
import ValueTimeLockModel from '../common/models/ValueTimeLockModel';
/**
 * Object representing a blockchain time and hash
 */
export interface IBlockchainTime {
    /** The logical blockchain time */
    time: number;
    /** The hash associated with the blockchain time */
    hash: string;
}
/**
 * Data structure containing block height and hash.
 */
export interface IBlockInfo {
    /** Block height. */
    height: number;
    /** Block hash. */
    hash: string;
    /** Previous block hash. */
    previousHash: string;
}
/**
 * Processor for Bitcoin REST API calls
 */
export default class BitcoinProcessor {
    private config;
    /** The first Sidetree block in Bitcoin's blockchain. */
    readonly genesisBlockNumber: number;
    /** Monitor of the running Bitcoin service. */
    monitor: Monitor;
    /** Store for the state of sidetree transactions. */
    private readonly transactionStore;
    private versionManager;
    /** Last seen block */
    private lastProcessedBlock;
    /** Poll timeout identifier */
    private pollTimeoutId;
    private serviceInfoProvider;
    private bitcoinClient;
    private spendingMonitor;
    private serviceStateStore;
    private blockMetadataStore;
    private mongoDbLockTransactionStore;
    private lockResolver;
    private lockMonitor;
    private sidetreeTransactionParser;
    /** at least 100 blocks per page unless reaching the last block */
    private static readonly pageSizeInBlocks;
    constructor(config: IBitcoinConfig);
    /**
     * Initializes the Bitcoin processor
     */
    initialize(versionModels: BitcoinVersionModel[], customLogger?: ISidetreeLogger, customEventEmitter?: ISidetreeEventEmitter): Promise<void>;
    private upgradeDatabaseIfNeeded;
    /**
     * A faster version of process transactions that requires access to bitcoin data directory.
     * @param startingBlock The starting block which we have not processed yet to begin processing.
     */
    private fastProcessTransactions;
    /**
     * Used only by fast initialization.
     * Parses given blocks to locate and store Sidetree transactions DB.
     * @param blocks Blocks that are not in any specific order.
     * @param notYetValidatedBlocks A map of all blocks that have not been confirmed to be part of the blockchain, where the block hash is the key.
     * @param startingBlockHeight The height of the starting block that we have not yet processed.
     * @param heightOfEarliestKnownValidBlock
     */
    private processBlocks;
    /**
     * Find all hashes in the notYetValidatedBlocks that are actually valid,
     * add them to the validated list and delete them from the map.
     */
    private findEarliestValidBlockAndAddToValidBlocks;
    private removeTransactionsInInvalidBlocks;
    /**
     * Iterate through all the outputs in the first transaction (coinbase) and add up all the satoshis
     * then minus the block reward to get the total transaction fee.
     * @param block The block to get the fee for
     */
    private static getBitcoinBlockTotalFee;
    /**
     * Given the block height, return the block reward
     */
    private static getBitcoinBlockReward;
    /**
     * Iterates through the transactions within the given block and process the sidetree transactions
     * @param block the block to process
     */
    private processSidetreeTransactionsInBlock;
    /**
     * Gets the blockchain time of the given time hash.
     * Gets the latest logical blockchain time if time hash is not given.
     * @param hash Blockchain time hash.
     * @returns the current or associated blockchain time of the given time hash.
     */
    time(hash?: string): Promise<IBlockchainTime>;
    /**
     * Fetches Sidetree transactions in chronological order from since or genesis.
     * @param since A transaction number
     * @param hash The associated transaction time hash
     * @returns Transactions in complete blocks since given transaction number, with normalizedFee.
     */
    transactions(since?: number, hash?: string): Promise<{
        moreTransactions: boolean;
        transactions: TransactionModel[];
    }>;
    /**
     * Given a list block metadata, returns the first in the list that has a valid hash,
     * returns `undefined` if a valid block is not found.
     */
    firstValidBlock(blocks: IBlockInfo[]): Promise<IBlockInfo | undefined>;
    /**
     * Given an ordered list of Sidetree transactions, returns the first transaction in the list that is valid.
     * @param transactions List of transactions to check
     * @returns The first valid transaction, or undefined if none are valid
     */
    firstValidTransaction(transactions: TransactionModel[]): Promise<TransactionModel | undefined>;
    /**
     * Writes a Sidetree transaction to the underlying Bitcoin's blockchain.
     * @param anchorString The string to be written as part of the transaction.
     * @param minimumFee The minimum fee to be paid for this transaction.
     */
    writeTransaction(anchorString: string, minimumFee: number): Promise<void>;
    /**
     * Modifies the given array and update the normalized fees, then write to block metadata store.
     * @param blocks the ordered block metadata to set the normalized fee for.
     */
    private writeBlocksToMetadataStoreWithFee;
    /**
     * Calculate and return proof-of-fee value for a particular block.
     * @param block The block height to get normalized fee for
     */
    getNormalizedFee(block: number | string): Promise<TransactionFeeModel>;
    /**
     * Handles the get version operation.
     */
    getServiceVersion(): Promise<ServiceVersionModel>;
    /**
     * Gets the lock information for the specified identifier (if specified); if nothing is passed in then
     * it returns the current lock information (if one exist).
     *
     * @param lockIdentifier The identifier of the lock to look up.
     */
    getValueTimeLock(lockIdentifier: string): Promise<ValueTimeLockModel>;
    /**
     * Gets the lock information which is currently held by this node. It throws an RequestError if none exist.
     */
    getActiveValueTimeLockForThisNode(): Promise<ValueTimeLockModel>;
    /**
     * Generates a private key for the Bitcoin testnet.
     */
    static generatePrivateKeyForTestnet(): string;
    /**
     * Will process transactions every interval seconds.
     * @param interval Number of seconds between each query
     */
    private periodicPoll;
    /**
     * Processes transactions from startBlock (or genesis) to the current blockchain height.
     * @param startBlock The block to begin from (inclusive)
     */
    private processTransactions;
    /**
     * Gets the starting block (first block in chronological order) which we have not processed yet.
     */
    private getStartingBlockForPeriodicPoll;
    /**
     * Begins to revert databases until consistent with blockchain.
     * @returns A known valid block before the fork. `undefined` if no known valid block can be found.
     */
    private revertDatabases;
    /**
     * Trims entries in the system DBs to the given a block height.
     * Trims all entries if no block height is given.
     * @param blockHeight The exclusive block height to perform DB trimming on.
     */
    private trimDatabasesToBlock;
    /**
     * Given a Bitcoin block height and hash, verifies against the blockchain
     * @param height Block height to verify
     * @param hash Block hash to verify
     * @returns true if valid, false otherwise
     */
    private verifyBlock;
    /**
     * Given a Bitcoin block height, processes that block for Sidetree transactions
     * @param blockHeight Height of block to process
     * @param previousBlockHash Block hash of the previous block
     * @returns the metadata of block processed
     */
    private processBlock;
    private getSidetreeTransactionModelIfExist;
    /**
     * Return transactions since transaction number and the last block seen
     * (Will get at least 1 full block worth of data unless there is no transaction to return)
     * @param since Transaction number to query since
     * @param maxBlockHeight The last block height to consider included in transactions
     * @returns a tuple of [transactions, lastBlockSeen]
     */
    private getTransactionsSince;
}
