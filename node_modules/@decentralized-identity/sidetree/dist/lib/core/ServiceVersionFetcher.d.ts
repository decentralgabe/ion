import ServiceVersionModel from '../common/models/ServiceVersionModel';
/**
 * Encapsulates the functionality of getting the version information from the dependent services.
 */
export default class ServiceVersionFetcher {
    private uri;
    private static readonly fetchWaitTimeInMilliseconds;
    private fetch;
    private cachedVersion;
    private lastTryFetchTime;
    /**
     * Creates a new instance of this object.
     * @param uri The target service uri which must implement a /version endpoint returning
     * ServiceVersionModel json object.
     */
    constructor(uri: string);
    /**
     * Gets the service version.
     * Returns an 'empty' service version if unable to fetch it.
     */
    getVersion(): Promise<ServiceVersionModel>;
    /**
     * Tries to get the version information by making the REST API call. In case of any errors, it ignores
     * any exceptions and returns an 'empty' service version information.
     */
    private tryGetServiceVersion;
    private static get emptyServiceVersion();
}
