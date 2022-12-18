import ResponseStatus from '../common/enums/ResponseStatus';
/**
 * Error class used as a response to external requests.
 */
export default class RequestError extends Error {
    readonly responseCode: ResponseStatus;
    readonly code?: string | undefined;
    /**
     * Gets an HTTP status number according to the response code.
     * This is used by some middleware solutions on error handling.
     */
    get status(): number;
    /** Koa property used to determine if the error message should be returned */
    get expose(): boolean;
    constructor(responseCode: ResponseStatus, code?: string | undefined);
}
