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
const util = require("util");
const zlib = require("zlib");
const ErrorCode_1 = require("../ErrorCode");
const SidetreeError_1 = require("../../../../common/SidetreeError");
/**
 * Encapsulates functionality to compress/decompress data.
 */
class Compressor {
    /**
     * Compresses teh data in gzip and return it as buffer.
     * @param inputAsBuffer The input string to be compressed.
     */
    static compress(inputAsBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield Compressor.gzipAsync(inputAsBuffer);
            // Casting result to Buffer as that's what is returned by gzip
            return result;
        });
    }
    /**
     * Decompresses the input and returns it as buffer.
     */
    static decompress(inputAsBuffer, maxAllowedDecompressedSizeInBytes) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create a gunzip transform object.
            const gunzip = zlib.createGunzip();
            let content = Buffer.alloc(0);
            // Handle the data chunks that are decompressed as they come in.
            gunzip.on('data', (chunk) => {
                const currentContentLength = content.length + chunk.length;
                // If decompressed data exceeded max allowed size, terminate gunzip and throw error.
                if (currentContentLength > maxAllowedDecompressedSizeInBytes) {
                    const error = new SidetreeError_1.default(ErrorCode_1.default.CompressorMaxAllowedDecompressedDataSizeExceeded, `Max data size allowed: ${maxAllowedDecompressedSizeInBytes} bytes, aborted decompression at ${currentContentLength} bytes.`);
                    gunzip.destroy(error);
                    return;
                }
                content = Buffer.concat([content, chunk]);
            });
            // Create a promise to wrap the successful/failed decompress events.
            const readBody = new Promise((resolve, reject) => {
                gunzip.on('end', resolve);
                gunzip.on('error', reject);
            });
            // Now that we have setup all the call backs, we pass the buffer to be decoded to the writable stream of gunzip Transform.
            gunzip.end(inputAsBuffer);
            // Wait until the read is completed.
            yield readBody;
            return content;
        });
    }
}
exports.default = Compressor;
/** The estimated ratio/multiplier of decompressed Sidetree CAS file size compared against the compressed file size. */
Compressor.estimatedDecompressionMultiplier = 3;
Compressor.gzipAsync = util.promisify(zlib.gzip);
//# sourceMappingURL=Compressor.js.map