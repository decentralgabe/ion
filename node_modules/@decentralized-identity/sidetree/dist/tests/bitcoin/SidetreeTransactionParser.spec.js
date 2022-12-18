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
const BitcoinClient_1 = require("../../lib/bitcoin/BitcoinClient");
const node_fetch_1 = require("node-fetch");
const SidetreeTransactionParser_1 = require("../../lib/bitcoin/SidetreeTransactionParser");
describe('SidetreeTransactionParser', () => {
    let sidetreeTransactionPrefix;
    beforeAll(() => {
        sidetreeTransactionPrefix = 'sidetree:';
    });
    const validTestWalletImportString = 'cTpKFwqu2HqW4y5ByMkNRKAvkPxEcwpax5Qr33ibYvkp1KSxdji6';
    const bitcoinClient = new BitcoinClient_1.default('uri:test', 'u', 'p', validTestWalletImportString, 10, 1, 0);
    let sidetreeTxnParser;
    beforeEach(() => {
        sidetreeTxnParser = new SidetreeTransactionParser_1.default(bitcoinClient, sidetreeTransactionPrefix);
    });
    function createValidDataOutput(data) {
        const sidetreeDataWithPrefix = sidetreeTransactionPrefix + data;
        const sidetreeDataWithPrefixInHex = Buffer.from(sidetreeDataWithPrefix).toString('hex');
        return {
            satoshis: 0,
            scriptAsmAsString: `OP_RETURN ${sidetreeDataWithPrefixInHex}`
        };
    }
    describe('parse', () => {
        it('should return undefined if the sidetree data is invalid', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockTxn = {
                id: 'some id',
                blockHash: 'hash',
                confirmations: 1,
                outputs: [],
                inputs: []
            };
            spyOn(sidetreeTxnParser, 'getValidSidetreeDataFromOutputs').and.returnValue(undefined);
            const actual = yield sidetreeTxnParser.parse(mockTxn);
            expect(actual).not.toBeDefined();
            done();
        }));
        it('should return undefined if the writer data is invalid', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockTxn = {
                id: 'some id',
                blockHash: 'hash',
                confirmations: 1,
                outputs: [],
                inputs: []
            };
            spyOn(sidetreeTxnParser, 'getValidSidetreeDataFromOutputs').and.returnValue('some data');
            spyOn(sidetreeTxnParser, 'getValidWriterFromInputs').and.returnValue(undefined);
            const actual = yield sidetreeTxnParser.parse(mockTxn);
            expect(actual).not.toBeDefined();
            done();
        }));
        it('should return correct expected data', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const sidetreeData = 'sidetree data';
            const writer = 'valid writer';
            const mockTxn = {
                id: 'some id',
                blockHash: 'hash',
                confirmations: 1,
                outputs: [],
                inputs: []
            };
            spyOn(sidetreeTxnParser, 'getValidSidetreeDataFromOutputs').and.returnValue(sidetreeData);
            spyOn(sidetreeTxnParser, 'getValidWriterFromInputs').and.returnValue(writer);
            const actual = yield sidetreeTxnParser.parse(mockTxn);
            expect(actual).toBeDefined();
            expect(actual.data).toEqual(sidetreeData);
            expect(actual.writer).toEqual(writer);
            done();
        }));
    });
    describe('getValidSidetreeDataFromOutputs', () => {
        it('should return the sidetree data if only one output has the data present', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockSidetreeData = 'some side tree data';
            let sidetreeDataSent = false;
            spyOn(sidetreeTxnParser, 'getSidetreeDataFromOutputIfExist').and.callFake(() => {
                if (!sidetreeDataSent) {
                    sidetreeDataSent = true;
                    return mockSidetreeData;
                }
                return undefined;
            });
            const mockOutputs = [
                createValidDataOutput('mock data 1'),
                createValidDataOutput('mock data 2')
            ];
            const actual = sidetreeTxnParser['getValidSidetreeDataFromOutputs'](mockOutputs, sidetreeTransactionPrefix);
            expect(actual).toEqual(mockSidetreeData);
            done();
        }));
        it('should return undefined if no output has any sidetree data.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(sidetreeTxnParser, 'getSidetreeDataFromOutputIfExist').and.returnValue(undefined);
            const mockOutputs = [
                createValidDataOutput('mock data 1'),
                createValidDataOutput('mock data 2')
            ];
            const actual = sidetreeTxnParser['getValidSidetreeDataFromOutputs'](mockOutputs, sidetreeTransactionPrefix);
            expect(actual).not.toBeDefined();
            done();
        }));
        it('should only return the first output with the sidetree data.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockOutputs = [
                createValidDataOutput('mock data 1'),
                createValidDataOutput('mock data 2'),
                createValidDataOutput('mock data 2')
            ];
            let callCount = 0;
            spyOn(sidetreeTxnParser, 'getSidetreeDataFromOutputIfExist').and.callFake(() => {
                callCount++;
                if (callCount > 1) {
                    return `mockSidetreeData ${callCount}`;
                }
                return undefined;
            });
            const actual = sidetreeTxnParser['getValidSidetreeDataFromOutputs'](mockOutputs, sidetreeTransactionPrefix);
            expect(actual).toEqual('mockSidetreeData 2');
            done();
        }));
    });
    describe('getSidetreeDataFromOutputIfExist', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return the data if the valid sidetree transaction exist', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const sidetreeData = 'some test data';
            const mockDataOutput = createValidDataOutput(sidetreeData);
            const actual = sidetreeTxnParser['getSidetreeDataFromOutputIfExist'](mockDataOutput, sidetreeTransactionPrefix);
            expect(actual).toEqual(sidetreeData);
            done();
        }));
        it('should return undefined if no valid sidetree transaction exist', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockOutput = { satoshis: 0, scriptAsmAsString: 'some random data' };
            const actual = sidetreeTxnParser['getSidetreeDataFromOutputIfExist'](mockOutput, sidetreeTransactionPrefix);
            expect(actual).not.toBeDefined();
            done();
        }));
        it('should return undefined if data does not start with sidetree prefix', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const sidetreeData = 'some test data';
            const mockDataOutput = createValidDataOutput(sidetreeData);
            const actual = sidetreeTxnParser['getSidetreeDataFromOutputIfExist'](mockDataOutput, 'notSidetree');
            expect(actual).not.toBeDefined();
            done();
        }));
    }));
    describe('getValidWriterFromInputs', () => {
        it('should return undefined if the number of inputs are less than 1', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const actual = yield sidetreeTxnParser['getValidWriterFromInputs']('txn id', []);
            expect(actual).toBeUndefined();
            done();
        }));
        it('should return undefined if the script asm has only 1 values', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockInput = [
                { outputIndexInPreviousTransaction: 0, previousTransactionId: 'id', scriptAsmAsString: 'signature' }
            ];
            const actual = yield sidetreeTxnParser['getValidWriterFromInputs']('txn id', mockInput);
            expect(actual).toBeUndefined();
            done();
        }));
        it('should return undefined if the script asm has 3 values', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockInput = [
                { outputIndexInPreviousTransaction: 0, previousTransactionId: 'id', scriptAsmAsString: 'signature publickey script' }
            ];
            const actual = yield sidetreeTxnParser['getValidWriterFromInputs']('txn id', mockInput);
            expect(actual).toBeUndefined();
            done();
        }));
        it('should return undefined if the output being spent is not found.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(sidetreeTxnParser, 'fetchOutput').and.returnValue(Promise.resolve(undefined));
            const mockInput = [
                { outputIndexInPreviousTransaction: 0, previousTransactionId: 'id', scriptAsmAsString: 'signature publickey' }
            ];
            const actual = yield sidetreeTxnParser['getValidWriterFromInputs']('txn id', mockInput);
            expect(actual).toBeUndefined();
            done();
        }));
        it('should return the value returned by the utitlity function.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockOutput = { satoshis: 50, scriptAsmAsString: 'output script' };
            spyOn(sidetreeTxnParser, 'fetchOutput').and.returnValue(Promise.resolve(mockOutput));
            const mockInput = [
                { outputIndexInPreviousTransaction: 0, previousTransactionId: 'id', scriptAsmAsString: 'signature publickey' }
            ];
            const mockPublicKeyHash = 'public-key-hash';
            spyOn(sidetreeTxnParser, 'getPublicKeyHashIfValidScript').and.returnValue(mockPublicKeyHash);
            const actual = yield sidetreeTxnParser['getValidWriterFromInputs']('txn id', mockInput);
            expect(actual).toEqual(mockPublicKeyHash);
            done();
        }));
    });
    describe('fetchOutput', () => {
        it('should return the otuput returned by calling the bitcoin client', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const mockTxn = {
                id: 'id',
                blockHash: 'block-hash',
                confirmations: 5,
                inputs: [],
                outputs: [
                    { satoshis: 50, scriptAsmAsString: 'script asm 1' },
                    { satoshis: 10, scriptAsmAsString: 'script asm 2' }
                ]
            };
            spyOn(sidetreeTxnParser['bitcoinClient'], 'getRawTransaction').and.returnValue(Promise.resolve(mockTxn));
            const actual = yield sidetreeTxnParser['fetchOutput']('txn id', 1);
            expect(actual).toEqual(mockTxn.outputs[1]);
            done();
        }));
        it('should throw if fetch throws', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockError = new node_fetch_1.FetchError('mocked test error', 'request-timeout');
            spyOn(sidetreeTxnParser['bitcoinClient'], 'getRawTransaction').and.callFake(() => __awaiter(void 0, void 0, void 0, function* () {
                throw mockError;
            }));
            try {
                yield sidetreeTxnParser['fetchOutput']('txn id', 1);
                fail();
            }
            catch (e) {
                expect(e).toEqual(mockError);
            }
        }));
    });
    describe('getPublicKeyHashIfValidScript', () => {
        it('should return the correct value if the script is in the correct format.', () => {
            const publickey = 'valid-public-key';
            const validInput = `OP_DUP OP_HASH160 ${publickey} OP_EQUALVERIFY OP_CHECKSIG`;
            const actual = sidetreeTxnParser['getPublicKeyHashIfValidScript'](validInput);
            expect(actual).toEqual(publickey);
        });
        it('should return undefined if the input is not in correct format.', () => {
            const actual = sidetreeTxnParser['getPublicKeyHashIfValidScript']('some invalid input');
            expect(actual).toBeUndefined();
        });
    });
});
//# sourceMappingURL=SidetreeTransactionParser.spec.js.map