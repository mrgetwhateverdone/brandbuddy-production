/**
 * This part of the code provides focused error state management
 * Handles global error states, recovery, and reporting
 */

import React, { createContext, useContext, useCallback, useReducer } from 'react';
import { AppError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logger';

interface ErrorState {
  errors: AppError[];
  isRecovering: boolean;
  retryCount: number;
}

type ErrorAction = 
  | { type: 'ADD_ERROR'; payload: AppError }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'START_RECOVERY' }
  | { type: 'END_RECOVERY' }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_RETRY' };

interface ErrorContextType {
  state: ErrorState;
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  startRecovery: () => void;
  endRecovery: () => void;
  hasErrors: boolean;
  hasCriticalErrors: boolean;
  canRetry: boolean;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// This part of the code provides error state reducer
function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload]
      };
    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.timestamp !== action.payload)
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
        retryCount: 0
      };
    case 'START_RECOVERY':
      return {
        ...state,
        isRecovering: true
      };
    case 'END_RECOVERY':
      return {
        ...state,
        isRecovering: false
      };
    case 'INCREMENT_RETRY':
      return {
        ...state,
        retryCount: state.retryCount + 1
      };
    case 'RESET_RETRY':
      return {
        ...state,
        retryCount: 0
      };
    default:
      return state;
  }
}

const initialState: ErrorState = {
  errors: [],
  isRecovering: false,
  retryCount: 0
};

interface ErrorProviderProps {
  children: React.ReactNode;
  maxRetries?: number;
}

// This part of the code provides error management with automatic recovery
export function ErrorProvider({ children, maxRetries = 3 }: ErrorProviderProps) {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  const addError = useCallback((error: AppError) => {
    logger.error('Error added to global state', { 
      code: error.code, 
      severity: error.severity,
      message: error.message 
    });
    dispatch({ type: 'ADD_ERROR', payload: error });
  }, []);

  const removeError = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: id });
  }, []);

  const clearErrors = useCallback(() => {
    logger.info('Clearing all errors');
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const startRecovery = useCallback(() => {
    logger.info('Starting error recovery');
    dispatch({ type: 'START_RECOVERY' });
    dispatch({ type: 'INCREMENT_RETRY' });
  }, []);

  const endRecovery = useCallback(() => {
    logger.info('Ending error recovery');
    dispatch({ type: 'END_RECOVERY' });
  }, []);

  const hasErrors = state.errors.length > 0;
  const hasCriticalErrors = state.errors.some(error => error.severity === 'critical');
  const canRetry = state.retryCount < maxRetries && !state.isRecovering;

  const contextValue: ErrorContextType = {
    state,
    addError,
    removeError,
    clearErrors,
    startRecovery,
    endRecovery,
    hasErrors,
    hasCriticalErrors,
    canRetry
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
}

// This part of the code provides typed hook for error context
export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// This part of the code provides error boundary integration hook
export function useErrorHandler() {
  const { addError } = useError();
  
  return useCallback((error: Error, errorInfo?: any) => {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error.message, 
          'UNKNOWN_ERROR', 
          'medium',
          { stack: error.stack, errorInfo }
        );
    
    addError(appError);
  }, [addError]);
}
