import Config from '../../lib/core/models/Config';
/**
 * MongoDB related operations.
 */
export default class MongoDb {
    private static initialized;
    /**
     * Setup inmemory mongodb to test with
     */
    static createInmemoryDb(config: Config): Promise<void>;
}
