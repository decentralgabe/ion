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
const crypto = require("crypto");
const EventCode_1 = require("./EventCode");
const EventEmitter_1 = require("../common/EventEmitter");
const Logger_1 = require("../common/Logger");
/**
 * A download manager class that performs multiple downloads at the same time.
 */
class DownloadManager {
    /**
     * Constructs the download manager.
     * @param cas The Content Addressable Store to use for fetching the actual content.
     */
    constructor(maxConcurrentDownloads, cas) {
        this.maxConcurrentDownloads = maxConcurrentDownloads;
        this.cas = cas;
        this.pendingDownloads = [];
        this.activeDownloads = new Map();
        this.completedDownloads = new Map();
        // If maximum concurrent CAS download count is NaN, set it to a default value.
        if (isNaN(maxConcurrentDownloads)) {
            const defaultMaxConcurrentDownloads = 20;
            Logger_1.default.info(`Maximum concurrent CAS download count not given, defaulting to ${defaultMaxConcurrentDownloads}.`);
            this.maxConcurrentDownloads = defaultMaxConcurrentDownloads;
        }
    }
    /**
     * Starts pending downloads if maximum concurrent download count is not reached,
     * and resolve downloads that are completed, then invokes this same method again,
     * thus this method must only be invoked once externally as initialization.
     */
    start() {
        try {
            // Move all completed downloads in `activeDownloads` to the `completedDownloads` map.
            const completedDownloadHandles = [];
            for (const [downloadHandle, downloadInfo] of this.activeDownloads) {
                if (downloadInfo.completed) {
                    this.completedDownloads.set(downloadHandle, downloadInfo.fetchResult);
                    completedDownloadHandles.push(downloadHandle);
                    // Resolve the promise associated with the download.
                    downloadInfo.resolve();
                }
            }
            for (const downloadHandle of completedDownloadHandles) {
                this.activeDownloads.delete(downloadHandle);
            }
            // If maximum concurrent download count is reached, then we can't schedule more downloads.
            const availableDownloadLanes = this.maxConcurrentDownloads - this.activeDownloads.size;
            if (availableDownloadLanes <= 0) {
                return;
            }
            // Else we can schedule more downloads, but only if there are pending downloads.
            if (this.pendingDownloads.length === 0) {
                return;
            }
            // Keep start downloading the next queued item until all download lanes are full or there is no more item to download.
            for (let i = 0; i < this.pendingDownloads.length && i < availableDownloadLanes; i++) {
                const downloadInfo = this.pendingDownloads[i];
                // Intentionally not awaiting on a download.
                this.downloadAsync(downloadInfo);
                this.activeDownloads.set(downloadInfo.handle, downloadInfo);
            }
            // Remove active downloads from `pendingDownloads` list.
            this.pendingDownloads.splice(0, availableDownloadLanes);
        }
        catch (error) {
            Logger_1.default.error(`Encountered unhandled/unexpected error in DownloadManager, must investigate and fix: ${error}`);
        }
        finally {
            setTimeout(() => __awaiter(this, void 0, void 0, function* () { return this.start(); }), 1000);
        }
    }
    /**
     * Downloads the content of the given content hash.
     * @param contentHash Hash of the content to be downloaded.
     */
    download(contentHash, maxSizeInBytes) {
        return __awaiter(this, void 0, void 0, function* () {
            const handle = crypto.randomBytes(32);
            const fetchPromise = new Promise(resolve => {
                const downloadInfo = { handle, contentHash, maxSizeInBytes, resolve, completed: false, content: undefined };
                this.pendingDownloads.push(downloadInfo);
            });
            yield fetchPromise;
            const fetchResult = this.completedDownloads.get(handle);
            this.completedDownloads.delete(handle);
            EventEmitter_1.default.emit(EventCode_1.default.SidetreeDownloadManagerDownload, { code: fetchResult.code });
            return fetchResult;
        });
    }
    /**
     * The internal download method that gets called by the main download manager monitoring loop when download lanes are available to download content.
     * NOTE: This method MUST NEVER throw (more accurately: ALWAYS set downloadInfo.completed = true),
     * else it will LEAK the available download lanes and in turn hang the Observer.
     * @param downloadInfo Data structure containing `completed` flag and `fetchResult`,
     *                     used to signal to the main download manager monitoring loop when the requested download is completed.
     */
    downloadAsync(downloadInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let contentHash = '';
            try {
                contentHash = downloadInfo.contentHash;
                const fetchResult = yield this.cas.read(contentHash, downloadInfo.maxSizeInBytes);
                downloadInfo.fetchResult = fetchResult;
            }
            catch (error) {
                Logger_1.default.error(`Unexpected error while downloading '${contentHash}, investigate and fix ${error}'.`);
            }
            finally {
                downloadInfo.completed = true;
            }
        });
    }
}
exports.default = DownloadManager;
//# sourceMappingURL=DownloadManager.js.map