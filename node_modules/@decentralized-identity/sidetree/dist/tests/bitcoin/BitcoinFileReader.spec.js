"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const BitcoinFileReader_1 = require("../../lib/bitcoin/BitcoinFileReader");
const ErrorCode_1 = require("../../lib/bitcoin/ErrorCode");
const SidetreeError_1 = require("../../lib/common/SidetreeError");
describe('BitcoinFileReader', () => {
    let bitcoinFileReader;
    const testDir = 'test/dir';
    beforeAll(() => {
        bitcoinFileReader = new BitcoinFileReader_1.default(testDir);
    });
    describe('listBlockFiles', () => {
        it('should list block files', () => {
            spyOn(fs, 'readdirSync').and.callFake((path) => {
                expect(path).toEqual(`${testDir}/blocks`);
                return ['blk001.dat', 'notBlk.dat', 'test.ts', 'blk002.dat'];
            });
            const result = bitcoinFileReader.listBlockFiles();
            expect(result).toEqual(['blk001.dat', 'blk002.dat']);
        });
        it('should return empty array if fs throws', () => {
            spyOn(fs, 'readdirSync').and.throwError('Fake fs error in test');
            expect(() => {
                bitcoinFileReader.listBlockFiles();
            }).toThrow(new SidetreeError_1.default(ErrorCode_1.default.BitcoinFileReaderBlockCannotReadDirectory, 'Fake fs error in test'));
        });
    });
    describe('readBlockFile', () => {
        it('should return the expected buffer', () => {
            const fileName = 'blk000.dat';
            spyOn(fs, 'readFileSync').and.callFake((path) => {
                expect(path).toEqual(`${testDir}/blocks/${fileName}`);
                return Buffer.from('some string');
            });
            const result = bitcoinFileReader.readBlockFile(fileName);
            expect(result).toEqual(Buffer.from('some string'));
        });
        it('should return undefined if fs throws', () => {
            spyOn(fs, 'readFileSync').and.throwError('Fake fs error in test');
            expect(() => {
                bitcoinFileReader.readBlockFile('fileName');
            }).toThrow(new SidetreeError_1.default(ErrorCode_1.default.BitcoinFileReaderBlockCannotReadFile, 'Fake fs error in test'));
        });
    });
});
//# sourceMappingURL=BitcoinFileReader.spec.js.map