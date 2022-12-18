/// <reference types="node" />
import IBitcoinFileReader from './interfaces/IBitcoinFileReader';
/**
 * concrete implementation of BitcoinFileReader
 */
export default class BitcoinFileReader implements IBitcoinFileReader {
    private bitcoinDataDirectory;
    /**
     * Constructor
     * @param bitcoinDataDirectory The same directory used by bitcoin core
     */
    constructor(bitcoinDataDirectory: string);
    listBlockFiles(): string[];
    readBlockFile(fileName: string): Buffer;
}
