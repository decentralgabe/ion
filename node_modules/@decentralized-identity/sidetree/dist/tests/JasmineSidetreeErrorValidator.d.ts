/**
 * Encapsulates the helper functions for the tests.
 */
export default class JasmineSidetreeErrorValidator {
    /**
     * Fails the current spec if the execution of the function does not throw the expected SidetreeError.
     *
     * @param functionToExecute The function to execute.
     * @param expectedErrorCode The expected error code.
     * @param expectedContainedStringInMessage The string expected to be part of (need not be full error message) the error message.
     */
    static expectSidetreeErrorToBeThrown(functionToExecute: () => any, expectedErrorCode: string, expectedContainedStringInMessage?: string): void;
    /**
     * Fails the current spec if the execution of the function does not throw the expected SidetreeError.
     *
     * @param functionToExecute The function to execute.
     * @param expectedErrorCode The expected error code.
     * @param expectedContainedStringInMessage The string expected to be part of (need not be full error message) the error message.
     */
    static expectSidetreeErrorToBeThrownAsync(functionToExecute: () => Promise<any>, expectedErrorCode: string, expectedContainedStringInMessage?: string): Promise<void>;
}
