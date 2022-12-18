import BlockMetadata from './models/BlockMetadata';
import IBlockMetadataStore from './interfaces/IBlockMetadataStore';
import MongoDbStore from '../common/MongoDbStore';
/**
 * Implementation of IBlockMetadataStore using MongoDB database.
 */
export default class MongoDbBlockMetadataStore extends MongoDbStore implements IBlockMetadataStore {
    /** Collection name for storing block metadata. */
    static readonly collectionName = "blocks";
    /** Query option to exclude `_id` field from being returned. */
    private static readonly optionToExcludeIdField;
    /**
     * Constructs a `MongoDbBlockMetadataStore`;
     */
    constructor(serverUrl: string, databaseName: string);
    createIndex(): Promise<void>;
    add(arrayOfBlockMetadata: BlockMetadata[]): Promise<void>;
    removeLaterThan(blockHeight?: number): Promise<void>;
    get(fromInclusiveHeight: number, toExclusiveHeight: number): Promise<BlockMetadata[]>;
    getLast(): Promise<BlockMetadata | undefined>;
    /**
     * Gets the first block (block with lowest height).
     */
    private getFirst;
    lookBackExponentially(): Promise<BlockMetadata[]>;
}
