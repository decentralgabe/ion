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
const Delta_1 = require("./Delta");
const Did_1 = require("./Did");
const DocumentComposer_1 = require("./DocumentComposer");
const ErrorCode_1 = require("./ErrorCode");
const JsonAsync_1 = require("./util/JsonAsync");
const Logger_1 = require("../../../common/Logger");
const Operation_1 = require("./Operation");
const OperationProcessor_1 = require("./OperationProcessor");
const OperationType_1 = require("../../enums/OperationType");
const ResponseStatus_1 = require("../../../common/enums/ResponseStatus");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Sidetree operation request handler.
 */
class RequestHandler {
    constructor(resolver, operationQueue, didMethodName) {
        this.resolver = resolver;
        this.operationQueue = operationQueue;
        this.didMethodName = didMethodName;
        this.operationProcessor = new OperationProcessor_1.default();
    }
    /**
     * Handles an operation request.
     */
    handleOperationRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Handling operation request of size ${request.length} bytes...`);
            // Perform common validation for any write request and parse it into an `OperationModel`.
            let operationModel;
            try {
                const operationRequest = yield JsonAsync_1.default.parse(request);
                // Check `delta` property data size if they exist in the operation.
                if (operationRequest.type === OperationType_1.default.Create ||
                    operationRequest.type === OperationType_1.default.Recover ||
                    operationRequest.type === OperationType_1.default.Update) {
                    Delta_1.default.validateDelta(operationRequest.delta);
                }
                operationModel = yield Operation_1.default.parse(request);
                // Reject operation if there is already an operation for the same DID waiting to be batched and anchored.
                if (yield this.operationQueue.contains(operationModel.didUniqueSuffix)) {
                    const errorMessage = `An operation request already exists in queue for DID '${operationModel.didUniqueSuffix}', only one is allowed at a time.`;
                    throw new SidetreeError_1.default(ErrorCode_1.default.QueueingMultipleOperationsPerDidNotAllowed, errorMessage);
                }
            }
            catch (error) {
                // Give meaningful/specific error code and message when possible.
                if (error instanceof SidetreeError_1.default) {
                    Logger_1.default.info(`Bad request: ${error.code}`);
                    Logger_1.default.info(`Error message: ${error.message}`);
                    return {
                        status: ResponseStatus_1.default.BadRequest,
                        body: { code: error.code, message: error.message }
                    };
                }
                // Else we give a generic bad request response.
                Logger_1.default.info(`Bad request: ${error}`);
                return {
                    status: ResponseStatus_1.default.BadRequest
                };
            }
            try {
                Logger_1.default.info(`Operation type: '${operationModel.type}', DID unique suffix: '${operationModel.didUniqueSuffix}'`);
                // Passed common operation validation, hand off to specific operation handler.
                let response;
                switch (operationModel.type) {
                    case OperationType_1.default.Create:
                        response = yield this.handleCreateRequest(operationModel);
                        break;
                    // these cases do nothing because we do not know the latest document state unless we resolve.
                    case OperationType_1.default.Update:
                    case OperationType_1.default.Recover:
                    case OperationType_1.default.Deactivate:
                        response = {
                            status: ResponseStatus_1.default.Succeeded
                        };
                        break;
                    default:
                        // Should be an impossible condition, but we defensively check and handle.
                        response = {
                            status: ResponseStatus_1.default.BadRequest,
                            body: { code: ErrorCode_1.default.RequestHandlerUnknownOperationType, message: `Unsupported operation type '${operationModel.type}'.` }
                        };
                }
                // if the operation was processed successfully, queue the original request buffer for batching.
                if (response.status === ResponseStatus_1.default.Succeeded) {
                    yield this.operationQueue.enqueue(operationModel.didUniqueSuffix, operationModel.operationBuffer);
                }
                return response;
            }
            catch (error) {
                // Give meaningful/specific error code and message when possible.
                if (error instanceof SidetreeError_1.default) {
                    Logger_1.default.info(`Sidetree error: ${error.code} ${error.message}`);
                    return {
                        status: ResponseStatus_1.default.BadRequest,
                        body: { code: error.code, message: error.message }
                    };
                }
                Logger_1.default.info(`Unexpected error: ${error}`);
                return {
                    status: ResponseStatus_1.default.ServerError
                };
            }
        });
    }
    handleCreateRequest(operationModel) {
        return __awaiter(this, void 0, void 0, function* () {
            const didState = yield this.applyCreateOperation(operationModel);
            // Should be an impossible condition, but we defensively check and handle.
            if (didState === undefined) {
                return {
                    status: ResponseStatus_1.default.BadRequest,
                    body: 'Invalid create operation.'
                };
            }
            const didString = `did:${this.didMethodName}:${operationModel.didUniqueSuffix}`;
            const published = false;
            const did = yield Did_1.default.create(didString, this.didMethodName);
            const document = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
            return {
                status: ResponseStatus_1.default.Succeeded,
                body: document
            };
        });
    }
    /**
     * Handles resolve operation.
     * @param shortOrLongFormDid Can either be:
     *   1. A short-form DID. e.g. 'did:<methodName>:abc' or
     *   2. A long-form DID. e.g. 'did:<methodName>:<unique-portion>:Base64url(JCS({suffix-data, delta}))'
     */
    handleResolveRequest(shortOrLongFormDid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                Logger_1.default.info(`Handling resolution request for: ${shortOrLongFormDid}...`);
                const did = yield Did_1.default.create(shortOrLongFormDid, this.didMethodName);
                let didState;
                let published = false;
                if (did.isShortForm) {
                    didState = yield this.resolver.resolve(did.uniqueSuffix);
                    if (didState !== undefined) {
                        published = true;
                    }
                }
                else {
                    [didState, published] = yield this.resolveLongFormDid(did);
                }
                if (didState === undefined) {
                    Logger_1.default.info(`DID not found for DID '${shortOrLongFormDid}'...`);
                    return {
                        status: ResponseStatus_1.default.NotFound,
                        body: { code: ErrorCode_1.default.DidNotFound, message: 'DID Not Found' }
                    };
                }
                // We reach here it means there is a DID Document to return.
                // If DID is published, use the short-form DID; else use long-form DID in document.
                const document = DocumentComposer_1.default.transformToExternalDocument(didState, did, published);
                // Status is different if DID is deactivated.
                const didDeactivated = didState.nextRecoveryCommitmentHash === undefined;
                const status = didDeactivated ? ResponseStatus_1.default.Deactivated : ResponseStatus_1.default.Succeeded;
                Logger_1.default.info(`DID Document found for DID '${shortOrLongFormDid}'...`);
                return {
                    status,
                    body: document
                };
            }
            catch (error) {
                // Give meaningful/specific error code and message when possible.
                if (error instanceof SidetreeError_1.default) {
                    Logger_1.default.info(`Bad request. Code: ${error.code}. Message: ${error.message}`);
                    return {
                        status: ResponseStatus_1.default.BadRequest,
                        body: { code: error.code, message: error.message }
                    };
                }
                Logger_1.default.info(`Unexpected error: ${error}`);
                return {
                    status: ResponseStatus_1.default.ServerError
                };
            }
        });
    }
    /**
     * Resolves the given long-form DID by resolving using operations found over the network first;
     * if no operations found, the given create operation will be used to construct the DID state.
     *
     * @returns [DID state, published]
     */
    resolveLongFormDid(did) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Handling long-form DID resolution of DID '${did.longForm}'...`);
            // Attempt to resolve the DID by using operations found from the network first.
            let didState = yield this.resolver.resolve(did.uniqueSuffix);
            // If DID state found then return it.
            if (didState !== undefined) {
                return [didState, true];
            }
            // The code reaches here if this DID is not registered on the ledger.
            didState = yield this.applyCreateOperation(did.createOperation);
            return [didState, false];
        });
    }
    applyCreateOperation(createOperation) {
        return __awaiter(this, void 0, void 0, function* () {
            const operationWithMockedAnchorTime = {
                didUniqueSuffix: createOperation.didUniqueSuffix,
                type: OperationType_1.default.Create,
                transactionTime: 0,
                transactionNumber: 0,
                operationIndex: 0,
                operationBuffer: createOperation.operationBuffer
            }; // NOTE: The transaction timing does not matter here, we are just computing a "theoretical" document if it were anchored on blockchain.
            const newDidState = yield this.operationProcessor.apply(operationWithMockedAnchorTime, undefined);
            return newDidState;
        });
    }
}
exports.default = RequestHandler;
//# sourceMappingURL=RequestHandler.js.map