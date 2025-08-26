/**
 * Shared Logging Service
 * This part of the code provides centralized, structured logging across the entire application
 * Replaces console.log statements with proper logging infrastructure
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  endpoint?: string;
  component?: string;
  userId?: string;
  requestId?: string;
  brandName?: string;
  operation?: string;
  [key: string]: any;
}

export class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // This part of the code determines logging level based on environment
    this.isDevelopment = process.env.NODE_ENV === 'development' || 
                        typeof window !== 'undefined' && import.meta.env.DEV;
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context));
    }
  }

  // This part of the code provides specialized loggers for different contexts
  createLogger(defaultContext: LogContext) {
    return {
      debug: (msg: string, ctx?: LogContext) => this.debug(msg, {...defaultContext, ...ctx}),
      info: (msg: string, ctx?: LogContext) => this.info(msg, {...defaultContext, ...ctx}),
      warn: (msg: string, ctx?: LogContext) => this.warn(msg, {...defaultContext, ...ctx}),
      error: (msg: string, ctx?: LogContext) => this.error(msg, {...defaultContext, ...ctx}),
    };
  }

  // This part of the code provides performance timing utilities
  startTimer(operation: string, context?: LogContext) {
    const start = Date.now();
    return {
      end: (additionalContext?: LogContext) => {
        const duration = Date.now() - start;
        this.info(`${operation} completed`, {
          ...context,
          ...additionalContext,
          duration: `${duration}ms`
        });
      }
    };
  }
}

// This part of the code exports singleton instance for consistent logging across the application
export const logger = new Logger();
