import { useQuery, useMutation } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";
import { useSettingsIntegration } from "./useSettingsIntegration";
import { logger } from "@/lib/logger";
import type { 
  ReplenishmentData, 
  ReplenishmentKPIs, 
  InsightData, 
  SupplierPerformance,
  ProductData,
  ShipmentData 
} from "@/types/data";
import type { ReplenishmentItemSuggestion, AIInsight, ReplenishmentKPIContext } from "@/types/api";

// This part of the code extends the base interface for additional replenishment-specific KPIs
interface ExtendedReplenishmentKPIs extends ReplenishmentKPIs {
  reorderRecommendations: number;
}

// This part of the code defines replenishment-specific item structure
interface CriticalItem {
  productId: string;
  productName: string;
  sku: string | null;
  currentStock: number;
  minimumThreshold: number;
  recommendedQuantity: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  supplier: string;
  estimatedLeadTime: number;
}

// This part of the code defines reorder suggestion structure
interface ReorderSuggestion {
  productId: string;
  productName: string;
  sku: string | null;
  suggestedQuantity: number;
  estimatedCost: number;
  supplier: string;
  urgency: 'low' | 'medium' | 'high';
  reasoning: string;
}

// This part of the code defines type-safe replenishment data structure
interface TypedReplenishmentData extends Omit<ReplenishmentData, 'kpis'> {
  kpis: ExtendedReplenishmentKPIs;
  kpiContext?: ReplenishmentKPIContext; // This part of the code includes AI-powered KPI context for meaningful percentages
  products: ProductData[];
  shipments: ShipmentData[];
  criticalItems: CriticalItem[];
  supplierPerformance: SupplierPerformance[];
  reorderSuggestions: ReorderSuggestion[];
}

/**
 * Main replenishment data hook with settings-aware caching
 * Respects user's refresh interval preferences and cache settings
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useReplenishmentData = () => {
  const { getQueryConfig } = useSettingsIntegration();
  const queryConfig = getQueryConfig();
  const hookLogger = logger.createLogger({ component: "useReplenishmentData", hook: "replenishment" });

  return useQuery<TypedReplenishmentData>({
    queryKey: ["replenishment-data"],
    queryFn: async (): Promise<TypedReplenishmentData> => {
      hookLogger.info("Fetching BrandBuddy replenishment intelligence", {
        brandFilter: "Callahan-Smith"
      });

      // This part of the code calls the server to fetch replenishment data securely
      // Server analyzes inventory levels, supplier performance, and generates AI insights
      const rawReplenishmentData = await internalApi.getReplenishmentData();

      // This part of the code ensures type-safe filtering for Callahan-Smith brand only
      // Additional safety layer on top of server-side filtering
      const filteredInsights: InsightData[] = (rawReplenishmentData.insights || []).filter((insight: InsightData) => 
        !insight.description || 
        insight.description.toLowerCase().includes('callahan-smith') || 
        insight.source === 'replenishment_agent'
      );

      const replenishmentData: TypedReplenishmentData = {
        ...rawReplenishmentData,
        insights: filteredInsights
      };

      hookLogger.info("BrandBuddy replenishment intelligence loaded", {
        brandFilter: "Callahan-Smith",
        criticalSKUs: replenishmentData.kpis?.criticalSKUs || 0,
        replenishmentValue: replenishmentData.kpis?.replenishmentValue || 0,
        supplierAlerts: replenishmentData.kpis?.supplierAlerts || 0,
        rawInsightCount: rawReplenishmentData.insights?.length || 0,
        filteredInsightCount: filteredInsights.length,
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
 * FAST replenishment data hook without AI insights for immediate page load  
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useReplenishmentDataFast = () => {
  const { getQueryConfig } = useSettingsIntegration();
  const queryConfig = getQueryConfig();
  const hookLogger = logger.createLogger({ component: "useReplenishmentDataFast", hook: "replenishment-fast" });

  return useQuery<TypedReplenishmentData>({
    queryKey: ["replenishment-data-fast"],
    queryFn: async (): Promise<TypedReplenishmentData> => {
      hookLogger.info("Fetching FAST replenishment data (no AI insights)", {
        brandFilter: "Callahan-Smith"
      });

      // This part of the code calls fast mode to get immediate data without AI processing
      const rawData = await internalApi.getReplenishmentDataFast();

      const replenishmentData: TypedReplenishmentData = {
        ...rawData,
        insights: [] // Fast mode has no insights
      };

      hookLogger.info("FAST replenishment data loaded for Callahan-Smith", {
        criticalSKUs: replenishmentData.kpis?.criticalSKUs || 0,
        replenishmentValue: replenishmentData.kpis?.replenishmentValue || 0,
        insights: 0 // Fast mode has no insights
      });

      return replenishmentData;
    },
    ...queryConfig,
    meta: {
      errorMessage: "Unable to load fast replenishment data - Refresh to retry or check API connection",
    },
  });
};

/**
 * Replenishment AI insights hook for progressive loading  
 * 🔒 SECURE: Uses internal API for AI insights only
 */
export const useReplenishmentInsights = () => {
  return useQuery({
    queryKey: ["replenishment-insights"],
    queryFn: async () => {
      console.log(
        "🤖 Client: Loading replenishment AI insights in background...",
      );

      // This part of the code fetches AI insights separately for progressive loading
      const insightsData = await internalApi.getReplenishmentInsights();

      console.log("✅ Client: Replenishment AI insights loaded:", {
        insights: insightsData.insights?.length || 0,
      });

      return insightsData;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - standardized with Dashboard/Orders for consistency
    retry: 2, // Fewer retries for AI insights (matches Dashboard/Orders proven pattern)
    meta: {
      errorMessage:
        "Unable to load replenishment insights - Refresh to retry or check API connection",
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

/**
 * Silent AI suggestion hook for individual replenishment items
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useReplenishmentItemSuggestionSilent = () => {
  return useMutation({
    mutationFn: async (item: ProductData): Promise<ReplenishmentItemSuggestion> => {
      console.log(
        "🔒 Client: Requesting AI suggestion for replenishment item:",
        item.product_sku || item.product_id,
      );

      // This part of the code calls the server to generate AI suggestion securely
      const suggestion = await internalApi.generateReplenishmentItemSuggestion(item);

      console.log("✅ Client: AI suggestion received for replenishment item (silent):", item.product_sku || item.product_id);
      return suggestion;
    },
    retry: 1, // Only retry once for AI suggestions
    retryDelay: 2000, // 2 second delay before retry
    onError: (error) => {
      logger.error("Failed to generate replenishment item suggestion:", error);
    },
    onSuccess: (data) => {
      logger.info("Successfully generated replenishment item suggestion:", data);
    },
  });
};
