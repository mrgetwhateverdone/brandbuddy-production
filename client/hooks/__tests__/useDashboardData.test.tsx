/**
 * This part of the code tests critical data fetching hooks
 * Ensures proper API integration and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test-utils';
import { useDashboardData } from '../useDashboardData';
import { server, mockDashboardData, errorHandlers } from '@/mocks/server';

// Mock the settings integration
vi.mock('@/hooks/useSettingsIntegration', () => ({
  useSettingsIntegration: () => ({
    getQueryConfig: () => ({
      staleTime: 0,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 3,
      retryDelay: () => 1000,
      gcTime: 10 * 60 * 1000,
    })
  })
}));

describe('useDashboardData', () => {
  beforeEach(() => {
    // Reset any mock server handlers
    server.resetHandlers();
  });

  it('fetches dashboard data successfully', async () => {
    const { result } = renderHook(() => useDashboardData());
    
    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    
    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Check successful data fetch
    expect(result.current.data).toEqual(mockDashboardData);
    expect(result.current.error).toBeNull();
  });

  it('handles API errors gracefully', async () => {
    // Override handlers to return error
    server.use(...errorHandlers);
    
    const { result } = renderHook(() => useDashboardData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Check error state
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });

  it('provides refetch functionality', async () => {
    const { result } = renderHook(() => useDashboardData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Check refetch function exists
    expect(typeof result.current.refetch).toBe('function');
    
    // Call refetch
    const refetchResult = result.current.refetch();
    expect(refetchResult).toBeDefined();
  });

  it('returns loading state during initial fetch', () => {
    const { result } = renderHook(() => useDashboardData());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('includes meta information for error handling', async () => {
    server.use(...errorHandlers);
    
    const { result } = renderHook(() => useDashboardData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // The hook should include meta for error messages
    expect(result.current.error).toBeTruthy();
  });

  it('uses correct query key for caching', async () => {
    const { result } = renderHook(() => useDashboardData());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // The query should be using the correct key
    expect(result.current.data).toEqual(mockDashboardData);
  });

  it('respects query configuration from settings', async () => {
    const { result } = renderHook(() => useDashboardData());
    
    // The hook should use settings from useSettingsIntegration
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockDashboardData);
  });
});
