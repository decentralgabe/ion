"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A class that can generate `BlockMetadata`.
 */
class BlockMetadataGenerator {
    /**
     * Generates an array of `BlockMetadata`.
     */
    static generate(count) {
        const blocks = [];
        for (let i = 0; i < count; i++) {
            const block = {
                hash: 'anything',
                height: i,
                previousHash: 'anything',
                totalFee: i,
                normalizedFee: i,
                transactionCount: i
            };
            blocks.push(block);
        }
        return blocks;
    }
}
exports.default = BlockMetadataGenerator;
//# sourceMappingURL=BlockMetadataGenerator.js.map