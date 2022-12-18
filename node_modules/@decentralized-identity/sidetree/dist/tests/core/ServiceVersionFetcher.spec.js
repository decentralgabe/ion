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
const ReadableStream_1 = require("../../lib/common/ReadableStream");
const ServiceVersionFetcher_1 = require("../../lib/core/ServiceVersionFetcher");
describe('ServiceVersionFetcher', () => __awaiter(void 0, void 0, void 0, function* () {
    describe('getVersion()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should get version by making a REST api call.', () => __awaiter(void 0, void 0, void 0, function* () {
            const expectedServiceVersion = { name: 'test-service', version: 'x.y.z' };
            const serviceVersionFetcher = new ServiceVersionFetcher_1.default('someURI');
            const fetchSpy = spyOn(serviceVersionFetcher, 'fetch').and.returnValue(Promise.resolve({ status: 200 }));
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(JSON.stringify(expectedServiceVersion))));
            const version = yield serviceVersionFetcher.getVersion();
            expect(fetchSpy).toHaveBeenCalled();
            expect(readAllSpy).toHaveBeenCalled();
            expect(version).toEqual(expectedServiceVersion);
        }));
        it('should return undefined version if there is an exception during version REST call.', () => __awaiter(void 0, void 0, void 0, function* () {
            const serviceVersionFetcher = new ServiceVersionFetcher_1.default('someURI');
            const fetchSpy = spyOn(serviceVersionFetcher, 'fetch').and.throwError('some error.');
            const version = yield serviceVersionFetcher.getVersion();
            expect(fetchSpy).toHaveBeenCalled();
            expect(version.name).toEqual('undefined');
            expect(version.version).toEqual('undefined');
        }));
        it('should not fetch again if last fetch was within the threshold.', () => __awaiter(void 0, void 0, void 0, function* () {
            const serviceVersionFetcher = new ServiceVersionFetcher_1.default('someURI');
            // throw error on fetch to make sure that cached version is 'empty'
            const fetchSpy = spyOn(serviceVersionFetcher, 'fetch').and.throwError('some error.');
            const tryGetServiceVersionSpy = spyOn(serviceVersionFetcher, 'tryGetServiceVersion').and.callThrough();
            yield serviceVersionFetcher.getVersion();
            expect(fetchSpy).toHaveBeenCalled();
            expect(tryGetServiceVersionSpy).toHaveBeenCalled();
            // Call getVersion again and ensure that the network call didn't happen
            yield serviceVersionFetcher.getVersion();
            expect(tryGetServiceVersionSpy.calls.count()).toEqual(1);
        }));
        it('should fetch again if last fetch was outside the threshold.', () => __awaiter(void 0, void 0, void 0, function* () {
            const expectedServiceVersion = { name: 'test-service', version: 'x.y.z' };
            const serviceVersionFetcher = new ServiceVersionFetcher_1.default('someURI');
            const fetchSpy = spyOn(serviceVersionFetcher, 'fetch').and.returnValue(Promise.resolve({ status: 200 }));
            const readAllSpy = spyOn(ReadableStream_1.default, 'readAll').and.returnValue(Promise.resolve(Buffer.from(JSON.stringify(expectedServiceVersion))));
            const tryGetServiceVersionSpy = spyOn(serviceVersionFetcher, 'tryGetServiceVersion').and.callThrough();
            yield serviceVersionFetcher.getVersion();
            expect(fetchSpy).toHaveBeenCalled();
            expect(readAllSpy).toHaveBeenCalled();
            expect(tryGetServiceVersionSpy).toHaveBeenCalled();
            // Update the last fetch time to ensure another network call
            const fetchWaitTimeInMillisecs = (10 * 60 * 1000) + 1; // 10 mins + 1 millisec
            const futureTimeInMillisecs = Date.now() + fetchWaitTimeInMillisecs;
            spyOn(Date, 'now').and.returnValue(futureTimeInMillisecs);
            // Call getVersion again and ensure that another network call was made
            yield serviceVersionFetcher.getVersion();
            expect(fetchSpy.calls.count()).toEqual(2);
            expect(tryGetServiceVersionSpy.calls.count()).toEqual(2);
        }));
    }));
}));
//# sourceMappingURL=ServiceVersionFetcher.spec.js.map