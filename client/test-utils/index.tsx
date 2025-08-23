/**
 * This part of the code provides centralized testing utilities
 * Eliminates setup duplication across test files
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// This part of the code creates a test-specific QueryClient with disabled retries
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// This part of the code provides all necessary providers for component testing
interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={testQueryClient}>
          <SettingsProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// This part of the code provides custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// This part of the code provides utilities for testing async components
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// This part of the code provides mock data generators
export const createMockKPIs = () => ({
  totalOrdersToday: 147,
  atRiskOrders: 12,
  openPOs: 35,
  unfulfillableSKUs: 0,
});

export const createMockDashboardData = () => ({
  products: [],
  shipments: [],
  kpis: createMockKPIs(),
  quickOverview: {
    totalRevenue: 2500000,
    totalOrders: 1247,
    averageOrderValue: 2005.61,
    fulfillmentRate: 98.2
  },
  warehouseInventory: [],
  insights: [],
  anomalies: [],
  marginRisks: [],
  costVariances: [],
  lastUpdated: new Date().toISOString(),
});

export const createMockError = (message = 'Test error', code = 'TEST_ERROR') => {
  const error = new Error(message);
  (error as any).code = code;
  return error;
};

// Re-export everything from RTL
export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };
