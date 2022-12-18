import BitcoinBlockModel from './models/BitcoinBlockModel';
/**
 * Iterates through block data by parsing raw block data file from latest file to earliest
 */
export default class BitcoinBlockDataIterator {
    private fileReader;
    private fileNames;
    private currentIndex;
    constructor(path: string);
    /**
     * Returns if there is another file to read
     */
    hasPrevious(): boolean;
    /**
     * Returns the previous block data or undefined if there is no previous.
     */
    previous(): BitcoinBlockModel[] | undefined;
}
