import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";
import { useSettingsIntegration } from "./useSettingsIntegration";
import { logger } from "@/lib/logger";
import type { InventoryData, InventoryItem } from "@/types/api";

/**
 * Main inventory data hook with settings-aware caching
 * Respects user's refresh interval preferences and cache settings
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useInventoryData = () => {
  const { getQueryConfig } = useSettingsIntegration();
  const queryConfig = getQueryConfig();
  const hookLogger = logger.createLogger({ component: "useInventoryData", hook: "inventory" });

  return useQuery<InventoryData>({
    queryKey: ["inventory-data"],
    queryFn: async (): Promise<InventoryData> => {
      hookLogger.info("Fetching BrandBuddy inventory data", {
        brandFilter: "Callahan-Smith"
      });

      // This part of the code calls the server to fetch inventory data securely
      // Server transforms product data into inventory structure with proper mappings
      const rawInventoryData = await internalApi.getInventoryData();

      // This part of the code ensures type-safe client-side filtering for Callahan-Smith brand only
      const filteredInventory = (rawInventoryData.inventory || []).filter((item: any) => 
        item.brand_name === 'Callahan-Smith'
      );

      // This part of the code filters supplier analysis for Callahan-Smith suppliers only
      const filteredSupplierAnalysis = (rawInventoryData.supplierAnalysis || []).filter((supplier: any) => {
        // Check if this supplier has any Callahan-Smith inventory
        const hasCallahanSmithInventory = filteredInventory.some((item: any) => 
          item.supplier === supplier.supplier
        );
        return hasCallahanSmithInventory;
      });

      const inventoryData: InventoryData = {
        ...rawInventoryData,
        inventory: filteredInventory,
        supplierAnalysis: filteredSupplierAnalysis as any
      };

      hookLogger.info("BrandBuddy inventory data filtered for Callahan-Smith", {
        brandFilter: "Callahan-Smith",
        totalInventory: rawInventoryData.inventory?.length || 0,
        callahanSmithInventory: filteredInventory.length,
        totalSuppliers: rawInventoryData.supplierAnalysis?.length || 0,
        callahanSmithSuppliers: filteredSupplierAnalysis.length,
        insights: inventoryData.insights?.length || 0,
      });

      return inventoryData;
    },
    ...queryConfig, // This part of the code applies user's cache and refresh settings
    meta: {
      errorMessage:
        "Unable to load inventory data - Refresh to retry or check API connection",
    },
  });
};

/**
 * FAST inventory data hook without AI insights for immediate page load  
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useInventoryDataFast = () => {
  const { getQueryConfig } = useSettingsIntegration();
  const queryConfig = getQueryConfig();
  const hookLogger = logger.createLogger({ component: "useInventoryDataFast", hook: "inventory-fast" });

  return useQuery<InventoryData>({
    queryKey: ["inventory-data-fast"],
    queryFn: async (): Promise<InventoryData> => {
      hookLogger.info("Fetching FAST inventory data (no AI insights)", {
        brandFilter: "Callahan-Smith"
      });

      // This part of the code calls fast mode to get immediate data without AI processing
      const rawInventoryData = await internalApi.getInventoryDataFast();

      // This part of the code ensures type-safe client-side filtering for Callahan-Smith brand only
      const filteredInventory = (rawInventoryData.inventory || []).filter((item: any) => 
        item.brand_name === 'Callahan-Smith'
      );

      // This part of the code filters supplier analysis for Callahan-Smith suppliers only
      const filteredSupplierAnalysis: SupplierPerformance[] = (rawInventoryData.supplierAnalysis || []).filter((supplier: SupplierPerformance) => {
        const hasCallahanSmithInventory = filteredInventory.some((item: any) => 
          item.supplier === supplier.supplier
        );
        return hasCallahanSmithInventory;
      });

      const inventoryData: InventoryData = {
        ...rawInventoryData,
        inventory: filteredInventory,
        supplierAnalysis: filteredSupplierAnalysis as any
      };

      hookLogger.info("FAST inventory data loaded for Callahan-Smith", {
        callahanSmithInventory: filteredInventory.length,
        callahanSmithSuppliers: filteredSupplierAnalysis.length,
        insights: 0 // Fast mode has no insights
      });

      return inventoryData;
    },
    ...queryConfig,
    meta: {
      errorMessage: "Unable to load fast inventory data - Refresh to retry or check API connection",
    },
  });
};

/**
 * Inventory AI insights hook for progressive loading  
 * 🔒 SECURE: Uses internal API for AI insights only
 * 🎯 STANDARDIZED: Uses same cache settings as Dashboard/Orders for reliability
 */
export const useInventoryInsights = () => {
  return useQuery({
    queryKey: ["inventory-insights"],
    queryFn: async () => {
      console.log(
        "🤖 Client: Loading inventory AI insights in background...",
      );

      // This part of the code fetches AI insights separately for progressive loading
      const insightsData = await internalApi.getInventoryInsights();

      console.log("✅ Client: Inventory AI insights loaded:", {
        insights: insightsData.insights?.length || 0,
      });

      return insightsData;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - standardized with Dashboard/Orders for consistency
    retry: 2, // Fewer retries for AI insights (matches Dashboard/Orders proven pattern)
    meta: {
      errorMessage:
        "Unable to load inventory insights - Refresh to retry or check API connection",
    },
  });
};

/**
 * Inventory table hook for pagination and view management
 * 🔒 SECURE: Client-side data management for table display
 */
export const useInventoryTable = (inventory: InventoryItem[] = [], pageSize: number = 15) => {
  const tableLogger = logger.createLogger({ component: "useInventoryTable", hook: "inventory-table" });

  return useQuery({
    queryKey: ["inventory-table", inventory.length, pageSize],
    queryFn: () => {
      // This part of the code processes inventory data for table display
      const displayInventory = inventory.slice(0, pageSize);
      const hasMore = inventory.length > pageSize;

      tableLogger.info("Callahan-Smith inventory table prepared", {
        displayed: displayInventory.length,
        total: inventory.length,
        pageSize
      });

      return {
        displayInventory,
        hasMore,
        totalCount: inventory.length,
      };
    },
    enabled: true,
    staleTime: Infinity, // This part of the code keeps data fresh as long as source data hasn't changed
    retry: 1,
  });
};

/**
 * Get real-time inventory connection status
 * 🔒 SECURE: Monitors internal API connection status
 */
export const useInventoryConnectionStatus = () => {
  const inventoryQuery = useInventoryData();

  return {
    isConnected: !inventoryQuery.isError,
    isLoading: inventoryQuery.isLoading,
    error: inventoryQuery.error,
    lastUpdated: inventoryQuery.dataUpdatedAt,
    refetch: inventoryQuery.refetch,
  };
};

/**
 * Inventory query invalidation utility
 * 🔒 SECURE: Cache management for inventory data
 */
export const useInventoryRefresh = () => {
  const queryClient = useQueryClient();
  const refreshLogger = logger.createLogger({ component: "useInventoryRefresh", hook: "inventory-refresh" });

  return {
    refreshInventory: () => {
      refreshLogger.info("Forcing BrandBuddy inventory data refresh");
      queryClient.invalidateQueries({ queryKey: ["inventory-data"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-table"] });
    },
    clearInventoryCache: () => {
      refreshLogger.info("Clearing BrandBuddy inventory cache");
      queryClient.removeQueries({ queryKey: ["inventory-data"] });
      queryClient.removeQueries({ queryKey: ["inventory-table"] });
    },
  };
};

/**
 * Inventory item suggestion interface
 */
interface InventoryItemSuggestion {
  suggestion: string;
}

/**
 * AI inventory item suggestion hook for individual SKU analysis (silent mode)
 * 🔒 SECURE: Uses internal API - NO OpenAI keys exposed
 */
export const useInventoryItemSuggestionSilent = () => {
  return useMutation({
    mutationFn: async (item: InventoryItem): Promise<InventoryItemSuggestion> => {
      console.log(
        "🔒 Client: Requesting AI suggestion for inventory item:",
        item.sku,
      );

      // This part of the code calls the server to generate AI suggestion securely
      const suggestion = await internalApi.generateInventoryItemSuggestion(item);

      console.log("✅ Client: AI suggestion received for inventory item:", item.sku);
      return suggestion;
    },
    retry: 1, // Only retry once for AI suggestions
    retryDelay: 2000, // 2 second delay before retry
  });
};
