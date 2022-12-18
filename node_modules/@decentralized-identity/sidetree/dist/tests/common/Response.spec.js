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
const Response_1 = require("../../lib/common/Response");
const ResponseStatus_1 = require("../../lib/common/enums/ResponseStatus");
describe('Response', () => {
    it('should return 200 as HTTP status code if ResponseStatus is Success.', () => {
        const httpStatusCode = Response_1.default.toHttpStatus(ResponseStatus_1.default.Succeeded);
        expect(httpStatusCode).toEqual(200);
    });
    it('should return 400 as HTTP status code if ResponseStatus is Bad Request.', () => {
        const httpStatusCode = Response_1.default.toHttpStatus(ResponseStatus_1.default.BadRequest);
        expect(httpStatusCode).toEqual(400);
    });
    it('should return 410 as HTTP status code if ResponseStatus is Deactivated.', () => {
        const httpStatusCode = Response_1.default.toHttpStatus(ResponseStatus_1.default.Deactivated);
        expect(httpStatusCode).toEqual(410);
    });
    it('should return 404 as HTTP status code if ResponseStatus is Not Found.', () => {
        const httpStatusCode = Response_1.default.toHttpStatus(ResponseStatus_1.default.NotFound);
        expect(httpStatusCode).toEqual(404);
    });
    it('should return 500 as HTTP status code if ResponseStatus is ServerError.', () => __awaiter(void 0, void 0, void 0, function* () {
        const httpStatusCode = Response_1.default.toHttpStatus(ResponseStatus_1.default.ServerError);
        expect(httpStatusCode).toEqual(500);
    }));
});
//# sourceMappingURL=Response.spec.js.map