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
class MockBlockMetadataStore {
    constructor() {
        this.store = [];
    }
    add(blockMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            this.store.push(...blockMetadata);
        });
    }
    removeLaterThan(blockHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            if (blockHeight !== undefined) {
                this.store = this.store.filter((block) => { return block.height < blockHeight; });
            }
        });
    }
    get(fromInclusiveHeight, toExclusiveHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            const sortedStore = this.store.sort((a, b) => { return a.height - b.height; });
            return sortedStore.filter((block) => { return block.height >= fromInclusiveHeight && block.height < toExclusiveHeight; });
        });
    }
    getLast() {
        return __awaiter(this, void 0, void 0, function* () {
            const sortedStore = this.store.sort((a, b) => { return a.height - b.height; });
            return sortedStore[sortedStore.length - 1];
        });
    }
    lookBackExponentially() {
        return __awaiter(this, void 0, void 0, function* () {
            console.warn('lookBackExponentially always returns empty array. Use spy to override this.');
            return [];
        });
    }
}
exports.default = MockBlockMetadataStore;
//# sourceMappingURL=MockBlockMetadataStore.js.map