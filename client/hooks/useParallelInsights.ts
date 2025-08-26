import { useQuery } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";

/**
 * This part of the code provides parallel loading for all AI insights
 * Loads insights for multiple pages simultaneously for better performance
 * Caches results and provides optimized loading states
 */

export interface ParallelInsightsData {
  dashboardInsights: any;
  ordersInsights: any;
  inventoryInsights: any;
  replenishmentInsights: any;
  inboundInsights: any;
  slaInsights: any;
  warehouseInsights: any;
  reportsInsights: any;
}

/**
 * This part of the code loads all insights in parallel for better performance
 * Useful for preloading insights when user is likely to visit multiple pages
 */
export const useParallelInsights = () => {
  return useQuery({
    queryKey: ["parallel-insights"],
    queryFn: async (): Promise<ParallelInsightsData> => {
      console.log("🚀 Loading ALL insights in parallel for maximum performance...");
      
      const startTime = Date.now();
      
      // This part of the code loads all insights simultaneously instead of sequentially
      const [
        dashboardInsights,
        ordersInsights,
        inventoryInsights,
        replenishmentInsights,
        inboundInsights,
        slaInsights,
        // Note: Warehouse and Reports insights need to be added when their fast endpoints are created
      ] = await Promise.allSettled([
        internalApi.getDashboardInsights().catch(e => ({ insights: [], dailyBrief: null, error: e.message })),
        internalApi.getOrdersData().then(data => data.insights).catch(e => ({ error: e.message })),
        internalApi.getInventoryData().then(data => data.insights).catch(e => ({ error: e.message })),
        internalApi.getReplenishmentData().then(data => data.insights).catch(e => ({ error: e.message })),
        internalApi.getInboundData().then(data => data.insights).catch(e => ({ error: e.message })),
        internalApi.getSLAData().then(data => data.insights).catch(e => ({ error: e.message })),
      ]);
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Parallel insights loaded in ${loadTime}ms`);
      
      // This part of the code extracts results from Promise.allSettled
      const extractResult = (result: PromiseSettledResult<any>) => 
        result.status === 'fulfilled' ? result.value : { error: 'Failed to load' };
      
      return {
        dashboardInsights: extractResult(dashboardInsights),
        ordersInsights: extractResult(ordersInsights),
        inventoryInsights: extractResult(inventoryInsights),
        replenishmentInsights: extractResult(replenishmentInsights),
        inboundInsights: extractResult(inboundInsights),
        slaInsights: extractResult(slaInsights),
        warehouseInsights: [], // TODO: Add when warehouse fast endpoint is created
        reportsInsights: [], // TODO: Add when reports fast endpoint is created
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - insights are cached anyway
    cacheTime: 30 * 60 * 1000, // 30 minutes in React Query cache
    retry: 1, // Only retry once for parallel loading
    meta: {
      errorMessage: "Unable to load insights in parallel - Some insights may be unavailable",
    },
  });
};

/**
 * This part of the code provides individual insight hooks that can use parallel data
 * Falls back to individual loading if parallel data is not available
 */
export const useDashboardInsightsOptimized = () => {
  const { data: parallelData } = useParallelInsights();
  
  return useQuery({
    queryKey: ["dashboard-insights-optimized"],
    queryFn: async () => {
      // This part of the code uses parallel data if available, otherwise loads individually
      if (parallelData?.dashboardInsights && !parallelData.dashboardInsights.error) {
        console.log("⚡ Using dashboard insights from parallel cache");
        return parallelData.dashboardInsights;
      }
      
      console.log("🔄 Loading dashboard insights individually");
      return await internalApi.getDashboardInsights();
    },
    enabled: !parallelData || !!parallelData.dashboardInsights?.error,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * This part of the code provides preloading capability for likely next pages
 * Anticipates user navigation patterns for better UX
 */
export const usePreloadInsights = (pagesToPreload: string[] = []) => {
  const { data: parallelData, isLoading } = useParallelInsights();
  
  // This part of the code calculates preload statistics
  const preloadStats = {
    dashboardReady: !!parallelData?.dashboardInsights,
    ordersReady: !!parallelData?.ordersInsights,
    inventoryReady: !!parallelData?.inventoryInsights,
    replenishmentReady: !!parallelData?.replenishmentInsights,
    inboundReady: !!parallelData?.inboundInsights,
    slaReady: !!parallelData?.slaInsights,
    totalReady: Object.values(parallelData || {}).filter(Boolean).length,
    isLoading,
  };
  
  return {
    preloadStats,
    parallelData,
    isPreloading: isLoading,
  };
};

export default useParallelInsights;
