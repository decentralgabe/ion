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
const FetchResultCode_1 = require("../../lib/common/enums/FetchResultCode");
const Ipfs_1 = require("../../lib/ipfs/Ipfs");
const IpfsErrorCode_1 = require("../../lib/ipfs/IpfsErrorCode");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const ReadableStream_1 = require("../../lib/common/ReadableStream");
const SharedErrorCode_1 = require("../../lib/common/SharedErrorCode");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
const Timeout_1 = require("../../lib/ipfs/Util/Timeout");
const node_fetch_1 = require("node-fetch");
describe('Ipfs', () => __awaiter(void 0, void 0, void 0, function* () {
    const config = require('../json/config-test.json');
    let casClient;
    let networkAvailable = false;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // test network connectivity, `networkAvailable` is used by tests to decide whether to run tests through real network calls or stubs
        const ipfsVersionUrl = new URL('/api/v0/version', config.ipfsHttpApiEndpointUri).toString();
        try {
            const response = yield node_fetch_1.default(ipfsVersionUrl, { method: 'POST' });
            if (response.status === 200) {
                networkAvailable = true;
            }
        }
        catch (_a) {
            // no op, all tests will run through stubs
        }
    }));
    beforeEach(() => {
        const fetchTimeoutInSeconds = 1;
        casClient = new Ipfs_1.default(config.ipfsHttpApiEndpointUri, fetchTimeoutInSeconds);
    });
    describe('write()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should return file hash of the content written.', () => __awaiter(void 0, void 0, void 0, function* () {
            // stub network call if network is not available
            // testing using real network calls will help detect regression such as https://github.com/decentralized-identity/sidetree/issues/1188
            if (!networkAvailable) {
                spyOn(casClient, 'fetch').and.returnValue(Promise.resolve({ status: 200, body: 'unused' }));
                spyOn(ReadableStream_1.default, 'readAll')
                    .and.returnValue(Promise.resolve(Buffer.from(JSON.stringify({ Hash: 'QmNaJwbzQuMwBdBk24WqyinzMNWsiK1rJPN1WnL4uwKQaA' }))));
            }
            const hash = yield casClient.write(Buffer.from('anyBuffer'));
            expect(hash).toEqual('QmNaJwbzQuMwBdBk24WqyinzMNWsiK1rJPN1WnL4uwKQaA');
        }));
        it('should throw if content writing IPFS HTTP API returned a non-OK status with or without body', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(casClient, 'fetch').and.returnValue(Promise.resolve({ status: 500, body: 'unused' }));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from('abc')));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => casClient.write(Buffer.from('unused')), IpfsErrorCode_1.default.IpfsFailedWritingContent);
        }));
        it('should throw if content writing IPFS HTTP API returned a non-OK status without body', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(casClient, 'fetch').and.returnValue(Promise.resolve({ status: 500 }));
            spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from('abc')));
            yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => casClient.write(Buffer.from('unused')), IpfsErrorCode_1.default.IpfsFailedWritingContent);
        }));
    }));
    describe('read()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should set fetch CIDv0 result as success when fetch is successful.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fetchSpy = spyOn(casClient, 'fetch').and.returnValue(Promise.resolve({ status: 200, body: 'unused' }));
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from('abc')));
            const fetchResult = yield casClient.read('QmWCcaE2iTRnJxqaC4VGFhD6ARsqRNPe2D2eYJTWgeP7ko', 1);
            expect(fetchSpy).toHaveBeenCalled();
            expect(readAllSpy).toHaveBeenCalled();
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.Success);
            expect(fetchResult.content.toString()).toEqual('abc');
        }));
        it('should set fetch CIDv1 result as success when fetch is successful.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fetchSpy = spyOn(casClient, 'fetch').and.returnValue(Promise.resolve({ status: 200, body: 'unused' }));
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from('abc')));
            const fetchResult = yield casClient.read('bafkreid5uh2g5gbbhvpza4mwfwbmigy43rar2xkalwtvc7v34b4557cr2i', 1);
            expect(fetchSpy).toHaveBeenCalled();
            expect(readAllSpy).toHaveBeenCalled();
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.Success);
            expect(fetchResult.content.toString()).toEqual('abc');
        }));
        it('should set fetch result as not-found when IPFS HTTP API returns non OK status.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fetchSpy = spyOn(casClient, 'fetch').and.returnValue(Promise.resolve({ status: 500, body: 'unused' }));
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(JSON.stringify({
                code: 'unused'
            }))));
            const fetchResult = yield casClient.read('QmWCcaE2iTRnJxqaC4VGFhD6ARsqRNPe2D2eYJTWgeP7ko', 1);
            expect(fetchSpy).toHaveBeenCalled();
            expect(readAllSpy).toHaveBeenCalled();
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.NotFound);
        }));
        it('should set fetch result as not-found when `timeout()` throws an unexpected error.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fetchContentSpy = spyOn(casClient, 'fetchContent');
            const timeoutSpy = spyOn(Timeout_1.default, 'timeout').and.throwError('any unexpected error');
            const fetchResult = yield casClient.read('QmWCcaE2iTRnJxqaC4VGFhD6ARsqRNPe2D2eYJTWgeP7ko', 1);
            expect(fetchContentSpy).toHaveBeenCalled();
            expect(timeoutSpy).toHaveBeenCalled();
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.NotFound);
        }));
        it('should set fetch result as not-found when `timeout()` throws a timeout error.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fetchContentSpy = spyOn(casClient, 'fetchContent');
            const timeoutSpy = spyOn(Timeout_1.default, 'timeout').and.callFake(() => { throw new SidetreeError_1.default(IpfsErrorCode_1.default.TimeoutPromiseTimedOut); });
            const fetchResult = yield casClient.read('QmWCcaE2iTRnJxqaC4VGFhD6ARsqRNPe2D2eYJTWgeP7ko', 1);
            expect(fetchContentSpy).toHaveBeenCalled();
            expect(timeoutSpy).toHaveBeenCalled();
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.NotFound);
        }));
        it('should set fetch result correctly when given hash is invalid.', () => __awaiter(void 0, void 0, void 0, function* () {
            const fetchResult = yield casClient.read('anyInvalidHash', 1);
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.InvalidHash);
        }));
        it('should return correct fetch result code if IPFS service is not reachable.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simulate IPFS not reachable.
            const fetchContentSpy = spyOn(casClient, 'fetch').and.callFake(() => {
                const error = new Error('any error message');
                error.code = 'ECONNREFUSED';
                throw error;
            });
            const fetchResult = yield casClient.read('QmWCcaE2iTRnJxqaC4VGFhD6ARsqRNPe2D2eYJTWgeP7ko', 1);
            expect(fetchContentSpy).toHaveBeenCalled();
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.CasNotReachable);
        }));
        it('should return as content not found if `fetch()` throws unexpected error.', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simulate IPFS not reachable.
            const fetchContentSpy = spyOn(casClient, 'fetch').and.throwError('any unexpected error');
            const fetchResult = yield casClient.read('QmWCcaE2iTRnJxqaC4VGFhD6ARsqRNPe2D2eYJTWgeP7ko', 1);
            expect(fetchContentSpy).toHaveBeenCalled();
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.NotFound);
        }));
        it('should return as content not found if unexpected error occurred while reading the content stream.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFetchResponse = { status: 200 };
            spyOn(casClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            spyOn(ReadableStream_1.default, 'readAll').and.throwError('any unexpected error');
            const fetchResult = yield casClient.read('QmWCcaE2iTRnJxqaC4VGFhD6ARsqRNPe2D2eYJTWgeP7ko', 1);
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.NotFound);
        }));
        it('should return correct fetch result code if content found is not a file.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFetchResponse = { status: 500 };
            const fetchSpy = spyOn(casClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll')
                .and.returnValue(Promise.resolve(Buffer.from(JSON.stringify({ Message: 'this dag node is a directory' }))));
            const fetchResult = yield casClient.read('QmWCcaE2iTRnJxqaC4VGFhD6ARsqRNPe2D2eYJTWgeP7ko', 1);
            expect(fetchSpy).toHaveBeenCalled();
            expect(readAllSpy).toHaveBeenCalled();
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.NotAFile);
        }));
        it('should return correct fetch result code if content max size is exceeded.', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFetchResponse = { status: 200 };
            const fetchSpy = spyOn(casClient, 'fetch').and.returnValue(Promise.resolve(mockFetchResponse));
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.callFake(() => {
                throw new SidetreeError_1.default(SharedErrorCode_1.default.ReadableStreamMaxAllowedDataSizeExceeded);
            });
            const fetchResult = yield casClient.read('QmWCcaE2iTRnJxqaC4VGFhD6ARsqRNPe2D2eYJTWgeP7ko', 1);
            expect(fetchSpy).toHaveBeenCalled();
            expect(readAllSpy).toHaveBeenCalled();
            expect(fetchResult.code).toEqual(FetchResultCode_1.default.MaxSizeExceeded);
        }));
    }));
}));
//# sourceMappingURL=Ipfs.spec.js.map