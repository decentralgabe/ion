import ILogger from './interfaces/ILogger';
/**
 * Logger used in Sidetree.
 * Intended to be human readable for debugging.
 */
export default class Logger {
    private static singleton;
    /**
     * Overrides the default logger if given.
     */
    static initialize(customLogger?: ILogger): void;
    /**
     * Logs info.
     */
    static info(data: any): void;
    /**
     * Logs warning.
     */
    static warn(data: any): void;
    /**
     * Logs error.
     */
    static error(data: any): void;
}
