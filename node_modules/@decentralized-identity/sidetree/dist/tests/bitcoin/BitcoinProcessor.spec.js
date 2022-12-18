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
const fs = require("fs");
const httpStatus = require("http-status");
const BitcoinProcessor_1 = require("../../lib/bitcoin/BitcoinProcessor");
const BitcoinClient_1 = require("../../lib/bitcoin/BitcoinClient");
const BitcoinDataGenerator_1 = require("./BitcoinDataGenerator");
const BitcoinRawDataParser_1 = require("../../lib/bitcoin/BitcoinRawDataParser");
const BlockMetadataGenerator_1 = require("../generators/BlockMetadataGenerator");
const ErrorCode_1 = require("../../lib/bitcoin/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const RequestError_1 = require("../../lib/bitcoin/RequestError");
const ResponseStatus_1 = require("../../lib/common/enums/ResponseStatus");
const SharedErrorCode_1 = require("../../lib/common/SharedErrorCode");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
const TransactionNumber_1 = require("../../lib/bitcoin/TransactionNumber");
function randomString(length = 16) {
    return Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(16).substring(0, length);
}
function randomNumber(max = 256) {
    return Math.round(Math.random() * max);
}
function randomBlock(above = 0) {
    return { height: above + randomNumber(), hash: randomString(), previousHash: randomString() };
}
describe('BitcoinProcessor', () => {
    const versionModels = [
        { startingBlockchainTime: 0, version: 'latest', protocolParameters: { valueTimeLockDurationInBlocks: 1, initialNormalizedFeeInSatoshis: 1, feeLookBackWindowInBlocks: 1, feeMaxFluctuationMultiplierPerBlock: 1 } }
    ];
    const testConfig = {
        bitcoinDataDirectory: undefined,
        bitcoinFeeSpendingCutoffPeriodInBlocks: 100,
        bitcoinFeeSpendingCutoff: 1,
        bitcoinPeerUri: 'http://localhost:18332',
        bitcoinRpcUsername: 'admin',
        bitcoinRpcPassword: '123456789',
        bitcoinWalletOrImportString: BitcoinClient_1.default.generatePrivateKey('testnet'),
        databaseName: 'bitcoin-test',
        defaultTransactionFeeInSatoshisPerKB: undefined,
        genesisBlockNumber: 1,
        mongoDbConnectionString: 'mongodb://localhost:27017',
        requestMaxRetries: 3,
        requestTimeoutInMilliseconds: 300,
        sidetreeTransactionPrefix: 'sidetree:',
        sidetreeTransactionFeeMarkupPercentage: 0,
        transactionPollPeriodInSeconds: 60,
        valueTimeLockUpdateEnabled: true,
        valueTimeLockPollPeriodInSeconds: 60,
        valueTimeLockAmountInBitcoins: 1,
        valueTimeLockTransactionFeesAmountInBitcoins: undefined
    };
    let bitcoinProcessor;
    // DB related spies.
    let blockMetadataStoreInitializeSpy;
    let blockMetadataStoreAddSpy;
    let blockMetadataStoreGetLastSpy;
    let blockMetadataStoreGetSpy;
    let serviceStateStoreInitializeSpy;
    let transactionStoreInitializeSpy;
    let mongoLockTxnStoreSpy;
    let trimDatabasesToBlockSpy;
    let upgradeDatabaseIfNeededSpy;
    let bitcoinClientInitializeSpy;
    let getStartingBlockForPeriodicPollSpy;
    let processTransactionsSpy;
    let fastProcessTransactionsSpy;
    let periodicPollSpy;
    let lockMonitorSpy;
    beforeEach(() => {
        const config = Object.assign({}, testConfig); // Clone the test config so that tests don't share the same object when it is being modified.
        bitcoinProcessor = new BitcoinProcessor_1.default(config);
        blockMetadataStoreInitializeSpy = spyOn(bitcoinProcessor['blockMetadataStore'], 'initialize');
        serviceStateStoreInitializeSpy = spyOn(bitcoinProcessor['serviceStateStore'], 'initialize');
        transactionStoreInitializeSpy = spyOn(bitcoinProcessor['transactionStore'], 'initialize');
        bitcoinClientInitializeSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'initialize');
        mongoLockTxnStoreSpy = spyOn(bitcoinProcessor['mongoDbLockTransactionStore'], 'initialize');
        lockMonitorSpy = spyOn(bitcoinProcessor['lockMonitor'], 'startPeriodicProcessing');
        blockMetadataStoreAddSpy = spyOn(bitcoinProcessor['blockMetadataStore'], 'add');
        blockMetadataStoreGetLastSpy = spyOn(bitcoinProcessor['blockMetadataStore'], 'getLast');
        blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(undefined));
        blockMetadataStoreGetSpy = spyOn(bitcoinProcessor['blockMetadataStore'], 'get');
        blockMetadataStoreGetSpy.and.returnValue(Promise.resolve({
            height: 999999,
            hash: 'someHash',
            normalizedFee: 9999999,
            previousHash: 'prevHash',
            transactionCount: 9999999,
            totalFee: 9999999999999
        }));
        getStartingBlockForPeriodicPollSpy = spyOn(bitcoinProcessor, 'getStartingBlockForPeriodicPoll');
        getStartingBlockForPeriodicPollSpy.and.returnValue(Promise.resolve(undefined));
        processTransactionsSpy = spyOn(bitcoinProcessor, 'processTransactions');
        processTransactionsSpy.and.returnValue(Promise.resolve({ hash: 'IamAHash', height: 54321 }));
        fastProcessTransactionsSpy = spyOn(bitcoinProcessor, 'fastProcessTransactions');
        periodicPollSpy = spyOn(bitcoinProcessor, 'periodicPoll');
        trimDatabasesToBlockSpy = spyOn(bitcoinProcessor, 'trimDatabasesToBlock');
        upgradeDatabaseIfNeededSpy = spyOn(bitcoinProcessor, 'upgradeDatabaseIfNeeded');
    });
    function createBlockMetadata(inclusiveStartingHeight, exclusiveEndingHeight) {
        let height = inclusiveStartingHeight;
        const blockMetadata = [];
        const hash = randomString();
        while (height < exclusiveEndingHeight) {
            blockMetadata.push({
                height,
                hash: hash,
                normalizedFee: height,
                previousHash: hash,
                transactionCount: height,
                totalFee: height
            });
            height++;
        }
        return blockMetadata;
    }
    function createTransactions(count, height, incrementalHeight = false, deterministicNormalizedFee = false) {
        const transactions = [];
        if (!count) {
            count = randomNumber(9) + 1;
        }
        if (height === undefined) {
            height = randomNumber();
        }
        const hash = randomString();
        for (let i = 0; i < count; i++) {
            const fee = deterministicNormalizedFee ? height + i : randomNumber();
            transactions.push({
                transactionNumber: TransactionNumber_1.default.construct(height, i),
                transactionTime: incrementalHeight ? height + i : height,
                transactionTimeHash: hash,
                anchorString: randomString(),
                transactionFeePaid: fee,
                normalizedTransactionFee: fee,
                writer: randomString()
            });
        }
        return transactions;
    }
    describe('constructor', () => {
        it('should use appropriate config values', () => {
            const config = {
                bitcoinDataDirectory: undefined,
                bitcoinFeeSpendingCutoffPeriodInBlocks: 100,
                bitcoinFeeSpendingCutoff: 1,
                bitcoinPeerUri: randomString(),
                bitcoinRpcUsername: 'admin',
                bitcoinRpcPassword: 'password123',
                bitcoinWalletOrImportString: BitcoinClient_1.default.generatePrivateKey('testnet'),
                databaseName: randomString(),
                defaultTransactionFeeInSatoshisPerKB: 42,
                genesisBlockNumber: randomNumber(),
                mongoDbConnectionString: randomString(),
                sidetreeTransactionPrefix: randomString(4),
                requestTimeoutInMilliseconds: undefined,
                requestMaxRetries: undefined,
                transactionPollPeriodInSeconds: 60,
                sidetreeTransactionFeeMarkupPercentage: 0,
                valueTimeLockUpdateEnabled: true,
                valueTimeLockPollPeriodInSeconds: 60,
                valueTimeLockAmountInBitcoins: 1,
                valueTimeLockTransactionFeesAmountInBitcoins: undefined
            };
            const bitcoinProcessor = new BitcoinProcessor_1.default(config);
            expect(bitcoinProcessor.genesisBlockNumber).toEqual(config.genesisBlockNumber);
            expect(bitcoinProcessor.config.transactionPollPeriodInSeconds).toEqual(60);
            expect(bitcoinProcessor.config.sidetreeTransactionPrefix).toEqual(config.sidetreeTransactionPrefix);
            expect(bitcoinProcessor['bitcoinClient']['sidetreeTransactionFeeMarkupPercentage']).toEqual(0);
            expect(bitcoinProcessor['bitcoinClient']['estimatedFeeSatoshiPerKB']).toEqual(42);
        });
        it('should use appropriate config values with lock amount', () => {
            const config = {
                bitcoinDataDirectory: undefined,
                bitcoinFeeSpendingCutoffPeriodInBlocks: 100,
                bitcoinFeeSpendingCutoff: 1,
                bitcoinPeerUri: randomString(),
                bitcoinRpcUsername: 'admin',
                bitcoinRpcPassword: 'password123',
                bitcoinWalletOrImportString: BitcoinClient_1.default.generatePrivateKey('testnet'),
                databaseName: randomString(),
                defaultTransactionFeeInSatoshisPerKB: 42,
                genesisBlockNumber: randomNumber(),
                mongoDbConnectionString: randomString(),
                sidetreeTransactionPrefix: randomString(4),
                requestTimeoutInMilliseconds: undefined,
                requestMaxRetries: undefined,
                transactionPollPeriodInSeconds: 60,
                sidetreeTransactionFeeMarkupPercentage: 0,
                valueTimeLockUpdateEnabled: true,
                valueTimeLockPollPeriodInSeconds: 60,
                valueTimeLockAmountInBitcoins: 1,
                valueTimeLockTransactionFeesAmountInBitcoins: 123
            };
            const bitcoinProcessor = new BitcoinProcessor_1.default(config);
            expect(bitcoinProcessor.genesisBlockNumber).toEqual(config.genesisBlockNumber);
            expect(bitcoinProcessor.config.transactionPollPeriodInSeconds).toEqual(60);
            expect(bitcoinProcessor.config.sidetreeTransactionPrefix).toEqual(config.sidetreeTransactionPrefix);
            expect(bitcoinProcessor['bitcoinClient']['sidetreeTransactionFeeMarkupPercentage']).toEqual(0);
            expect(bitcoinProcessor['bitcoinClient']['estimatedFeeSatoshiPerKB']).toEqual(42);
        });
    });
    describe('initialize', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            bitcoinClientInitializeSpy.and.returnValue(Promise.resolve());
            getStartingBlockForPeriodicPollSpy.and.returnValue(Promise.resolve({ height: 123, hash: 'hash' }));
            mongoLockTxnStoreSpy.and.returnValue(Promise.resolve());
            lockMonitorSpy.and.returnValue(Promise.resolve());
        }));
        it('should initialize the internal objects', (done) => __awaiter(void 0, void 0, void 0, function* () {
            expect(transactionStoreInitializeSpy).not.toHaveBeenCalled();
            expect(bitcoinClientInitializeSpy).not.toHaveBeenCalled();
            expect(mongoLockTxnStoreSpy).not.toHaveBeenCalled();
            expect(lockMonitorSpy).not.toHaveBeenCalled();
            yield bitcoinProcessor.initialize(versionModels);
            expect(blockMetadataStoreInitializeSpy).toHaveBeenCalled();
            expect(serviceStateStoreInitializeSpy).toHaveBeenCalled();
            expect(upgradeDatabaseIfNeededSpy).toHaveBeenCalled();
            expect(transactionStoreInitializeSpy).toHaveBeenCalled();
            expect(bitcoinClientInitializeSpy).toHaveBeenCalled();
            expect(mongoLockTxnStoreSpy).toHaveBeenCalled();
            expect(processTransactionsSpy).toHaveBeenCalledBefore(lockMonitorSpy);
            expect(lockMonitorSpy).toHaveBeenCalled();
            done();
        }));
        it('should not start transaction observer polling if polling is turned off.', () => __awaiter(void 0, void 0, void 0, function* () {
            bitcoinProcessor.config.transactionPollPeriodInSeconds = 0;
            yield bitcoinProcessor.initialize(versionModels);
            expect(periodicPollSpy).not.toHaveBeenCalled();
        }));
        it('should skip initialization if unable to find a starting block.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            getStartingBlockForPeriodicPollSpy.and.returnValue(Promise.resolve(undefined));
            yield bitcoinProcessor.initialize(versionModels);
            expect(processTransactionsSpy).not.toHaveBeenCalled();
            expect(fastProcessTransactionsSpy).not.toHaveBeenCalled();
            done();
        }));
        it('should process all the blocks since its last known', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const fromNumber = randomNumber();
            const fromHash = randomString();
            getStartingBlockForPeriodicPollSpy.and.returnValue(Promise.resolve({
                height: fromNumber,
                hash: fromHash
            }));
            processTransactionsSpy.and.callFake((sinceBlock) => {
                expect(sinceBlock.height).toEqual(fromNumber);
                expect(sinceBlock.hash).toEqual(fromHash);
                return Promise.resolve({
                    hash: 'latestHash',
                    height: 12345
                });
            });
            expect(getStartingBlockForPeriodicPollSpy).not.toHaveBeenCalled();
            expect(processTransactionsSpy).not.toHaveBeenCalled();
            yield bitcoinProcessor.initialize(versionModels);
            expect(getStartingBlockForPeriodicPollSpy).toHaveBeenCalled();
            expect(processTransactionsSpy).toHaveBeenCalled();
            expect(fastProcessTransactionsSpy).not.toHaveBeenCalled();
            done();
        }));
        it('should process all the blocks since its last known With fastProcessTransactions', (done) => __awaiter(void 0, void 0, void 0, function* () {
            bitcoinProcessor.config.bitcoinDataDirectory = 'somePath';
            const fromNumber = randomNumber();
            const fromHash = randomString();
            getStartingBlockForPeriodicPollSpy.and.returnValue(Promise.resolve({
                height: fromNumber,
                hash: fromHash
            }));
            fastProcessTransactionsSpy.and.callFake((sinceBlock) => {
                expect(sinceBlock.height).toEqual(fromNumber);
                expect(sinceBlock.hash).toEqual(fromHash);
            });
            expect(getStartingBlockForPeriodicPollSpy).not.toHaveBeenCalled();
            expect(fastProcessTransactionsSpy).not.toHaveBeenCalled();
            yield bitcoinProcessor.initialize(versionModels);
            expect(getStartingBlockForPeriodicPollSpy).toHaveBeenCalled();
            expect(fastProcessTransactionsSpy).toHaveBeenCalled();
            expect(processTransactionsSpy).not.toHaveBeenCalled();
            done();
        }));
        it('should begin to periodically poll for updates', (done) => __awaiter(void 0, void 0, void 0, function* () {
            expect(periodicPollSpy).not.toHaveBeenCalled();
            yield bitcoinProcessor.initialize(versionModels);
            expect(periodicPollSpy).toHaveBeenCalled();
            done();
        }));
    });
    describe('time', () => {
        it('should get the current latest when given no hash', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const height = randomNumber();
            const hash = randomString();
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve({
                height: height,
                hash: hash,
                normalizedFee: 123,
                previousHash: 'prevHash',
                transactionCount: 123,
                totalFee: 123
            }));
            const actual = yield bitcoinProcessor.time();
            expect(actual.time).toEqual(height);
            expect(actual.hash).toEqual(hash);
            expect(blockMetadataStoreGetLastSpy).toHaveBeenCalled();
            done();
        }));
        it('should get the corresponding bitcoin height given a hash', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const height = randomNumber();
            const hash = randomString();
            const tipSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(height));
            const hashSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockHash').and.returnValue(Promise.resolve(hash));
            const spy = spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockInfo');
            spy.and.returnValue(Promise.resolve({ height, hash, previousHash: 'prevHash' }));
            const actual = yield bitcoinProcessor.time(hash);
            expect(actual.time).toEqual(height);
            expect(actual.hash).toEqual(hash);
            expect(tipSpy).not.toHaveBeenCalled();
            expect(hashSpy).not.toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
            done();
        }));
    });
    describe('transactions()', () => {
        beforeEach(() => {
            const mockFeeCalculator = {
                calculateNormalizedTransactionFeeFromBlock(block) { return Math.floor(block.normalizedFee); },
                getNormalizedFee() {
                    return __awaiter(this, void 0, void 0, function* () { return 509; });
                },
                addNormalizedFeeToBlockMetadata() {
                    return __awaiter(this, void 0, void 0, function* () { return {}; });
                }
            };
            spyOn(bitcoinProcessor['versionManager'], 'getFeeCalculator').and.returnValue(mockFeeCalculator);
        });
        it('should get transactions since genesis capped by page size in blocks', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            // return as many as page size
            const transactions = createTransactions(BitcoinProcessor_1.default['pageSizeInBlocks'], bitcoinProcessor['genesisBlockNumber'], true, true);
            const mockLastProcessedBlock = {
                height: transactions[transactions.length - 1].transactionTime + 1,
                hash: 'some hash',
                previousHash: 'previous hash'
            };
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            blockMetadataStoreGetSpy.and.returnValue(createBlockMetadata(bitcoinProcessor['genesisBlockNumber'], bitcoinProcessor['genesisBlockNumber'] + BitcoinProcessor_1.default['pageSizeInBlocks']));
            const getTransactionsStartingFromSpy = spyOn(bitcoinProcessor['transactionStore'], 'getTransactionsStartingFrom').and.callFake(() => {
                return Promise.resolve(transactions);
            });
            const actual = yield bitcoinProcessor.transactions();
            expect(blockMetadataStoreGetSpy).toHaveBeenCalledWith(bitcoinProcessor['genesisBlockNumber'], bitcoinProcessor['genesisBlockNumber'] + BitcoinProcessor_1.default['pageSizeInBlocks']);
            expect(verifyMock).toHaveBeenCalledTimes(1); // called after data was retrieved
            expect(getTransactionsStartingFromSpy).toHaveBeenCalled();
            expect(actual.moreTransactions).toBeTruthy(); // true because page size is reached
            expect(actual.transactions).toEqual(transactions);
            done();
        }));
        it('should throw if block metadata does not match transaction requirements', (done) => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            // return as many as page size
            const transactions = createTransactions(BitcoinProcessor_1.default['pageSizeInBlocks'], bitcoinProcessor['genesisBlockNumber'], true, true);
            const mockLastProcessedBlock = {
                height: transactions[transactions.length - 1].transactionTime + 1,
                hash: 'some hash',
                previousHash: 'previous hash'
            };
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            // This is not enough block meta data to calculate normalized fee for every transactions
            blockMetadataStoreGetSpy.and.returnValue(createBlockMetadata(bitcoinProcessor['genesisBlockNumber'], bitcoinProcessor['genesisBlockNumber'] + 1));
            spyOn(bitcoinProcessor['transactionStore'], 'getTransactionsStartingFrom').and.callFake(() => {
                return Promise.resolve(transactions);
            });
            try {
                yield bitcoinProcessor.transactions();
                fail('expect to throw but did not');
            }
            catch (e) {
                expect(e).toEqual(new RequestError_1.default(ResponseStatus_1.default.ServerError, ErrorCode_1.default.BitcoinBlockMetadataNotFound));
            }
            ;
            done();
        }));
        it('should get transactions since genesis and handle mid block processing', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            const transactions = createTransactions(BitcoinProcessor_1.default['pageSizeInBlocks'], bitcoinProcessor['genesisBlockNumber'], true, true);
            // This makes the last transaction in the array "processing"
            const lastProcessedBlockHeightLess = transactions[transactions.length - 1].transactionTime - 1;
            const mockLastProcessedBlock = {
                height: lastProcessedBlockHeightLess,
                hash: 'some hash',
                previousHash: 'previous hash'
            };
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            blockMetadataStoreGetSpy.and.returnValue(createBlockMetadata(bitcoinProcessor['genesisBlockNumber'], bitcoinProcessor['genesisBlockNumber'] + BitcoinProcessor_1.default['pageSizeInBlocks'] - 1));
            const getTransactionsStartingFromSpy = spyOn(bitcoinProcessor['transactionStore'], 'getTransactionsStartingFrom').and.callFake(() => {
                return Promise.resolve(transactions);
            });
            const actual = yield bitcoinProcessor.transactions();
            expect(verifyMock).toHaveBeenCalledTimes(1);
            expect(getTransactionsStartingFromSpy).toHaveBeenCalled();
            expect(blockMetadataStoreGetSpy).toHaveBeenCalledWith(bitcoinProcessor['genesisBlockNumber'], bitcoinProcessor['genesisBlockNumber'] + BitcoinProcessor_1.default['pageSizeInBlocks'] - 1);
            expect(actual.moreTransactions).toBeFalsy(); // don't need more transactions because page size is not reached (last block reached)
            expect(actual.transactions).toEqual(transactions.slice(0, transactions.length - 1)); // the last one should be omitted because it is processing
            done();
        }));
        it('should return no transaction if last processed block in DB is not found.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockLastProcessedBlock = undefined;
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            const fetchedTransactions = yield bitcoinProcessor.transactions();
            expect(fetchedTransactions).toEqual({
                moreTransactions: false,
                transactions: []
            });
        }));
        it('should get transactions since genesis and handle complete last block', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            const transactions = createTransactions(BitcoinProcessor_1.default['pageSizeInBlocks'], bitcoinProcessor['genesisBlockNumber'], true, true);
            // make the last transaction time to be the same as last processed block height
            const lastProcessedBlockHeight = transactions[transactions.length - 1].transactionTime;
            const mockLastProcessedBlock = {
                height: lastProcessedBlockHeight,
                hash: 'some hash',
                previousHash: 'previous hash'
            };
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            blockMetadataStoreGetSpy.and.returnValue(createBlockMetadata(bitcoinProcessor['genesisBlockNumber'], bitcoinProcessor['genesisBlockNumber'] + BitcoinProcessor_1.default['pageSizeInBlocks']));
            const getTransactionsStartingFromSpy = spyOn(bitcoinProcessor['transactionStore'], 'getTransactionsStartingFrom').and.callFake(() => {
                return Promise.resolve(transactions);
            });
            const actual = yield bitcoinProcessor.transactions();
            expect(blockMetadataStoreGetSpy).toHaveBeenCalledWith(bitcoinProcessor['genesisBlockNumber'], bitcoinProcessor['genesisBlockNumber'] + BitcoinProcessor_1.default['pageSizeInBlocks']);
            expect(verifyMock).toHaveBeenCalledTimes(1);
            expect(getTransactionsStartingFromSpy).toHaveBeenCalled();
            expect(actual.moreTransactions).toBeFalsy(); // Looks at genesis to genesis + 100 but lastProcessedBlock is genesis + 99
            expect(actual.transactions).toEqual(transactions);
            done();
        }));
        it('should get transactions since genesis and handle past last block', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            const lastProcessedBlockHeight = bitcoinProcessor['genesisBlockNumber'];
            const transactions = createTransactions(BitcoinProcessor_1.default['pageSizeInBlocks'], lastProcessedBlockHeight + 1, false);
            // make the last transaction time genesis so the transactions will all be out of bound
            const mockLastProcessedBlock = {
                height: lastProcessedBlockHeight,
                hash: 'some hash',
                previousHash: 'previous hash'
            };
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            const getTransactionsStartingFromSpy = spyOn(bitcoinProcessor['transactionStore'], 'getTransactionsStartingFrom').and.callFake(() => {
                return Promise.resolve(transactions);
            });
            const actual = yield bitcoinProcessor.transactions();
            expect(verifyMock).toHaveBeenCalledTimes(1);
            expect(getTransactionsStartingFromSpy).toHaveBeenCalled();
            expect(actual.moreTransactions).toBeFalsy(); // no more transactions because past last block
            expect(actual.transactions).toEqual([]); // no return because nothing is processed
            done();
        }));
        it('should find at least 1 transaction and return', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            // make the last transaction time genesis + 1000 so it needs to call getTransactionsStartingFrom multiple times
            const lastProcessedBlockHeight = bitcoinProcessor['genesisBlockNumber'] + 1000;
            const mockLastProcessedBlock = {
                height: lastProcessedBlockHeight,
                hash: 'some hash',
                previousHash: 'previous hash'
            };
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            blockMetadataStoreGetSpy.and.returnValue(createBlockMetadata(bitcoinProcessor['genesisBlockNumber'] + 505, bitcoinProcessor['genesisBlockNumber'] + 506));
            const getTransactionsStartingFromSpy = spyOn(bitcoinProcessor['transactionStore'], 'getTransactionsStartingFrom').and.callFake((begin) => {
                if (begin === bitcoinProcessor['genesisBlockNumber'] + 500) {
                    return Promise.resolve(createTransactions(1, begin + 5, false, true));
                }
                return Promise.resolve([]);
            });
            const actual = yield bitcoinProcessor.transactions();
            expect(blockMetadataStoreGetSpy).toHaveBeenCalledWith(bitcoinProcessor['genesisBlockNumber'] + 505, bitcoinProcessor['genesisBlockNumber'] + 506);
            expect(verifyMock).toHaveBeenCalledTimes(1);
            expect(getTransactionsStartingFromSpy).toHaveBeenCalledTimes(6);
            expect(actual.moreTransactions).toBeTruthy(); // more transactions because it didn't reach latestProcessedBlock
            expect(actual.transactions.length).toEqual(1);
            done();
        }));
        it('should return default if transactions is empty array', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            const mockLastProcessedBlock = {
                height: bitcoinProcessor['genesisBlockNumber'] + 99999,
                hash: 'some hash',
                previousHash: 'previous hash'
            };
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            const getTransactionsStartingFromSpy = spyOn(bitcoinProcessor['transactionStore'], 'getTransactionsStartingFrom').and.callFake(() => {
                return Promise.resolve([]);
            });
            const actual = yield bitcoinProcessor.transactions();
            expect(verifyMock).toHaveBeenCalledTimes(1);
            expect(getTransactionsStartingFromSpy).toHaveBeenCalled();
            expect(actual.moreTransactions).toBeFalsy();
            expect(actual.transactions).toEqual([]);
            done();
        }));
        it('should get transactions since a specific block height and hash', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const expectedHeight = randomNumber();
            const expectedHash = randomString();
            const expectedTransactionNumber = TransactionNumber_1.default.construct(expectedHeight, 0);
            const lastBlockHeight = BitcoinProcessor_1.default['pageSizeInBlocks'] + expectedHeight - 1; // caps the result to avoid 2 sets of transactions
            const lastBlockHash = 'last block hash';
            const mockLastProcessedBlock = {
                height: lastBlockHeight,
                hash: lastBlockHash,
                previousHash: 'previous hash'
            };
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            blockMetadataStoreGetSpy.and.returnValue(createBlockMetadata(expectedHeight, expectedHeight + BitcoinProcessor_1.default['pageSizeInBlocks']));
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.callFake((height, hash) => {
                expect(height === expectedHeight || height === lastBlockHeight).toBeTruthy();
                expect(hash === expectedHash || hash === lastBlockHash).toBeTruthy();
                return Promise.resolve(true);
            });
            const transactions = createTransactions(BitcoinProcessor_1.default['pageSizeInBlocks'], expectedHeight, true, true);
            const getTransactionsStartingFromSpy = spyOn(bitcoinProcessor['transactionStore'], 'getTransactionsStartingFrom').and.callFake(() => {
                return Promise.resolve(transactions);
            });
            const actual = yield bitcoinProcessor.transactions(expectedTransactionNumber, expectedHash);
            // starting 1 block later because of since
            expect(blockMetadataStoreGetSpy).toHaveBeenCalledWith(expectedHeight + 1, expectedHeight + BitcoinProcessor_1.default['pageSizeInBlocks']);
            expect(verifyMock).toHaveBeenCalledTimes(2);
            expect(getTransactionsStartingFromSpy).toHaveBeenCalled();
            expect(actual.moreTransactions).toBeFalsy();
            transactions.shift();
            expect(actual.transactions).toEqual(transactions); // the first one should be excluded because of since
            done();
        }));
        it('should fail if only given a block height', (done) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield bitcoinProcessor.transactions(randomNumber());
                fail('expected to throw');
            }
            catch (error) {
                expect(error.status).toEqual(httpStatus.BAD_REQUEST);
                expect(error.code).not.toEqual(SharedErrorCode_1.default.InvalidTransactionNumberOrTimeHash);
            }
            finally {
                done();
            }
        }));
        it('should fail if the height and hash do not validate against the current blockchain', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const expectedHeight = randomNumber();
            const expectedHash = randomString();
            const expectedTransactionNumber = TransactionNumber_1.default.construct(expectedHeight, 0);
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(false));
            try {
                yield bitcoinProcessor.transactions(expectedTransactionNumber, expectedHash);
                fail('expected to throw');
            }
            catch (error) {
                expect(error.status).toEqual(httpStatus.BAD_REQUEST);
                expect(error.code).toEqual(SharedErrorCode_1.default.InvalidTransactionNumberOrTimeHash);
                expect(verifyMock).toHaveBeenCalledTimes(1);
            }
            finally {
                done();
            }
        }));
        it('should return no transactions if bitcoin service is in a forked state.', () => __awaiter(void 0, void 0, void 0, function* () {
            const expectedHeight = randomNumber();
            const expectedHash = randomString();
            const expectedTransactionNumber = TransactionNumber_1.default.construct(expectedHeight, 0);
            blockMetadataStoreGetLastSpy.and.returnValues(Promise.resolve('unused'));
            // The 2nd return value simulates a forked state in the bitcoin service.
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValues(Promise.resolve(true), Promise.resolve(false));
            const response = yield bitcoinProcessor.transactions(expectedTransactionNumber, expectedHash);
            expect(blockMetadataStoreGetLastSpy).toHaveBeenCalledTimes(1);
            expect(verifyMock).toHaveBeenCalledTimes(2);
            expect(response.moreTransactions).toBeFalsy();
            expect(response.transactions.length).toEqual(0);
        }));
        it('should make moreTransactions true when last block processed is not reached', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockLastProcessedBlock = {
                height: Number.MAX_SAFE_INTEGER,
                hash: 'some hash',
                previousHash: 'previous hash'
            };
            const expectedHeight = randomNumber();
            const expectedHash = randomString();
            const expectedTransactionNumber = TransactionNumber_1.default.construct(expectedHeight, 0);
            blockMetadataStoreGetLastSpy.and.returnValue(Promise.resolve(mockLastProcessedBlock));
            blockMetadataStoreGetSpy.and.returnValue(createBlockMetadata(expectedHeight, expectedHeight + BitcoinProcessor_1.default['pageSizeInBlocks']));
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            const transactions = createTransactions(BitcoinProcessor_1.default['pageSizeInBlocks'], expectedHeight, true, true);
            const getTransactionsStartingFromSpy = spyOn(bitcoinProcessor['transactionStore'], 'getTransactionsStartingFrom').and.returnValue(Promise.resolve(transactions));
            const actual = yield bitcoinProcessor.transactions(expectedTransactionNumber, expectedHash);
            expect(verifyMock).toHaveBeenCalled();
            expect(blockMetadataStoreGetSpy).toHaveBeenCalledWith(expectedHeight + 1, expectedHeight + BitcoinProcessor_1.default['pageSizeInBlocks']);
            expect(getTransactionsStartingFromSpy).toHaveBeenCalled();
            expect(actual.moreTransactions).toBeTruthy();
            done();
        }));
    });
    describe('firstValidBlock', () => {
        it('should return the first of the valid transactions', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blocks = BlockMetadataGenerator_1.default.generate(10);
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.callFake((height) => {
                return Promise.resolve(height === 5);
            });
            const actual = yield bitcoinProcessor.firstValidBlock(blocks);
            expect(verifyMock).toHaveBeenCalledTimes(6);
            expect(actual).toEqual(blocks[5]);
            done();
        }));
        it('should return undefined if no valid transactions are found', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blocks = BlockMetadataGenerator_1.default.generate(10);
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(false));
            const actual = yield bitcoinProcessor.firstValidBlock(blocks);
            expect(actual).toBeUndefined();
            expect(verifyMock).toHaveBeenCalled();
            done();
        }));
    });
    describe('firstValidTransaction', () => {
        it('should return the first of the valid transactions', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const transactions = [];
            const heights = [];
            const count = 10;
            for (let i = 0; i < count; i++) {
                const height = randomNumber();
                const feePaidRandom = randomNumber();
                heights.push(height);
                transactions.push({
                    anchorString: randomString(),
                    transactionNumber: TransactionNumber_1.default.construct(height, randomNumber()),
                    transactionTime: height,
                    transactionTimeHash: randomString(),
                    transactionFeePaid: feePaidRandom,
                    normalizedTransactionFee: feePaidRandom,
                    writer: randomString()
                });
            }
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.callFake((height) => {
                expect(height).toEqual(heights.shift());
                return Promise.resolve(heights.length === 0);
            });
            const actual = yield bitcoinProcessor.firstValidTransaction(transactions);
            expect(verifyMock).toHaveBeenCalledTimes(count);
            expect(actual).toBeDefined();
            done();
        }));
        it('should return undefined if no valid transactions are found', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const transactions = createTransactions();
            const verifyMock = spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(false));
            const actual = yield bitcoinProcessor.firstValidTransaction(transactions);
            expect(actual).toBeUndefined();
            expect(verifyMock).toHaveBeenCalled();
            done();
        }));
    });
    describe('writeTransaction', () => {
        const bitcoinFee = 4000;
        beforeEach(() => {
            bitcoinProcessor['lastProcessedBlock'] = {
                height: randomNumber(),
                hash: randomString(),
                previousHash: randomString(),
                normalizedFee: 123,
                transactionCount: 1000,
                totalFee: 1000
            };
        });
        it('should write a transaction if there are enough Satoshis', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const monitorAddSpy = spyOn(bitcoinProcessor['spendingMonitor'], 'addTransactionDataBeingWritten');
            const getCoinsSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getBalanceInSatoshis').and.returnValue(Promise.resolve(9999999999));
            spyOn(bitcoinProcessor['bitcoinClient'], 'createSidetreeTransaction').and.returnValue(Promise.resolve({
                transactionId: 'string',
                transactionFee: bitcoinFee,
                serializedTransactionObject: 'string'
            }));
            spyOn(bitcoinProcessor['spendingMonitor'], 'isCurrentFeeWithinSpendingLimit').and.returnValue(Promise.resolve(true));
            const hash = randomString();
            const broadcastSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'broadcastSidetreeTransaction').and.returnValue(Promise.resolve('someHash'));
            yield bitcoinProcessor.writeTransaction(hash, bitcoinFee);
            expect(getCoinsSpy).toHaveBeenCalled();
            expect(broadcastSpy).toHaveBeenCalled();
            expect(monitorAddSpy).toHaveBeenCalledWith(hash);
            done();
        }));
        it('should fail if there are not enough satoshis to create a transaction', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const monitorAddSpy = spyOn(bitcoinProcessor['spendingMonitor'], 'addTransactionDataBeingWritten');
            const getCoinsSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getBalanceInSatoshis').and.returnValue(Promise.resolve(0));
            spyOn(bitcoinProcessor['spendingMonitor'], 'isCurrentFeeWithinSpendingLimit').and.returnValue(Promise.resolve(true));
            const hash = randomString();
            spyOn(bitcoinProcessor['bitcoinClient'], 'createSidetreeTransaction').and.returnValue(Promise.resolve({
                transactionId: 'string',
                transactionFee: Number.MAX_SAFE_INTEGER,
                serializedTransactionObject: 'string'
            }));
            const broadcastSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'broadcastSidetreeTransaction').and.callFake(() => {
                fail('writeTransaction should have stopped before calling broadcast');
            });
            try {
                yield bitcoinProcessor.writeTransaction(hash, 4000);
                fail('should have thrown');
            }
            catch (error) {
                expect(error instanceof RequestError_1.default).toBeTruthy();
                expect(error.status).toEqual(400);
                expect(error.code).toEqual(SharedErrorCode_1.default.NotEnoughBalanceForWrite);
                expect(getCoinsSpy).toHaveBeenCalled();
                expect(broadcastSpy).not.toHaveBeenCalled();
            }
            finally {
                expect(monitorAddSpy).not.toHaveBeenCalled();
                done();
            }
        }));
        it('should fail if the current fee is over the spending limits', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const monitorAddSpy = spyOn(bitcoinProcessor['spendingMonitor'], 'addTransactionDataBeingWritten');
            const spendLimitSpy = spyOn(bitcoinProcessor['spendingMonitor'], 'isCurrentFeeWithinSpendingLimit').and.returnValue(Promise.resolve(false));
            const broadcastSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'broadcastSidetreeTransaction');
            const createSidetreeTransactionSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'createSidetreeTransaction').and.returnValue(Promise.resolve({
                transactionId: 'string',
                transactionFee: bitcoinFee,
                serializedTransactionObject: 'string'
            }));
            try {
                yield bitcoinProcessor.writeTransaction('some data', bitcoinFee);
                fail('expected to throw');
            }
            catch (error) {
                expect(error.status).toEqual(httpStatus.BAD_REQUEST);
                expect(error.code).toEqual(SharedErrorCode_1.default.SpendingCapPerPeriodReached);
            }
            expect(broadcastSpy).not.toHaveBeenCalled();
            expect(spendLimitSpy).toHaveBeenCalledWith(bitcoinFee, bitcoinProcessor['lastProcessedBlock'].height);
            expect(monitorAddSpy).not.toHaveBeenCalled();
            expect(createSidetreeTransactionSpy).toHaveBeenCalledTimes(1);
            done();
        }));
    });
    describe('getNormalizedFee', () => {
        let mockedCurrentHeight;
        let validBlockHeight;
        beforeEach(() => {
            mockedCurrentHeight = bitcoinProcessor['genesisBlockNumber'] + 200;
            validBlockHeight = mockedCurrentHeight - 50;
            spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(mockedCurrentHeight));
        });
        it('should throw if the input is less than the genesis block', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield bitcoinProcessor.getNormalizedFee(0);
                fail('should have failed');
            }
            catch (error) {
                expect(error.status).toEqual(httpStatus.BAD_REQUEST);
                expect(error.code).toEqual(SharedErrorCode_1.default.BlockchainTimeOutOfRange);
            }
        }));
        it('should return the value from the normalized fee calculator.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFeeCalculator = {
                calculateNormalizedTransactionFeeFromBlock(block) { return Math.floor(block.normalizedFee); },
                getNormalizedFee() {
                    return __awaiter(this, void 0, void 0, function* () { return 509; });
                },
                addNormalizedFeeToBlockMetadata() {
                    return __awaiter(this, void 0, void 0, function* () { return {}; });
                }
            };
            spyOn(bitcoinProcessor['versionManager'], 'getFeeCalculator').and.returnValue(mockFeeCalculator);
            const response = yield bitcoinProcessor.getNormalizedFee(validBlockHeight);
            expect(response).toBeDefined();
            expect(response.normalizedTransactionFee).toEqual(509);
        }));
        it('should return the value from the normalized fee calculator when passed in a string representation of block number.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFeeCalculator = {
                calculateNormalizedTransactionFeeFromBlock(block) { return Math.floor(block.normalizedFee); },
                getNormalizedFee(block) {
                    return __awaiter(this, void 0, void 0, function* () {
                        // make sure block is converted
                        expect(typeof block).toEqual('number');
                        return 509;
                    });
                },
                addNormalizedFeeToBlockMetadata() {
                    return __awaiter(this, void 0, void 0, function* () { return {}; });
                }
            };
            spyOn(bitcoinProcessor['versionManager'], 'getFeeCalculator').and.returnValue(mockFeeCalculator);
            // turn into a string then cast to any to simulate a request with string
            const response = yield bitcoinProcessor.getNormalizedFee(String(validBlockHeight));
            expect(response).toBeDefined();
            expect(response.normalizedTransactionFee).toEqual(509);
        }));
    });
    describe('periodicPoll', () => {
        beforeEach(() => {
            periodicPollSpy.and.callThrough();
        });
        it('should call processTransactions from its last known point', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const lastBlock = {
                height: randomNumber(),
                hash: randomString(),
                previousHash: randomString(),
                normalizedFee: randomNumber(),
                transactionCount: randomNumber(),
                totalFee: randomNumber()
            };
            const nextBlock = randomNumber();
            const nextHash = randomString();
            bitcoinProcessor['lastProcessedBlock'] = lastBlock;
            processTransactionsSpy.and.callFake((block) => {
                expect(block.height).toEqual(lastBlock.height);
                expect(block.hash).toEqual(lastBlock.hash);
                return Promise.resolve({
                    hash: nextHash,
                    height: nextBlock
                });
            });
            getStartingBlockForPeriodicPollSpy.and.returnValue(Promise.resolve(lastBlock));
            yield bitcoinProcessor['periodicPoll']();
            // need to wait for the process call
            setTimeout(() => {
                expect(bitcoinProcessor['pollTimeoutId']).toBeDefined();
                // clean up
                clearTimeout(bitcoinProcessor['pollTimeoutId']);
                done();
            }, 300);
            expect(processTransactionsSpy).toHaveBeenCalled();
        }));
        it('should not call process transaction if the starting block is undefined', (done) => __awaiter(void 0, void 0, void 0, function* () {
            getStartingBlockForPeriodicPollSpy.and.returnValue(Promise.resolve(undefined));
            yield bitcoinProcessor['periodicPoll']();
            // need to wait for the process call
            setTimeout(() => {
                expect(bitcoinProcessor['pollTimeoutId']).toBeDefined();
                // clean up
                clearTimeout(bitcoinProcessor['pollTimeoutId']);
                done();
            }, 300);
            expect(processTransactionsSpy).not.toHaveBeenCalled();
            done();
        }));
        it('should not throw if the processing throws', (done) => __awaiter(void 0, void 0, void 0, function* () {
            getStartingBlockForPeriodicPollSpy.and.throwError('Test error');
            try {
                yield bitcoinProcessor['periodicPoll']();
            }
            catch (e) {
                fail('There should not be any exception thrown.');
            }
            // need to wait for the process call
            setTimeout(() => {
                expect(bitcoinProcessor['pollTimeoutId']).toBeDefined();
                // clean up
                clearTimeout(bitcoinProcessor['pollTimeoutId']);
                done();
            }, 300);
            done();
        }));
        it('should set a timeout to call itself', (done) => __awaiter(void 0, void 0, void 0, function* () {
            processTransactionsSpy.and.returnValue(Promise.resolve({
                hash: randomString(),
                height: randomNumber()
            }));
            getStartingBlockForPeriodicPollSpy.and.returnValue(bitcoinProcessor['lastProcessedBlock']);
            bitcoinProcessor['periodicPoll']();
            // need to wait for the process call
            setTimeout(() => {
                expect(bitcoinProcessor['pollTimeoutId']).toBeDefined();
                // clean up
                clearTimeout(bitcoinProcessor['pollTimeoutId']);
                done();
            }, 300);
        }));
        it('should clear the previous timeout if set', (done) => __awaiter(void 0, void 0, void 0, function* () {
            getStartingBlockForPeriodicPollSpy.and.returnValue(Promise.resolve());
            const clearTimeoutSpy = spyOn(global, 'clearTimeout').and.returnValue();
            bitcoinProcessor['pollTimeoutId'] = 1234;
            yield bitcoinProcessor['periodicPoll']();
            // need to wait for the process call
            setTimeout(() => {
                expect(bitcoinProcessor['pollTimeoutId']).toBeDefined();
                // clean up
                clearTimeout(bitcoinProcessor['pollTimeoutId']);
                done();
            }, 300);
            expect(clearTimeoutSpy).toHaveBeenCalled();
        }));
    });
    describe('getBitcoinBlockReward', () => {
        it('should return 0 if halving time is greater than or equal to 64', () => {
            const result = BitcoinProcessor_1.default['getBitcoinBlockReward'](Number.MAX_SAFE_INTEGER);
            expect(result).toEqual(0);
        });
        it('should return 50 billion satoshis if halving time is greater than or equal to 0', () => {
            const result = BitcoinProcessor_1.default['getBitcoinBlockReward'](2);
            expect(result).toEqual(5000000000);
        });
    });
    describe('processBlocks', () => {
        it('should process as intended', () => __awaiter(void 0, void 0, void 0, function* () {
            const processSidetreeTransactionsInBlockSpy = spyOn(bitcoinProcessor, 'processSidetreeTransactionsInBlock');
            const blockData = [
                { hash: 'abc', height: 2, previousHash: 'def', transactions: [{ outputs: [{ satoshis: 100 }, { satoshis: 5000000000 }, { satoshis: 50 }] }] },
                { hash: 'def', height: 1, previousHash: 'out of range', transactions: [{ outputs: [{ satoshis: 5000000000 }] }] },
                { hash: 'ghi', height: 4, previousHash: 'out of range', transactions: [{ outputs: [{ satoshis: 5000000000 }] }] }
            ];
            const notYetValidatedBlocks = new Map();
            const startingHeight = 2;
            const heightOfEarliestKnownValidBlock = 3;
            yield bitcoinProcessor['processBlocks'](blockData, notYetValidatedBlocks, startingHeight, heightOfEarliestKnownValidBlock);
            expect(notYetValidatedBlocks.get('abc')).toEqual({
                hash: 'abc',
                height: 2,
                previousHash: 'def',
                totalFee: 150,
                transactionCount: 1
            });
            expect(processSidetreeTransactionsInBlockSpy).toHaveBeenCalledTimes(1);
        }));
    });
    describe('findEarliestValidBlockAndAddToValidBlocks', () => {
        it('should return new height and hash and update validBlocks while ignoring extra blocks', () => __awaiter(void 0, void 0, void 0, function* () {
            const validBlocks = [{ hash: 'hash', height: 3, previousHash: 'asb', totalFee: 123, transactionCount: 456, normalizedFee: 1 }];
            const notYetValidatedBlocks = new Map();
            notYetValidatedBlocks.set('abc', { hash: 'abc', height: 2, previousHash: 'def', totalFee: 2, transactionCount: 2, normalizedFee: 1 });
            notYetValidatedBlocks.set('def', { hash: 'def', height: 1, previousHash: 'out of range', totalFee: 1, transactionCount: 1, normalizedFee: 1 });
            notYetValidatedBlocks.set('out of range', { previousHash: 'this is out of range' });
            notYetValidatedBlocks.set('something that is garbage', { previousHash: 'garbage' });
            const hashOfEarliestKnownValidBlock = 'abc';
            const startingBlockHeight = 1;
            bitcoinProcessor['findEarliestValidBlockAndAddToValidBlocks'](validBlocks, notYetValidatedBlocks, hashOfEarliestKnownValidBlock, startingBlockHeight);
            expect(validBlocks[2]).toEqual({ hash: 'def', height: 1, previousHash: 'out of range', totalFee: 1, transactionCount: 1, normalizedFee: 1 });
            expect(validBlocks[1]).toEqual({ hash: 'abc', height: 2, previousHash: 'def', totalFee: 2, transactionCount: 2, normalizedFee: 1 });
            expect(notYetValidatedBlocks.size).toEqual(2);
            expect(notYetValidatedBlocks.get('out of range')).toBeDefined();
            expect(notYetValidatedBlocks.get('something that is garbage')).toBeDefined();
            expect(notYetValidatedBlocks.get('abc')).toBeUndefined();
            expect(notYetValidatedBlocks.get('def')).toBeUndefined();
        }));
        it('should return original values when no valid blocks are found', () => __awaiter(void 0, void 0, void 0, function* () {
            const validBlocks = [];
            const invalidBlocks = new Map();
            invalidBlocks.set('abc', {});
            invalidBlocks.set('def', {});
            const hashOfEarliestKnownValidBlock = 'not in the map';
            const startingBlockHeight = 1;
            bitcoinProcessor['findEarliestValidBlockAndAddToValidBlocks'](validBlocks, invalidBlocks, hashOfEarliestKnownValidBlock, startingBlockHeight);
            expect(validBlocks.length).toEqual(0);
            expect(invalidBlocks.size).toEqual(2);
        }));
    });
    describe('removeTransactionsInInvalidBlocks', () => {
        it('should process invalid blocks as intended', () => __awaiter(void 0, void 0, void 0, function* () {
            const removeTransactionByTransactionTimeHashSpy = spyOn(bitcoinProcessor['transactionStore'], 'removeTransactionByTransactionTimeHash');
            const invalidBlocks = new Map();
            invalidBlocks.set('abc', {});
            invalidBlocks.set('def', {});
            yield bitcoinProcessor['removeTransactionsInInvalidBlocks'](invalidBlocks);
            expect(removeTransactionByTransactionTimeHashSpy).toHaveBeenCalledWith('abc');
            expect(removeTransactionByTransactionTimeHashSpy).toHaveBeenCalledWith('def');
            expect(removeTransactionByTransactionTimeHashSpy).toHaveBeenCalledTimes(2);
        }));
    });
    describe('writeBlocksToMetadataStoreWithFee', () => {
        it('should process the correct transactions', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockMetadata = [
                {
                    height: 999999,
                    hash: 'someHash1',
                    previousHash: 'prevHash',
                    transactionCount: 123,
                    totalFee: 123
                },
                {
                    height: 1000000,
                    hash: 'someHash2',
                    previousHash: 'prevHash',
                    transactionCount: 123,
                    totalFee: 123
                }
            ];
            const mockFeeCalculator = {
                calculateNormalizedTransactionFeeFromBlock(block) { return Math.floor(block.normalizedFee); },
                getNormalizedFee() {
                    return __awaiter(this, void 0, void 0, function* () { return 509; });
                },
                addNormalizedFeeToBlockMetadata(block) {
                    return __awaiter(this, void 0, void 0, function* () { return Object.assign({ normalizedFee: 111 }, block); });
                }
            };
            spyOn(bitcoinProcessor['versionManager'], 'getFeeCalculator').and.returnValue(mockFeeCalculator);
            const addNormalizedFeeSpy = spyOn(mockFeeCalculator, 'addNormalizedFeeToBlockMetadata').and.callThrough();
            yield bitcoinProcessor['writeBlocksToMetadataStoreWithFee'](blockMetadata);
            expect(addNormalizedFeeSpy).toHaveBeenCalledWith({ height: 999999, hash: 'someHash1', previousHash: 'prevHash', transactionCount: 123, totalFee: 123 });
            expect(addNormalizedFeeSpy).toHaveBeenCalledWith({ height: 1000000, hash: 'someHash2', previousHash: 'prevHash', transactionCount: 123, totalFee: 123 });
            expect(addNormalizedFeeSpy).toHaveBeenCalledTimes(2);
            expect(blockMetadataStoreAddSpy).toHaveBeenCalledWith([
                {
                    height: 999999,
                    hash: 'someHash1',
                    normalizedFee: 111,
                    previousHash: 'prevHash',
                    transactionCount: 123,
                    totalFee: 123
                },
                {
                    height: 1000000,
                    hash: 'someHash2',
                    normalizedFee: 111,
                    previousHash: 'prevHash',
                    transactionCount: 123,
                    totalFee: 123
                }
            ]);
            expect(blockMetadataStoreAddSpy).toHaveBeenCalledTimes(1);
            expect(bitcoinProcessor['lastProcessedBlock']).toEqual({
                height: 1000000,
                hash: 'someHash2',
                normalizedFee: 111,
                previousHash: 'prevHash',
                transactionCount: 123,
                totalFee: 123
            });
        }));
    });
    describe('fastProcessTransactions', () => {
        beforeEach(() => {
            fastProcessTransactionsSpy.and.callThrough();
        });
        it('should process transactions as intended', () => __awaiter(void 0, void 0, void 0, function* () {
            // this is the end to end test
            const startBlock = randomBlock(testConfig.genesisBlockNumber);
            const getCurrentHeightMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(startBlock.height + 1));
            const getCurrentHashMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockInfoFromHeight')
                .and.returnValue(Promise.resolve({ hash: 'hash2', height: startBlock.height + 1, previousHash: 'hash1' }));
            const fsReaddirSyncSpy = spyOn(fs, 'readdirSync').and.returnValue(['blk001.dat']);
            const fsReadFileSyncSpy = spyOn(fs, 'readFileSync').and.returnValue(Buffer.from('someBuffer'));
            const processSidetreeTransactionsInBlockSpy = spyOn(bitcoinProcessor, 'processSidetreeTransactionsInBlock');
            const removeTransactionByTransactionTimeHashSpy = spyOn(bitcoinProcessor['transactionStore'], 'removeTransactionByTransactionTimeHash');
            const writeBlocksToMetadataStoreWithFeeSpy = spyOn(bitcoinProcessor, 'writeBlocksToMetadataStoreWithFee');
            const rawDataParserSpy = spyOn(BitcoinRawDataParser_1.default, 'parseRawDataFile').and.returnValue([
                {
                    hash: 'hash2',
                    height: startBlock.height + 1,
                    previousHash: 'hash1',
                    transactions: [{ outputs: [{ satoshis: 12345, scriptAsmAsString: 'asm' }], inputs: [], confirmations: 1, id: 'is2', blockHash: 'hash2' }]
                },
                {
                    hash: 'hash1',
                    height: startBlock.height,
                    previousHash: 'hash0',
                    transactions: [{ outputs: [{ satoshis: 12345, scriptAsmAsString: 'asm' }], inputs: [], confirmations: 1, id: 'id1', blockHash: 'hash1' }]
                },
                {
                    hash: 'fork1',
                    height: startBlock.height,
                    previousHash: 'hash0',
                    transactions: [{ outputs: [{ satoshis: 12345, scriptAsmAsString: 'asm' }], inputs: [], confirmations: 1, id: 'idfork', blockHash: 'fork1' }]
                },
                {
                    hash: 'outOfBound',
                    height: startBlock.height + 100,
                    previousHash: 'otherHash',
                    transactions: [{ outputs: [{ satoshis: 12345, scriptAsmAsString: 'asm' }], inputs: [], confirmations: 1, id: 'outOfBound', blockHash: 'outOfBound' }]
                }
            ]);
            const mockFeeCalculator = {
                calculateNormalizedTransactionFeeFromBlock(block) { return Math.floor(block.normalizedFee); },
                getNormalizedFee() {
                    return __awaiter(this, void 0, void 0, function* () { return 509; });
                },
                addNormalizedFeeToBlockMetadata(block) {
                    return __awaiter(this, void 0, void 0, function* () { return Object.assign({ normalizedFee: 111 }, block); });
                }
            };
            spyOn(bitcoinProcessor['versionManager'], 'getFeeCalculator').and.returnValue(mockFeeCalculator);
            yield bitcoinProcessor['fastProcessTransactions'](startBlock);
            expect(getCurrentHeightMock).toHaveBeenCalled();
            expect(getCurrentHashMock).toHaveBeenCalled();
            expect(fsReaddirSyncSpy).toHaveBeenCalled();
            expect(fsReadFileSyncSpy).toHaveBeenCalled();
            // 3 times because 3 blocks are in bound
            expect(processSidetreeTransactionsInBlockSpy).toHaveBeenCalledTimes(3);
            // onces because 1 block is forked
            expect(removeTransactionByTransactionTimeHashSpy).toHaveBeenCalledTimes(1);
            expect(rawDataParserSpy).toHaveBeenCalled();
            expect(writeBlocksToMetadataStoreWithFeeSpy).toHaveBeenCalledTimes(1);
        }));
        it('should process transactions as intended with no raw data', () => __awaiter(void 0, void 0, void 0, function* () {
            // this is the end to end test
            const startBlock = randomBlock(testConfig.genesisBlockNumber);
            const getCurrentHeightMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(startBlock.height + 1));
            const getCurrentHashMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockInfoFromHeight')
                .and.returnValue(Promise.resolve({ hash: 'hash2', height: startBlock.height + 1, previousHash: 'hash1' }));
            const fsReaddirSyncSpy = spyOn(fs, 'readdirSync').and.returnValue(['blk001.dat']);
            const fsReadFileSyncSpy = spyOn(fs, 'readFileSync').and.returnValue(Buffer.from('someBuffer'));
            const writeBlocksToMetadataStoreWithFeeSpy = spyOn(bitcoinProcessor, 'writeBlocksToMetadataStoreWithFee');
            const rawDataParserSpy = spyOn(BitcoinRawDataParser_1.default, 'parseRawDataFile').and.returnValue([]); // make it empty on purpose
            const mockFeeCalculator = {
                calculateNormalizedTransactionFeeFromBlock(block) { return Math.floor(block.normalizedFee); },
                getNormalizedFee() {
                    return __awaiter(this, void 0, void 0, function* () { return 509; });
                },
                addNormalizedFeeToBlockMetadata(block) {
                    return __awaiter(this, void 0, void 0, function* () { return Object.assign({ normalizedFee: 111 }, block); });
                }
            };
            spyOn(bitcoinProcessor['versionManager'], 'getFeeCalculator').and.returnValue(mockFeeCalculator);
            yield bitcoinProcessor['fastProcessTransactions'](startBlock);
            expect(getCurrentHeightMock).toHaveBeenCalled();
            expect(getCurrentHashMock).toHaveBeenCalled();
            expect(fsReaddirSyncSpy).toHaveBeenCalled();
            expect(fsReadFileSyncSpy).toHaveBeenCalled();
            // onces because 1 block is forked
            expect(rawDataParserSpy).toHaveBeenCalled();
            expect(writeBlocksToMetadataStoreWithFeeSpy).toHaveBeenCalledTimes(1);
        }));
    });
    describe('processTransactions', () => {
        beforeEach(() => {
            processTransactionsSpy.and.callThrough();
        });
        it('should verify the start block', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockProcessedBlockMetadata = BlockMetadataGenerator_1.default.generate(1)[0];
            const startBlock = randomBlock(testConfig.genesisBlockNumber);
            const processMock = spyOn(bitcoinProcessor, 'processBlock').and.returnValue(Promise.resolve(mockProcessedBlockMetadata));
            const getCurrentHeightMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(startBlock.height + 1));
            yield bitcoinProcessor['processTransactions'](startBlock);
            expect(bitcoinProcessor['lastProcessedBlock']).toBeDefined();
            expect(bitcoinProcessor['lastProcessedBlock'].hash).toEqual(mockProcessedBlockMetadata.hash);
            expect(processMock).toHaveBeenCalled();
            expect(getCurrentHeightMock).toHaveBeenCalled();
            done();
        }));
        it('should call processBlock on all blocks within range', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockProcessedBlockMetadata = BlockMetadataGenerator_1.default.generate(1)[0];
            const startBlock = randomBlock(testConfig.genesisBlockNumber);
            const processMock = spyOn(bitcoinProcessor, 'processBlock').and.returnValue(Promise.resolve(mockProcessedBlockMetadata));
            const getCurrentHeightMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(startBlock.height + 9));
            yield bitcoinProcessor['processTransactions'](startBlock);
            expect(bitcoinProcessor['lastProcessedBlock']).toBeDefined();
            expect(bitcoinProcessor['lastProcessedBlock'].hash).toEqual(mockProcessedBlockMetadata.hash);
            expect(getCurrentHeightMock).toHaveBeenCalled();
            expect(processMock).toHaveBeenCalledTimes(10);
            done();
        }));
        it('should throw if asked to start processing before genesis', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const tipSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(testConfig.genesisBlockNumber + 1));
            const processMock = spyOn(bitcoinProcessor, 'processBlock');
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => bitcoinProcessor['processTransactions']({ height: testConfig.genesisBlockNumber - 10, hash: randomString(), previousHash: randomString() }), ErrorCode_1.default.BitcoinProcessorCannotProcessBlocksBeforeGenesis);
            expect(tipSpy).not.toHaveBeenCalled();
            expect(processMock).not.toHaveBeenCalled();
            done();
        }));
        it('should recall previous hashes when calling processBlock', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Custom write some sequential blocks such that between blocks the previousHash changes.
            const mockProcessedBlockMetadatas = BlockMetadataGenerator_1.default.generate(10); // Height will be 0 to 9.
            const offset = randomNumber(100) + testConfig.genesisBlockNumber;
            const tipSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(offset + 9));
            const processMock = spyOn(bitcoinProcessor, 'processBlock').and.callFake((height, hash) => {
                const index = height - offset;
                if (index !== 0) {
                    expect(hash).toEqual(mockProcessedBlockMetadatas[index - 1].hash);
                }
                return Promise.resolve(mockProcessedBlockMetadatas[index]);
            });
            yield bitcoinProcessor['processTransactions']({ height: offset, hash: randomString(), previousHash: randomString() });
            expect(tipSpy).toHaveBeenCalled();
            expect(processMock).toHaveBeenCalled();
            done();
        }));
    });
    describe('getStartingBlockForPeriodicPoll', () => {
        let actualLastProcessedBlock;
        let getBlockInfoFromHeightSpy;
        beforeEach(() => {
            // Revert the spy call in parent beforeEach();
            getStartingBlockForPeriodicPollSpy.and.callThrough();
            bitcoinProcessor['lastProcessedBlock'] = {
                height: randomNumber(),
                hash: randomString(),
                previousHash: randomString(),
                normalizedFee: randomNumber(),
                transactionCount: randomNumber(),
                totalFee: randomNumber()
            };
            actualLastProcessedBlock = bitcoinProcessor['lastProcessedBlock'];
            getBlockInfoFromHeightSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockInfoFromHeight');
            getBlockInfoFromHeightSpy.and.callFake((height) => {
                return Promise.resolve({
                    height,
                    hash: randomString(),
                    previousHash: randomString()
                });
            });
            expect(actualLastProcessedBlock).toBeDefined();
        });
        it('should return the block after the last-processed-block', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(actualLastProcessedBlock.height + 1));
            const actual = yield bitcoinProcessor['getStartingBlockForPeriodicPoll']();
            expect(actual).toBeDefined();
            expect(actual.height).toEqual(actualLastProcessedBlock.height + 1);
        }));
        it('should return undefined if the last-processed-block is same as the current height', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(true));
            spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(actualLastProcessedBlock.height));
            const actual = yield bitcoinProcessor['getStartingBlockForPeriodicPoll']();
            expect(actual).not.toBeDefined();
        }));
        it('should revert blockchain if verifyblock fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockHeightAfterRevert = actualLastProcessedBlock.height - 1;
            const revertBlockchainSpy = spyOn(bitcoinProcessor, 'revertDatabases');
            revertBlockchainSpy.and.returnValue({ height: mockHeightAfterRevert, hash: randomString() });
            spyOn(bitcoinProcessor, 'verifyBlock').and.returnValue(Promise.resolve(false));
            spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(actualLastProcessedBlock.height + 1));
            const actual = yield bitcoinProcessor['getStartingBlockForPeriodicPoll']();
            expect(actual).toBeDefined();
            expect(actual.height).toEqual(mockHeightAfterRevert + 1);
            expect(revertBlockchainSpy).toHaveBeenCalled();
        }));
        it('should use genesis block as the starting block if no last processed block is found.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            // Simulate no last processed block is found.
            bitcoinProcessor['lastProcessedBlock'] = undefined;
            yield bitcoinProcessor['getStartingBlockForPeriodicPoll']();
            expect(trimDatabasesToBlockSpy).toHaveBeenCalled();
            // We don't care about the mocked return value, we only care that `getBlockInfoFromHeightSpy()` is invoked with the genesis block height.
            expect(getBlockInfoFromHeightSpy).toHaveBeenCalledWith(bitcoinProcessor.genesisBlockNumber);
            done();
        }));
        it('should use genesis block as the starting block if no valid block is left after reverting.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const verifyBlockSpy = spyOn(bitcoinProcessor, 'verifyBlock');
            verifyBlockSpy.and.returnValue(Promise.resolve(false));
            // Simulate no valid block left after reverting.
            const revertDatabaseSpy = spyOn(bitcoinProcessor, 'revertDatabases');
            revertDatabaseSpy.and.returnValue(Promise.resolve(undefined));
            // Simulate that current height in bitcoin core is ahead than the desired starting block.
            const getCurrentBlockHeightSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(Number.MAX_SAFE_INTEGER));
            yield bitcoinProcessor['getStartingBlockForPeriodicPoll']();
            expect(verifyBlockSpy).toHaveBeenCalled();
            expect(revertDatabaseSpy).toHaveBeenCalled();
            expect(getCurrentBlockHeightSpy).toHaveBeenCalled();
            // We don't care about the mocked return value, we only care that `getBlockInfoFromHeightSpy()` is invoked with the genesis block height.
            expect(getBlockInfoFromHeightSpy).toHaveBeenCalledWith(bitcoinProcessor.genesisBlockNumber);
            done();
        }));
    });
    describe('revertDatabases', () => {
        it('should invoke trimDatabasesToBlock() correctly and return the correct block info.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blocks = BlockMetadataGenerator_1.default.generate(10);
            const lookBackExponentiallySpy = spyOn(bitcoinProcessor['blockMetadataStore'], 'lookBackExponentially').and.returnValue(Promise.resolve(blocks));
            const firstValidBlockSpy = spyOn(bitcoinProcessor, 'firstValidBlock').and.callFake((actualBlocks) => {
                expect(actualBlocks).toEqual(blocks);
                return Promise.resolve(blocks[5]);
            });
            const actual = yield bitcoinProcessor['revertDatabases']();
            expect(actual).toEqual(blocks[5]);
            expect(lookBackExponentiallySpy).toHaveBeenCalled();
            expect(firstValidBlockSpy).toHaveBeenCalled();
            expect(trimDatabasesToBlockSpy).toHaveBeenCalledWith(blocks[5].height);
            done();
        }));
        it('should return `undefined` as the last valid block if all data have been reverted.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blocks = BlockMetadataGenerator_1.default.generate(10);
            const lookBackExponentiallySpy = spyOn(bitcoinProcessor['blockMetadataStore'], 'lookBackExponentially').and.returnValue(Promise.resolve(blocks));
            // Mock to simulate no valid transaction found.
            const firstValid = spyOn(bitcoinProcessor, 'firstValidBlock').and.returnValue(Promise.resolve(undefined));
            const actual = yield bitcoinProcessor['revertDatabases']();
            expect(actual).toBeUndefined();
            expect(lookBackExponentiallySpy).toHaveBeenCalled();
            expect(firstValid).toHaveBeenCalled();
            expect(trimDatabasesToBlockSpy).toHaveBeenCalled();
            done();
        }));
    });
    describe('trimDatabasesToBlock', () => {
        it('should call the internal data removal methods with correct values.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            trimDatabasesToBlockSpy.and.callThrough();
            const removeBlocksLaterThanSpy = spyOn(bitcoinProcessor['blockMetadataStore'], 'removeLaterThan');
            const removeTransactionsLaterThanSpy = spyOn(bitcoinProcessor['transactionStore'], 'removeTransactionsLaterThan');
            const blockHeight = 123;
            const expectedLastTransactionNumberInBlock = TransactionNumber_1.default.lastTransactionOfBlock(blockHeight);
            yield bitcoinProcessor.trimDatabasesToBlock(blockHeight);
            expect(removeBlocksLaterThanSpy).toHaveBeenCalledWith(123);
            expect(removeTransactionsLaterThanSpy).toHaveBeenCalledWith(expectedLastTransactionNumberInBlock);
            done();
        }));
        it('should call internal data removal methods with `undefined` if no block height is given.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            trimDatabasesToBlockSpy.and.callThrough();
            const removeBlocksLaterThanSpy = spyOn(bitcoinProcessor['blockMetadataStore'], 'removeLaterThan');
            const removeTransactionsLaterThanSpy = spyOn(bitcoinProcessor['transactionStore'], 'removeTransactionsLaterThan');
            yield bitcoinProcessor.trimDatabasesToBlock();
            expect(removeBlocksLaterThanSpy).toHaveBeenCalledWith(undefined);
            expect(removeTransactionsLaterThanSpy).toHaveBeenCalledWith(undefined);
            done();
        }));
    });
    describe('verifyBlock', () => {
        it('should return true if the hash matches given a block height', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const height = randomNumber();
            const hash = randomString();
            bitcoinProcessor['lastProcessedBlock'] = {
                height: 1234,
                hash: 'some hash',
                previousHash: 'previous hash',
                normalizedFee: randomNumber(),
                transactionCount: randomNumber(),
                totalFee: randomNumber()
            };
            const heightMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(Number.MAX_SAFE_INTEGER));
            const hashMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockHash').and.returnValue(hash);
            const actual = yield bitcoinProcessor['verifyBlock'](height, hash);
            expect(actual).toBeTruthy();
            expect(heightMock).toHaveBeenCalled();
            expect(hashMock).toHaveBeenCalled();
            done();
        }));
        it('should return false if the hash does not match given a block height', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const height = randomNumber();
            const hash = randomString();
            bitcoinProcessor['lastProcessedBlock'] = {
                height: 1234,
                hash: 'some hash',
                previousHash: 'previous hash',
                normalizedFee: randomNumber(),
                transactionCount: randomNumber(),
                totalFee: randomNumber()
            };
            const heightMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(Number.MAX_SAFE_INTEGER));
            const hashMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockHash').and.returnValue(randomString());
            const actual = yield bitcoinProcessor['verifyBlock'](height, hash);
            expect(actual).toBeFalsy();
            expect(heightMock).toHaveBeenCalled();
            expect(hashMock).toHaveBeenCalled();
            done();
        }));
        it('should return false if the height passed in is outside block height range', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const height = randomNumber();
            const hash = randomString();
            bitcoinProcessor['lastProcessedBlock'] = {
                height: 1234,
                hash: 'some hash',
                previousHash: 'previous hash',
                normalizedFee: 123,
                transactionCount: 1000,
                totalFee: 1000
            };
            const heightMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getCurrentBlockHeight').and.returnValue(Promise.resolve(1));
            const hashMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockHash').and.returnValue(randomString());
            const actual = yield bitcoinProcessor['verifyBlock'](height, hash);
            expect(actual).toBeFalsy(); // false because 1 < 1234
            expect(heightMock).toHaveBeenCalled();
            expect(hashMock).not.toHaveBeenCalled();
            done();
        }));
    });
    describe('processBlock', () => {
        it('should review all transactions in a block and add valid sidetree txns to the transactionStore', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const block = randomNumber();
            const blockHash = randomString();
            const blockData = {
                height: block,
                hash: blockHash,
                previousHash: 'previous_hash',
                transactions: [
                    { id: 'id', blockHash: 'hash', confirmations: 5, inputs: [], outputs: [] },
                    { id: 'id2', blockHash: 'hash2', confirmations: 5, inputs: [], outputs: [] },
                    { id: 'id3', blockHash: 'hash3', confirmations: 5, inputs: [], outputs: [] }
                ]
            };
            const mockFeeCalculator = {
                calculateNormalizedTransactionFeeFromBlock(block) { return Math.floor(block.normalizedFee); },
                getNormalizedFee() {
                    return __awaiter(this, void 0, void 0, function* () { return 509; });
                },
                addNormalizedFeeToBlockMetadata(block) {
                    return __awaiter(this, void 0, void 0, function* () { return Object.assign({ normalizedFee: 300 }, block); });
                }
            };
            spyOn(bitcoinProcessor['versionManager'], 'getFeeCalculator').and.returnValue(mockFeeCalculator);
            spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockHash').and.returnValue(blockHash);
            spyOn(bitcoinProcessor['bitcoinClient'], 'getBlock').and.returnValue(Promise.resolve(blockData));
            const mockSidetreeTxnModels = [
                { anchorString: 'anchor1', transactionTimeHash: 'timehash1', transactionTime: 100, transactionNumber: 200, transactionFeePaid: 300, normalizedTransactionFee: 400, writer: 'writer1' },
                { anchorString: 'anchor2', transactionTimeHash: 'timehash2', transactionTime: 150, transactionNumber: 250, transactionFeePaid: 350, normalizedTransactionFee: 450, writer: 'writer2' }
            ];
            // Return the mock values one-by-one in order
            let getSidetreeTxnCallIndex = 0;
            spyOn(bitcoinProcessor, 'getSidetreeTransactionModelIfExist').and.callFake(() => {
                let retValue;
                if (getSidetreeTxnCallIndex < mockSidetreeTxnModels.length) {
                    retValue = mockSidetreeTxnModels[getSidetreeTxnCallIndex];
                }
                getSidetreeTxnCallIndex++;
                // Return undefined if we don't have data (to mock no valid sidetree transactions)
                return Promise.resolve(retValue);
            });
            // Verify that the add transaction is called with the correct values
            let addTxnCallIndex = 0;
            const addTransaction = spyOn(bitcoinProcessor['transactionStore'], 'addTransaction').and.callFake((sidetreeTransaction) => {
                expect(sidetreeTransaction).toEqual(mockSidetreeTxnModels[addTxnCallIndex]);
                addTxnCallIndex++;
                return Promise.resolve(undefined);
            });
            const actualBlock = yield bitcoinProcessor['processBlock'](block, blockData.previousHash);
            expect(actualBlock.hash).toEqual(blockData.hash);
            expect(addTransaction.calls.count()).toEqual(2);
            expect(addTxnCallIndex).toEqual(2);
            expect(blockMetadataStoreAddSpy).toHaveBeenCalled();
            done();
        }));
        it('should not add anything to the transaction store if no sidetree transaction is found.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const block = randomNumber();
            const blockHash = randomString();
            const blockData = {
                height: block,
                hash: blockHash,
                previousHash: 'previous_hash',
                transactions: [
                    { id: 'id', blockHash: 'hash', confirmations: 5, inputs: [], outputs: [] },
                    { id: 'id2', blockHash: 'hash2', confirmations: 5, inputs: [], outputs: [] }
                ]
            };
            const mockFeeCalculator = {
                calculateNormalizedTransactionFeeFromBlock(block) { return Math.floor(block.normalizedFee); },
                getNormalizedFee() {
                    return __awaiter(this, void 0, void 0, function* () { return 509; });
                },
                addNormalizedFeeToBlockMetadata(block) {
                    return __awaiter(this, void 0, void 0, function* () { return Object.assign({ normalizedFee: 111 }, block); });
                }
            };
            spyOn(bitcoinProcessor['versionManager'], 'getFeeCalculator').and.returnValue(mockFeeCalculator);
            spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockHash').and.returnValue(blockHash);
            spyOn(bitcoinProcessor['bitcoinClient'], 'getBlock').and.returnValue(Promise.resolve(blockData));
            spyOn(bitcoinProcessor, 'getSidetreeTransactionModelIfExist').and.returnValue(undefined);
            const addTransactionSpy = spyOn(bitcoinProcessor['transactionStore'], 'addTransaction');
            const actualBlock = yield bitcoinProcessor['processBlock'](block, blockData.previousHash);
            expect(actualBlock.hash).toEqual(blockData.hash);
            expect(addTransactionSpy).not.toHaveBeenCalled();
            done();
        }));
        it('should throw if any exception is thrown while going through transactions.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const block = randomNumber();
            const blockHash = randomString();
            const blockData = {
                height: block,
                hash: blockHash,
                previousHash: 'previous_hash',
                transactions: [
                    { id: 'id', blockHash: 'hash', confirmations: 5, inputs: [], outputs: [] }
                ]
            };
            spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockHash').and.returnValue(blockHash);
            spyOn(bitcoinProcessor['bitcoinClient'], 'getBlock').and.returnValue(Promise.resolve(blockData));
            spyOn(bitcoinProcessor, 'getSidetreeTransactionModelIfExist').and.throwError('Test exception');
            const addTransaction = spyOn(bitcoinProcessor['transactionStore'], 'addTransaction');
            try {
                yield bitcoinProcessor['processBlock'](block, blockData.previousHash);
                fail('Expected exception is not thrown');
            }
            catch (e) { }
            expect(addTransaction).not.toHaveBeenCalled();
            done();
        }));
        it('should throw if the previousBlockHash does not match the bitcoin block retrieved', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const block = randomNumber();
            const blockData = BitcoinDataGenerator_1.default.generateBlock(block, () => { return undefined; });
            const blockHash = randomString();
            spyOn(bitcoinProcessor['bitcoinClient'], 'getBlockHash').and.returnValue(blockHash);
            const rpcMock = spyOn(bitcoinProcessor['bitcoinClient'], 'getBlock');
            rpcMock.and.returnValue(Promise.resolve(blockData));
            try {
                yield bitcoinProcessor['processBlock'](block, blockData.previousHash + '-but-not-though');
                fail('expected to throw');
            }
            catch (error) {
                expect(rpcMock).toHaveBeenCalled();
            }
            finally {
                done();
            }
        }));
    });
    describe('getSidetreeTransactionModelIfExist', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should only return the sidetree transaction data if exist.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockSidetreeData = {
                data: 'sidetree data',
                writer: 'writer'
            };
            spyOn(bitcoinProcessor['sidetreeTransactionParser'], 'parse').and.returnValue(Promise.resolve(mockSidetreeData));
            const mockTxnFee = 1000;
            const getTxnFeeSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getTransactionFeeInSatoshis').and.returnValue(Promise.resolve(mockTxnFee));
            const mockTxnNumber = 1000;
            spyOn(TransactionNumber_1.default, 'construct').and.returnValue(1000);
            const mockTxnBlock = 20;
            const mockTxn = {
                blockHash: 'block hash',
                confirmations: 2,
                id: 'id',
                outputs: [],
                inputs: []
            };
            const mockOutputTxnModel = {
                anchorString: mockSidetreeData.data,
                transactionFeePaid: mockTxnFee,
                transactionNumber: mockTxnNumber,
                transactionTime: mockTxnBlock,
                transactionTimeHash: mockTxn.blockHash,
                writer: mockSidetreeData.writer
            };
            const output = yield bitcoinProcessor['getSidetreeTransactionModelIfExist'](mockTxn, 10, mockTxnBlock);
            expect(output).toBeDefined();
            expect(output).toEqual(mockOutputTxnModel);
            expect(getTxnFeeSpy).toHaveBeenCalled();
            done();
        }));
        it('should return undefined if the parse result is undefined.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(bitcoinProcessor['sidetreeTransactionParser'], 'parse').and.returnValue(Promise.resolve(undefined));
            const getTxnFeeSpy = spyOn(bitcoinProcessor['bitcoinClient'], 'getTransactionFeeInSatoshis');
            const getNormalizedFeeSpy = spyOn(bitcoinProcessor, 'getNormalizedFee');
            const mockTxn = {
                blockHash: 'block hash',
                confirmations: 2,
                id: 'id',
                outputs: [],
                inputs: []
            };
            const output = yield bitcoinProcessor['getSidetreeTransactionModelIfExist'](mockTxn, 10, 20);
            expect(output).not.toBeDefined();
            expect(getTxnFeeSpy).not.toHaveBeenCalled();
            expect(getNormalizedFeeSpy).not.toHaveBeenCalled();
            done();
        }));
    }));
    describe('getServiceVersion', () => {
        it('should return the correct response body for the version request', () => __awaiter(void 0, void 0, void 0, function* () {
            const expectedVersion = {
                name: 'test-service',
                version: 'x.y.z'
            };
            // Make the handle service version call return the test value
            spyOn(bitcoinProcessor['serviceInfoProvider'], 'getServiceVersion').and.returnValue(expectedVersion);
            const fetchedVersion = yield bitcoinProcessor.getServiceVersion();
            expect(fetchedVersion.name).toEqual(expectedVersion.name);
            expect(fetchedVersion.version).toEqual(expectedVersion.version);
        }));
    });
    describe('getValueTimeLock', () => {
        it('should call the lock resolver and return the value from it.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockValueTimeLock = {
                amountLocked: 1000,
                identifier: 'lock identifier',
                owner: 'owner',
                unlockTransactionTime: 1233,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            spyOn(bitcoinProcessor['lockResolver'], 'resolveSerializedLockIdentifierAndThrowOnError').and.returnValue(Promise.resolve(mockValueTimeLock));
            const actual = yield bitcoinProcessor.getValueTimeLock('some serialized input');
            expect(actual).toEqual(mockValueTimeLock);
            done();
        }));
        it('should throw request error if lockresolver throws any exception', (done) => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(bitcoinProcessor['lockResolver'], 'resolveSerializedLockIdentifierAndThrowOnError').and.throwError('no lock found.');
            try {
                yield bitcoinProcessor.getValueTimeLock('some serialized input');
                fail('Expected exception is not thrown');
            }
            catch (e) {
                const expectedError = new RequestError_1.default(ResponseStatus_1.default.NotFound, SharedErrorCode_1.default.ValueTimeLockNotFound);
                expect(e).toEqual(expectedError);
            }
            done();
        }));
    });
    describe('generatePrivateKeyForTestnet', () => {
        it('should return a private key string by calling the BitcoinClient', () => {
            const mockPrivateKey = 'mocked private key';
            spyOn(BitcoinClient_1.default, 'generatePrivateKey').and.returnValue(mockPrivateKey);
            const actual = BitcoinProcessor_1.default.generatePrivateKeyForTestnet();
            expect(actual).toEqual(mockPrivateKey);
        });
    });
    describe('getActiveValueTimeLockForThisNode', () => {
        it('should return the value-time-lock from the lock monitor', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockValueTimeLock = {
                amountLocked: 1000,
                identifier: 'lock identifier',
                owner: 'owner',
                unlockTransactionTime: 1233,
                normalizedFee: 100,
                lockTransactionTime: 1220
            };
            spyOn(bitcoinProcessor['lockMonitor'], 'getCurrentValueTimeLock').and.returnValue(Promise.resolve(mockValueTimeLock));
            const actual = yield bitcoinProcessor.getActiveValueTimeLockForThisNode();
            expect(actual).toEqual(mockValueTimeLock);
        }));
        it('should throw not-found error if the lock monitor returns undefined.', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(bitcoinProcessor['lockMonitor'], 'getCurrentValueTimeLock').and.returnValue(Promise.resolve(undefined));
            try {
                yield bitcoinProcessor.getActiveValueTimeLockForThisNode();
                fail('Expected exception is not thrown');
            }
            catch (e) {
                const expectedError = new RequestError_1.default(ResponseStatus_1.default.NotFound, SharedErrorCode_1.default.ValueTimeLockNotFound);
                expect(e).toEqual(expectedError);
            }
        }));
        it('should throw pending-state exception if the lock monitor throws pending-state error', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(bitcoinProcessor['lockMonitor'], 'getCurrentValueTimeLock').and.callFake(() => {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockMonitorCurrentValueTimeLockInPendingState);
            });
            try {
                yield bitcoinProcessor.getActiveValueTimeLockForThisNode();
                fail('Expected exception is not thrown');
            }
            catch (e) {
                const expectedError = new RequestError_1.default(ResponseStatus_1.default.NotFound, ErrorCode_1.default.ValueTimeLockInPendingState);
                expect(e).toEqual(expectedError);
            }
        }));
        it('should bubble up any other errors.', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(bitcoinProcessor['lockMonitor'], 'getCurrentValueTimeLock').and.throwError('no lock found.');
            try {
                yield bitcoinProcessor.getActiveValueTimeLockForThisNode();
                fail('Expected exception is not thrown');
            }
            catch (e) {
                const expectedError = new RequestError_1.default(ResponseStatus_1.default.ServerError);
                expect(e).toEqual(expectedError);
            }
        }));
    });
    describe('upgradeDatabaseIfNeeded', () => {
        beforeEach(() => {
            upgradeDatabaseIfNeededSpy.and.callThrough();
        });
        it('should not perform upgrade if saved database version is the same as the expected version.', () => __awaiter(void 0, void 0, void 0, function* () {
            const serviceStateStorePutSpy = spyOn(bitcoinProcessor['serviceStateStore'], 'put');
            // Simulate that the saved service version is the same as the running service version.
            spyOn(bitcoinProcessor['serviceStateStore'], 'get').and.returnValue(Promise.resolve({ databaseVersion: '1.1.0' }));
            yield bitcoinProcessor.upgradeDatabaseIfNeeded();
            // Verify that upgrade path was not invoked.
            expect(serviceStateStorePutSpy).not.toHaveBeenCalled();
        }));
        it('should perform upgrade if saved database version is older than the expected database version.', () => __awaiter(void 0, void 0, void 0, function* () {
            const serviceStateStorePutSpy = spyOn(bitcoinProcessor['serviceStateStore'], 'put');
            const transactionStoreClearCollectionSpy = spyOn(bitcoinProcessor['transactionStore'], 'clearCollection');
            const blockMetadataStoreClearCollectionSpy = spyOn(bitcoinProcessor['blockMetadataStore'], 'clearCollection');
            // Mock a database version that is definitely older than the expected database version to trigger DB upgrade.
            spyOn(bitcoinProcessor['serviceStateStore'], 'get').and.returnValue(Promise.resolve({ databaseVersion: '0.0.1' }));
            yield bitcoinProcessor.upgradeDatabaseIfNeeded();
            // Verify that that upgrade path was invoked.
            expect(transactionStoreClearCollectionSpy).toHaveBeenCalledBefore(serviceStateStorePutSpy);
            expect(blockMetadataStoreClearCollectionSpy).toHaveBeenCalledBefore(serviceStateStorePutSpy);
            expect(serviceStateStorePutSpy).toHaveBeenCalledWith({ databaseVersion: '1.1.0' });
        }));
        it('should throw if attempting to run older code on newer DB.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock a saved database version that is definitely newer than the expected version to trigger expected error.
            spyOn(bitcoinProcessor['serviceStateStore'], 'get').and.returnValue(Promise.resolve({ databaseVersion: '99999.0.0' }));
            JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => bitcoinProcessor.upgradeDatabaseIfNeeded(), ErrorCode_1.default.DatabaseDowngradeNotAllowed);
        }));
    });
});
//# sourceMappingURL=BitcoinProcessor.spec.js.map