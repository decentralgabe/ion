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
const Encoder_1 = require("../../lib/core/versions/latest/Encoder");
const FetchResultCode_1 = require("../../lib/common/enums/FetchResultCode");
const Multihash_1 = require("../../lib/core/versions/latest/Multihash");
/**
 * Implementation of a CAS class for testing.
 * Simply using a hash map to store all the content by hash.
 */
class MockCas {
    constructor(mockSecondsTakenForEachCasFetch) {
        /** A Map that stores the given content. */
        this.storage = new Map();
        /** Time taken in seconds for each mock fetch. */
        this.mockSecondsTakenForEachCasFetch = 0;
        if (mockSecondsTakenForEachCasFetch !== undefined) {
            this.mockSecondsTakenForEachCasFetch = mockSecondsTakenForEachCasFetch;
        }
    }
    /**
     * Gets the address that can be used to access the given content.
     */
    static getAddress(content) {
        const hash = Multihash_1.default.hash(content, 18); // SHA256
        const encodedHash = Encoder_1.default.encode(hash);
        return encodedHash;
    }
    write(content) {
        return __awaiter(this, void 0, void 0, function* () {
            const encodedHash = MockCas.getAddress(content);
            this.storage.set(encodedHash, content);
            return encodedHash;
        });
    }
    read(address, _maxSizeInBytes) {
        return __awaiter(this, void 0, void 0, function* () {
            // Wait for configured time before returning.
            yield new Promise(resolve => setTimeout(resolve, this.mockSecondsTakenForEachCasFetch * 1000));
            const content = this.storage.get(address);
            if (content === undefined) {
                return {
                    code: FetchResultCode_1.default.NotFound
                };
            }
            return {
                code: FetchResultCode_1.default.Success,
                content
            };
        });
    }
}
exports.default = MockCas;
//# sourceMappingURL=MockCas.js.map