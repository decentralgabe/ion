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
const Blockchain_1 = require("../../lib/core/Blockchain");
const ErrorCode_1 = require("../../lib/core/ErrorCode");
const ErrorCode_2 = require("../../lib/bitcoin/ErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const ReadableStream_1 = require("../../lib/common/ReadableStream");
const SharedErrorCode_1 = require("../../lib/common/SharedErrorCode");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
describe('Blockchain', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('read()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return transactions fetched.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const mockFetchResponse = {
                status: 200,
                body: {
                    read: () => { return 'Ignored body.'; }
                }
            };
            const mockReadableStreamReadString = JSON.stringify({
                moreTransactions: false,
                transactions: [{
                        anchorString: '1',
                        transactionNumber: 1,
                        transactionTime: 1,
                        transactionTimeHash: '1'
                    }]
            });
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockReadableStreamReadString)));
            const readResult = yield blockchainClient.read();
            expect(readResult.moreTransactions).toBeFalsy();
            expect(readResult.transactions.length).toEqual(1);
            expect(readResult.transactions[0].transactionNumber).toEqual(1);
        }));
        it('should throw SidetreeError with correct code when if invalid time hash is given.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const mockFetchResponse = {
                status: 400,
                body: {
                    read: () => { return 'Ignored body.'; }
                }
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(JSON.stringify({
                code: SharedErrorCode_1.default.InvalidTransactionNumberOrTimeHash
            }))));
            try {
                yield blockchainClient.read();
            }
            catch (error) {
                // Throwing error is the expected case.
                if (error.code !== SharedErrorCode_1.default.InvalidTransactionNumberOrTimeHash) {
                    fail();
                }
                return;
            }
            fail();
        }));
        it('should throw if error is encountered when reading transactions.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const mockFetchResponse = {
                status: 500,
                body: {
                    read: () => { return 'Error message in body that gets printed to console.'; }
                }
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(JSON.stringify({
                code: 'unused'
            }))));
            try {
                yield blockchainClient.read(1, 'Unused transaction hash.');
            }
            catch (error) {
                // Throwing error is the expected case.
                if (error.code !== ErrorCode_1.default.BlockchainReadResponseNotOk) {
                    fail();
                }
                return;
            }
            fail();
        }));
        it('should throw if not both the transaction time and hash are given.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            try {
                yield blockchainClient.read(1, undefined);
            }
            catch (error) {
                // Throwing error is the expected case.
                if (error.code !== ErrorCode_1.default.BlockchainReadInvalidArguments) {
                    fail();
                }
                return;
            }
            fail();
        }));
        it('should throw if response body fails JSON parse.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const mockFetchResponse = { status: 200 };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from('An unexpected non JSON string.')));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => blockchainClient.read(1, 'Unused'), ErrorCode_1.default.BlockchainReadResponseBodyNotJson);
        }));
    }));
    describe('write()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should write as expected', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('uri');
            const mockFetchResponse = {
                status: 200
            };
            const fetchSpy = spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            yield blockchainClient.write('Unused anchor string.', 100);
            expect(fetchSpy).toHaveBeenCalled();
        }));
        it('should throw SidetreeError with correct error code if blockchain service returns an unexpected error.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const mockFetchResponse = {
                status: 500,
                body: {
                    read: () => { return 'Error message in body that gets printed to console.'; }
                }
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => blockchainClient.write('Unused anchor string.', 100), ErrorCode_1.default.BlockchainWriteUnexpectedError);
        }));
        it('should throw SidetreeError with correct error code if blockchain service returns a known Sidetree error.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const dummyErrorCode = 'dummy error code';
            const mockFetchResponse = {
                status: 500,
                body: {
                    read: () => { return JSON.stringify({ code: dummyErrorCode }); }
                }
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => blockchainClient.write('Unused anchor string.', 100), dummyErrorCode);
        }));
    }));
    describe('getFirstValidTransaction()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return the transaction returned by the underlying blockchain service.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const mockFetchResponse = {
                status: 200,
                body: {
                    read: () => {
                        return JSON.stringify({
                            anchorString: '0',
                            transactionNumber: 0,
                            transactionTime: 0,
                            transactionTimeHash: '0'
                        });
                    }
                }
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            const unusedTransactions = [
                {
                    anchorString: 'unused',
                    transactionNumber: 1,
                    transactionTime: 1,
                    transactionTimeHash: 'unused',
                    transactionFeePaid: 1,
                    normalizedTransactionFee: 1,
                    writer: 'writer'
                }
            ];
            const firstValidTransaction = yield blockchainClient.getFirstValidTransaction(unusedTransactions);
            expect(firstValidTransaction).toBeDefined();
            expect(firstValidTransaction.anchorString).toEqual('0');
            expect(firstValidTransaction.transactionNumber).toEqual(0);
            expect(firstValidTransaction.transactionTime).toEqual(0);
            expect(firstValidTransaction.transactionTimeHash).toEqual('0');
        }));
        it('should return undefined if valid transaction cannot be found.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const mockFetchResponse = {
                status: 404,
                body: {
                    read: () => {
                        return 'Unused response body.';
                    }
                }
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            const unusedTransactions = [
                {
                    anchorString: 'unused',
                    transactionNumber: 1,
                    transactionTime: 1,
                    transactionTimeHash: 'unused',
                    transactionFeePaid: 1,
                    normalizedTransactionFee: 1,
                    writer: 'writer'
                }
            ];
            const firstValidTransaction = yield blockchainClient.getFirstValidTransaction(unusedTransactions);
            expect(firstValidTransaction).toBeUndefined();
        }));
    }));
    describe('getLatestTime()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return the latest time', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const mockFetchResponse = {
                status: 200,
                body: {
                    read: () => { return `{ "hash": "someHash", "time": 123 }`; }
                }
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            const result = yield blockchainClient.getLatestTime();
            expect(result).toEqual({ hash: 'someHash', time: 123 });
        }));
        it('should throw if encountered error when fetching time from blockchain service.', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('Unused URI');
            const mockFetchResponse = {
                status: 500,
                body: {
                    read: () => { return 'Error message in body that gets printed to console.'; }
                }
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            try {
                yield blockchainClient.getLatestTime();
            }
            catch (error) {
                // Throwing error is the expected case.
                if (error.code !== ErrorCode_1.default.BlockchainGetLatestTimeResponseNotOk) {
                    fail();
                }
                return;
            }
            fail();
        }));
    }));
    describe('getCachedVersion', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should get the version from the service version fetcher', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const expectedServiceVersion = { name: 'test-service', version: 'x.y.z' };
            const serviceVersionSpy = spyOn(blockchainClient['serviceVersionFetcher'], 'getVersion').and.returnValue(Promise.resolve(expectedServiceVersion));
            const fetchedServiceVersion = yield blockchainClient.getServiceVersion();
            expect(serviceVersionSpy).toHaveBeenCalled();
            expect(fetchedServiceVersion).toEqual(expectedServiceVersion);
        }));
    }));
    describe('getFee', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should get the fee returned by the blockchain service', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const expectedFee = 12345;
            const mockFetchResponse = {
                status: 200,
                body: `{ "normalizedTransactionFee": ${expectedFee} }`
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            const feeResponse = yield blockchainClient.getFee(7890);
            expect(feeResponse).toEqual(expectedFee);
        }));
        it('should throw if the response is not 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockFetchResponse = {
                status: 500,
                body: '{}'
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            yield expectAsync(blockchainClient.getFee(700)).toBeRejectedWith(new SidetreeError_1.default(ErrorCode_1.default.BlockchainGetFeeResponseNotOk));
        }));
        it('should throw if the response is 400 with the specific error code', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockFetchResponse = {
                status: 400,
                body: `{"code": "${SharedErrorCode_1.default.BlockchainTimeOutOfRange}"}`
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            yield expectAsync(blockchainClient.getFee(700)).toBeRejectedWith(new SidetreeError_1.default(SharedErrorCode_1.default.BlockchainTimeOutOfRange));
        }));
        it('should throw if the response is 400 but the error code is generic', () => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockFetchResponse = {
                status: 400,
                body: `{"code": "something happened"}`
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            yield expectAsync(blockchainClient.getFee(700)).toBeRejectedWith(new SidetreeError_1.default(ErrorCode_1.default.BlockchainGetFeeResponseNotOk));
        }));
    }));
    describe('getValueTimeLock', () => {
        it('should return the object returned by the network call.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockValueTimeLock = {
                amountLocked: 12134,
                identifier: 'identifier',
                lockTransactionTime: 11223,
                normalizedFee: 100,
                owner: 'some owner',
                unlockTransactionTime: 98734
            };
            const mockFetchResponse = {
                status: 200,
                body: JSON.stringify(mockValueTimeLock)
            };
            const fetchSpy = spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            const identifierInput = 'identifier input';
            const actual = yield blockchainClient.getValueTimeLock(identifierInput);
            expect(actual).toEqual(mockValueTimeLock);
            expect(fetchSpy).toHaveBeenCalledWith(`${blockchainClient['locksUri']}/${identifierInput}`);
            expect(readAllSpy).toHaveBeenCalledWith(mockFetchResponse.body);
            done();
        }));
        it('should return undefined if not-found is returned by the network call.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockFetchResponse = {
                status: 404,
                body: '{"code": "some error code"}'
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            const actual = yield blockchainClient.getValueTimeLock('non-existent-identifier');
            expect(actual).not.toBeDefined();
            done();
        }));
        it('should throw if there is any other error returned by the network call.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockFetchResponse = {
                status: 500,
                body: '{"code": "some error code"}'
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => blockchainClient.getValueTimeLock('non-existent-identifier'), ErrorCode_1.default.BlockchainGetLockResponseNotOk);
            done();
        }));
    });
    describe('getWriterValueTimeLock', () => {
        it('should return the object returned by the network call.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockValueTimeLock = {
                amountLocked: 12134,
                identifier: 'identifier',
                lockTransactionTime: 11223,
                normalizedFee: 100,
                owner: 'some owner',
                unlockTransactionTime: 98734
            };
            const mockFetchResponse = {
                status: 200,
                body: JSON.stringify(mockValueTimeLock)
            };
            const fetchSpy = spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            const actual = yield blockchainClient.getWriterValueTimeLock();
            expect(actual).toEqual(mockValueTimeLock);
            expect(fetchSpy).toHaveBeenCalledWith(`${blockchainClient['writerLockUri']}`);
            expect(readAllSpy).toHaveBeenCalledWith(mockFetchResponse.body);
            done();
        }));
        it('should return undefined if not-found is returned by the network call.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockFetchResponse = {
                status: 404,
                body: '{"code": "some error code"}'
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            const actual = yield blockchainClient.getWriterValueTimeLock();
            expect(actual).not.toBeDefined();
            done();
        }));
        it('should return undefined if pending-state error is returned by the network call.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockFetchResponse = {
                status: 404,
                body: JSON.stringify({ code: ErrorCode_2.default.ValueTimeLockInPendingState })
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            const actual = yield blockchainClient.getWriterValueTimeLock();
            expect(actual).toBeUndefined();
            done();
        }));
        it('should throw generic error if HTTP 200 is not returned by the network call.', (done) => __awaiter(void 0, void 0, void 0, function* () {
            const blockchainClient = new Blockchain_1.default('unused');
            const mockFetchResponse = {
                status: 500,
                body: '{"code": "some error code"}'
            };
            spyOn(blockchainClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(mockFetchResponse.body)));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => blockchainClient.getWriterValueTimeLock(), ErrorCode_1.default.BlockchainGetWriterLockResponseNotOk);
            done();
        }));
    });
}));
//# sourceMappingURL=Blockchain.spec.js.map