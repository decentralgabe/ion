/// <reference types="node" />
import IOperationQueue from './interfaces/IOperationQueue';
import IRequestHandler from '../../interfaces/IRequestHandler';
import Resolver from '../../Resolver';
import ResponseModel from '../../../common/models/ResponseModel';
/**
 * Sidetree operation request handler.
 */
export default class RequestHandler implements IRequestHandler {
    private resolver;
    private operationQueue;
    private didMethodName;
    private operationProcessor;
    constructor(resolver: Resolver, operationQueue: IOperationQueue, didMethodName: string);
    /**
     * Handles an operation request.
     */
    handleOperationRequest(request: Buffer): Promise<ResponseModel>;
    private handleCreateRequest;
    /**
     * Handles resolve operation.
     * @param shortOrLongFormDid Can either be:
     *   1. A short-form DID. e.g. 'did:<methodName>:abc' or
     *   2. A long-form DID. e.g. 'did:<methodName>:<unique-portion>:Base64url(JCS({suffix-data, delta}))'
     */
    handleResolveRequest(shortOrLongFormDid: string): Promise<ResponseModel>;
    /**
     * Resolves the given long-form DID by resolving using operations found over the network first;
     * if no operations found, the given create operation will be used to construct the DID state.
     *
     * @returns [DID state, published]
     */
    private resolveLongFormDid;
    private applyCreateOperation;
}
