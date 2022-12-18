/// <reference types="node" />
import FetchResult from '../common/models/FetchResult';
import ICas from '../core/interfaces/ICas';
/**
 * Class that implements the `ICas` interface by communicating with IPFS.
 */
export default class Ipfs implements ICas {
    private uri;
    private fetchTimeoutInSeconds;
    private fetch;
    constructor(uri: string, fetchTimeoutInSeconds: number);
    write(content: Buffer): Promise<string>;
    read(casUri: string, maxSizeInBytes: number): Promise<FetchResult>;
    /**
     * Fetch the content from IPFS.
     * This method also allows easy mocking in tests.
     */
    private fetchContent;
    private pinContent;
}
