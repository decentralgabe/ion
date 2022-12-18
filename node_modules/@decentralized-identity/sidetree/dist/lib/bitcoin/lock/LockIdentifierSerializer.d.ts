import LockIdentifierModel from '../models/LockIdentifierModel';
/**
 * Encapsulates functionality to serialize and deserialize a lock identifier.
 */
export default class LockIdentifierSerializer {
    private static readonly delimiter;
    /**
     * Returns the string representation of this identifier.
     */
    static serialize(lockIdentifier: LockIdentifierModel): string;
    /**
     * Gets this object from the serialized input.
     * @param serialized The serialized lock.
     */
    static deserialize(serialized: string): LockIdentifierModel;
}
