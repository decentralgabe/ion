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
const EventCode_1 = require("../core/EventCode");
const EventEmitter_1 = require("../common/EventEmitter");
const Logger_1 = require("../common/Logger");
/**
 * Class used to manage approximate blockchain time
 */
class BlockchainClock {
    /**
     *
     * @param blockchain The blockchain client to use
     * @param serviceStateStore The service state store to store time in
     * @param enableRealBlockchainTimePull If enabled, will pull real blockchain time from blockchain, else will only use time from db
     */
    constructor(blockchain, serviceStateStore, enableRealBlockchainTimePull) {
        this.blockchain = blockchain;
        this.serviceStateStore = serviceStateStore;
        this.enableRealBlockchainTimePull = enableRealBlockchainTimePull;
        // used only for testing purposes to stop periodic pulling
        this.continuePulling = true;
        /**
         * The interval which to pull and update blockchain time
         */
        this.blockchainTimePullIntervalInSeconds = 60;
    }
    /**
     * Get the time
     */
    getTime() {
        return this.cachedApproximateTime;
    }
    /**
     * Start periodically pulling blockchain time. Will use real blockchain time if enabled
     */
    startPeriodicPullLatestBlockchainTime() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const serviceState = yield this.serviceStateStore.get();
                if (this.enableRealBlockchainTimePull) {
                    yield this.pullRealBlockchainTime(serviceState);
                }
                this.cachedApproximateTime = serviceState.approximateTime;
                Logger_1.default.info(`Core cachedApproximateTime updated to: ${serviceState.approximateTime}`);
            }
            catch (e) {
                Logger_1.default.error(`Error occurred while updating BitcoinClock: ${e}`);
            }
            if (this.continuePulling) {
                setTimeout(() => __awaiter(this, void 0, void 0, function* () { return this.startPeriodicPullLatestBlockchainTime(); }), this.blockchainTimePullIntervalInSeconds * 1000);
            }
        });
    }
    /**
     * Gets latest blockchain time from bitcoin service, stores it in DB as well as updates the given service state with new time.
     */
    pullRealBlockchainTime(serviceState) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const latestBlockchainTime = yield this.blockchain.getLatestTime();
                if (serviceState.approximateTime !== latestBlockchainTime.time) {
                    serviceState.approximateTime = latestBlockchainTime.time;
                    yield this.serviceStateStore.put(serviceState);
                    EventEmitter_1.default.emit(EventCode_1.default.SidetreeBlockchainTimeChanged, { time: serviceState.approximateTime });
                }
            }
            catch (e) {
                Logger_1.default.error(`Error occurred while updating blockchain time, investigate and fix: ${e}`);
            }
        });
    }
}
exports.default = BlockchainClock;
//# sourceMappingURL=BlockchainClock.js.map