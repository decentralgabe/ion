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
const ErrorCode_1 = require("./ErrorCode");
const JsonAsync_1 = require("./versions/latest/util/JsonAsync");
const Logger_1 = require("../common/Logger");
const ReadableStream_1 = require("../common/ReadableStream");
const ServiceVersionFetcher_1 = require("./ServiceVersionFetcher");
const SharedErrorCode_1 = require("../common/SharedErrorCode");
const SidetreeError_1 = require("../common/SidetreeError");
const node_fetch_1 = require("node-fetch");
/**
 * Class that communicates with the underlying blockchain using REST API defined by the protocol document.
 */
class Blockchain {
    constructor(uri) {
        this.uri = uri;
        this.fetch = node_fetch_1.default;
        this.transactionsUri = `${uri}/transactions`;
        this.timeUri = `${uri}/time`;
        this.feeUri = `${uri}/fee`;
        this.locksUri = `${uri}/locks`;
        this.writerLockUri = `${uri}/writerlock`;
        this.serviceVersionFetcher = new ServiceVersionFetcher_1.default(uri);
    }
    write(anchorString, minimumFee) {
        return __awaiter(this, void 0, void 0, function* () {
            const anchorStringObject = {
                minimumFee,
                anchorString
            };
            const requestParameters = {
                method: 'post',
                body: Buffer.from(JSON.stringify(anchorStringObject)),
                headers: { 'Content-Type': 'application/json' }
            };
            const response = yield this.fetch(this.transactionsUri, requestParameters);
            // Throw error with meaningful code if possible.
            if (response.status !== HttpStatus.OK) {
                const body = response.body.read().toString();
                Logger_1.default.error(`Blockchain write error response status: ${response.status}`);
                Logger_1.default.error(`Blockchain write error body: ${body}`);
                let parsedBody;
                try {
                    parsedBody = JSON.parse(body);
                }
                catch (_a) {
                    // Continue even if JSON parsing fails. We are just trying to parse the body as an object if possible.
                }
                // Throw Sidetree error with specific code if given.
                if (parsedBody !== undefined && parsedBody.code !== undefined) {
                    throw new SidetreeError_1.default(parsedBody.code, 'Remote blockchain service returned a known write error.');
                }
                // Else throw generic sidetree error.
                throw new SidetreeError_1.default(ErrorCode_1.default.BlockchainWriteUnexpectedError, 'Remote blockchain service returned an unexpected write error.');
            }
        });
    }
    read(sinceTransactionNumber, transactionTimeHash) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((sinceTransactionNumber !== undefined && transactionTimeHash === undefined) ||
                (sinceTransactionNumber === undefined && transactionTimeHash !== undefined)) {
                throw new SidetreeError_1.default(ErrorCode_1.default.BlockchainReadInvalidArguments, 'Transaction number and time hash must both be given or not given at the same time.');
            }
            let queryString = '';
            if (sinceTransactionNumber !== undefined && transactionTimeHash !== undefined) {
                queryString = `?since=${sinceTransactionNumber}&transaction-time-hash=${transactionTimeHash}`;
            }
            const readUri = this.transactionsUri + queryString; // e.g. https://127.0.0.1/transactions?since=6212927891701761&transaction-time-hash=abc
            Logger_1.default.info(`Fetching URI '${readUri}'...`);
            const response = yield this.fetch(readUri);
            Logger_1.default.info(`Fetch response: ${response.status}'.`);
            const responseBodyBuffer = yield ReadableStream_1.default.readAll(response.body);
            let responseBody;
            try {
                responseBody = JSON.parse(responseBodyBuffer.toString());
            }
            catch (_a) {
                throw new SidetreeError_1.default(ErrorCode_1.default.BlockchainReadResponseBodyNotJson, `Blockchain read response body not JSON: ${responseBodyBuffer}`);
            }
            if (response.status === HttpStatus.BAD_REQUEST &&
                responseBody.code === SharedErrorCode_1.default.InvalidTransactionNumberOrTimeHash) {
                throw new SidetreeError_1.default(SharedErrorCode_1.default.InvalidTransactionNumberOrTimeHash);
            }
            if (response.status !== HttpStatus.OK) {
                throw new SidetreeError_1.default(ErrorCode_1.default.BlockchainReadResponseNotOk, `Blockchain read HTTP status ${response.status}. Body: ${responseBodyBuffer}`);
            }
            return responseBody;
        });
    }
    getFirstValidTransaction(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyString = JSON.stringify({ transactions });
            const requestParameters = {
                method: 'post',
                body: Buffer.from(bodyString),
                headers: { 'Content-Type': 'application/json' }
            };
            const firstValidTransactionUri = `${this.transactionsUri}/firstValid`;
            Logger_1.default.info(`Posting to first-valid transaction URI '${firstValidTransactionUri} with body: '${bodyString}'...`);
            const response = yield this.fetch(firstValidTransactionUri, requestParameters);
            if (response.status === HttpStatus.NOT_FOUND) {
                return undefined;
            }
            const responseBodyString = response.body.read().toString();
            const transaction = JSON.parse(responseBodyString);
            return transaction;
        });
    }
    /**
     * Gets the version of the bitcoin service.
     */
    getServiceVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.serviceVersionFetcher.getVersion();
        });
    }
    /**
     * Gets the latest blockchain time and updates the cached time.
     */
    getLatestTime() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Getting blockchain time...`);
            const response = yield this.fetch(this.timeUri);
            const responseBodyString = response.body.read().toString();
            if (response.status !== HttpStatus.OK) {
                const errorMessage = `Encountered an error fetching latest time from blockchain: ${responseBodyString}`;
                throw new SidetreeError_1.default(ErrorCode_1.default.BlockchainGetLatestTimeResponseNotOk, errorMessage);
            }
            Logger_1.default.info(`Got latest blockchain time: ${responseBodyString}`);
            const latestBlockchainTimeModel = JSON.parse(responseBodyString);
            return latestBlockchainTimeModel;
        });
    }
    getFee(transactionTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const readUri = `${this.feeUri}/${transactionTime}`;
            const response = yield this.fetch(readUri);
            const responseBodyString = yield ReadableStream_1.default.readAll(response.body);
            const responseBody = JSON.parse(responseBodyString.toString());
            if (response.status === HttpStatus.BAD_REQUEST &&
                responseBody.code === SharedErrorCode_1.default.BlockchainTimeOutOfRange) {
                throw new SidetreeError_1.default(SharedErrorCode_1.default.BlockchainTimeOutOfRange);
            }
            if (response.status !== HttpStatus.OK) {
                Logger_1.default.error(`Blockchain read error response status: ${response.status}`);
                Logger_1.default.error(`Blockchain read error body: ${responseBodyString}`);
                throw new SidetreeError_1.default(ErrorCode_1.default.BlockchainGetFeeResponseNotOk);
            }
            return responseBody.normalizedTransactionFee;
        });
    }
    getValueTimeLock(lockIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const readUri = `${this.locksUri}/${lockIdentifier}`;
            const response = yield this.fetch(readUri);
            const responseBodyString = yield ReadableStream_1.default.readAll(response.body);
            if (response.status === HttpStatus.NOT_FOUND) {
                return undefined;
            }
            if (response.status !== HttpStatus.OK) {
                throw new SidetreeError_1.default(ErrorCode_1.default.BlockchainGetLockResponseNotOk, `Response: ${responseBodyString}`);
            }
            return JsonAsync_1.default.parse(responseBodyString);
        });
    }
    getWriterValueTimeLock() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.fetch(this.writerLockUri);
            if (response.status === HttpStatus.NOT_FOUND) {
                return undefined;
            }
            const responseBodyString = yield ReadableStream_1.default.readAll(response.body);
            if (response.status !== HttpStatus.OK) {
                throw new SidetreeError_1.default(ErrorCode_1.default.BlockchainGetWriterLockResponseNotOk, `Status: ${response.status}. Response: ${responseBodyString}.`);
            }
            const responseBody = yield JsonAsync_1.default.parse(responseBodyString);
            return responseBody;
        });
    }
}
exports.default = Blockchain;
//# sourceMappingURL=Blockchain.js.map