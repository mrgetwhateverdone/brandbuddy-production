import { useQuery } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";
import { useSettingsIntegration } from "./useSettingsIntegration";
import type { 
  SLAKPIs, 
  SLAData, 
  SLAPerformanceTrends, 
  SLASupplierScorecard, 
  SLAInsight, 
  SLAFinancialImpact, 
  SLAOptimizationRecommendation 
} from "@/types/api";

/**
 * This part of the code defines the SLA data hook
 * Follows the proven patterns from other data hooks (useOrdersData, useInventoryData)
 */


/**
 * This part of the code provides the main SLA data hook
 * Uses TanStack Query for caching and real-time updates
 */
export function useSLAData() {
  const { getSLASettings } = useSettingsIntegration();
  
  return useQuery({
    queryKey: ['sla-data'],
    queryFn: () => internalApi.getSLAData(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes auto-refresh
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });
}

/**
 * FAST SLA data hook without AI insights for immediate page load
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export function useSLADataFast() {
  const { getSLASettings } = useSettingsIntegration();
  
  return useQuery({
    queryKey: ['sla-data-fast'],
    queryFn: () => internalApi.getSLADataFast(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes auto-refresh
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });
}

/**
 * SLA AI insights hook for progressive loading
 * 🔒 SECURE: Uses internal API for AI insights only
 */
export function useSLAInsights() {
  return useQuery({
    queryKey: ['sla-insights'],
    queryFn: async () => {
      console.log(
        "🤖 Client: Loading SLA AI insights in background...",
      );

      const insightsData = await internalApi.getSLAInsights();

      console.log("✅ Client: SLA AI insights loaded:", {
        insights: insightsData.insights?.length || 0,
      });

      return insightsData;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - standardized with Dashboard/Orders for consistency
    retry: 2, // Fewer retries for AI insights (matches Dashboard/Orders proven pattern)
    meta: {
      errorMessage:
        "Unable to load SLA insights - Refresh to retry or check API connection",
    },
  });
}

/**
 * This part of the code provides a hook for refreshing SLA data
 * Useful for manual refresh functionality
 */
export function useRefreshSLA() {
  const { refetch } = useSLAData();
  
  return {
    refreshSLA: () => refetch()
  };
}
