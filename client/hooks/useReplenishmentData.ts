import { useQuery } from "@tanstack/react-query";
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
