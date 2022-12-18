import BitcoinClient from './BitcoinClient';
/**
 * Monitor for the running Bitcoin service.
 */
export default class Monitor {
    private bitcoinClient;
    constructor(bitcoinClient: BitcoinClient);
    /**
     * Gets the size of the operation queue.
     */
    getWalletBalance(): Promise<any>;
}
