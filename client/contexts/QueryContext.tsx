/**
 * This part of the code provides focused query state management
 * Separates query configuration from settings for better organization
 */

import React, { createContext, useContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface QueryContextType {
  queryClient: QueryClient;
  refetchAll: () => Promise<void>;
  invalidateAll: () => Promise<void>;
}

const QueryContext = createContext<QueryContextType | undefined>(undefined);

interface QueryProviderProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

// This part of the code provides query state management with optimized defaults
export function QueryProvider({ children, queryClient: externalClient }: QueryProviderProps) {
  const queryClient = useMemo(() => {
    if (externalClient) return externalClient;
    
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          retry: (failureCount, error: any) => {
            // This part of the code implements smart retry logic
            if (error?.status === 404 || error?.status === 403) return false;
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          gcTime: 10 * 60 * 1000, // 10 minutes
        },
        mutations: {
          retry: 1,
          onError: (error: any) => {
            logger.error('Mutation failed', { error: error.message });
          },
        },
      },
      logger: {
        log: logger.debug,
        warn: logger.warning,
        error: logger.error,
      },
    });
  }, [externalClient]);

  const contextValue = useMemo(() => ({
    queryClient,
    refetchAll: async () => {
      logger.info('Refetching all queries');
      await queryClient.refetchQueries();
    },
    invalidateAll: async () => {
      logger.info('Invalidating all queries');
      await queryClient.invalidateQueries();
    },
  }), [queryClient]);

  return (
    <QueryContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </QueryContext.Provider>
  );
}

// This part of the code provides typed hook for query context
export function useQueryContext() {
  const context = useContext(QueryContext);
  if (context === undefined) {
    throw new Error('useQueryContext must be used within a QueryProvider');
  }
  return context;
}
