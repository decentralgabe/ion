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
const MongoDbStore_1 = require("../common/MongoDbStore");
/**
 * Implementation of IBlockMetadataStore using MongoDB database.
 */
class MongoDbBlockMetadataStore extends MongoDbStore_1.default {
    /**
     * Constructs a `MongoDbBlockMetadataStore`;
     */
    constructor(serverUrl, databaseName) {
        super(serverUrl, MongoDbBlockMetadataStore.collectionName, databaseName);
    }
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            // Create unique index, so duplicate inserts are rejected.
            yield this.collection.createIndex({ height: 1 }, { unique: true });
        });
    }
    add(arrayOfBlockMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const bulkOperations = this.collection.initializeOrderedBulkOp();
            arrayOfBlockMetadata.sort((a, b) => a.height - b.height);
            for (const blockMetadata of arrayOfBlockMetadata) {
                bulkOperations.find({ height: blockMetadata.height }).upsert().replaceOne(blockMetadata);
            }
            yield bulkOperations.execute();
        });
    }
    removeLaterThan(blockHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            // If block height is not given, remove all.
            if (blockHeight === undefined) {
                yield this.clearCollection();
                return;
            }
            yield this.collection.deleteMany({ height: { $gt: blockHeight } });
        });
    }
    get(fromInclusiveHeight, toExclusiveHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            let dbCursor;
            // Add filter to query.
            dbCursor = this.collection.find({
                $and: [
                    { height: { $gte: fromInclusiveHeight } },
                    { height: { $lt: toExclusiveHeight } }
                ]
            });
            // Add sort to query.
            dbCursor = dbCursor.sort({ height: 1 });
            // Execute the query.
            const blocks = yield dbCursor.toArray();
            return blocks;
        });
    }
    getLast() {
        return __awaiter(this, void 0, void 0, function* () {
            const blocks = yield this.collection.find().sort({ height: -1 }).limit(1).toArray();
            if (blocks.length === 0) {
                return undefined;
            }
            const lastBlockMetadata = blocks[0];
            return lastBlockMetadata;
        });
    }
    /**
     * Gets the first block (block with lowest height).
     */
    getFirst() {
        return __awaiter(this, void 0, void 0, function* () {
            const blocks = yield this.collection.find().sort({ height: 1 }).limit(1).toArray();
            if (blocks.length === 0) {
                return undefined;
            }
            const lastBlockMetadata = blocks[0];
            return lastBlockMetadata;
        });
    }
    lookBackExponentially() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastBlock = yield this.getLast();
            const firstBlock = yield this.getFirst();
            if (firstBlock === undefined) {
                return [];
            }
            // Exponentially look back from last block to first block.
            const heightOfBlocksToReturn = [];
            let lookBackDistance = 1;
            let currentHeight = lastBlock.height;
            while (currentHeight >= firstBlock.height) {
                heightOfBlocksToReturn.push(currentHeight);
                currentHeight = lastBlock.height - lookBackDistance;
                lookBackDistance *= 2;
            }
            const exponentiallySpacedBlocks = yield this.collection.find({ height: { $in: heightOfBlocksToReturn } }, MongoDbBlockMetadataStore.optionToExcludeIdField).toArray();
            exponentiallySpacedBlocks.sort((a, b) => b.height - a.height); // Sort in height descending order.
            return exponentiallySpacedBlocks;
        });
    }
}
exports.default = MongoDbBlockMetadataStore;
/** Collection name for storing block metadata. */
MongoDbBlockMetadataStore.collectionName = 'blocks';
/** Query option to exclude `_id` field from being returned. */
MongoDbBlockMetadataStore.optionToExcludeIdField = { fields: { _id: 0 } };
//# sourceMappingURL=MongoDbBlockMetadataStore.js.map