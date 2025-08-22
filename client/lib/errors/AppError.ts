/**
 * This part of the code defines standardized error handling hierarchy
 * Provides consistent error management across the application
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCode = 
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'PERMISSION_ERROR'
  | 'DATA_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode = 'UNKNOWN_ERROR',
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }

  // This part of the code provides error severity checking methods
  isCritical(): boolean {
    return this.severity === 'critical';
  }

  isRecoverable(): boolean {
    return this.severity === 'low' || this.severity === 'medium';
  }

  // This part of the code serializes error for logging
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    };
  }
}

// This part of the code provides factory functions for common error types
export const createAPIError = (message: string, context?: Record<string, any>): AppError => {
  return new AppError(message, 'API_ERROR', 'high', context);
};

export const createNetworkError = (message: string, context?: Record<string, any>): AppError => {
  return new AppError(message, 'NETWORK_ERROR', 'high', context);
};

export const createValidationError = (message: string, context?: Record<string, any>): AppError => {
  return new AppError(message, 'VALIDATION_ERROR', 'medium', context);
};

export const createDataError = (message: string, context?: Record<string, any>): AppError => {
  return new AppError(message, 'DATA_ERROR', 'medium', context);
};

// This part of the code handles error transformation from unknown types
export const handleApiError = (error: unknown, context?: Record<string, any>): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    // Determine error type based on error message or properties
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return createNetworkError(error.message, { ...context, originalError: error.name });
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return createValidationError(error.message, { ...context, originalError: error.name });
    }
    
    return createAPIError(error.message, { ...context, originalError: error.name });
  }
  
  if (typeof error === 'string') {
    return new AppError(error, 'UNKNOWN_ERROR', 'medium', context);
  }
  
  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 'medium', { 
    ...context, 
    originalError: error 
  });
};
