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
const SharedErrorCode_1 = require("../common/SharedErrorCode");
const SidetreeError_1 = require("./SidetreeError");
/* global NodeJS */
/**
 * ReadableStream utilities
 */
class ReadableStream {
    /**
     * Given a readable stream, reads all data only if the content does not exceed given max size.
     * Throws error if content exceeds give max size.
     * @param stream Readable stream to read.
     * @param maxAllowedSizeInBytes The maximum allowed size limit of the content.
     * @returns a Buffer of the readable stream data
     */
    static readAll(stream, maxAllowedSizeInBytes) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set callback for the 'readable' event to concatenate chunks of the readable stream.
            let content = Buffer.alloc(0);
            let currentSizeInBytes = 0;
            stream.on('readable', () => {
                // NOTE: Cast to any is to work-around incorrect TS definition for read() where
                // `null` should be a possible return type but is not defined in @types/node: 10.12.18.
                let chunk = stream.read();
                while (chunk !== null) {
                    currentSizeInBytes += chunk.length;
                    // Monitor on read size only if `maxAllowedSizeInBytes` is set.
                    if (maxAllowedSizeInBytes !== undefined &&
                        currentSizeInBytes > maxAllowedSizeInBytes) {
                        const error = new SidetreeError_1.default(SharedErrorCode_1.default.ReadableStreamMaxAllowedDataSizeExceeded, `Max data size allowed: ${maxAllowedSizeInBytes} bytes, aborted reading at ${currentSizeInBytes} bytes.`);
                        // NOTE: Cast to any is to work-around incorrect TS definition where `destroy()` is missing.
                        stream.destroy(error);
                    }
                    content = Buffer.concat([content, chunk]);
                    chunk = stream.read();
                }
            });
            // Create a promise to wrap the successful/failed read events.
            const readBody = new Promise((resolve, reject) => {
                stream.on('end', resolve);
                stream.on('error', reject);
            });
            // Wait until the read is completed.
            yield readBody;
            return content;
        });
    }
}
exports.default = ReadableStream;
//# sourceMappingURL=ReadableStream.js.map