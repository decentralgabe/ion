import BlockMetadata from '../../lib/bitcoin/models/BlockMetadata';
import IBlockMetadataStore from '../../lib/bitcoin/interfaces/IBlockMetadataStore';
export default class MockBlockMetadataStore implements IBlockMetadataStore {
    store: BlockMetadata[];
    constructor();
    add(blockMetadata: BlockMetadata[]): Promise<void>;
    removeLaterThan(blockHeight?: number): Promise<void>;
    get(fromInclusiveHeight: number, toExclusiveHeight: number): Promise<BlockMetadata[]>;
    getLast(): Promise<BlockMetadata | undefined>;
    lookBackExponentially(): Promise<BlockMetadata[]>;
}
