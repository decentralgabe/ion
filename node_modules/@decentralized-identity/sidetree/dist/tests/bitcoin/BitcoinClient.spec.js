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
const nodeFetchPackage = require("node-fetch");
const bitcore_lib_1 = require("bitcore-lib");
const BitcoinClient_1 = require("../../lib/bitcoin/BitcoinClient");
const BitcoinDataGenerator_1 = require("./BitcoinDataGenerator");
const BitcoinWallet_1 = require("../../lib/bitcoin/BitcoinWallet");
const ErrorCode_1 = require("../../lib/bitcoin/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const Logger_1 = require("../../lib/common/Logger");
const ReadableStream_1 = require("../../lib/common/ReadableStream");
describe('BitcoinClient', () => __awaiter(void 0, void 0, void 0, function* () {
    let bitcoinClient;
    let fetchSpy;
    let bitcoinWalletImportString;
    let privateKeyFromBitcoinClient;
    let walletAddressFromBitcoinClient;
    const bitcoinPeerUri = 'uri:someuri';
    const maxRetries = 2;
    beforeEach(() => {
        bitcoinWalletImportString = BitcoinClient_1.default.generatePrivateKey('testnet');
        bitcoinClient = new BitcoinClient_1.default(bitcoinPeerUri, 'u', 'p', bitcoinWalletImportString, 10, maxRetries, 0);
        const bitcoinWallet = bitcoinClient['bitcoinWallet'];
        privateKeyFromBitcoinClient = bitcoinWallet['walletPrivateKey'];
        walletAddressFromBitcoinClient = bitcoinWallet.getAddress();
        // this is always mocked to protect against actual calls to the bitcoin network
        fetchSpy = spyOn(nodeFetchPackage, 'default');
    });
    /**
     * Verifies the given expected input against the actual input to `rpcCall`, then mocks the return value.
     */
    function verifyThenMockRpcCall(expectedMethod, expectedIsWalletRpc, expectedParams, returns) {
        return spyOn(bitcoinClient, 'rpcCall').and.callFake((request, _enableTimeout, isWalletRpc) => {
            expect(isWalletRpc).toEqual(expectedIsWalletRpc);
            expect(request.method).toEqual(expectedMethod);
            expect(request.params).toEqual(expectedParams);
            return Promise.resolve(returns);
        });
    }
    function generateBitcoreTransactionWrapper(bitcoinWalletImportString, outputSatoshis = 1, confirmations = 0) {
        const transaction = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, outputSatoshis);
        const unspentOutput = BitcoinDataGenerator_1.default.generateUnspentCoin(bitcoinWalletImportString, outputSatoshis + 500);
        transaction.from([unspentOutput]);
        // Create the class' internal object
        return {
            id: transaction.id,
            blockHash: 'some hash',
            confirmations: confirmations,
            inputs: transaction.inputs,
            outputs: transaction.outputs
        };
    }
    describe('constructor', () => {
        let ctorWallet;
        let ctorImportString;
        beforeAll(() => {
            ctorImportString = BitcoinClient_1.default.generatePrivateKey('testnet');
            ctorWallet = new BitcoinWallet_1.default(ctorImportString);
        });
        it('should use the wallet that was passed in the parameters', () => {
            const actual = new BitcoinClient_1.default('uri:mock', 'u', 'p', ctorWallet, 10, 10, 10);
            expect(actual['bitcoinWallet']).toEqual(ctorWallet);
        });
        it('should use the wallet created by the import-string parameter', () => {
            const expectedWallet = new BitcoinWallet_1.default(bitcoinWalletImportString);
            const actual = new BitcoinClient_1.default('uri:mock', 'u', 'p', bitcoinWalletImportString, 10, 10, 10);
            expect(actual['bitcoinWallet']).toEqual(expectedWallet);
        });
        it('should use the estimated fee set by the estimatedFeeSatoshiPerKB parameter', () => {
            const expectedEstimatedFee = 42;
            const actual = new BitcoinClient_1.default('uri:mock', 'u', 'p', ctorWallet, 10, 10, 10, expectedEstimatedFee);
            expect(actual['estimatedFeeSatoshiPerKB']).toEqual(expectedEstimatedFee);
        });
        it('should construct without authorization if username and passwords are not supplied', () => {
            const expectedEstimatedFee = 42;
            const actual = new BitcoinClient_1.default('uri:mock', undefined, undefined, ctorWallet, 10, 10, 10, expectedEstimatedFee);
            expect(actual['bitcoinAuthorization']).toEqual(undefined);
        });
    });
    describe('createSidetreeTransaction', () => {
        it('should return the expected result', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTxn = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 5000);
            spyOn(mockTxn, 'getFee').and.returnValue(12345);
            const createTransactionSpy = spyOn(bitcoinClient, 'createTransaction').and.returnValue(Promise.resolve(mockTxn));
            const mockSignedTxn = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 100000);
            const signSpy = spyOn(bitcoinClient['bitcoinWallet'], 'signTransaction').and.returnValue(Promise.resolve(mockSignedTxn));
            const mockSerializedTxn = 'serialized transaction';
            const serializeSpy = spyOn(BitcoinClient_1.default, 'serializeSignedTransaction').and.returnValue(mockSerializedTxn);
            const result = yield bitcoinClient.createSidetreeTransaction('transactionData', 123);
            expect(createTransactionSpy).toHaveBeenCalledWith('transactionData', 123);
            expect(signSpy).toHaveBeenCalledWith(mockTxn);
            expect(serializeSpy).toHaveBeenCalledWith(mockSignedTxn);
            expect(result).toEqual({
                transactionId: mockSignedTxn.id,
                transactionFee: mockTxn.getFee(),
                serializedTransactionObject: mockSerializedTxn
            });
        }));
    });
    describe('generatePrivateKey', () => {
        function validateGeneratedPrivateKey(privateKey) {
            expect(privateKey).toBeDefined();
            expect(typeof privateKey).toEqual('string');
            expect(privateKey.length).toBeGreaterThan(0);
            expect(() => {
                bitcore_lib_1.PrivateKey.fromWIF(privateKey);
            }).not.toThrow();
        }
        it('should construct a PrivateKey and export its WIF', () => {
            const privateKey = BitcoinClient_1.default.generatePrivateKey('testnet');
            validateGeneratedPrivateKey(privateKey);
        });
        it('should return the values for mainnet/livenet', () => {
            const mainNetKey = BitcoinClient_1.default.generatePrivateKey('mainnet');
            validateGeneratedPrivateKey(mainNetKey);
            const livenetKey = BitcoinClient_1.default.generatePrivateKey('livenet');
            validateGeneratedPrivateKey(livenetKey);
        });
    });
    describe('initialize', () => {
        it('should import key if the wallet does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
            const waitUntilBitcoinCoreIsReadySpy = spyOn(bitcoinClient, 'waitUntilBitcoinCoreIsReady').and.returnValue(Promise.resolve(true));
            const walletExistsSpy = spyOn(bitcoinClient, 'isAddressAddedToWallet').and.returnValue(Promise.resolve(false));
            const publicKeyHex = privateKeyFromBitcoinClient.toPublicKey().toBuffer().toString('hex');
            const importSpy = spyOn(bitcoinClient, 'addWatchOnlyAddressToWallet').and.callFake((key, rescan) => {
                expect(key).toEqual(publicKeyHex);
                expect(rescan).toBeTruthy();
                return Promise.resolve(undefined);
            });
            const createWalletSpy = spyOn(bitcoinClient, 'createWallet');
            const loadWalletSpy = spyOn(bitcoinClient, 'loadWallet');
            yield bitcoinClient.initialize();
            expect(waitUntilBitcoinCoreIsReadySpy).toHaveBeenCalled();
            expect(walletExistsSpy).toHaveBeenCalled();
            expect(importSpy).toHaveBeenCalled();
            expect(createWalletSpy).toHaveBeenCalled();
            expect(loadWalletSpy).toHaveBeenCalled();
        }));
        it('should not import key if the wallet already exist', () => __awaiter(void 0, void 0, void 0, function* () {
            const waitUntilBitcoinCoreIsReadySpy = spyOn(bitcoinClient, 'waitUntilBitcoinCoreIsReady').and.returnValue(Promise.resolve(true));
            const walletExistsSpy = spyOn(bitcoinClient, 'isAddressAddedToWallet').and.returnValue(Promise.resolve(true));
            const importSpy = spyOn(bitcoinClient, 'addWatchOnlyAddressToWallet');
            const createWalletSpy = spyOn(bitcoinClient, 'createWallet');
            const loadWalletSpy = spyOn(bitcoinClient, 'loadWallet');
            yield bitcoinClient.initialize();
            expect(waitUntilBitcoinCoreIsReadySpy).toHaveBeenCalled();
            expect(walletExistsSpy).toHaveBeenCalled();
            expect(importSpy).not.toHaveBeenCalled();
            expect(createWalletSpy).toHaveBeenCalled();
            expect(loadWalletSpy).toHaveBeenCalled();
        }));
    });
    describe('waitUntilBitcoinCoreIsReady', () => {
        it('should keep checking status until Bitcoin Core is fully sync-ed', () => __awaiter(void 0, void 0, void 0, function* () {
            const firstBitcoinCoreState = {
                headers: 100,
                blocks: 20 // simulates 20% synchronization
            };
            const secondBitcoinCoreState = {
                headers: 100,
                blocks: 100 // simulates 100% synchronization
            };
            const rpcSpy = spyOn(bitcoinClient, 'rpcCall').and.returnValues(firstBitcoinCoreState, secondBitcoinCoreState);
            const pollingWindowInSeconds = 0; // skip any waiting in unit tests
            yield bitcoinClient['waitUntilBitcoinCoreIsReady'](pollingWindowInSeconds);
            expect(rpcSpy).toHaveBeenCalledTimes(2);
        }));
        it('should keep checking status if error is encountered', () => __awaiter(void 0, void 0, void 0, function* () {
            const firstBitcoinCoreState = undefined; // forcing an error to be thrown internally
            const secondBitcoinCoreState = {
                headers: 100,
                blocks: 100 // simulates 100% synchronization
            };
            const rpcSpy = spyOn(bitcoinClient, 'rpcCall').and.returnValues(firstBitcoinCoreState, secondBitcoinCoreState);
            const pollingWindowInSeconds = 0; // skip any waiting in unit tests
            yield bitcoinClient['waitUntilBitcoinCoreIsReady'](pollingWindowInSeconds);
            expect(rpcSpy).toHaveBeenCalledTimes(2);
        }));
    });
    describe('broadcastSidetreeTransaction', () => {
        it('should call broadcastTransactionRpc with expected argument', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const verifyThenMockRpcCall = spyOn(bitcoinClient, 'broadcastTransactionRpc').and.returnValue('some value');
            yield bitcoinClient.broadcastSidetreeTransaction({ transactionId: 'someId', transactionFee: 1223, serializedTransactionObject: 'abc' });
            expect(verifyThenMockRpcCall).toHaveBeenCalledTimes(1);
            done();
        }));
    });
    describe('broadcastLockTransaction', () => {
        it('should call the utility function with correct input.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockInputTxnModel = {
                transactionId: 'some txn id',
                transactionFee: 100,
                redeemScriptAsHex: 'some-redeem-script',
                serializedTransactionObject: 'serialized-lock-transaction-object'
            };
            const mockUtilFuncResponse = 'mock-response';
            const spy = spyOn(bitcoinClient, 'broadcastTransactionRpc').and.returnValue(Promise.resolve(mockUtilFuncResponse));
            const actual = yield bitcoinClient.broadcastLockTransaction(mockInputTxnModel);
            expect(actual).toEqual(mockUtilFuncResponse);
            expect(spy).toHaveBeenCalledWith(mockInputTxnModel.serializedTransactionObject);
            done();
        }));
    });
    describe('createLockTransaction', () => {
        it('should create the lock transaction.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFreezeTxn = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString);
            spyOn(mockFreezeTxn, 'getFee').and.returnValue(122987);
            const mockRedeemScript = bitcore_lib_1.Script.empty().add(177);
            const mockUnspentOutput = BitcoinDataGenerator_1.default.generateUnspentCoin(bitcoinWalletImportString, 1233423426);
            spyOn(bitcoinClient, 'getUnspentOutputs').and.returnValue(Promise.resolve([mockUnspentOutput]));
            const mockCreateFreezeTxnOutput = [mockFreezeTxn, mockRedeemScript];
            const createFreezeTxnSpy = spyOn(bitcoinClient, 'createFreezeTransaction').and.returnValue(Promise.resolve(mockCreateFreezeTxnOutput));
            const mockSignedTxn = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 19988);
            const signSpy = spyOn(bitcoinClient['bitcoinWallet'], 'signFreezeTransaction').and.returnValue(Promise.resolve(mockSignedTxn));
            const mockSerializedTxn = 'mocked serialized transaction';
            const serializeSpy = spyOn(BitcoinClient_1.default, 'serializeSignedTransaction').and.returnValue(mockSerializedTxn);
            const lockAmountInput = 123456;
            const lockUntilBlockInput = 789005;
            const actual = yield bitcoinClient.createLockTransaction(lockAmountInput, lockUntilBlockInput);
            expect(createFreezeTxnSpy).toHaveBeenCalledWith([mockUnspentOutput], lockUntilBlockInput, lockAmountInput);
            expect(signSpy).toHaveBeenCalledWith(mockFreezeTxn, mockRedeemScript);
            expect(serializeSpy).toHaveBeenCalledWith(mockSignedTxn);
            const expectedOutput = {
                transactionId: mockSignedTxn.id,
                transactionFee: mockFreezeTxn.getFee(),
                redeemScriptAsHex: mockRedeemScript.toHex(),
                serializedTransactionObject: mockSerializedTxn
            };
            expect(actual).toEqual(expectedOutput);
        }));
    });
    describe('createRelockTransaction', () => {
        it('should create the relock transaction.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFreezeTxn = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString);
            spyOn(mockFreezeTxn, 'getFee').and.returnValue(122987);
            const mockPreviousFreezeTxn = generateBitcoreTransactionWrapper(bitcoinWalletImportString);
            const mockRedeemScript = bitcore_lib_1.Script.empty().add(177);
            const mockCreateFreezeTxnOutput = [mockFreezeTxn, mockRedeemScript];
            const createFreezeTxnSpy = spyOn(bitcoinClient, 'createSpendToFreezeTransaction').and.returnValue(Promise.resolve(mockCreateFreezeTxnOutput));
            spyOn(bitcoinClient, 'getRawTransactionRpc').and.returnValue(Promise.resolve(mockPreviousFreezeTxn));
            const mockPreviousRedeemScript = bitcore_lib_1.Script.empty().add(179);
            const createScriptSpy = spyOn(BitcoinClient_1.default, 'createFreezeScript').and.returnValue(mockPreviousRedeemScript);
            const mockSignedTxn = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 19988);
            const signSpy = spyOn(bitcoinClient['bitcoinWallet'], 'signSpendFromFreezeTransaction').and.returnValue(Promise.resolve(mockSignedTxn));
            const mockSerializedTxn = 'mocked serialized transaction';
            const serializeSpy = spyOn(BitcoinClient_1.default, 'serializeSignedTransaction').and.returnValue(mockSerializedTxn);
            const existingLockBlockInput = 123456;
            const lockUntilBlockInput = 789005;
            const actual = yield bitcoinClient.createRelockTransaction('previousFreezeTxnId', existingLockBlockInput, lockUntilBlockInput);
            expect(createFreezeTxnSpy).toHaveBeenCalledWith(mockPreviousFreezeTxn, existingLockBlockInput, lockUntilBlockInput);
            expect(createScriptSpy).toHaveBeenCalledWith(existingLockBlockInput, walletAddressFromBitcoinClient);
            expect(signSpy).toHaveBeenCalledWith(mockFreezeTxn, mockPreviousRedeemScript, mockRedeemScript);
            expect(serializeSpy).toHaveBeenCalledWith(mockSignedTxn);
            const expectedOutput = {
                transactionId: mockSignedTxn.id,
                transactionFee: mockFreezeTxn.getFee(),
                redeemScriptAsHex: mockRedeemScript.toHex(),
                serializedTransactionObject: mockSerializedTxn
            };
            expect(actual).toEqual(expectedOutput);
        }));
    });
    describe('createReleaseLockTransaction', () => {
        it('should create the relock transaction.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFreezeTxn = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString);
            const mockPreviousFreezeTxn = generateBitcoreTransactionWrapper(bitcoinWalletImportString);
            const createBack2WalletTxnSpy = spyOn(bitcoinClient, 'createSpendToWalletTransaction').and.returnValue(Promise.resolve(mockFreezeTxn));
            spyOn(bitcoinClient, 'getRawTransactionRpc').and.returnValue(Promise.resolve(mockPreviousFreezeTxn));
            const mockPreviousRedeemScript = 'previous redeem script';
            const createScriptSpy = spyOn(BitcoinClient_1.default, 'createFreezeScript').and.returnValue(mockPreviousRedeemScript);
            const mockSignedTxn = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 19988);
            const signSpy = spyOn(bitcoinClient['bitcoinWallet'], 'signSpendFromFreezeTransaction').and.returnValue(Promise.resolve(mockSignedTxn));
            const mockSerializedTxn = 'mocked serialized transaction';
            const serializeSpy = spyOn(BitcoinClient_1.default, 'serializeSignedTransaction').and.returnValue(mockSerializedTxn);
            const existingLockBlockInput = 123456;
            const actual = yield bitcoinClient.createReleaseLockTransaction('previousFreezeTxnId', existingLockBlockInput);
            expect(createBack2WalletTxnSpy).toHaveBeenCalledWith(mockPreviousFreezeTxn, existingLockBlockInput);
            expect(createScriptSpy).toHaveBeenCalledWith(existingLockBlockInput, walletAddressFromBitcoinClient);
            expect(signSpy).toHaveBeenCalledWith(mockFreezeTxn, mockPreviousRedeemScript, undefined);
            expect(serializeSpy).toHaveBeenCalledWith(mockSignedTxn);
            const expectedOutput = {
                transactionId: mockSignedTxn.id,
                transactionFee: mockFreezeTxn.getFee(),
                redeemScriptAsHex: '',
                serializedTransactionObject: mockSerializedTxn
            };
            expect(actual).toEqual(expectedOutput);
        }));
    });
    describe('createWallet', () => {
        it('should create a wallet', () => __awaiter(void 0, void 0, void 0, function* () {
            const rpcSpy = spyOn(bitcoinClient, 'rpcCall').and.returnValue({});
            const loggerSpy = spyOn(Logger_1.default, 'info');
            yield bitcoinClient['createWallet']();
            expect(rpcSpy).toHaveBeenCalledWith({
                method: 'createwallet',
                params: ['sidetreeDefaultWallet']
            }, true, false);
            expect(loggerSpy).toHaveBeenCalledWith(`Wallet created with name "sidetreeDefaultWallet".`);
        }));
        it('should throw error when create wallet fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const rpcSpy = spyOn(bitcoinClient, 'rpcCall').and.throwError('fake test error');
            try {
                yield bitcoinClient['createWallet']();
                fail('should have thrown but did not');
            }
            catch (_a) {
                expect(rpcSpy).toHaveBeenCalledWith({
                    method: 'createwallet',
                    params: ['sidetreeDefaultWallet']
                }, true, false);
            }
        }));
        it('should log info when wallet already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            const rpcSpy = spyOn(bitcoinClient, 'rpcCall').and.throwError('Wallet file verification failed. Failed to create path abc/def. Database already exists.');
            const loggerSpy = spyOn(Logger_1.default, 'info');
            yield bitcoinClient['createWallet']();
            expect(rpcSpy).toHaveBeenCalledWith({
                method: 'createwallet',
                params: ['sidetreeDefaultWallet']
            }, true, false);
            expect(loggerSpy).toHaveBeenCalledWith(`Wallet with name sidetreeDefaultWallet already exists.`);
        }));
    });
    describe('loadWallet', () => {
        it('should load a wallet', () => __awaiter(void 0, void 0, void 0, function* () {
            const rpcSpy = spyOn(bitcoinClient, 'rpcCall').and.returnValue({});
            const loggerSpy = spyOn(Logger_1.default, 'info');
            yield bitcoinClient['loadWallet']();
            expect(rpcSpy).toHaveBeenCalledWith({
                method: 'loadwallet',
                params: ['sidetreeDefaultWallet', true]
            }, true, false);
            expect(loggerSpy).toHaveBeenCalledWith(`Wallet loaded with name "sidetreeDefaultWallet".`);
        }));
        it('should throw error when load wallet fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const rpcSpy = spyOn(bitcoinClient, 'rpcCall').and.throwError('fake test error');
            try {
                yield bitcoinClient['loadWallet']();
                fail('should have thrown but did not');
            }
            catch (_a) {
                expect(rpcSpy).toHaveBeenCalledWith({
                    method: 'loadwallet',
                    params: ['sidetreeDefaultWallet', true]
                }, true, false);
            }
        }));
        it('should log info when wallet is already loaded', () => __awaiter(void 0, void 0, void 0, function* () {
            const rpcSpy = spyOn(bitcoinClient, 'rpcCall').and.throwError('Wallet file verification failed. Data file abc/def is already loaded.');
            const loggerSpy = spyOn(Logger_1.default, 'info');
            yield bitcoinClient['loadWallet']();
            expect(rpcSpy).toHaveBeenCalledWith({
                method: 'loadwallet',
                params: ['sidetreeDefaultWallet', true]
            }, true, false);
            expect(loggerSpy).toHaveBeenCalledWith(`Wallet with name sidetreeDefaultWallet already loaded.`);
        }));
    });
    describe('getBlock', () => {
        it('should get the block data.', () => __awaiter(void 0, void 0, void 0, function* () {
            const transaction = generateBitcoreTransactionWrapper(bitcoinWalletImportString);
            const hash = 'block_hash';
            const blockData = {
                hash: hash,
                height: 2,
                tx: [
                    { hex: Buffer.from(transaction.toString()).toString('hex') }
                ],
                previousblockhash: 'some other hash'
            };
            spyOn(BitcoinClient_1.default, 'createBitcoreTransactionWrapper').and.returnValue(transaction);
            const expectedIsWalletRpc = false;
            const spy = verifyThenMockRpcCall('getblock', expectedIsWalletRpc, [hash, 2], blockData);
            const actual = yield bitcoinClient.getBlock(hash);
            expect(spy).toHaveBeenCalled();
            expect(actual.hash).toEqual(blockData.hash);
            expect(actual.height).toEqual(blockData.height);
            expect(actual.previousHash).toEqual(blockData.previousblockhash);
            expect(actual.transactions[0]).toEqual(BitcoinClient_1.default['createBitcoinTransactionModel'](transaction));
        }));
    });
    describe('getBlockHash', () => {
        it('should get the block hash', () => __awaiter(void 0, void 0, void 0, function* () {
            const height = 512;
            const hash = 'ADSFSAEF34359';
            const expectedIsWalletRpc = false;
            const spy = verifyThenMockRpcCall('getblockhash', expectedIsWalletRpc, [height], hash);
            const actual = yield bitcoinClient.getBlockHash(height);
            expect(actual).toEqual(hash);
            expect(spy).toHaveBeenCalled();
        }));
    });
    describe('getBlockInfo', () => {
        it('should get the block info', () => __awaiter(void 0, void 0, void 0, function* () {
            const height = 1234;
            const hash = 'some hash value';
            const previousHash = Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(32);
            const expectedIsWalletRpc = false;
            const spy = verifyThenMockRpcCall('getblockheader', expectedIsWalletRpc, [hash, true], { height: height, previousblockhash: previousHash });
            const actual = yield bitcoinClient.getBlockInfo(hash);
            expect(actual.hash).toEqual(hash);
            expect(actual.height).toEqual(height);
            expect(actual.previousHash).toEqual(previousHash);
            expect(spy).toHaveBeenCalled();
        }));
    });
    describe('getBlockInfoFromHeight', () => {
        it('should get the block info', () => __awaiter(void 0, void 0, void 0, function* () {
            const height = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
            const hash = 'some hash value';
            const previousHash = 'some other hash';
            const heightSpy = spyOn(bitcoinClient, 'getBlockHash').and.callFake((calledHeight) => {
                expect(calledHeight).toEqual(height);
                return Promise.resolve(hash);
            });
            const expectedIsWalletRpc = false;
            const spy = verifyThenMockRpcCall('getblockheader', expectedIsWalletRpc, [hash, true], { height: height, previousblockhash: previousHash });
            const actual = yield bitcoinClient.getBlockInfoFromHeight(height);
            expect(actual.hash).toEqual(hash);
            expect(actual.height).toEqual(height);
            expect(actual.previousHash).toEqual(previousHash);
            expect(spy).toHaveBeenCalled();
            expect(heightSpy).toHaveBeenCalled();
        }));
    });
    describe('getCurrentBlockHeight', () => {
        it('should return the latest block', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const height = 753;
            const expectedParams = undefined;
            const expectedIsWalletRpc = false;
            const mock = verifyThenMockRpcCall('getblockcount', expectedIsWalletRpc, expectedParams, height);
            const actual = yield bitcoinClient.getCurrentBlockHeight();
            expect(actual).toEqual(height);
            expect(mock).toHaveBeenCalled();
            done();
        }));
    });
    describe('getRawTransaction', () => {
        it('should make the correct rpc call and return the transaction object', () => __awaiter(void 0, void 0, void 0, function* () {
            const txnId = 'transaction_id';
            const mockTransaction = generateBitcoreTransactionWrapper(bitcoinWalletImportString, 50);
            const mockTransactionAsOutputTxn = BitcoinClient_1.default['createBitcoinTransactionModel'](mockTransaction);
            const spy = spyOn(bitcoinClient, 'getRawTransactionRpc').and.returnValue(mockTransaction);
            const actual = yield bitcoinClient.getRawTransaction(txnId);
            expect(actual).toEqual(mockTransactionAsOutputTxn);
            expect(spy).toHaveBeenCalled();
        }));
    });
    describe('getRawTransactionRpc', () => {
        it('should make the correct rpc call and return the transaction object', () => __awaiter(void 0, void 0, void 0, function* () {
            const txnId = 'transaction_id';
            const confirmations = 23;
            const mockTransaction = generateBitcoreTransactionWrapper(bitcoinWalletImportString, 50, confirmations);
            spyOn(BitcoinClient_1.default, 'createBitcoreTransactionWrapper').and.returnValue(mockTransaction);
            const expectedIsWalletRpc = false;
            const spy = verifyThenMockRpcCall('getrawtransaction', expectedIsWalletRpc, [txnId, true], {
                confirmations: confirmations,
                hex: Buffer.from('serialized txn').toString('hex')
            });
            const actual = yield bitcoinClient['getRawTransactionRpc'](txnId);
            expect(actual).toEqual(mockTransaction);
            expect(spy).toHaveBeenCalled();
        }));
        it('should handle the case if the confirmations parameter from the blockchain is undefined', () => __awaiter(void 0, void 0, void 0, function* () {
            const txnId = 'transaction_id';
            const mockTransaction = generateBitcoreTransactionWrapper(bitcoinWalletImportString, 50, 0);
            spyOn(BitcoinClient_1.default, 'createBitcoreTransactionWrapper').and.returnValue(mockTransaction);
            const expectedIsWalletRpc = false;
            const spy = verifyThenMockRpcCall('getrawtransaction', expectedIsWalletRpc, [txnId, true], {
                confirmations: undefined,
                hex: Buffer.from('serialized txn').toString('hex')
            });
            const actual = yield bitcoinClient['getRawTransactionRpc'](txnId);
            expect(actual).toEqual(mockTransaction);
            expect(spy).toHaveBeenCalled();
        }));
    });
    describe('createTransactionFromBuffer', () => {
        it('should create the Transaction object correctly.', () => {
            const transaction = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 100);
            const unspentOutput = BitcoinDataGenerator_1.default.generateUnspentCoin(bitcoinWalletImportString, 500);
            transaction.from([unspentOutput]);
            const actual = BitcoinClient_1.default['createTransactionFromBuffer'](transaction.toBuffer());
            expect(actual.inputs.length).toEqual(transaction.inputs.length);
            expect(actual.inputs[0].script.toASM()).toEqual(transaction.inputs[0].script.toASM());
            expect(actual.outputs.length).toEqual(transaction.outputs.length);
            expect(actual.outputs[0].script.toASM()).toEqual(transaction.outputs[0].script.toASM());
        });
    });
    describe('createBitcoreTransactionWrapper', () => {
        it('should create the transaction object with the inputs passed in', () => {
            const mockTransaction = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 400);
            spyOn(BitcoinClient_1.default, 'createTransactionFromBuffer').and.returnValue(mockTransaction);
            const expectedTxn = {
                id: mockTransaction.id,
                blockHash: 'block hash',
                confirmations: 50,
                inputs: mockTransaction.inputs,
                outputs: mockTransaction.outputs
            };
            const actual = BitcoinClient_1.default['createBitcoreTransactionWrapper'](Buffer.from('mock input'), expectedTxn.confirmations, expectedTxn.blockHash);
            expect(actual).toEqual(expectedTxn);
        });
    });
    describe('getCurrentEstimatedFeeInSatoshisPerKB', () => {
        const expectedIsWalletRpc = false;
        it('should call the correct rpc and return the fee', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFeeInBitcoins = 155;
            const spy = verifyThenMockRpcCall('estimatesmartfee', expectedIsWalletRpc, [1], { feerate: mockFeeInBitcoins });
            const expectedFeeInSatoshis = mockFeeInBitcoins * 100000000;
            const actual = yield bitcoinClient['getCurrentEstimatedFeeInSatoshisPerKB']();
            expect(actual).toEqual(expectedFeeInSatoshis);
            expect(spy).toHaveBeenCalled();
        }));
        it('should throw if the feerate undefined', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const spy = verifyThenMockRpcCall('estimatesmartfee', expectedIsWalletRpc, [1], {});
            try {
                yield bitcoinClient['getCurrentEstimatedFeeInSatoshisPerKB']();
                fail('should have thrown');
            }
            catch (error) {
                expect(spy).toHaveBeenCalled();
            }
            done();
        }));
        it('should throw if the there are any errors returned', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const spy = verifyThenMockRpcCall('estimatesmartfee', expectedIsWalletRpc, [1], { feerate: 1, errors: ['some error'] });
            try {
                yield bitcoinClient['getCurrentEstimatedFeeInSatoshisPerKB']();
                fail('should have thrown');
            }
            catch (error) {
                expect(spy).toHaveBeenCalled();
            }
            done();
        }));
    });
    describe('updateEstimatedFeeInSatoshisPerKB', () => {
        it('should always call the correct rpc and return the updated fee', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFeeInBitcoins = 156;
            const expectedFeeInSatoshis = mockFeeInBitcoins * 100000000;
            const spy = spyOn(bitcoinClient, 'getCurrentEstimatedFeeInSatoshisPerKB').and.returnValue(expectedFeeInSatoshis);
            const actual = yield bitcoinClient['updateEstimatedFeeInSatoshisPerKB']();
            expect(actual).toEqual(expectedFeeInSatoshis);
            expect(bitcoinClient['estimatedFeeSatoshiPerKB']).toEqual(expectedFeeInSatoshis);
            expect(spy).toHaveBeenCalled();
        }));
        it('should always call the correct rpc and return the stored fee on error', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFeeInBitcoins = 157;
            const spy = spyOn(bitcoinClient, 'getCurrentEstimatedFeeInSatoshisPerKB');
            spy.and.throwError('test');
            const expectedFeeInSatoshis = mockFeeInBitcoins * 100000000;
            bitcoinClient['estimatedFeeSatoshiPerKB'] = expectedFeeInSatoshis;
            const actual = yield bitcoinClient['updateEstimatedFeeInSatoshisPerKB']();
            expect(actual).toEqual(expectedFeeInSatoshis);
            expect(bitcoinClient['estimatedFeeSatoshiPerKB']).toEqual(expectedFeeInSatoshis);
            expect(spy).toHaveBeenCalled();
        }));
        it('should rethrow RPC error when no fee was stored', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const spy = spyOn(bitcoinClient, 'getCurrentEstimatedFeeInSatoshisPerKB');
            spy.and.throwError('test');
            try {
                yield bitcoinClient['updateEstimatedFeeInSatoshisPerKB']();
                fail('should have thrown');
            }
            catch (_a) {
                expect(spy).toHaveBeenCalled();
            }
            finally {
                done();
            }
        }));
    });
    describe('getTransactionOutValueInSatoshi', () => {
        it('should return the satoshis from the correct output index.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTxnWithMultipleOutputs = {
                id: 'someid',
                blockHash: 'block Hash',
                confirmations: 30,
                inputs: [],
                outputs: [
                    { satoshis: 100, scriptAsmAsString: 'script1' },
                    { satoshis: 200, scriptAsmAsString: 'script2' }
                ]
            };
            spyOn(bitcoinClient, 'getRawTransaction').and.returnValue(Promise.resolve(mockTxnWithMultipleOutputs));
            const outputFromZeroIdx = yield bitcoinClient['getTransactionOutValueInSatoshi']('someId', 0);
            expect(outputFromZeroIdx).toEqual(100);
            const outputFromOneIdx = yield bitcoinClient['getTransactionOutValueInSatoshi']('someId', 1);
            expect(outputFromOneIdx).toEqual(200);
        }));
    });
    describe('getTransactionFeeInSatoshis', () => {
        it('should return the inputs - outputs.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTxn = {
                id: 'someid',
                blockHash: 'block hash',
                confirmations: 4,
                inputs: [
                    { previousTransactionId: 'prevTxnId', outputIndexInPreviousTransaction: 0, scriptAsmAsString: 'inputscript' }
                ],
                outputs: [
                    { satoshis: 100, scriptAsmAsString: 'script1' },
                    { satoshis: 200, scriptAsmAsString: 'script2' }
                ]
            };
            const mockTxnOutputsSum = 300; // manually calculated based on the mockTxn above
            const mockInputsSum = 500;
            spyOn(bitcoinClient, 'getRawTransaction').and.returnValue(Promise.resolve(mockTxn));
            spyOn(bitcoinClient, 'getTransactionOutValueInSatoshi').and.returnValue(Promise.resolve(mockInputsSum));
            const actual = yield bitcoinClient.getTransactionFeeInSatoshis('someid');
            expect(actual).toEqual(mockInputsSum - mockTxnOutputsSum);
        }));
    });
    describe('createBitcoinOutputModel', () => {
        it('should work if the output does not have any script', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockOutput = { script: undefined, saotshis: 123 };
            const actual = BitcoinClient_1.default['createBitcoinOutputModel'](mockOutput);
            expect(actual.scriptAsmAsString).toEqual('');
            expect(actual.satoshis).toEqual(mockOutput.satoshis);
            done();
        }));
    });
    describe('getUnspentOutputs', () => {
        it('should query for unspent output coins given an address', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const coin = BitcoinDataGenerator_1.default.generateUnspentCoin(bitcoinWalletImportString, 1);
            const expectedIsWalletRpc = true;
            const minimumConfirmations = 0;
            const rpcCallSpy = verifyThenMockRpcCall('listunspent', expectedIsWalletRpc, [minimumConfirmations, null, [walletAddressFromBitcoinClient.toString()]], [
                {
                    txId: coin.txId,
                    outputIndex: coin.outputIndex,
                    address: coin.address,
                    script: coin.script,
                    satoshis: coin.satoshis
                }
            ]);
            const actual = yield bitcoinClient['getUnspentOutputs'](walletAddressFromBitcoinClient);
            expect(rpcCallSpy).toHaveBeenCalled();
            expect(actual[0].satoshis).toEqual(coin.satoshis);
            done();
        }));
        it('should return empty if no coins were found', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const expectedIsWalletRpc = true;
            const minimumConfirmations = 0;
            const rpcCallSpy = verifyThenMockRpcCall('listunspent', expectedIsWalletRpc, [minimumConfirmations, null, [walletAddressFromBitcoinClient.toString()]], []);
            const actual = yield bitcoinClient['getUnspentOutputs'](walletAddressFromBitcoinClient);
            expect(rpcCallSpy).toHaveBeenCalled();
            expect(actual).toEqual([]);
            done();
        }));
    });
    describe('addWatchOnlyAddressToWallet', () => {
        it('should call the importpubkey API', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const expectedIsWalletRpc = true;
            const publicKeyAsHex = 'some dummy value';
            const rescan = true;
            const spy = verifyThenMockRpcCall('importpubkey', expectedIsWalletRpc, [publicKeyAsHex, 'sidetree', rescan], []);
            yield bitcoinClient['addWatchOnlyAddressToWallet'](publicKeyAsHex, rescan);
            expect(spy).toHaveBeenCalled();
            done();
        }));
    });
    describe('broadcastTransactionRpc', () => {
        it('should call the correct rpc with the input.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const expectedIsWalletRpc = false;
            const mockRawTransaction = 'mocked-raw-transaction';
            const mockRpcOutput = 'mockRpcOutput';
            const spy = verifyThenMockRpcCall('sendrawtransaction', expectedIsWalletRpc, [mockRawTransaction], mockRpcOutput);
            const actual = yield bitcoinClient['broadcastTransactionRpc'](mockRawTransaction);
            expect(actual).toEqual(mockRpcOutput);
            expect(spy).toHaveBeenCalled();
            done();
        }));
        it('should throw if the RPC call fails.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const expectedIsWalletRpc = false;
            const mockRawTransaction = 'mocked-raw-transaction';
            const mockRpcOutput = 'mockRpcOutput';
            const spy = verifyThenMockRpcCall('sendrawtransaction', expectedIsWalletRpc, [mockRawTransaction], mockRpcOutput);
            spy.and.throwError('test');
            try {
                yield bitcoinClient['broadcastTransactionRpc'](mockRawTransaction);
                fail('should have thrown');
            }
            catch (error) {
                expect(error.message).toContain('test');
                expect(spy).toHaveBeenCalled();
            }
            finally {
                done();
            }
        }));
    });
    describe('createTransaction', () => {
        let originalFeeMarkupPercentage;
        beforeEach(() => {
            originalFeeMarkupPercentage = bitcoinClient['sidetreeTransactionFeeMarkupPercentage'];
        });
        afterEach(() => {
            bitcoinClient['sidetreeTransactionFeeMarkupPercentage'] = originalFeeMarkupPercentage;
        });
        it('should create the transaction object using fee passed in if it is greater', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const availableSatoshis = 5000;
            const unspentCoin = BitcoinDataGenerator_1.default.generateUnspentCoin(bitcoinWalletImportString, availableSatoshis);
            spyOn(bitcoinClient, 'getUnspentOutputs').and.returnValue(Promise.resolve([unspentCoin]));
            // The calculated fee is less than the one passed in
            spyOn(bitcoinClient, 'calculateTransactionFee').and.returnValue(Promise.resolve(1));
            const dataToWrite = 'data to write';
            const dataToWriteInHex = Buffer.from(dataToWrite).toString('hex');
            const fee = availableSatoshis / 2;
            const transaction = yield bitcoinClient['createTransaction'](dataToWrite, fee);
            expect(transaction.getFee()).toEqual(fee);
            expect(transaction.outputs[0].script.toASM()).toContain(dataToWriteInHex);
            done();
        }));
        it('should create the transaction object and apply markup and round up to nearest int when using the fee passed in', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const availableSatoshis = 5000;
            const unspentCoin = BitcoinDataGenerator_1.default.generateUnspentCoin(bitcoinWalletImportString, availableSatoshis);
            spyOn(bitcoinClient, 'getUnspentOutputs').and.returnValue(Promise.resolve([unspentCoin]));
            // The calculated fee is less than the one passed in
            spyOn(bitcoinClient, 'calculateTransactionFee').and.returnValue(Promise.resolve(1));
            bitcoinClient['sidetreeTransactionFeeMarkupPercentage'] = 10;
            const dataToWrite = 'data to write';
            const dataToWriteInHex = Buffer.from(dataToWrite).toString('hex');
            const fee = availableSatoshis / 2;
            const transaction = yield bitcoinClient['createTransaction'](dataToWrite, fee);
            expect(transaction.getFee()).toEqual(Math.ceil(fee * 110 / 100));
            expect(transaction.outputs[0].script.toASM()).toContain(dataToWriteInHex);
            done();
        }));
        it('should create the transaction object using calculated fee if it is greater', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const availableSatoshis = 5000;
            const calculatedFee = 3000;
            const unspentCoin = BitcoinDataGenerator_1.default.generateUnspentCoin(bitcoinWalletImportString, availableSatoshis);
            spyOn(bitcoinClient, 'getUnspentOutputs').and.returnValue(Promise.resolve([unspentCoin]));
            // The calculated fee is greater than the fee passed in
            spyOn(bitcoinClient, 'calculateTransactionFee').and.returnValue(Promise.resolve(calculatedFee));
            const dataToWrite = 'data to write';
            const dataToWriteInHex = Buffer.from(dataToWrite).toString('hex');
            const fee = availableSatoshis / 2;
            const transaction = yield bitcoinClient['createTransaction'](dataToWrite, fee);
            expect(transaction.getFee()).toEqual(calculatedFee);
            expect(transaction.outputs[0].script.toASM()).toContain(dataToWriteInHex);
            done();
        }));
        it('should create the transaction object using calculated fee with markup, round up to nearest int', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const availableSatoshis = 5000;
            const calculatedFee = 3000;
            const unspentCoin = BitcoinDataGenerator_1.default.generateUnspentCoin(bitcoinWalletImportString, availableSatoshis);
            bitcoinClient['sidetreeTransactionFeeMarkupPercentage'] = 10;
            spyOn(bitcoinClient, 'getUnspentOutputs').and.returnValue(Promise.resolve([unspentCoin]));
            // The calculated fee is greater than the fee passed in
            spyOn(bitcoinClient, 'calculateTransactionFee').and.returnValue(Promise.resolve(calculatedFee));
            const dataToWrite = 'data to write';
            const dataToWriteInHex = Buffer.from(dataToWrite).toString('hex');
            const fee = availableSatoshis / 2;
            const transaction = yield bitcoinClient['createTransaction'](dataToWrite, fee);
            expect(transaction.getFee()).toEqual(Math.ceil(calculatedFee * 110 / 100));
            expect(transaction.outputs[0].script.toASM()).toContain(dataToWriteInHex);
            done();
        }));
    });
    describe('calculateTransactionFee', () => {
        it('should calculate the fee correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            const estimatedFee = 1528;
            spyOn(bitcoinClient, 'getCurrentEstimatedFeeInSatoshisPerKB').and.returnValue(estimatedFee);
            const mockTransaction = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 10000);
            const expectedFee = 107;
            const actualFee = yield bitcoinClient['calculateTransactionFee'](mockTransaction);
            expect(expectedFee).toEqual(actualFee);
        }));
        it('should throw if no stored estimate and the fee estimate throws', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const spy = spyOn(bitcoinClient, 'getCurrentEstimatedFeeInSatoshisPerKB');
            spy.and.throwError('test');
            const mockTransaction = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 10000);
            try {
                yield bitcoinClient['calculateTransactionFee'](mockTransaction);
                fail('should have thrown');
            }
            catch (_a) {
                expect(spy).toHaveBeenCalled();
            }
            finally {
                done();
            }
        }));
        it('should use stored estimate, if estimate fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const estimatedFee = 1529;
            bitcoinClient['estimatedFeeSatoshiPerKB'] = estimatedFee;
            const spy = spyOn(bitcoinClient, 'getCurrentEstimatedFeeInSatoshisPerKB');
            spy.and.throwError('test');
            const mockTransaction = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 10000);
            const expectedFee = 108;
            const actualFee = yield bitcoinClient['calculateTransactionFee'](mockTransaction);
            expect(expectedFee).toEqual(actualFee);
            expect(spy).toHaveBeenCalled();
        }));
    });
    describe('createFreezeTransaction', () => {
        it('should create the freeze transaction correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFreezeUntilBlock = 987654;
            const mockFreezeAmount = 1000;
            const mockRedeemScript = bitcore_lib_1.Script.empty().add(117);
            const mockRedeemScriptHashOutput = bitcore_lib_1.Script.buildScriptHashOut(mockRedeemScript);
            const mockUnspentOutput = BitcoinDataGenerator_1.default.generateUnspentCoin(bitcoinWalletImportString, Math.pow(10, 8));
            const mockTxnFee = 2000;
            const createScriptSpy = spyOn(BitcoinClient_1.default, 'createFreezeScript').and.returnValue(mockRedeemScript);
            const estimateFeeSpy = spyOn(bitcoinClient, 'calculateTransactionFee').and.returnValue(mockTxnFee);
            const [actualTxn, redeemScript] = yield bitcoinClient['createFreezeTransaction']([mockUnspentOutput], mockFreezeUntilBlock, mockFreezeAmount);
            expect(redeemScript).toEqual(mockRedeemScript);
            expect(actualTxn.getFee()).toEqual(mockTxnFee);
            // There should be 2 outputs
            expect(actualTxn.outputs.length).toEqual(2);
            // 1st output is the freeze output
            expect(actualTxn.outputs[0].satoshis).toEqual(mockFreezeAmount);
            expect(actualTxn.outputs[0].script.toASM()).toEqual(mockRedeemScriptHashOutput.toASM());
            // 2nd output is the difference back to this wallet and this should be the
            // 'change' script === where the rest of the satoshis will go
            const expectedPayToScript = bitcore_lib_1.Script.buildPublicKeyHashOut(privateKeyFromBitcoinClient.toAddress());
            expect(actualTxn.outputs[1].script.toASM()).toEqual(expectedPayToScript.toASM());
            expect(actualTxn.getChangeOutput()).toEqual(actualTxn.outputs[1]);
            expect(createScriptSpy).toHaveBeenCalledWith(mockFreezeUntilBlock, walletAddressFromBitcoinClient);
            expect(estimateFeeSpy).toHaveBeenCalled();
        }));
    });
    describe('createSpendToFreezeTransaction', () => {
        it('should return the transaction by the utility function', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFreezeTxn1 = generateBitcoreTransactionWrapper(bitcoinWalletImportString, 12345);
            const mockFreezeTxn2 = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 7890);
            const mockFreezeUntilPreviousBlock = 12345;
            const mockFreezeUntilBlock = 987654;
            const mockRedeemScript = bitcore_lib_1.Script.empty().add(117);
            const mockRedeemScriptHashOutput = bitcore_lib_1.Script.buildScriptHashOut(mockRedeemScript);
            const createScriptSpy = spyOn(BitcoinClient_1.default, 'createFreezeScript').and.returnValue(mockRedeemScript);
            const utilFuncSpy = spyOn(bitcoinClient, 'createSpendTransactionFromFrozenTransaction').and.returnValue(mockFreezeTxn2);
            const [actualTxn, redeemScript] = yield bitcoinClient['createSpendToFreezeTransaction'](mockFreezeTxn1, mockFreezeUntilPreviousBlock, mockFreezeUntilBlock);
            expect(actualTxn).toEqual(mockFreezeTxn2);
            expect(redeemScript).toEqual(mockRedeemScript);
            expect(createScriptSpy).toHaveBeenCalledWith(mockFreezeUntilBlock, walletAddressFromBitcoinClient);
            const expectedPayToScriptAddress = new bitcore_lib_1.Address(mockRedeemScriptHashOutput);
            expect(utilFuncSpy).toHaveBeenCalledWith(mockFreezeTxn1, mockFreezeUntilPreviousBlock, expectedPayToScriptAddress);
        }));
    });
    describe('createSpendToWalletTransaction', () => {
        it('should return the transaction by the utility function', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFreezeTxn1 = generateBitcoreTransactionWrapper(bitcoinWalletImportString, 12345);
            const mockFreezeTxn2 = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 7890);
            const mockFreezeUntilBlock = 987654;
            const utilFuncSpy = spyOn(bitcoinClient, 'createSpendTransactionFromFrozenTransaction').and.returnValue(mockFreezeTxn2);
            const actual = yield bitcoinClient['createSpendToWalletTransaction'](mockFreezeTxn1, mockFreezeUntilBlock);
            expect(actual).toEqual(mockFreezeTxn2);
            expect(utilFuncSpy).toHaveBeenCalledWith(mockFreezeTxn1, mockFreezeUntilBlock, walletAddressFromBitcoinClient);
        }));
    });
    describe('createSpendTransactionFromFrozenTransaction', () => {
        it('should create the spend transaction correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFreezeTxn = generateBitcoreTransactionWrapper(bitcoinWalletImportString, 12345);
            const mockFreezeUntilBlock = 987654;
            const mockPayToAddress = walletAddressFromBitcoinClient;
            const mockPayToAddressScriptHash = bitcore_lib_1.Script.buildPublicKeyHashOut(mockPayToAddress);
            const mockUnspentOutput = bitcore_lib_1.Transaction.UnspentOutput.fromObject({
                txid: mockFreezeTxn.id, vout: 3, scriptPubKey: bitcore_lib_1.Script.empty(), satoshis: 456789
            });
            const mockTxnFee = 21897;
            const createUnspentSpy = spyOn(bitcoinClient, 'createUnspentOutputFromFrozenTransaction').and.returnValue(mockUnspentOutput);
            const estimateFeeSpy = spyOn(bitcoinClient, 'calculateTransactionFee').and.returnValue(mockTxnFee);
            const actual = yield bitcoinClient['createSpendTransactionFromFrozenTransaction'](mockFreezeTxn, mockFreezeUntilBlock, mockPayToAddress);
            expect(actual.version).toEqual(2);
            // Output should be to the mock address passed in
            expect(actual.outputs.length).toEqual(1);
            expect(actual.outputs[0].script.toASM()).toEqual(mockPayToAddressScriptHash.toASM());
            // The fee should be correctly set as per the estimate
            expect(actual.getFee()).toEqual(mockTxnFee);
            // There's only 1 input (from the previous freeze txn)
            expect(actual.inputs.length).toEqual(1);
            expect(actual.inputs[0].prevTxId.toString('hex')).toEqual(mockUnspentOutput.txId);
            expect(actual.inputs[0].outputIndex).toEqual(mockUnspentOutput.outputIndex);
            expect(actual.inputs[0].sequenceNumber).toEqual(mockFreezeUntilBlock);
            // Check other function calls
            expect(createUnspentSpy).toHaveBeenCalledWith(mockFreezeTxn, mockFreezeUntilBlock);
            expect(estimateFeeSpy).toHaveBeenCalled();
        }));
    });
    describe('createUnspentOutputFromFrozenTransaction', () => {
        it('should create unspent output from input transaction', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFreezeTxn = generateBitcoreTransactionWrapper(bitcoinWalletImportString, 12345);
            const mockFreezeUntilBlock = 987654;
            const mockRedeemScript = bitcore_lib_1.Script.empty().add(117);
            const mockRedeemScriptHashOutput = bitcore_lib_1.Script.buildScriptHashOut(mockRedeemScript);
            const createScriptSpy = spyOn(BitcoinClient_1.default, 'createFreezeScript').and.returnValue(mockRedeemScript);
            const actual = bitcoinClient['createUnspentOutputFromFrozenTransaction'](mockFreezeTxn, mockFreezeUntilBlock);
            expect(actual.txId).toEqual(mockFreezeTxn.id);
            expect(actual.outputIndex).toEqual(0);
            expect(actual.script.toASM()).toEqual(mockRedeemScriptHashOutput.toASM());
            expect(actual.satoshis).toEqual(mockFreezeTxn.outputs[0].satoshis);
            expect(createScriptSpy).toHaveBeenCalledWith(mockFreezeUntilBlock, walletAddressFromBitcoinClient);
        }));
    });
    describe('createFreezeScript', () => {
        it('should create the correct redeem script', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockLockUntilBlock = 45000;
            const mockLockUntilBuffer = Buffer.alloc(3);
            mockLockUntilBuffer.writeIntLE(mockLockUntilBlock, 0, 3);
            const publicKeyHashOutScript = bitcore_lib_1.Script.buildPublicKeyHashOut(walletAddressFromBitcoinClient);
            const mockLockUntilBufferAsHex = mockLockUntilBuffer.toString('hex');
            const expectedScriptAsm = `${mockLockUntilBufferAsHex} OP_NOP3 OP_DROP ${publicKeyHashOutScript.toASM()}`;
            const redeemScript = BitcoinClient_1.default['createFreezeScript'](mockLockUntilBlock, walletAddressFromBitcoinClient);
            expect(redeemScript.toASM()).toEqual(expectedScriptAsm);
        }));
    });
    describe('serializeSignedTransaction', () => {
        it('should call serialize with disable-input-sigining check', () => {
            const mockTxn = BitcoinDataGenerator_1.default.generateBitcoinTransaction(bitcoinWalletImportString, 1987);
            const mockSerializedTxn = 'serialized txn';
            const serializeSpy = spyOn(mockTxn, 'serialize').and.returnValue(mockSerializedTxn);
            const actual = BitcoinClient_1.default['serializeSignedTransaction'](mockTxn);
            expect(actual).toEqual(mockSerializedTxn);
            expect(serializeSpy).toHaveBeenCalledWith({ disableAll: true });
        });
    });
    describe('getBalanceInSatoshis', () => {
        it('should call the unspentoutput API', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockUnspentOutput = {
                satoshis: 12345
            };
            spyOn(bitcoinClient, 'getUnspentOutputs').and.returnValue([mockUnspentOutput, mockUnspentOutput]);
            const actual = yield bitcoinClient.getBalanceInSatoshis();
            expect(actual).toEqual(mockUnspentOutput.satoshis * 2);
            done();
        }));
    });
    describe('isAddressAddedToWallet', () => {
        const expectedIsWalletRpc = true;
        it('should check if the wallet is watch only', () => __awaiter(void 0, void 0, void 0, function* () {
            const address = 'ADSFAEADSF0934ADF';
            const spy = verifyThenMockRpcCall('getaddressinfo', expectedIsWalletRpc, [address], {
                address,
                scriptPubKey: 'afdoijEAFDSDF',
                ismine: false,
                solvable: true,
                desc: 'Test Address data',
                iswatchonly: true,
                isscript: false,
                iswitness: false,
                pubkey: 'random_pubkey_name',
                iscompressed: true,
                ischange: false,
                timestamp: 0,
                labels: []
            });
            const actual = yield bitcoinClient['isAddressAddedToWallet'](address);
            expect(actual).toBeTruthy();
            expect(spy).toHaveBeenCalled();
        }));
        it('should check if the wallet has labels', () => __awaiter(void 0, void 0, void 0, function* () {
            const address = 'some_ADDRESS_string';
            const spy = verifyThenMockRpcCall('getaddressinfo', expectedIsWalletRpc, [address], {
                address,
                scriptPubKey: 'script_pubkey_random',
                ismine: false,
                solvable: true,
                desc: 'Test Address data',
                iswatchonly: false,
                isscript: false,
                iswitness: false,
                pubkey: 'pubkey_random_value',
                iscompressed: true,
                label: 'sidetree',
                ischange: false,
                timestamp: 0,
                labels: [
                    {
                        name: 'sidetree',
                        purpose: 'receive'
                    }
                ]
            });
            const actual = yield bitcoinClient['isAddressAddedToWallet'](address);
            expect(actual).toBeTruthy();
            expect(spy).toHaveBeenCalled();
        }));
        it('should return false if it appears to be a random address', () => __awaiter(void 0, void 0, void 0, function* () {
            const address = 'random-ADDress';
            const spy = verifyThenMockRpcCall('getaddressinfo', expectedIsWalletRpc, [address], {
                address,
                scriptPubKey: 'script_pubKEY_random',
                ismine: false,
                solvable: false,
                iswatchonly: false,
                isscript: true,
                iswitness: false,
                ischange: false,
                labels: []
            });
            const actual = yield bitcoinClient['isAddressAddedToWallet'](address);
            expect(actual).toBeFalsy();
            expect(spy).toHaveBeenCalled();
        }));
    });
    describe('rpcCall', () => {
        it('should call retry-fetch with specific wallet.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const request = {};
            const memberName = 'memberRequestName';
            const memberValue = 'memberRequestValue';
            request[memberName] = memberValue;
            const mockedBodyBuffer = Buffer.from(JSON.stringify({
                result: 'abc'
            }));
            const retryFetchSpy = spyOn(bitcoinClient, 'fetchWithRetry');
            retryFetchSpy.and.callFake((uri, params) => {
                expect(uri).toContain(`${bitcoinPeerUri}/wallet/sidetreeDefaultWallet`);
                expect(params.method).toEqual('post');
                expect(JSON.parse(params.body)[memberName]).toEqual(memberValue);
                return Promise.resolve(mockedBodyBuffer);
            });
            const actualResult = yield bitcoinClient['rpcCall'](request, true, true);
            expect(actualResult).toEqual('abc');
            expect(retryFetchSpy).toHaveBeenCalled();
            done();
        }));
        it('should call retry-fetch without specific wallet.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const request = {};
            const memberName = 'memberRequestName';
            const memberValue = 'memberRequestValue';
            request[memberName] = memberValue;
            const mockedBodyBuffer = Buffer.from(JSON.stringify({
                result: 'abc'
            }));
            const retryFetchSpy = spyOn(bitcoinClient, 'fetchWithRetry');
            retryFetchSpy.and.callFake((uri, params) => {
                expect(uri).toContain(bitcoinPeerUri);
                expect(params.method).toEqual('post');
                expect(JSON.parse(params.body)[memberName]).toEqual(memberValue);
                return Promise.resolve(mockedBodyBuffer);
            });
            const actualResult = yield bitcoinClient['rpcCall'](request, true, false);
            expect(actualResult).toEqual('abc');
            expect(retryFetchSpy).toHaveBeenCalled();
            done();
        }));
        it('should call retry-fetch without authorization', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const request = {};
            const memberName = 'memberRequestName';
            const memberValue = 'memberRequestValue';
            request[memberName] = memberValue;
            const mockedBodyBuffer = Buffer.from(JSON.stringify({
                result: 'abc'
            }));
            const retryFetchSpy = spyOn(bitcoinClient, 'fetchWithRetry');
            retryFetchSpy.and.callFake((uri, params) => {
                expect(uri).toContain(bitcoinPeerUri);
                expect(params.method).toEqual('post');
                expect(JSON.parse(params.body)[memberName]).toEqual(memberValue);
                return Promise.resolve(mockedBodyBuffer);
            });
            const originalAuthorization = bitcoinClient.bitcoinAuthorization;
            bitcoinClient.bitcoinAuthorization = undefined; // Removing authorization header.
            const actualResult = yield bitcoinClient['rpcCall'](request, true, false);
            expect(actualResult).toEqual('abc');
            expect(retryFetchSpy).toHaveBeenCalled();
            bitcoinClient.bitcoinAuthorization = originalAuthorization;
            done();
        }));
        it('should throw if the RPC call result contains an `error` property.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                test: 'some request value'
            };
            const mockedBodyBuffer = Buffer.from(JSON.stringify({
                error: 'some_error'
            }));
            const retryFetchSpy = spyOn(bitcoinClient, 'fetchWithRetry');
            retryFetchSpy.and.callFake((uri, params) => {
                expect(uri).toContain(bitcoinPeerUri);
                expect(params.method).toEqual('post');
                expect(JSON.parse(params.body).test).toEqual(request.test);
                return Promise.resolve(mockedBodyBuffer);
            });
            try {
                yield bitcoinClient['rpcCall'](request, true, false);
                fail('should have thrown');
            }
            catch (error) {
                expect(error.message).toContain('some_error');
                expect(retryFetchSpy).toHaveBeenCalled();
            }
            finally {
                done();
            }
        }));
    });
    describe('fetchWithRetry', () => {
        it('should fetch the URI with the given requestParameters when timeout is enabled', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockedRequestParams = { method: 'POST' };
            const mockedResponseBody = 'mockedBody';
            const mockedResponseStatus = 200;
            fetchSpy.and.callFake((uri, params) => {
                expect(uri).toEqual(path);
                // Expected to have timeout set explicitly.
                const expectedFinalRequestParams = {
                    method: 'POST',
                    timeout: bitcoinClient.requestTimeout
                };
                expect(params).toEqual(expectedFinalRequestParams);
                return Promise.resolve({ status: mockedResponseStatus, body: mockedResponseBody });
            });
            const mockBuffer = Buffer.from('anyBufferValue');
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.callFake((body) => {
                expect(body).toEqual(mockedResponseBody);
                return Promise.resolve(mockBuffer);
            });
            const path = 'http://unused_path';
            const buffer = yield bitcoinClient['fetchWithRetry'](path, mockedRequestParams, true); // true = timeout enabled.
            expect(fetchSpy).toHaveBeenCalled();
            expect(readAllSpy).toHaveBeenCalled();
            expect(buffer).toEqual(mockBuffer);
            done();
        }));
        it('should fetch the URI with the given requestParameters when timeout is disabled.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockedRequestParams = { method: 'POST' };
            const mockedResponseBody = 'mockedBody';
            const mockedResponseStatus = 200;
            fetchSpy.and.callFake((uri, params) => {
                expect(uri).toEqual(path);
                // Expected to have timeout set explicitly.
                const expectedFinalRequestParams = {
                    method: 'POST',
                    timeout: 0
                };
                expect(params).toEqual(expectedFinalRequestParams);
                return Promise.resolve({ status: mockedResponseStatus, body: mockedResponseBody });
            });
            const mockBuffer = Buffer.from('anyBufferValue');
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.callFake((body) => {
                expect(body).toEqual(mockedResponseBody);
                return Promise.resolve(mockBuffer);
            });
            const path = 'http://unused_path';
            const buffer = yield bitcoinClient['fetchWithRetry'](path, mockedRequestParams, false); // false = timeout disabled.
            expect(fetchSpy).toHaveBeenCalled();
            expect(readAllSpy).toHaveBeenCalled();
            expect(buffer).toEqual(mockBuffer);
            done();
        }));
        it('should retry with increased timeout until max-retry reached if timeout is enabled.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockedRequestParams = { method: 'POST' };
            const mockedTimeoutError = new nodeFetchPackage.FetchError('test', 'request-timeout');
            let previousTimeout = 0; // Records the timeout used by the previous fetch call. Setting to zero allows the initial timeout value check to succeed also.
            fetchSpy.and.callFake((_uri, params) => {
                expect(params.timeout).toBeGreaterThan(previousTimeout);
                previousTimeout = params.timeout;
                return Promise.reject(mockedTimeoutError);
            });
            const path = 'http://unused_path';
            try {
                yield bitcoinClient['fetchWithRetry'](path, mockedRequestParams, true); // true = timeout enabled.
            }
            catch (error) {
                if (error.type === 'request-timeout') {
                    // This exception is the expected behavior, perform rest of the validations.
                    expect(fetchSpy).toHaveBeenCalledTimes(bitcoinClient.requestMaxRetries + 1);
                    done();
                    return;
                }
            }
            fail('Should have throw a request timeout error when reached maximum retry count.');
        }));
        it('should throw non timeout errors thrown by fetch immediately.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockedRequestParams = { method: 'POST' };
            const mockedTimeoutError = new nodeFetchPackage.FetchError('test', 'unknown-error'); // This should force error to be thrown without retry.
            fetchSpy.and.callFake(() => {
                return Promise.reject(mockedTimeoutError);
            });
            const path = 'http://unused_path';
            try {
                yield bitcoinClient['fetchWithRetry'](path, mockedRequestParams, true); // true = timeout enabled.
            }
            catch (error) {
                if (error.type === 'unknown-error') {
                    expect(fetchSpy).toHaveBeenCalledTimes(1); // Expecting only fetching once.
                    done();
                    return;
                }
            }
            fail('Should have throw a request timeout error when reached maximum retry count.');
        }));
        it('should retry if response HTTP code is related to network connectivity issues.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockedResponseBody = 'unusedBody';
            fetchSpy.and.returnValues({ status: 502, body: mockedResponseBody }, // Simulates a network issue.
            { status: 200, body: mockedResponseBody } // Simulates a subsequent success.
            );
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.callFake(() => {
                return Promise.resolve(Buffer.from('unused'));
            });
            yield bitcoinClient['fetchWithRetry']('http://unused_path', {}, true); // true = timeout enabled.
            expect(fetchSpy).toHaveBeenCalledTimes(2);
            expect(readAllSpy).toHaveBeenCalledTimes(2); // Shows retry has happened.
            done();
        }));
        it('should throw if response HTTP code is an error not related to connectivity issues.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockedResponseBody = 'unusedBody';
            fetchSpy.and.returnValue({ status: 500, body: mockedResponseBody }); // Simulates a non-network issue.
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from('unused')));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => bitcoinClient['fetchWithRetry']('http://unused_path', {}, true), // true = timeout enabled.
            ErrorCode_1.default.BitcoinClientFetchUnexpectedError);
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(readAllSpy).toHaveBeenCalledTimes(1); // Shows retry never happened.
            done();
        }));
    });
}));
//# sourceMappingURL=BitcoinClient.spec.js.map