"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BitcoinFileReader_1 = require("./BitcoinFileReader");
const BitcoinRawDataParser_1 = require("./BitcoinRawDataParser");
const Logger_1 = require("../common/Logger");
/**
 * Iterates through block data by parsing raw block data file from latest file to earliest
 */
class BitcoinBlockDataIterator {
    constructor(path) {
        this.fileReader = new BitcoinFileReader_1.default(path);
        this.fileNames = this.fileReader.listBlockFiles().sort();
        this.currentIndex = this.fileNames.length - 1;
    }
    /**
     * Returns if there is another file to read
     */
    hasPrevious() {
        return this.currentIndex >= 0;
    }
    /**
     * Returns the previous block data or undefined if there is no previous.
     */
    previous() {
        if (!this.hasPrevious()) {
            return undefined;
        }
        Logger_1.default.info(`Parsing file: ${this.fileNames[this.currentIndex]}`);
        const fileBuffer = this.fileReader.readBlockFile(this.fileNames[this.currentIndex]);
        const parsedData = BitcoinRawDataParser_1.default.parseRawDataFile(fileBuffer);
        this.currentIndex--;
        return parsedData;
    }
}
exports.default = BitcoinBlockDataIterator;
//# sourceMappingURL=BitcoinBlockDataIterator.js.map