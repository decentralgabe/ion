"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConsoleLogger_1 = require("./ConsoleLogger");
/**
 * Logger used in Sidetree.
 * Intended to be human readable for debugging.
 */
class Logger {
    /**
     * Overrides the default logger if given.
     */
    static initialize(customLogger) {
        if (customLogger !== undefined) {
            Logger.singleton = customLogger;
        }
    }
    /**
     * Logs info.
     */
    static info(data) {
        Logger.singleton.info(data);
    }
    /**
     * Logs warning.
     */
    static warn(data) {
        Logger.singleton.warn(data);
    }
    /**
     * Logs error.
     */
    static error(data) {
        Logger.singleton.error(data);
    }
}
exports.default = Logger;
Logger.singleton = new ConsoleLogger_1.default();
//# sourceMappingURL=Logger.js.map