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
const semver = require("semver");
const timeSpan = require("time-span");
const BitcoinBlockDataIterator_1 = require("./BitcoinBlockDataIterator");
const BitcoinClient_1 = require("./BitcoinClient");
const ErrorCode_1 = require("./ErrorCode");
const EventCode_1 = require("./EventCode");
const EventEmitter_1 = require("../common/EventEmitter");
const LockMonitor_1 = require("./lock/LockMonitor");
const LockResolver_1 = require("./lock/LockResolver");
const LogColor_1 = require("../common/LogColor");
const Logger_1 = require("../common/Logger");
const MongoDbBlockMetadataStore_1 = require("./MongoDbBlockMetadataStore");
const MongoDbLockTransactionStore_1 = require("./lock/MongoDbLockTransactionStore");
const MongoDbServiceStateStore_1 = require("../common/MongoDbServiceStateStore");
const MongoDbTransactionStore_1 = require("../common/MongoDbTransactionStore");
const Monitor_1 = require("./Monitor");
const RequestError_1 = require("./RequestError");
const ResponseStatus_1 = require("../common/enums/ResponseStatus");
const ServiceInfoProvider_1 = require("../common/ServiceInfoProvider");
const SharedErrorCode_1 = require("../common/SharedErrorCode");
const SidetreeError_1 = require("../common/SidetreeError");
const SidetreeTransactionParser_1 = require("./SidetreeTransactionParser");
const SpendingMonitor_1 = require("./SpendingMonitor");
const TransactionNumber_1 = require("./TransactionNumber");
const VersionManager_1 = require("./VersionManager");
/**
 * Processor for Bitcoin REST API calls
 */
