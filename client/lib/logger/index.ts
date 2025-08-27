/**
 * This part of the code provides centralized logging utilities
 * Replaces scattered console.log statements with proper logging
 */

interface LogContext {
  component?: string;
  action?: string;
  data?: any;
  timestamp?: string;
  // Additional properties for compatibility with hooks
  hook?: string;
  endpoint?: string;
  brandFilter?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = this.getLogPrefix(level);
    const contextStr = context ? ` [${context.component || 'Unknown'}]` : '';
    return `${prefix}${contextStr} ${message}`;
  }

  private getLogPrefix(level: string): string {
    const prefixes = {
      info: '📊',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔧'
    };
    return prefixes[level as keyof typeof prefixes] || '📝';
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context), context?.data);
    }
  }

  success(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('success', message, context), context?.data);
    }
  }

  warning(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warning', message, context), context?.data);
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context), context?.data);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context), context?.data);
    }
  }

  // This part of the code provides specific logging methods for common use cases
  apiCall(endpoint: string, method: string = 'GET', data?: any): void {
    this.info(`API ${method} ${endpoint}`, { 
      component: 'API', 
      action: 'request',
      data 
    });
  }

  apiSuccess(endpoint: string, responseData?: any): void {
    this.success(`API response successful: ${endpoint}`, {
      component: 'API',
      action: 'response',
      data: responseData
    });
  }

  apiError(endpoint: string, error: any): void {
    this.error(`API error: ${endpoint}`, {
      component: 'API',
      action: 'error',
      data: error
    });
  }

  componentMount(componentName: string): void {
    this.debug(`Component mounted: ${componentName}`, {
      component: componentName,
      action: 'mount'
    });
  }

  componentUnmount(componentName: string): void {
    this.debug(`Component unmounted: ${componentName}`, {
      component: componentName,
      action: 'unmount'
    });
  }

  // This part of the code provides context-aware logger creation (compatibility with server-side logger)
  createLogger(defaultContext: LogContext) {
    return {
      debug: (msg: string, ctx?: LogContext) => this.debug(msg, {...defaultContext, ...ctx}),
      info: (msg: string, ctx?: LogContext) => this.info(msg, {...defaultContext, ...ctx}),
      success: (msg: string, ctx?: LogContext) => this.success(msg, {...defaultContext, ...ctx}),
      warning: (msg: string, ctx?: LogContext) => this.warning(msg, {...defaultContext, ...ctx}),
      error: (msg: string, ctx?: LogContext) => this.error(msg, {...defaultContext, ...ctx}),
    };
  }
}

export const logger = new Logger();
export default logger;
