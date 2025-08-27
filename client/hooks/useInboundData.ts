import { useQuery } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";
import { useSettingsIntegration } from "./useSettingsIntegration";
import { logger } from "@/lib/logger";
import type { 
  InboundData, 
  InboundKPIs, 
  InsightData, 
  ReceivingMetrics, 
  SupplierPerformance,
  ShipmentData 
} from "@/types/data";

// This part of the code extends the base interface for additional inbound-specific KPIs
interface ExtendedInboundKPIs extends InboundKPIs {
  delayedShipments: number;
  receivingAccuracy: number;
  onTimeDeliveryRate: number;
}

// This part of the code defines type-safe inbound data structure
interface TypedInboundData extends Omit<InboundData, 'kpis'> {
  kpis: ExtendedInboundKPIs;
  shipments: ShipmentData[];
  todayArrivals: ShipmentData[];
}

/**
 * Main inbound operations data hook with settings-aware caching
 * Respects user's refresh interval preferences and cache settings
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useInboundData = () => {
  const { getQueryConfig } = useSettingsIntegration();
  const queryConfig = getQueryConfig();
  const hookLogger = logger.createLogger({ component: "useInboundData", hook: "inbound" });

  return useQuery<TypedInboundData>({
    queryKey: ["inbound-data"],
    queryFn: async (): Promise<TypedInboundData> => {
      hookLogger.info("Fetching BrandBuddy inbound operations intelligence", {
        brandFilter: "Callahan-Smith"
      });

      // This part of the code calls the server to fetch inbound operations data securely
      // Server analyzes shipment arrivals, receiving efficiency, and generates AI insights
      const rawInboundData = await internalApi.getInboundData();

      // This part of the code ensures type-safe filtering for Callahan-Smith brand only
      // Additional safety layer on top of server-side filtering
      const filteredInsights: InsightData[] = (rawInboundData.insights || []).filter((insight: InsightData) => 
        !insight.description || 
        insight.description.toLowerCase().includes('callahan-smith') || 
        insight.source === 'inbound_operations_agent'
      );

      const inboundData: TypedInboundData = {
        ...rawInboundData,
        insights: filteredInsights
      };

      hookLogger.info("BrandBuddy inbound operations intelligence loaded", {
        brandFilter: "Callahan-Smith",
        todayArrivals: inboundData.kpis?.todayArrivals || 0,
        thisWeekExpected: inboundData.kpis?.thisWeekExpected || 0,
        averageLeadTime: inboundData.kpis?.averageLeadTime || 0,
        rawInsightCount: rawInboundData.insights?.length || 0,
        filteredInsightCount: filteredInsights.length,
      });

      return inboundData;
    },
    ...queryConfig, // This part of the code applies user's cache and refresh settings
    meta: {
      errorMessage:
        "Unable to load inbound operations data - Refresh to retry or check API connection",
    },
  });
};

/**
 * Get real-time inbound operations connection status
 * 🔒 SECURE: Monitors internal API connection status
 */
export const useInboundConnectionStatus = () => {
  const inboundQuery = useInboundData();

  return {
    isConnected: !inboundQuery.isError,
    isLoading: inboundQuery.isLoading,
    error: inboundQuery.error,
    lastUpdated: inboundQuery.dataUpdatedAt,
    refetch: inboundQuery.refetch,
  };
};
