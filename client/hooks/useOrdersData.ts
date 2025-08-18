import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";
import type { OrdersData, OrderSuggestion } from "@/types/api";
import { toast } from "sonner";
import { Lightbulb } from "lucide-react";
import { useSettingsIntegration } from "./useSettingsIntegration";

/**
 * Main orders data hook with settings-aware caching
 * Respects user's refresh interval preferences and cache settings
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useOrdersData = () => {
  const { getQueryConfig } = useSettingsIntegration();
  const queryConfig = getQueryConfig();

  return useQuery({
    queryKey: ["orders-data"],
    queryFn: async (): Promise<OrdersData> => {
      console.log(
        "🔒 Client: Fetching Callahan-Smith orders data (using shipments as orders)...",
      );

      // This part of the code calls the server to fetch orders data securely
      // Server transforms shipments into order-like structure with proper mappings
      const ordersData = await internalApi.getOrdersData();

      console.log("✅ Client: Callahan-Smith orders data loaded securely:", {
        orders: ordersData.orders?.length || 0,
        kpis: ordersData.kpis ? Object.keys(ordersData.kpis).length : 0,
        insights: ordersData.insights?.length || 0,
        inboundShipments: ordersData.inboundIntelligence?.totalInbound || 0,
      });

      return ordersData;
    },
    ...queryConfig, // This part of the code applies user's cache and refresh settings
    meta: {
      errorMessage:
        "Unable to load Callahan-Smith orders data - Refresh to retry or check API connection",
    },
  });
};

/**
 * AI order suggestion hook for individual order analysis
 * 🔒 SECURE: Uses internal API - NO OpenAI keys exposed
 */
export const useOrderSuggestion = () => {
  return useMutation({
    mutationFn: async (orderData: any): Promise<OrderSuggestion> => {
      console.log(
        "🔒 Client: Requesting AI suggestion for order:",
        orderData.order_id,
      );

      // This part of the code calls the server to generate AI suggestion securely
      const suggestion = await internalApi.generateOrderSuggestion(orderData);

      console.log("✅ Client: AI suggestion received for order:", orderData.order_id);
      return suggestion;
    },
    onSuccess: (suggestion, orderData) => {
      // This part of the code shows a success toast with the AI suggestion
      toast.success(`AI Suggestion for ${orderData.order_id}`, {
        description: suggestion.suggestion,
        duration: 6000, // Auto-dismiss after 6 seconds
      });
    },
    onError: (error, orderData) => {
      // This part of the code shows an error toast when AI suggestion fails
      console.error("❌ Client: Order suggestion failed:", error);
      toast.error(`Failed to generate suggestion for ${orderData.order_id}`, {
        description: "AI service temporarily unavailable. Please try again.",
        duration: 4000,
      });
    },
    retry: 1, // Only retry once for AI suggestions
    retryDelay: 2000, // 2 second delay before retry
  });
};

/**
 * AI order suggestion hook for modal overlays (no toast notifications)
 * 🔒 SECURE: Uses internal API - NO OpenAI keys exposed
 */
export const useOrderSuggestionSilent = () => {
  return useMutation({
    mutationFn: async (orderData: any): Promise<OrderSuggestion> => {
      console.log(
        "🔒 Client: Requesting AI suggestion for order (silent):",
        orderData.order_id,
      );

      // This part of the code calls the server to generate AI suggestion securely
      const suggestion = await internalApi.generateOrderSuggestion(orderData);

      console.log("✅ Client: AI suggestion received for order (silent):", orderData.order_id);
      return suggestion;
    },
    retry: 1, // Only retry once for AI suggestions
    retryDelay: 2000, // 2 second delay before retry
  });
};

/**
 * Manual refresh function for all orders data
 */
export const useRefreshOrders = () => {
  const queryClient = useQueryClient();

  return {
    refreshAll: () => {
      // This part of the code invalidates and refetches all orders-related queries
      console.log("🔄 Refreshing all orders data...");
      queryClient.invalidateQueries({ queryKey: ["orders-data"] });
    },
  };
};

/**
 * Get real-time orders connection status
 * 🔒 SECURE: Monitors internal API connection status
 */
export const useOrdersConnectionStatus = () => {
  const ordersQuery = useOrdersData();

  return {
    isConnected: !ordersQuery.isError && !ordersQuery.isPending,
    isLoading: ordersQuery.isPending,
    hasError: ordersQuery.isError,
    error: ordersQuery.error,
    lastUpdated: ordersQuery.data?.lastUpdated,
    retry: ordersQuery.refetch,
  };
};

/**
 * Orders table data hook with pagination and filtering
 */
export const useOrdersTable = (limit: number = 15) => {
  const { data: ordersData, isLoading, error } = useOrdersData();

  const orders = ordersData?.orders || [];
  const displayOrders = orders.slice(0, limit);
  const hasMore = orders.length > limit;
  const totalCount = orders.length;

  return {
    orders: displayOrders,
    totalCount,
    hasMore,
    isLoading,
    error,
    // This part of the code provides filtering functions for the table
    filterByStatus: (status: string) =>
      orders.filter(order => order.status.toLowerCase().includes(status.toLowerCase())),
    filterByBrand: (brand: string) =>
      orders.filter(order => order.brand_name.toLowerCase().includes(brand.toLowerCase())),
    filterBySLA: (slaStatus: string) =>
      orders.filter(order => order.sla_status.toLowerCase().includes(slaStatus.toLowerCase())),
  };
};
