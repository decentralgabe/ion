import * as chalk from 'chalk';
/**
 * Abstraction for colored logs.
 */
export default class LogColor {
    /** Method for logging in light blue. */
    static lightBlue: chalk.Chalk;
    /** Method for logging in green. */
    static green: chalk.Chalk;
    /** Method for logging in yellow. */
    static yellow: chalk.Chalk;
    /** Method for logging in red. */
    static red: chalk.Chalk;
}
