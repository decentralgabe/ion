import ILogger from './interfaces/ILogger';
/**
 * Console Logger.
 */
export default class ConsoleLogger implements ILogger {
    info(data: any): void;
    warn(data: any): void;
    error(data: any): void;
}
