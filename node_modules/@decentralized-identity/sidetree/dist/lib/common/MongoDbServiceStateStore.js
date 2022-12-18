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
const MongoDbStore_1 = require("./MongoDbStore");
/**
 * Implementation of IServiceStateStore using MongoDB database.
 */
class MongoDbServiceStateStore extends MongoDbStore_1.default {
    /**
     * Constructs a `MongoDbServiceStateStore`;
     */
    constructor(serverUrl, databaseName) {
        super(serverUrl, MongoDbServiceStateStore.collectionName, databaseName);
    }
    put(serviceState) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.replaceOne({}, serviceState, { upsert: true }); // { } filter results in replacement of the first document returned.
        });
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            const queryOptions = { fields: { _id: 0 } }; // Exclude `_id` field from being returned.
            const serviceState = yield this.collection.findOne({}, queryOptions);
            return serviceState ? serviceState : {};
        });
    }
}
exports.default = MongoDbServiceStateStore;
/** Collection name for storing service state. */
MongoDbServiceStateStore.collectionName = 'service';
//# sourceMappingURL=MongoDbServiceStateStore.js.map