/**
 * Class containing code execution timeout/timing utilities.
 */
export default class Timeout {
    /**
     * Monitors the given promise to see if it runs to completion within the specified timeout duration.
     * @param task Promise to apply a timeout to.
     * @returns The value that the task returns if the task completed execution within the timeout duration.
     * @throws `TimeoutPromiseTimedOut` Error task timed out. Rethrows the error that the given task throws.
     */
    static timeout<T>(task: Promise<T>, timeoutInMilliseconds: number): Promise<T>;
}
