import Blockchain from './Blockchain';
import IServiceStateStore from '../common/interfaces/IServiceStateStore';
import ServiceStateModel from './models/ServiceStateModel';
/**
 * Class used to manage approximate blockchain time
 */
export default class BlockchainClock {
    private blockchain;
    private serviceStateStore;
    private enableRealBlockchainTimePull;
    private continuePulling;
    /**
     * The interval which to pull and update blockchain time
     */
    private blockchainTimePullIntervalInSeconds;
    private cachedApproximateTime?;
    /**
     *
     * @param blockchain The blockchain client to use
     * @param serviceStateStore The service state store to store time in
     * @param enableRealBlockchainTimePull If enabled, will pull real blockchain time from blockchain, else will only use time from db
     */
    constructor(blockchain: Blockchain, serviceStateStore: IServiceStateStore<ServiceStateModel>, enableRealBlockchainTimePull: boolean);
    /**
     * Get the time
     */
    getTime(): number | undefined;
    /**
     * Start periodically pulling blockchain time. Will use real blockchain time if enabled
     */
    startPeriodicPullLatestBlockchainTime(): Promise<void>;
    /**
     * Gets latest blockchain time from bitcoin service, stores it in DB as well as updates the given service state with new time.
     */
    private pullRealBlockchainTime;
}
