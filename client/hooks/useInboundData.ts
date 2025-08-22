import { useQuery } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";
import { useSettingsIntegration } from "./useSettingsIntegration";
import type { ShipmentData } from "@/types/api";

interface InboundKPIs {
  todayArrivals: number;
  thisWeekExpected: number;
  averageLeadTime: number;
  delayedShipments: number;
  receivingAccuracy: number;
  onTimeDeliveryRate: number;
}

interface InboundData {
  kpis: InboundKPIs;
  insights: any[];
  shipments: ShipmentData[];
  todayArrivals: ShipmentData[];
  receivingMetrics: any[];
  supplierPerformance: any[];
  lastUpdated: string;
}

/**
 * Main inbound operations data hook with settings-aware caching
 * Respects user's refresh interval preferences and cache settings
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useInboundData = () => {
  const { getQueryConfig } = useSettingsIntegration();
  const queryConfig = getQueryConfig();

  return useQuery({
    queryKey: ["inbound-data"],
    queryFn: async (): Promise<InboundData> => {
      console.log(
        "🚚 Client: Fetching BrandBuddy inbound operations intelligence (Callahan-Smith focused)...",
      );

      // This part of the code calls the server to fetch inbound operations data securely
      // Server analyzes shipment arrivals, receiving efficiency, and generates AI insights
      const rawInboundData = await internalApi.getInboundData();

      // This part of the code ensures client-side filtering for Callahan-Smith brand only
      // Additional safety layer on top of server-side filtering
      const filteredInsights = rawInboundData.insights?.filter(insight => 
        !insight.description || insight.description.toLowerCase().includes('callahan-smith') || 
        insight.source === 'inbound_operations_agent'
      ) || [];

      const inboundData = {
        ...rawInboundData,
        insights: filteredInsights
      };

      console.log("✅ Client: BrandBuddy inbound operations intelligence loaded (Callahan-Smith focused):", {
        todayArrivals: inboundData.kpis?.todayArrivals || 0,
        thisWeekExpected: inboundData.kpis?.thisWeekExpected || 0,
        averageLeadTime: inboundData.kpis?.averageLeadTime || 0,
        rawInsights: rawInboundData.insights?.length || 0,
        filteredInsights: filteredInsights.length,
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
