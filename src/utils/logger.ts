/**
 * Simple logger utility for the Sea-lion MCP server
 * 
 * Provides structured logging with different levels for debugging and monitoring.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Set log level from environment or default to 'info'
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    this.logLevel = ['debug', 'info', 'warn', 'error'].includes(envLogLevel) 
      ? envLogLevel 
      : 'info';
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Format and output log entry
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
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
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log info messages
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log error messages
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
