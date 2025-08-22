/**
 * This part of the code provides standardized loading state management
 * Eliminates inconsistent loading patterns across components
 */

export const LoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  REFETCHING: 'refetching'
} as const;

export type LoadingState = typeof LoadingStates[keyof typeof LoadingStates];

export interface AsyncState<T> {
  state: LoadingState;
  data: T | null;
  error: Error | null;
  lastUpdated: string | null;
}

// This part of the code provides loading state predicates
export const isLoading = (state: LoadingState): boolean => {
  return state === LoadingStates.LOADING || state === LoadingStates.REFETCHING;
};

export const isSuccess = (state: LoadingState): boolean => {
  return state === LoadingStates.SUCCESS;
};

export const isError = (state: LoadingState): boolean => {
  return state === LoadingStates.ERROR;
};

export const isIdle = (state: LoadingState): boolean => {
  return state === LoadingStates.IDLE;
};

// This part of the code provides initial state factory
export const createInitialAsyncState = <T>(): AsyncState<T> => ({
  state: LoadingStates.IDLE,
  data: null,
  error: null,
  lastUpdated: null
});

// This part of the code provides state transition helpers
export const toLoadingState = <T>(currentState: AsyncState<T>): AsyncState<T> => ({
  ...currentState,
  state: currentState.data ? LoadingStates.REFETCHING : LoadingStates.LOADING,
  error: null
});

export const toSuccessState = <T>(currentState: AsyncState<T>, data: T): AsyncState<T> => ({
  ...currentState,
  state: LoadingStates.SUCCESS,
  data,
  error: null,
  lastUpdated: new Date().toISOString()
});

export const toErrorState = <T>(currentState: AsyncState<T>, error: Error): AsyncState<T> => ({
  ...currentState,
  state: LoadingStates.ERROR,
  error,
  lastUpdated: new Date().toISOString()
});

// This part of the code provides React hook for async state management
import { useState, useCallback } from 'react';

export function useAsyncState<T>(initialData?: T): {
  asyncState: AsyncState<T>;
  setLoading: () => void;
  setSuccess: (data: T) => void;
  setError: (error: Error) => void;
  reset: () => void;
} {
  const [asyncState, setAsyncState] = useState<AsyncState<T>>(() => ({
    state: LoadingStates.IDLE,
    data: initialData || null,
    error: null,
    lastUpdated: null
  }));

  const setLoading = useCallback(() => {
    setAsyncState(current => toLoadingState(current));
  }, []);

  const setSuccess = useCallback((data: T) => {
    setAsyncState(current => toSuccessState(current, data));
  }, []);

  const setError = useCallback((error: Error) => {
    setAsyncState(current => toErrorState(current, error));
  }, []);

  const reset = useCallback(() => {
    setAsyncState(createInitialAsyncState<T>());
  }, []);

  return {
    asyncState,
    setLoading,
    setSuccess,
    setError,
    reset
  };
}
