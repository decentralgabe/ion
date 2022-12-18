/**
 * A simple in-memory implementation of operation store.
 */
import IConfirmationStore, { ConfirmationModel } from '../../lib/core/interfaces/IConfirmationStore';
export default class MockConfirmationStore implements IConfirmationStore {
    private entries;
    clear(): void;
    confirm(anchorString: string, confirmedAt: number): Promise<void>;
    getLastSubmitted(): Promise<ConfirmationModel | undefined>;
    submit(anchorString: string, submittedAt: number): Promise<void>;
    resetAfter(confirmedAt: number | undefined): Promise<void>;
}
