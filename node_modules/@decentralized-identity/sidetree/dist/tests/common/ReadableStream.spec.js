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
const fs = require("fs");
const JasmineSidetreeErrorValidator_1 = require("../JasmineSidetreeErrorValidator");
const ReadableStream_1 = require("../../lib/common/ReadableStream");
const SharedErrorCode_1 = require("../../lib/common/SharedErrorCode");
describe('ReadableStream', () => {
    it('should read all content using readAll().', () => __awaiter(void 0, void 0, void 0, function* () {
        const inputFilePath = './tests/common/readable-stream-test-input.txt';
        const stream = fs.createReadStream(inputFilePath);
        const content = yield ReadableStream_1.default.readAll(stream);
        const expectedContent = fs.readFileSync(inputFilePath);
        expect(content.length).toBeGreaterThan(64000);
        expect(content).toEqual(expectedContent);
    }));
    it('should read buffer content using readAll().', () => __awaiter(void 0, void 0, void 0, function* () {
        const inputFilePath = './tests/common/test.png';
        const stream = fs.createReadStream(inputFilePath);
        const content = yield ReadableStream_1.default.readAll(stream);
        const expectedContent = fs.readFileSync(inputFilePath);
        expect(content).toEqual(expectedContent);
    }));
    it('should throw error if stream exceeds the max allowed size.', (done) => __awaiter(void 0, void 0, void 0, function* () {
        const inputFilePath = './tests/bitcoin/testData/bitcoinTwoBlocksRawDataHex.txt';
        const stream = fs.createReadStream(inputFilePath);
        const maxAllowedContentSize = 100;
        yield JasmineSidetreeErrorValidator_1.default.expectSidetreeErrorToBeThrownAsync(() => ReadableStream_1.default.readAll(stream, maxAllowedContentSize), SharedErrorCode_1.default.ReadableStreamMaxAllowedDataSizeExceeded);
        done();
    }));
});
//# sourceMappingURL=ReadableStream.spec.js.map