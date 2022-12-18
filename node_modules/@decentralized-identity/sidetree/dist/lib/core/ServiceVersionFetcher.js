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
const Logger_1 = require("../common/Logger");
const ReadableStream_1 = require("../common/ReadableStream");
const node_fetch_1 = require("node-fetch");
/**
 * Encapsulates the functionality of getting the version information from the dependent services.
 */
class ServiceVersionFetcher {
    /**
     * Creates a new instance of this object.
     * @param uri The target service uri which must implement a /version endpoint returning
     * ServiceVersionModel json object.
     */
    constructor(uri) {
        this.uri = uri;
        this.fetch = node_fetch_1.default;
        this.lastTryFetchTime = 0;
        this.cachedVersion = ServiceVersionFetcher.emptyServiceVersion;
    }
    /**
     * Gets the service version.
     * Returns an 'empty' service version if unable to fetch it.
     */
    getVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            // If the last fetch was more than our threshold, try and refresh the version again
            if (Date.now() - this.lastTryFetchTime > ServiceVersionFetcher.fetchWaitTimeInMilliseconds) {
                this.cachedVersion = yield this.tryGetServiceVersion();
            }
            return this.cachedVersion;
        });
    }
    /**
     * Tries to get the version information by making the REST API call. In case of any errors, it ignores
     * any exceptions and returns an 'empty' service version information.
     */
    tryGetServiceVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.lastTryFetchTime = Date.now();
                const versionUri = `${this.uri}/version`;
                Logger_1.default.info(`Trying to get the version info from the blockchain service. Url: ${versionUri}`);
                const response = yield this.fetch(versionUri);
                const responseBodyBuffer = yield ReadableStream_1.default.readAll(response.body);
                Logger_1.default.info(`Received version response from the blockchain service: ${responseBodyBuffer.toString()}`);
                return JSON.parse(responseBodyBuffer.toString());
            }
            catch (e) {
                Logger_1.default.error(`Ignoring the exception during blockchain service version retrieval: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
            }
            return ServiceVersionFetcher.emptyServiceVersion;
        });
    }
    static get emptyServiceVersion() {
        return {
            name: 'undefined',
            version: 'undefined'
        };
    }
}
exports.default = ServiceVersionFetcher;
ServiceVersionFetcher.fetchWaitTimeInMilliseconds = 600000; // 10 minutes
//# sourceMappingURL=ServiceVersionFetcher.js.map