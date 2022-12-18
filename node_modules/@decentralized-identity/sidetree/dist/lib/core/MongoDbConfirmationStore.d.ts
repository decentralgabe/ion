import IConfirmationStore, { ConfirmationModel } from './interfaces/IConfirmationStore';
import MongoDbStore from '../common/MongoDbStore';
/**
 * Implementation of LastWriteStore that stores the last update per write
 */
export default class MongoDbConfirmationStore extends MongoDbStore implements IConfirmationStore {
    static readonly collectionName: string;
    constructor(serverUrl: string, databaseName: string);
    confirm(anchorString: string, confirmedAt: number): Promise<void>;
    resetAfter(confirmedAt: number | undefined): Promise<void>;
    getLastSubmitted(): Promise<ConfirmationModel | undefined>;
    submit(anchorString: string, submittedAt: number): Promise<void>;
    /**
     * @inheritDoc
     */
    createIndex(): Promise<void>;
}
