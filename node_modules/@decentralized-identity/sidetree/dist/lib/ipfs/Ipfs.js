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
const HttpStatus = require("http-status");
const crypto = require("crypto");
const FetchResultCode_1 = require("../common/enums/FetchResultCode");
const IpfsErrorCode_1 = require("../ipfs/IpfsErrorCode");
const Logger_1 = require("../common/Logger");
const ReadableStream_1 = require("../common/ReadableStream");
const SharedErrorCode_1 = require("../common/SharedErrorCode");
const SidetreeError_1 = require("../common/SidetreeError");
const Timeout_1 = require("./Util/Timeout");
const node_fetch_1 = require("node-fetch");
// this has to be require because it doesn't have a default export
const Cids = require('cids');
/**
 * Class that implements the `ICas` interface by communicating with IPFS.
 */
class Ipfs {
    constructor(uri, fetchTimeoutInSeconds) {
        this.uri = uri;
        this.fetchTimeoutInSeconds = fetchTimeoutInSeconds;
        this.fetch = node_fetch_1.default;
    }
    write(content) {
        return __awaiter(this, void 0, void 0, function* () {
            // A string that is cryptographically impossible to repeat as the boundary string.
            const multipartBoundaryString = crypto.randomBytes(32).toString('hex');
            // See https://tools.ietf.org/html/rfc7578#section-4.1
            // An example of multipart form data:
            //
            // --ABoundaryString
            // Content-Disposition: form-data;
            //
            // Content of the first part.
            // --ABoundaryString
            // Content-Disposition: form-data;
            // Content-Type: application/octet-stream
            //
            // Binary content of second part.
            // --ABoundaryString--
            const beginBoundary = Buffer.from(`--${multipartBoundaryString}\n`);
            const contentDisposition = Buffer.from(`Content-Disposition: form-data;\n`); // Required since IPFS v0.11
            const firstPartContentType = Buffer.from(`Content-Type: application/octet-stream\n\n`);
            const endBoundary = Buffer.from(`\n--${multipartBoundaryString}--`);
            const requestBody = Buffer.concat([beginBoundary, contentDisposition, firstPartContentType, content, endBoundary]);
            const requestParameters = {
                method: 'POST',
                headers: { 'Content-Type': `multipart/form-data; boundary=${multipartBoundaryString}` },
                body: requestBody
            };
            const addUrl = new URL('/api/v0/add', this.uri).toString(); // e.g. 'http://127.0.0.1:5001/api/v0/add'
            const response = yield this.fetch(addUrl, requestParameters);
            if (response.status !== HttpStatus.OK) {
                Logger_1.default.error(`IPFS write error response status: ${response.status}`);
                if (response.body) {
                    const errorBody = yield ReadableStream_1.default.readAll(response.body);
                    Logger_1.default.error(`IPFS write error body: ${errorBody}`);
                }
                throw new SidetreeError_1.default(IpfsErrorCode_1.default.IpfsFailedWritingContent, `Failed writing content of ${content.length} bytes.`);
            }
            const body = yield ReadableStream_1.default.readAll(response.body);
            const casUri = JSON.parse(body.toString()).Hash;
            Logger_1.default.info(`Wrote ${content.length} byte content as IPFS CID: ${casUri}`);
            return casUri;
        });
    }
    read(casUri, maxSizeInBytes) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // if Cid construction fails, it is not a valid cid
                /* eslint-disable no-new */
                new Cids(casUri);
            }
            catch (error) {
                Logger_1.default.info(`'${casUri}' is not a valid CID: ${SidetreeError_1.default.stringify(error)}`);
                return { code: FetchResultCode_1.default.InvalidHash };
            }
            // Fetch the content.
            let fetchResult;
            try {
                const fetchContentPromise = this.fetchContent(casUri, maxSizeInBytes);
                fetchResult = yield Timeout_1.default.timeout(fetchContentPromise, this.fetchTimeoutInSeconds * 1000);
            }
            catch (error) {
                // Log appropriately based on error.
                if (error.code === IpfsErrorCode_1.default.TimeoutPromiseTimedOut) {
                    Logger_1.default.info(`Timed out fetching CID '${casUri}'.`);
                }
                else {
                    // Log any unexpected error for investigation.
                    const errorMessage = `Unexpected error while fetching CID '${casUri}'. ` +
                        `Investigate and fix: ${SidetreeError_1.default.stringify(error)}`;
                    Logger_1.default.error(errorMessage);
                }
                // Mark content as `not found` if any error is thrown while fetching.
                return { code: FetchResultCode_1.default.NotFound };
            }
            // "Pin" (store permanently in local repo) content if fetch is successful. Re-pinning already existing object does not create a duplicate.
            if (fetchResult.code === FetchResultCode_1.default.Success) {
                yield this.pinContent(casUri);
                Logger_1.default.info(`Read and pinned ${fetchResult.content.length} bytes for CID: ${casUri}.`);
            }
            return fetchResult;
        });
    }
    /**
     * Fetch the content from IPFS.
     * This method also allows easy mocking in tests.
     */
    fetchContent(base58Multihash, maxSizeInBytes) {
        return __awaiter(this, void 0, void 0, function* () {
            // Go-IPFS HTTP API call.
            let response;
            try {
                // e.g. 'http://127.0.0.1:5001/api/v0/cat?arg=QmPPsg8BeJdqK2TnRHx5L2BFyjmFr9FK6giyznNjdL93NL&length=100000'
                // NOTE: we pass max size + 1 to the API because the API will return up to the size given,
                // so if we give the exact max size, we would not know when the content of the exact max size is returned,
                // whether the content is truncated or not; with the +1, if the content returned has size of max size + 1,
                // we can safely discard the content (in the stream read below) and return size exceeded as the fetch result.
                // Alternatively, we could choose not to supply this optional `length` parameter, but we do so such that
                // IPFS is given the opportunity to optimize its download logic. (e.g. not needing to download the entire content).
                const catUrl = new URL(`/api/v0/cat?arg=${base58Multihash}&length=${maxSizeInBytes + 1}`, this.uri).toString();
                response = yield this.fetch(catUrl, { method: 'POST' });
            }
            catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    return { code: FetchResultCode_1.default.CasNotReachable };
                }
                throw error;
            }
            // Handle non-OK response.
            if (response.status !== HttpStatus.OK) {
                const body = yield ReadableStream_1.default.readAll(response.body);
                const json = JSON.parse(body.toString());
                if (json.Message === 'this dag node is a directory') {
                    return { code: FetchResultCode_1.default.NotAFile };
                }
                Logger_1.default.info(`Received response code ${response.status} from IPFS for CID ${base58Multihash}: ${json})}`);
                return { code: FetchResultCode_1.default.NotFound };
            }
            // Handle OK response.
            const fetchResult = { code: FetchResultCode_1.default.Success };
            try {
                fetchResult.content = yield ReadableStream_1.default.readAll(response.body, maxSizeInBytes);
                return fetchResult;
            }
            catch (error) {
                if (error.code === SharedErrorCode_1.default.ReadableStreamMaxAllowedDataSizeExceeded) {
                    return { code: FetchResultCode_1.default.MaxSizeExceeded };
                }
                throw error;
            }
        });
    }
    pinContent(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            // e.g. 'http://127.0.0.1:5001/api/v0/pin/add?arg=QmPPsg8BeJdqK2TnRHx5L2BFyjmFr9FK6giyznNjdL93NL'
            const pinUrl = new URL(`/api/v0/pin/add?arg=${hash}`, this.uri).toString();
            yield this.fetch(pinUrl, { method: 'POST' });
        });
    }
}
exports.default = Ipfs;
//# sourceMappingURL=Ipfs.js.map