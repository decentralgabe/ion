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
/**
 * Request handler.
 */
class RequestHandler {
    constructor(resolver, operationQueue, didMethodName) {
        this.resolver = resolver;
        this.operationQueue = operationQueue;
        this.didMethodName = didMethodName;
        console.info(this.resolver, this.operationQueue, this.didMethodName);
    }
    handleOperationRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`RequestHandler: Not implemented. Version: TestVersion1. Inputs: ${request}`);
        });
    }
    handleResolveRequest(didOrDidDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`RequestHandler: Not implemented. Version: TestVersion1. Inputs: ${didOrDidDocument}`);
        });
    }
}
exports.default = RequestHandler;
//# sourceMappingURL=RequestHandler.js.map