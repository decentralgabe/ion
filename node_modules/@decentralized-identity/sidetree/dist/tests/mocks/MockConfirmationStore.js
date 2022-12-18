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
class MockConfirmationStore {
    constructor() {
        this.entries = [];
    }
    clear() {
        this.entries = [];
    }
    confirm(anchorString, confirmedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            const found = this.entries.find(entry => entry.anchorString === anchorString);
            if (found !== undefined) {
                found.confirmedAt = confirmedAt;
            }
        });
    }
    getLastSubmitted() {
        return __awaiter(this, void 0, void 0, function* () {
            const sorted = this.entries.sort((a, b) => b.submittedAt - a.submittedAt);
            if (sorted.length === 0) {
                return undefined;
            }
            else {
                return sorted[0];
            }
        });
    }
    submit(anchorString, submittedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            this.entries.push({
                anchorString,
                submittedAt,
                confirmedAt: undefined
            });
        });
    }
    resetAfter(confirmedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            this.entries.forEach((entry) => {
                if (confirmedAt === undefined || (entry.confirmedAt && entry.confirmedAt > confirmedAt)) {
                    entry.confirmedAt = undefined;
                }
            });
        });
    }
}
exports.default = MockConfirmationStore;
//# sourceMappingURL=MockConfirmationStore.js.map