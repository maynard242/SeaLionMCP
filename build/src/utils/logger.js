/**
 * Simple logger utility for the Sea-lionMCP server
 *
 * Provides structured logging with different levels for debugging and monitoring.
 */
class Logger {
    logLevel;
    constructor() {
        // Set log level from environment or default to 'info'
        const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
        this.logLevel = ['debug', 'info', 'warn', 'error'].includes(envLogLevel)
            ? envLogLevel
            : 'info';
    }
    /**
     * Check if a log level should be output
     */
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    /**
     * Format and output log entry
     */
    log(level, message, data) {
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(data && { data })
        };
        const output = data
            ? `[${entry.timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(data)}`
            : `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
        // Use appropriate console method
        switch (level) {
            case 'debug':
                console.debug(output);
                break;
            case 'info':
                console.info(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            case 'error':
                console.error(output);
                break;
        }
    }
    /**
     * Log debug messages
     */
    debug(message, data) {
        this.log('debug', message, data);
    }
    /**
     * Log info messages
     */
    info(message, data) {
        this.log('info', message, data);
    }
    /**
     * Log warning messages
     */
    warn(message, data) {
        this.log('warn', message, data);
    }
    /**
     * Log error messages
     */
    error(message, data) {
        this.log('error', message, data);
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map