class BitcoinProcessor {
    constructor(config) {
        this.config = config;
        this.versionManager = new VersionManager_1.default();
        this.genesisBlockNumber = config.genesisBlockNumber;
        this.serviceStateStore = new MongoDbServiceStateStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.blockMetadataStore = new MongoDbBlockMetadataStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.transactionStore = new MongoDbTransactionStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.spendingMonitor = new SpendingMonitor_1.default(config.bitcoinFeeSpendingCutoffPeriodInBlocks, BitcoinClient_1.default.convertBtcToSatoshis(config.bitcoinFeeSpendingCutoff), this.transactionStore);
        this.serviceInfoProvider = new ServiceInfoProvider_1.default('bitcoin');
        this.bitcoinClient =
            new BitcoinClient_1.default(config.bitcoinPeerUri, config.bitcoinRpcUsername, config.bitcoinRpcPassword, config.bitcoinWalletOrImportString, config.requestTimeoutInMilliseconds || 300, config.requestMaxRetries || 3, config.sidetreeTransactionFeeMarkupPercentage || 0, config.defaultTransactionFeeInSatoshisPerKB);
        this.sidetreeTransactionParser = new SidetreeTransactionParser_1.default(this.bitcoinClient, this.config.sidetreeTransactionPrefix);
        this.lockResolver =
            new LockResolver_1.default(this.versionManager, this.bitcoinClient);
        this.mongoDbLockTransactionStore = new MongoDbLockTransactionStore_1.default(config.mongoDbConnectionString, config.databaseName);
        // TODO: #988 Can potentially remove the default. If removed, the config will be required and more explicit but user can set bad values (0).
        // https://github.com/decentralized-identity/sidetree/issues/988
        const valueTimeLockTransactionFeesInBtc = config.valueTimeLockTransactionFeesAmountInBitcoins === undefined ? 0.25
            : config.valueTimeLockTransactionFeesAmountInBitcoins;
        this.lockMonitor = new LockMonitor_1.default(this.bitcoinClient, this.mongoDbLockTransactionStore, this.lockResolver, config.valueTimeLockPollPeriodInSeconds, config.valueTimeLockUpdateEnabled, BitcoinClient_1.default.convertBtcToSatoshis(config.valueTimeLockAmountInBitcoins), // Desired lock amount in satoshis
        BitcoinClient_1.default.convertBtcToSatoshis(valueTimeLockTransactionFeesInBtc), // Txn Fees amount in satoshis
        this.versionManager);
        this.monitor = new Monitor_1.default(this.bitcoinClient);
    }
    /**
     * Initializes the Bitcoin processor
     */
    initialize(versionModels, customLogger, customEventEmitter) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.initialize(customLogger);
            EventEmitter_1.default.initialize(customEventEmitter);
            yield this.bitcoinClient.initialize();
            yield this.versionManager.initialize(versionModels, this.config, this.blockMetadataStore);
            yield this.serviceStateStore.initialize();
            yield this.blockMetadataStore.initialize();
            yield this.transactionStore.initialize();
            yield this.mongoDbLockTransactionStore.initialize();
            yield this.upgradeDatabaseIfNeeded();
            // Only observe transactions if polling is enabled.
            if (this.config.transactionPollPeriodInSeconds > 0) {
                // Current implementation records processing progress at block increments using `this.lastProcessedBlock`,
                // so we need to trim the databases back to the last fully processed block.
                this.lastProcessedBlock = yield this.blockMetadataStore.getLast();
                const startingBlock = yield this.getStartingBlockForPeriodicPoll();
                if (startingBlock === undefined) {
                    Logger_1.default.info('Bitcoin processor state is ahead of Bitcoin Core, skipping initialization...');
                }
                else {
                    Logger_1.default.info('Synchronizing blocks for sidetree transactions...');
                    Logger_1.default.info(`Starting block: ${startingBlock.height} (${startingBlock.hash})`);
                    if (this.config.bitcoinDataDirectory) {
                        // This parses the raw block files directly to speed up the initial startup instead of using RPC calls.
                        yield this.fastProcessTransactions(startingBlock);
                    }
                    else {
                        yield this.processTransactions(startingBlock);
                    }
                }
                // Intentionally not await on the promise.
                this.periodicPoll();
            }
            else {
                Logger_1.default.warn(LogColor_1.default.yellow(`Transaction observer is disabled.`));
            }
            // NOTE: important to start lock monitor polling AFTER we have processed all the blocks above (for the case that this node is observing transactions),
            // this is because that the lock monitor depends on lock resolver, and lock resolver currently needs the normalized fee calculator,
            // even though lock monitor itself does not depend on normalized fee calculator.
            yield this.lockMonitor.startPeriodicProcessing();
        });
    }
    upgradeDatabaseIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            const expectedDbVersion = '1.1.0';
            const savedServiceState = yield this.serviceStateStore.get();
            const actualDbVersion = savedServiceState.databaseVersion;
            if (expectedDbVersion === actualDbVersion) {
                return;
            }
            // Throw if attempting to downgrade.
            if (actualDbVersion !== undefined && semver.lt(expectedDbVersion, actualDbVersion)) {
                Logger_1.default.error(LogColor_1.default.red(`Downgrading DB from version ${LogColor_1.default.green(actualDbVersion)} to  ${LogColor_1.default.green(expectedDbVersion)} is not allowed.`));
                throw new SidetreeError_1.default(ErrorCode_1.default.DatabaseDowngradeNotAllowed);
            }
            // Add DB upgrade code below.
            Logger_1.default.warn(LogColor_1.default.yellow(`Upgrading DB from version ${LogColor_1.default.green(actualDbVersion)} to ${LogColor_1.default.green(expectedDbVersion)}...`));
            // Current upgrade action is simply clearing/deleting existing DB such that initial sync can occur from genesis block.
            const timer = timeSpan();
            yield this.blockMetadataStore.clearCollection();
            yield this.transactionStore.clearCollection();
            yield this.serviceStateStore.put({ databaseVersion: expectedDbVersion });
            Logger_1.default.warn(LogColor_1.default.yellow(`DB upgraded in: ${LogColor_1.default.green(timer.rounded())} ms.`));
        });
    }
    /**
     * A faster version of process transactions that requires access to bitcoin data directory.
     * @param startingBlock The starting block which we have not processed yet to begin processing.
     */
    fastProcessTransactions(startingBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            const bitcoinBlockDataIterator = new BitcoinBlockDataIterator_1.default(this.config.bitcoinDataDirectory);
            const lastBlockHeight = yield this.bitcoinClient.getCurrentBlockHeight();
            const lastBlockInfo = yield this.bitcoinClient.getBlockInfoFromHeight(lastBlockHeight);
            // Use the model without normalized fee here because fast processing cannot derive normalized fee until all blocks are gathered.
            // a map of all blocks mapped with their hash being the key
            const notYetValidatedBlocks = new Map();
            // An array of blocks representing the validated chain reverse sorted by height
            const validatedBlocks = [];
            Logger_1.default.info(`Begin fast processing block ${startingBlock.height} to ${lastBlockHeight}`);
            // Loop through files backwards and process blocks from the end/tip of the blockchain until we reach the starting block given.
            let hashOfEarliestKnownValidBlock = lastBlockInfo.hash;
            let heightOfEarliestKnownValidBlock = lastBlockInfo.height;
            while (bitcoinBlockDataIterator.hasPrevious() && heightOfEarliestKnownValidBlock >= startingBlock.height) {
                const blocks = bitcoinBlockDataIterator.previous();
                yield this.processBlocks(blocks, notYetValidatedBlocks, startingBlock.height, heightOfEarliestKnownValidBlock);
                this.findEarliestValidBlockAndAddToValidBlocks(validatedBlocks, notYetValidatedBlocks, hashOfEarliestKnownValidBlock, startingBlock.height);
                if (validatedBlocks.length > 0) {
                    heightOfEarliestKnownValidBlock = validatedBlocks[validatedBlocks.length - 1].height - 1;
                    hashOfEarliestKnownValidBlock = validatedBlocks[validatedBlocks.length - 1].previousHash;
                }
            }
            // at this point, all the blocks in notYetValidatedBlocks are for sure not valid because we've filled the valid blocks with the ones we want
            yield this.removeTransactionsInInvalidBlocks(notYetValidatedBlocks);
            // Write the block metadata to DB.
            const timer = timeSpan(); // Start timer to measure time taken to write block metadata.
            // ValidatedBlocks are in descending order, this flips that and make it ascending by height for the purpose of normalized fee calculation
            const validatedBlocksOrderedByHeight = validatedBlocks.reverse();
            yield this.writeBlocksToMetadataStoreWithFee(validatedBlocksOrderedByHeight);
            Logger_1.default.info(`Inserted metadata of ${validatedBlocks.length} blocks to DB. Duration: ${timer.rounded()} ms.`);
            Logger_1.default.info('finished fast processing');
        });
    }
    /**
     * Used only by fast initialization.
     * Parses given blocks to locate and store Sidetree transactions DB.
     * @param blocks Blocks that are not in any specific order.
     * @param notYetValidatedBlocks A map of all blocks that have not been confirmed to be part of the blockchain, where the block hash is the key.
     * @param startingBlockHeight The height of the starting block that we have not yet processed.
     * @param heightOfEarliestKnownValidBlock
     */
    processBlocks(blocks, notYetValidatedBlocks, startingBlockHeight, heightOfEarliestKnownValidBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const block of blocks) {
                // The conditional check here is purely an optimization to avoid adding Sidetree transactions that we are for sure not interested in.
                // But even if we add all the Sidetree transactions in these blocks in DB, `removeTransactionsInInvalidBlocks()` would have clean them up.
                if (block.height >= startingBlockHeight && block.height <= heightOfEarliestKnownValidBlock) {
                    const blockMetadataWithoutFee = {
                        height: block.height,
                        hash: block.hash,
                        totalFee: BitcoinProcessor.getBitcoinBlockTotalFee(block),
                        transactionCount: block.transactions.length,
                        previousHash: block.previousHash
                    };
                    notYetValidatedBlocks.set(block.hash, blockMetadataWithoutFee);
                    // TODO: Issue #794 - https://github.com/decentralized-identity/sidetree/issues/794
                    // `processSidetreeTransactionsInBlock()` will store transactions to DB,
                    // but since we are processing from tail of the detached, an crash or an error thrown here will cause sync to resume from an incorrect block
                    yield this.processSidetreeTransactionsInBlock(block);
                }
            }
        });
    }
    /**
     * Find all hashes in the notYetValidatedBlocks that are actually valid,
     * add them to the validated list and delete them from the map.
     */
    findEarliestValidBlockAndAddToValidBlocks(validatedBlocks, notYetValidatedBlocks, hashOfEarliestKnownValidBlock, startingBlockHeight) {
        let validBlockCount = 0; // Just for console print out purpose at the end.
        let validBlock = notYetValidatedBlocks.get(hashOfEarliestKnownValidBlock);
        // Keep looking for the parent of the earliest known valid block from the detached chain
        // until either we can't find a parent from the list of not-yet-validated blocks,
        // or we have connected the detached chain to the main chain
        while (validBlock !== undefined && validBlock.height >= startingBlockHeight) {
            validatedBlocks.push(validBlock);
            // delete because it is now validated
            notYetValidatedBlocks.delete(hashOfEarliestKnownValidBlock);
            // the previous block hash becomes valid
            hashOfEarliestKnownValidBlock = validBlock.previousHash;
            validBlock = notYetValidatedBlocks.get(hashOfEarliestKnownValidBlock);
            validBlockCount++;
        }
        Logger_1.default.info(LogColor_1.default.lightBlue(`Found ${LogColor_1.default.green(validBlockCount)} valid blocks.`));
    }
    removeTransactionsInInvalidBlocks(invalidBlocks) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashes = invalidBlocks.keys();
            for (const hash of hashes) {
                yield this.transactionStore.removeTransactionByTransactionTimeHash(hash);
            }
        });
    }
    /**
     * Iterate through all the outputs in the first transaction (coinbase) and add up all the satoshis
     * then minus the block reward to get the total transaction fee.
     * @param block The block to get the fee for
     */
    static getBitcoinBlockTotalFee(block) {
        // get the total fee including block reward
        const coinbaseTransaction = block.transactions[0];
        let totalOutputSatoshi = 0;
        for (const output of coinbaseTransaction.outputs) {
            totalOutputSatoshi += output.satoshis;
        }
        // subtract block reward
        return totalOutputSatoshi - BitcoinProcessor.getBitcoinBlockReward(block.height);
    }
    /**
     * Given the block height, return the block reward
     */
    static getBitcoinBlockReward(height) {
        const halvingTimes = Math.floor(height / 210000);
        if (halvingTimes >= 64) {
            return 0;
        }
        return Math.floor(5000000000 / (Math.pow(2, halvingTimes)));
    }
    /**
     * Iterates through the transactions within the given block and process the sidetree transactions
     * @param block the block to process
     */
    processSidetreeTransactionsInBlock(block) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = block.transactions;
            // iterate through transactions
            for (let transactionIndex = 0; transactionIndex < transactions.length; transactionIndex++) {
                const transaction = transactions[transactionIndex];
                try {
                    const sidetreeTxToAdd = yield this.getSidetreeTransactionModelIfExist(transaction, transactionIndex, block.height);
                    // If there are transactions found then add them to the transaction store
                    if (sidetreeTxToAdd) {
                        Logger_1.default.info(LogColor_1.default.lightBlue(`Sidetree transaction found; adding ${LogColor_1.default.green(JSON.stringify(sidetreeTxToAdd))}`));
                        yield this.transactionStore.addTransaction(sidetreeTxToAdd);
                    }
                }
                catch (e) {
                    const inputs = { blockHeight: block.height, blockHash: block.hash, transactionIndex: transactionIndex };
                    Logger_1.default.info(`An error happened when trying to add sidetree transaction to the store. Inputs: ${JSON.stringify(inputs)}\r\n` +
                        `Full error: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
                    throw e;
                }
            }
        });
    }
    /**
     * Gets the blockchain time of the given time hash.
     * Gets the latest logical blockchain time if time hash is not given.
     * @param hash Blockchain time hash.
     * @returns the current or associated blockchain time of the given time hash.
     */
    time(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Getting time ${hash ? 'of time hash ' + hash : ''}`);
            if (!hash) {
                const block = yield this.blockMetadataStore.getLast();
                return {
                    time: block.height,
                    hash: block.hash
                };
            }
            const blockInfo = yield this.bitcoinClient.getBlockInfo(hash);
            return {
                hash: hash,
                time: blockInfo.height
            };
        });
    }
    /**
     * Fetches Sidetree transactions in chronological order from since or genesis.
     * @param since A transaction number
     * @param hash The associated transaction time hash
     * @returns Transactions in complete blocks since given transaction number, with normalizedFee.
     */
    transactions(since, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(LogColor_1.default.lightBlue(`Transactions request: since transaction number ${LogColor_1.default.green(since)}, time hash '${LogColor_1.default.green(hash)}'...`));
            if ((since && !hash) ||
                (!since && hash)) {
                throw new RequestError_1.default(ResponseStatus_1.default.BadRequest);
            }
            if (since && hash) {
                if (!(yield this.verifyBlock(TransactionNumber_1.default.getBlockNumber(since), hash))) {
                    Logger_1.default.info('Requested transactions hash mismatched blockchain');
                    throw new RequestError_1.default(ResponseStatus_1.default.BadRequest, SharedErrorCode_1.default.InvalidTransactionNumberOrTimeHash);
                }
            }
            Logger_1.default.info(`Returning transactions since ${since ? 'block ' + TransactionNumber_1.default.getBlockNumber(since) : 'beginning'}...`);
            // We get the last processed block directly from DB because if this service has observer turned off,
            // it would not have the last processed block cached in memory.
            const lastProcessedBlock = yield this.blockMetadataStore.getLast();
            if (lastProcessedBlock === undefined) {
                return {
                    moreTransactions: false,
                    transactions: []
                };
            }
            // NOTE: this conditional block is technically an optional optimization,
            // but it is a useful one especially when Bitcoin service's observing loop wait period is longer than that of the Core service's observing loop:
            // This prevents Core from repeatedly reverting its DB after detecting a fork then repopulating its DB with forked/invalid data again.
            if (!(yield this.verifyBlock(lastProcessedBlock.height, lastProcessedBlock.hash))) {
                Logger_1.default.info('Bitcoin service in a forked state, not returning transactions until the DB is reverted to correct chain.');
                return {
                    moreTransactions: false,
                    transactions: []
                };
            }
            const [transactions, lastBlockSeen] = yield this.getTransactionsSince(since, lastProcessedBlock.height);
            // Add normalizedFee to transactions because internal to bitcoin, normalizedFee live in blockMetadata and have to be joined by block height
            // with transactions to get per transaction normalizedFee.
            if (transactions.length !== 0) {
                const inclusiveFirstBlockHeight = transactions[0].transactionTime;
                const exclusiveLastBlockHeight = transactions[transactions.length - 1].transactionTime + 1;
                const blockMetaData = yield this.blockMetadataStore.get(inclusiveFirstBlockHeight, exclusiveLastBlockHeight);
                const blockMetaDataMap = new Map();
                for (const block of blockMetaData) {
                    blockMetaDataMap.set(block.height, block);
                }
                for (const transaction of transactions) {
                    const block = blockMetaDataMap.get(transaction.transactionTime);
                    if (block !== undefined) {
                        transaction.normalizedTransactionFee = this.versionManager.getFeeCalculator(block.height).calculateNormalizedTransactionFeeFromBlock(block);
                    }
                    else {
                        throw new RequestError_1.default(ResponseStatus_1.default.ServerError, ErrorCode_1.default.BitcoinBlockMetadataNotFound);
                    }
                }
            }
            // if last processed block has not been seen, then there are more transactions
            const moreTransactions = lastBlockSeen < lastProcessedBlock.height;
            return {
                transactions,
                moreTransactions
            };
        });
    }
    /**
     * Given a list block metadata, returns the first in the list that has a valid hash,
     * returns `undefined` if a valid block is not found.
     */
    firstValidBlock(blocks) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let index = 0; index < blocks.length; index++) {
                const block = blocks[index];
                if (yield this.verifyBlock(block.height, block.hash)) {
                    return block;
                }
            }
            return undefined;
        });
    }
    /**
     * Given an ordered list of Sidetree transactions, returns the first transaction in the list that is valid.
     * @param transactions List of transactions to check
     * @returns The first valid transaction, or undefined if none are valid
     */
    firstValidTransaction(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let index = 0; index < transactions.length; index++) {
                const transaction = transactions[index];
                const height = transaction.transactionTime;
                const hash = transaction.transactionTimeHash;
                if (yield this.verifyBlock(height, hash)) {
                    return transaction;
                }
            }
            return undefined;
        });
    }
    /**
     * Writes a Sidetree transaction to the underlying Bitcoin's blockchain.
     * @param anchorString The string to be written as part of the transaction.
     * @param minimumFee The minimum fee to be paid for this transaction.
     */
    writeTransaction(anchorString, minimumFee) {
        return __awaiter(this, void 0, void 0, function* () {
            const sidetreeTransactionString = `${this.config.sidetreeTransactionPrefix}${anchorString}`;
            const sidetreeTransaction = yield this.bitcoinClient.createSidetreeTransaction(sidetreeTransactionString, minimumFee);
            const transactionFee = sidetreeTransaction.transactionFee;
            Logger_1.default.info(`Fee: ${transactionFee}. Anchoring string ${anchorString}`);
            const feeWithinSpendingLimits = yield this.spendingMonitor.isCurrentFeeWithinSpendingLimit(transactionFee, this.lastProcessedBlock.height);
            if (!feeWithinSpendingLimits) {
                throw new RequestError_1.default(ResponseStatus_1.default.BadRequest, SharedErrorCode_1.default.SpendingCapPerPeriodReached);
            }
            const totalSatoshis = yield this.bitcoinClient.getBalanceInSatoshis();
            if (totalSatoshis < transactionFee) {
                const error = new Error(`Not enough satoshis to broadcast. Failed to broadcast anchor string ${anchorString}`);
                Logger_1.default.error(error);
                throw new RequestError_1.default(ResponseStatus_1.default.BadRequest, SharedErrorCode_1.default.NotEnoughBalanceForWrite);
            }
            const transactionHash = yield this.bitcoinClient.broadcastSidetreeTransaction(sidetreeTransaction);
            Logger_1.default.info(LogColor_1.default.lightBlue(`Successfully submitted transaction [hash: ${LogColor_1.default.green(transactionHash)}]`));
            this.spendingMonitor.addTransactionDataBeingWritten(anchorString);
        });
    }
    /**
     * Modifies the given array and update the normalized fees, then write to block metadata store.
     * @param blocks the ordered block metadata to set the normalized fee for.
     */
    writeBlocksToMetadataStoreWithFee(blocks) {
        return __awaiter(this, void 0, void 0, function* () {
            const blocksToWrite = [];
            for (const block of blocks) {
                const feeCalculator = yield this.versionManager.getFeeCalculator(block.height);
                const blockMetadata = yield feeCalculator.addNormalizedFeeToBlockMetadata({
                    height: block.height,
                    hash: block.hash,
                    previousHash: block.previousHash,
                    transactionCount: block.transactionCount,
                    totalFee: block.totalFee
                });
                blocksToWrite.push(blockMetadata);
            }
            this.blockMetadataStore.add(blocksToWrite);
            this.lastProcessedBlock = blocksToWrite[blocksToWrite.length - 1];
        });
    }
    /**
     * Calculate and return proof-of-fee value for a particular block.
     * @param block The block height to get normalized fee for
     */
    getNormalizedFee(block) {
        return __awaiter(this, void 0, void 0, function* () {
            // this is to protect the number type because it can be passed as a string through request path
            const blockNumber = Number(block);
            if (blockNumber < this.genesisBlockNumber) {
                const error = `The input block number must be greater than or equal to: ${this.genesisBlockNumber}`;
                Logger_1.default.error(error);
                throw new RequestError_1.default(ResponseStatus_1.default.BadRequest, SharedErrorCode_1.default.BlockchainTimeOutOfRange);
            }
            const normalizedTransactionFee = yield this.versionManager.getFeeCalculator(blockNumber).getNormalizedFee(blockNumber);
            return { normalizedTransactionFee: normalizedTransactionFee };
        });
    }
    /**
     * Handles the get version operation.
     */
    getServiceVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.serviceInfoProvider.getServiceVersion();
        });
    }
    /**
     * Gets the lock information for the specified identifier (if specified); if nothing is passed in then
     * it returns the current lock information (if one exist).
     *
     * @param lockIdentifier The identifier of the lock to look up.
     */
    getValueTimeLock(lockIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // NOTE: must return the await response as otherwise, the following exception handler is not invoked
                // (instead the caller's exception handler is invoked) and the correct status/error-code etc is not
                // bubbled up above.
                return yield this.lockResolver.resolveSerializedLockIdentifierAndThrowOnError(lockIdentifier);
            }
            catch (e) {
                Logger_1.default.info(`Value time lock not found. Identifier: ${lockIdentifier}. Error: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
                throw new RequestError_1.default(ResponseStatus_1.default.NotFound, SharedErrorCode_1.default.ValueTimeLockNotFound);
            }
        });
    }
    /**
     * Gets the lock information which is currently held by this node. It throws an RequestError if none exist.
     */
    getActiveValueTimeLockForThisNode() {
        return __awaiter(this, void 0, void 0, function* () {
            let currentLock;
            try {
                currentLock = yield this.lockMonitor.getCurrentValueTimeLock();
            }
            catch (e) {
                if (e instanceof SidetreeError_1.default && e.code === ErrorCode_1.default.LockMonitorCurrentValueTimeLockInPendingState) {
                    throw new RequestError_1.default(ResponseStatus_1.default.NotFound, ErrorCode_1.default.ValueTimeLockInPendingState);
                }
                Logger_1.default.error(`Current value time lock retrieval failed with error: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
                throw new RequestError_1.default(ResponseStatus_1.default.ServerError);
            }
            if (!currentLock) {
                throw new RequestError_1.default(ResponseStatus_1.default.NotFound, SharedErrorCode_1.default.ValueTimeLockNotFound);
            }
            return currentLock;
        });
    }
    /**
     * Generates a private key for the Bitcoin testnet.
     */
    static generatePrivateKeyForTestnet() {
        return BitcoinClient_1.default.generatePrivateKey('testnet');
    }
    /**
     * Will process transactions every interval seconds.
     * @param interval Number of seconds between each query
     */
    periodicPoll(interval = this.config.transactionPollPeriodInSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Defensive programming to prevent multiple polling loops even if this method is externally called multiple times.
                if (this.pollTimeoutId) {
                    clearTimeout(this.pollTimeoutId);
                }
                const startingBlock = yield this.getStartingBlockForPeriodicPoll();
                if (startingBlock === undefined) {
                    Logger_1.default.info('Bitcoin processor state is ahead of bitcoind: skipping periodic poll');
                }
                else {
                    yield this.processTransactions(startingBlock);
                }
                EventEmitter_1.default.emit(EventCode_1.default.BitcoinObservingLoopSuccess);
            }
            catch (error) {
                EventEmitter_1.default.emit(EventCode_1.default.BitcoinObservingLoopFailure);
                Logger_1.default.error(error);
            }
            finally {
                this.pollTimeoutId = setTimeout(this.periodicPoll.bind(this), 1000 * interval, interval);
            }
        });
    }
    /**
     * Processes transactions from startBlock (or genesis) to the current blockchain height.
     * @param startBlock The block to begin from (inclusive)
     */
    processTransactions(startBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Starting processTransaction at: ${Date.now()}`);
            const startBlockHeight = startBlock.height;
            if (startBlockHeight < this.genesisBlockNumber) {
                throw new SidetreeError_1.default(ErrorCode_1.default.BitcoinProcessorCannotProcessBlocksBeforeGenesis, `Input block: ${startBlock}. Genesis block: ${this.genesisBlockNumber}`);
            }
            const endBlockHeight = yield this.bitcoinClient.getCurrentBlockHeight();
            Logger_1.default.info(`Processing transactions from ${startBlockHeight} to ${endBlockHeight}`);
            let blockHeight = startBlockHeight;
            let previousBlockHash = startBlock.previousHash;
            while (blockHeight <= endBlockHeight) {
                const processedBlockMetadata = yield this.processBlock(blockHeight, previousBlockHash);
                this.lastProcessedBlock = processedBlockMetadata;
                blockHeight++;
                previousBlockHash = processedBlockMetadata.hash;
            }
            Logger_1.default.info(`Finished processing blocks ${startBlockHeight} to ${endBlockHeight}`);
        });
    }
    /**
     * Gets the starting block (first block in chronological order) which we have not processed yet.
     */
    getStartingBlockForPeriodicPoll() {
        return __awaiter(this, void 0, void 0, function* () {
            // If last processed block is undefined, start processing from genesis block.
            if (this.lastProcessedBlock === undefined) {
                yield this.trimDatabasesToBlock(); // Trim all data.
                return this.bitcoinClient.getBlockInfoFromHeight(this.genesisBlockNumber);
            }
            const lastProcessedBlockIsValid = yield this.verifyBlock(this.lastProcessedBlock.height, this.lastProcessedBlock.hash);
            // If the last processed block is not valid then that means that we need to
            // revert the DB back to a known valid block.
            let lastValidBlock;
            if (lastProcessedBlockIsValid) {
                lastValidBlock = this.lastProcessedBlock;
                // We need to trim the DB data to the last processed block,
                // in case transactions in a block is saved successfully but error occurred when saving the block metadata.
                yield this.trimDatabasesToBlock(lastValidBlock.height);
            }
            else {
                // The revert logic will return the last valid block.
                lastValidBlock = yield this.revertDatabases();
            }
            // If there is a valid processed block, we will start processing the block following it, else start processing from the genesis block.
            const startingBlockHeight = lastValidBlock ? lastValidBlock.height + 1 : this.genesisBlockNumber;
            // The new starting block-height may not be actually written on the blockchain yet
            // so here we make sure that we don't return an 'invalid' starting block.
            const currentHeight = yield this.bitcoinClient.getCurrentBlockHeight();
            if (startingBlockHeight > currentHeight) {
                return undefined;
            }
            // We have our new starting point
            return this.bitcoinClient.getBlockInfoFromHeight(startingBlockHeight);
        });
    }
    /**
     * Begins to revert databases until consistent with blockchain.
     * @returns A known valid block before the fork. `undefined` if no known valid block can be found.
     */
    revertDatabases() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Reverting databases...`);
            const exponentiallySpacedBlocks = yield this.blockMetadataStore.lookBackExponentially();
            const lastKnownValidBlock = yield this.firstValidBlock(exponentiallySpacedBlocks);
            const lastKnownValidBlockHeight = lastKnownValidBlock ? lastKnownValidBlock.height : undefined;
            Logger_1.default.info(LogColor_1.default.lightBlue(`Reverting database to ${LogColor_1.default.green(lastKnownValidBlockHeight || 'genesis')} block...`));
            yield this.trimDatabasesToBlock(lastKnownValidBlockHeight);
            EventEmitter_1.default.emit(EventCode_1.default.BitcoinDatabasesRevert, { blockHeight: lastKnownValidBlockHeight });
            return lastKnownValidBlock;
        });
    }
    /**
     * Trims entries in the system DBs to the given a block height.
     * Trims all entries if no block height is given.
     * @param blockHeight The exclusive block height to perform DB trimming on.
     */
    trimDatabasesToBlock(blockHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Trimming all block and transaction data after block height: ${blockHeight}`);
            // NOTE: Order is IMPORTANT!
            // *****
            // Remove block metadata BEFORE we remove any other data, because block metadata is used as the timestamp.
            yield this.blockMetadataStore.removeLaterThan(blockHeight);
            const lastTransactionNumberOfGivenBlock = blockHeight ? TransactionNumber_1.default.lastTransactionOfBlock(blockHeight) : undefined;
            yield this.transactionStore.removeTransactionsLaterThan(lastTransactionNumberOfGivenBlock);
        });
    }
    /**
     * Given a Bitcoin block height and hash, verifies against the blockchain
     * @param height Block height to verify
     * @param hash Block hash to verify
     * @returns true if valid, false otherwise
     */
    verifyBlock(height, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Verifying block ${height} (${hash})`);
            const currentBlockHeight = yield this.bitcoinClient.getCurrentBlockHeight();
            // this means the block height doesn't exist anymore
            if (currentBlockHeight < height) {
                return false;
            }
            const responseData = yield this.bitcoinClient.getBlockHash(height);
            Logger_1.default.info(`Retrieved block ${height} (${responseData})`);
            return hash === responseData;
        });
    }
    /**
     * Given a Bitcoin block height, processes that block for Sidetree transactions
     * @param blockHeight Height of block to process
     * @param previousBlockHash Block hash of the previous block
     * @returns the metadata of block processed
     */
    processBlock(blockHeight, previousBlockHash) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Processing block ${blockHeight}`);
            const blockHash = yield this.bitcoinClient.getBlockHash(blockHeight);
            const blockData = yield this.bitcoinClient.getBlock(blockHash);
            // This check detects fork by ensuring the fetched block points to the expected previous block.
            if (blockData.previousHash !== previousBlockHash) {
                throw new SidetreeError_1.default(ErrorCode_1.default.BitcoinProcessInvalidPreviousBlockHash, `Previous hash from blockchain: ${blockData.previousHash}. Expected value: ${previousBlockHash}`);
            }
            yield this.processSidetreeTransactionsInBlock(blockData);
            // Compute the total fee paid, total transaction count and normalized fee required for block metadata.
            const transactionCount = blockData.transactions.length;
            const totalFee = BitcoinProcessor.getBitcoinBlockTotalFee(blockData);
            const feeCalculator = this.versionManager.getFeeCalculator(blockHeight);
            const processedBlockMetadata = yield feeCalculator.addNormalizedFeeToBlockMetadata({
                hash: blockHash,
                height: blockHeight,
                previousHash: blockData.previousHash,
                totalFee,
                transactionCount
            });
            yield this.blockMetadataStore.add([processedBlockMetadata]);
            return processedBlockMetadata;
        });
    }
    getSidetreeTransactionModelIfExist(transaction, transactionIndex, transactionBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            const sidetreeData = yield this.sidetreeTransactionParser.parse(transaction);
            if (sidetreeData) {
                const transactionFeePaid = yield this.bitcoinClient.getTransactionFeeInSatoshis(transaction.id);
                return {
                    transactionNumber: TransactionNumber_1.default.construct(transactionBlock, transactionIndex),
                    transactionTime: transactionBlock,
                    transactionTimeHash: transaction.blockHash,
                    anchorString: sidetreeData.data,
                    transactionFeePaid: transactionFeePaid,
                    writer: sidetreeData.writer
                };
            }
            return undefined;
        });
    }
    /**
     * Return transactions since transaction number and the last block seen
     * (Will get at least 1 full block worth of data unless there is no transaction to return)
     * @param since Transaction number to query since
     * @param maxBlockHeight The last block height to consider included in transactions
     * @returns a tuple of [transactions, lastBlockSeen]
     */
    getTransactionsSince(since, maxBlockHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            // test against undefined because 0 is falsy and this helps differentiate the behavior between 0 and undefined
            let inclusiveBeginTransactionTime = since === undefined ? this.genesisBlockNumber : TransactionNumber_1.default.getBlockNumber(since);
            const transactionsToReturn = [];
            // while need more blocks and have not reached the processed block
            while (transactionsToReturn.length === 0 && inclusiveBeginTransactionTime <= maxBlockHeight) {
                const exclusiveEndTransactionTime = inclusiveBeginTransactionTime + BitcoinProcessor.pageSizeInBlocks;
                let transactions = yield this.transactionStore.getTransactionsStartingFrom(inclusiveBeginTransactionTime, exclusiveEndTransactionTime);
                transactions = transactions.filter((transaction) => {
                    // filter anything greater than the last processed block because they are not complete
                    return transaction.transactionTime <= maxBlockHeight &&
                        // if there is a since, filter transactions that are less than or equal to since (the first block will have undesired transactions)
                        (since === undefined || transaction.transactionNumber > since);
                });
                inclusiveBeginTransactionTime = exclusiveEndTransactionTime;
                transactionsToReturn.push(...transactions);
            }
            // the -1 makes the last seen transaction time inclusive because the variable is set to the exclusive one every loop
            return [transactionsToReturn, inclusiveBeginTransactionTime - 1];
        });
    }
}
exports.default = BitcoinProcessor;
/** at least 100 blocks per page unless reaching the last block */
BitcoinProcessor.pageSizeInBlocks = 100;
//# sourceMappingURL=BitcoinProcessor.js.map