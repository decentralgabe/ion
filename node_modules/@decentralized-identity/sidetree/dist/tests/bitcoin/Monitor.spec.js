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
const Monitor_1 = require("../../lib/bitcoin/Monitor");
describe('BitcoinFileReader', () => {
    let monitor;
    beforeAll(() => {
        const mockBitcoinClient = { getBalanceInSatoshis: () => { } };
        monitor = new Monitor_1.default(mockBitcoinClient);
    });
    describe('getWalletBalance', () => __awaiter(void 0, void 0, void 0, function* () {
        it('should get wallet balance', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockBalance = 123;
            spyOn(monitor['bitcoinClient'], 'getBalanceInSatoshis').and.returnValue(Promise.resolve(mockBalance));
            const balance = yield monitor.getWalletBalance();
            expect(balance).toEqual({ walletBalanceInBtc: 0.00000123 });
        }));
    }));
});
//# sourceMappingURL=Monitor.spec.js.map