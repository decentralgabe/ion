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
const timeSpan = require("time-span");
const Compressor_1 = require("./util/Compressor");
const Delta_1 = require("./Delta");
const ErrorCode_1 = require("./ErrorCode");
const JsonAsync_1 = require("./util/JsonAsync");
const Logger_1 = require("../../../common/Logger");
const ProtocolParameters_1 = require("./ProtocolParameters");
const SidetreeError_1 = require("../../../common/SidetreeError");
/**
 * Defines operations related to a Chunk File.
 */
class ChunkFile {
    /**
     * Parses and validates the given chunk file buffer and all the operations within it.
     * @throws SidetreeError if failed parsing or validation.
     */
    static parse(chunkFileBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const endTimer = timeSpan();
            const maxAllowedDecompressedSizeInBytes = ProtocolParameters_1.default.maxChunkFileSizeInBytes * Compressor_1.default.estimatedDecompressionMultiplier;
            const decompressedChunkFileBuffer = yield Compressor_1.default.decompress(chunkFileBuffer, maxAllowedDecompressedSizeInBytes);
            const chunkFileObject = yield JsonAsync_1.default.parse(decompressedChunkFileBuffer);
            Logger_1.default.info(`Parsed chunk file in ${endTimer.rounded()} ms.`);
            // Ensure only properties specified by Sidetree protocol are given.
            const allowedProperties = new Set(['deltas']);
            for (const property in chunkFileObject) {
                if (!allowedProperties.has(property)) {
                    throw new SidetreeError_1.default(ErrorCode_1.default.ChunkFileUnexpectedProperty, `Unexpected property ${property} in chunk file.`);
                }
            }
            this.validateDeltasProperty(chunkFileObject.deltas);
            return chunkFileObject;
        });
    }
    static validateDeltasProperty(deltas) {
        // Make sure deltas is an array.
        if (!(deltas instanceof Array)) {
            throw new SidetreeError_1.default(ErrorCode_1.default.ChunkFileDeltasPropertyNotArray, 'Invalid chunk file, deltas property is not an array.');
        }
        // Validate every delta is an object
        for (const delta of deltas) {
            if (typeof delta !== 'object') {
                throw new SidetreeError_1.default(ErrorCode_1.default.ChunkFileDeltasNotArrayOfObjects, 'Invalid chunk file, deltas property is not an array of objects.');
            }
            // Verify size of each delta does not exceed the maximum allowed limit.
            Delta_1.default.validateDelta(delta);
        }
    }
    /**
     * Creates chunk file buffer.
     * @returns Chunk file buffer. Returns `undefined` if arrays passed in contains no operations.
     */
    static createBuffer(createOperations, recoverOperations, updateOperations) {
        return __awaiter(this, void 0, void 0, function* () {
            const deltas = [];
            deltas.push(...createOperations.map(operation => operation.delta));
            deltas.push(...recoverOperations.map(operation => operation.delta));
            deltas.push(...updateOperations.map(operation => operation.delta));
            if (deltas.length === 0) {
                return undefined;
            }
            const chunkFileModel = {
                deltas
            };
            const rawData = Buffer.from(JSON.stringify(chunkFileModel));
            const compressedRawData = yield Compressor_1.default.compress(Buffer.from(rawData));
            return compressedRawData;
        });
    }
}
exports.default = ChunkFile;
//# sourceMappingURL=ChunkFile.js.map