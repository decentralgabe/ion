/// <reference types="node" />
import IOperationQueue from '../../../../lib/core/versions/latest/interfaces/IOperationQueue';
import IRequestHandler from '../../../../lib/core/interfaces/IRequestHandler';
import Resolver from '../../../../lib/core/Resolver';
import ResponseModel from '../../../../lib/common/models/ResponseModel';
/**
 * Request handler.
 */
export default class RequestHandler implements IRequestHandler {
    private resolver;
    private operationQueue;
    private didMethodName;
    constructor(resolver: Resolver, operationQueue: IOperationQueue, didMethodName: string);
    handleOperationRequest(request: Buffer): Promise<ResponseModel>;
    handleResolveRequest(didOrDidDocument: string): Promise<ResponseModel>;
}
