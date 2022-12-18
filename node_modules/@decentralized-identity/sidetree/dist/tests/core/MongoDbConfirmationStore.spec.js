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
const MongoDb_1 = require("../common/MongoDb");
const MongoDbConfirmationStore_1 = require("../../lib/core/MongoDbConfirmationStore");
/**
 * Creates a MongoDbConfirmationStore and initializes it.
 */
function createConfirmationStore(ConfirmationStoreUri, databaseName) {
    return __awaiter(this, void 0, void 0, function* () {
        const ConfirmationStore = new MongoDbConfirmationStore_1.default(ConfirmationStoreUri, databaseName);
        yield ConfirmationStore.initialize();
        return ConfirmationStore;
    });
}
describe('MongoDbConfirmationStore', () => __awaiter(void 0, void 0, void 0, function* () {
    const config = require('../json/config-test.json');
    const databaseName = 'sidetree-test';
    let confirmationStore;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield MongoDb_1.default.createInmemoryDb(config);
        confirmationStore = yield createConfirmationStore(config.mongoDbConnectionString, databaseName);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield confirmationStore.clearCollection();
    }));
    describe('getLastSubmitted', () => {
        it('should get the last submitted transaction', () => __awaiter(void 0, void 0, void 0, function* () {
            yield confirmationStore.submit('anchor-string1', 103);
            yield confirmationStore.submit('anchor-string2', 104);
            yield confirmationStore.submit('anchor-string3', 105);
            yield confirmationStore.submit('anchor-string4', 102);
            yield confirmationStore.submit('anchor-string5', 101);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 105, anchorString: 'anchor-string3'
            }));
        }));
        it('should return undefined if nothing has been submitted yet', () => __awaiter(void 0, void 0, void 0, function* () {
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(undefined);
        }));
        it('should return confirmed once confirmed', () => __awaiter(void 0, void 0, void 0, function* () {
            yield confirmationStore.submit('anchor-string1', 100);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 100, anchorString: 'anchor-string1'
            }));
            yield confirmationStore.confirm('anchor-string1', 101);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 100, confirmedAt: 101, anchorString: 'anchor-string1'
            }));
            yield confirmationStore.submit('anchor-string2', 105);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 105, anchorString: 'anchor-string2'
            }));
            yield confirmationStore.confirm('anchor-string2', 106);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 105, confirmedAt: 106, anchorString: 'anchor-string2'
            }));
        }));
        it('should clear the collections using afterReset with undefined args', () => __awaiter(void 0, void 0, void 0, function* () {
            yield confirmationStore.submit('anchor-string1', 100);
            yield confirmationStore.confirm('anchor-string1', 101);
            yield confirmationStore.submit('anchor-string2', 110);
            yield confirmationStore.resetAfter(undefined);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 110, anchorString: 'anchor-string2'
            }));
        }));
        it('should handle reorg correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            yield confirmationStore.submit('anchor-string1', 100);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 100, anchorString: 'anchor-string1'
            }));
            yield confirmationStore.confirm('anchor-string1', 101);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 100, confirmedAt: 101, anchorString: 'anchor-string1'
            }));
            yield confirmationStore.resetAfter(101);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 100, confirmedAt: 101, anchorString: 'anchor-string1'
            }));
            yield confirmationStore.resetAfter(100);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 100, anchorString: 'anchor-string1'
            }));
            yield confirmationStore.confirm('anchor-string1', 102);
            yield expectAsync(confirmationStore.getLastSubmitted()).toBeResolvedTo(jasmine.objectContaining({
                submittedAt: 100, confirmedAt: 102, anchorString: 'anchor-string1'
            }));
        }));
    });
}));
//# sourceMappingURL=MongoDbConfirmationStore.spec.js.map