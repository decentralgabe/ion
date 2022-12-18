"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const BitcoinBlockDataIterator_1 = require("../../lib/bitcoin/BitcoinBlockDataIterator");
const BitcoinRawDataParser_1 = require("../../lib/bitcoin/BitcoinRawDataParser");
describe('bitcoinBlockDataIterator', () => {
    let bitcoinBlockDataIterator;
    beforeAll(() => {
        spyOn(fs, 'readdirSync').and.returnValue(['blk01.dat']);
        bitcoinBlockDataIterator = new BitcoinBlockDataIterator_1.default('/');
    });
    describe('hasPrevious', () => {
        it('should return true if has previous', () => {
            bitcoinBlockDataIterator['currentIndex'] = 100;
            const result = bitcoinBlockDataIterator.hasPrevious();
            expect(result).toBeTruthy();
        });
        it('should return false if does not have previous', () => {
            bitcoinBlockDataIterator['currentIndex'] = -1;
            const result = bitcoinBlockDataIterator.hasPrevious();
            expect(result).toBeFalsy();
        });
    });
    describe('previous', () => {
        it('should return undefined if no previous', () => {
            bitcoinBlockDataIterator['currentIndex'] = -1;
            const result = bitcoinBlockDataIterator.previous();
            expect(result).toBeUndefined();
        });
        it('should return expected results if has previous', () => {
            bitcoinBlockDataIterator['currentIndex'] = 1;
            bitcoinBlockDataIterator['fileNames'] = ['some', 'files'];
            const fileReaderSpy = spyOn(bitcoinBlockDataIterator['fileReader'], 'readBlockFile');
            const bitcoinRawDataParserSpy = spyOn(BitcoinRawDataParser_1.default, 'parseRawDataFile').and.returnValue([]);
            const result = bitcoinBlockDataIterator.previous();
            expect(bitcoinBlockDataIterator['currentIndex']).toEqual(0);
            expect(result).toEqual([]);
            expect(fileReaderSpy).toHaveBeenCalledTimes(1);
            expect(bitcoinRawDataParserSpy).toHaveBeenCalledTimes(1);
        });
    });
});
//# sourceMappingURL=BitcoinBlockDataIterator.spec.js.map