import { useQuery } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";
import { useSettingsIntegration } from "./useSettingsIntegration";

interface ReplenishmentKPIs {
  criticalSKUs: number;
  replenishmentValue: number;
  supplierAlerts: number;
  reorderRecommendations: number;
}

interface ReplenishmentData {
  kpis: ReplenishmentKPIs;
  insights: any[];
  criticalItems: any[];
  supplierPerformance: any[];
  reorderSuggestions: any[];
  lastUpdated: string;
}

/**
 * Main replenishment data hook with settings-aware caching
 * Respects user's refresh interval preferences and cache settings
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useReplenishmentData = () => {
  const { getQueryConfig } = useSettingsIntegration();
  const queryConfig = getQueryConfig();

  return useQuery({
    queryKey: ["replenishment-data"],
    queryFn: async (): Promise<ReplenishmentData> => {
      console.log(
        "🚨 Client: Fetching BrandBuddy replenishment intelligence (Callahan-Smith focused)...",
      );

      // This part of the code calls the server to fetch replenishment data securely
      // Server analyzes inventory levels, supplier performance, and generates AI insights
      const rawReplenishmentData = await internalApi.getReplenishmentData();

      // This part of the code ensures client-side filtering for Callahan-Smith brand only
      // Additional safety layer on top of server-side filtering
      const filteredInsights = rawReplenishmentData.insights?.filter(insight => 
        !insight.description || insight.description.toLowerCase().includes('callahan-smith') || 
        insight.source === 'replenishment_agent'
      ) || [];

      const replenishmentData = {
        ...rawReplenishmentData,
        insights: filteredInsights
      };

      console.log("✅ Client: BrandBuddy replenishment intelligence loaded (Callahan-Smith focused):", {
        criticalSKUs: replenishmentData.kpis?.criticalSKUs || 0,
        replenishmentValue: replenishmentData.kpis?.replenishmentValue || 0,
        supplierAlerts: replenishmentData.kpis?.supplierAlerts || 0,
        rawInsights: rawReplenishmentData.insights?.length || 0,
        filteredInsights: filteredInsights.length,
      });

      return replenishmentData;
    },
    ...queryConfig, // This part of the code applies user's cache and refresh settings
    meta: {
      errorMessage:
        "Unable to load replenishment data - Refresh to retry or check API connection",
    },
  });
};

/**
 * Get real-time replenishment connection status
 * 🔒 SECURE: Monitors internal API connection status
 */
export const useReplenishmentConnectionStatus = () => {
  const replenishmentQuery = useReplenishmentData();

  return {
    isConnected: !replenishmentQuery.isError,
    isLoading: replenishmentQuery.isLoading,
    error: replenishmentQuery.error,
    lastUpdated: replenishmentQuery.dataUpdatedAt,
    refetch: replenishmentQuery.refetch,
  };
};
