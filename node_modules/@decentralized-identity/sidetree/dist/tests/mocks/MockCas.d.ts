/// <reference types="node" />
import FetchResult from '../../lib/common/models/FetchResult';
import ICas from '../../lib/core/interfaces/ICas';
/**
 * Implementation of a CAS class for testing.
 * Simply using a hash map to store all the content by hash.
 */
export default class MockCas implements ICas {
    /** A Map that stores the given content. */
    private storage;
    /** Time taken in seconds for each mock fetch. */
    private mockSecondsTakenForEachCasFetch;
    constructor(mockSecondsTakenForEachCasFetch?: number);
    /**
     * Gets the address that can be used to access the given content.
     */
    static getAddress(content: Buffer): string;
    write(content: Buffer): Promise<string>;
    read(address: string, _maxSizeInBytes: number): Promise<FetchResult>;
}
