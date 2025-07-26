/**
 * Simple logger utility for the sea-lionMCP server
 *
 * Provides structured logging with different levels for debugging and monitoring.
 */
declare class Logger {
    private logLevel;
    constructor();
    /**
     * Check if a log level should be output
     */
    private shouldLog;
    /**
     * Format and output log entry
     */
    private log;
    /**
     * Log debug messages
     */
    debug(message: string, data?: any): void;
    /**
     * Log info messages
     */
    info(message: string, data?: any): void;
    /**
     * Log warning messages
     */
    warn(message: string, data?: any): void;
    /**
     * Log error messages
     */
    error(message: string, data?: any): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map