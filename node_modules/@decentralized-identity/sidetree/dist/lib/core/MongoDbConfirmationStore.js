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
 * Implementation of LastWriteStore that stores the last update per write
 */
class MongoDbConfirmationStore extends MongoDbStore_1.default {
    constructor(serverUrl, databaseName) {
        super(serverUrl, MongoDbConfirmationStore.collectionName, databaseName);
    }
    confirm(anchorString, confirmedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.updateMany({ anchorString }, { $set: { confirmedAt } });
        });
    }
    resetAfter(confirmedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.updateMany({ confirmedAt: { $gt: confirmedAt } }, { $set: { confirmedAt: undefined } });
        });
    }
    getLastSubmitted() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.collection.find().sort({ submittedAt: -1 }).limit(1).toArray();
            if (response.length === 0) {
                return undefined;
            }
            // NOTE: MongoDB saves explicit `undefined` property as `null` internally by default,
            // so we do the `null` to `undefined` conversion here.
            if (response[0].confirmedAt === null) {
                response[0].confirmedAt = undefined;
            }
            return response[0];
        });
    }
    submit(anchorString, submittedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.insertOne({
                anchorString,
                submittedAt
            });
        });
    }
    /**
     * @inheritDoc
     */
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.createIndex({ anchorString: 1 });
            yield this.collection.createIndex({ submittedAt: 1 });
            yield this.collection.createIndex({ confirmedAt: 1 });
        });
    }
}
exports.default = MongoDbConfirmationStore;
MongoDbConfirmationStore.collectionName = 'confirmations';
//# sourceMappingURL=MongoDbConfirmationStore.js.map