import { useQuery, useQueryClient } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";
import type { InventoryData } from "@/types/api";
import { useSettingsIntegration } from "./useSettingsIntegration";

/**
 * Main inventory data hook with settings-aware caching
 * Respects user's refresh interval preferences and cache settings
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export const useInventoryData = () => {
  const { getQueryConfig } = useSettingsIntegration();
  const queryConfig = getQueryConfig();

  return useQuery({
    queryKey: ["inventory-data"],
    queryFn: async (): Promise<InventoryData> => {
      console.log(
        "🔒 Client: Fetching BrandBuddy inventory data (Callahan-Smith focused)...",
      );

      // This part of the code calls the server to fetch inventory data securely
      // Server transforms product data into inventory structure with proper mappings
      const rawInventoryData = await internalApi.getInventoryData();

      // This part of the code ensures client-side filtering for Callahan-Smith brand only
      const filteredInventory = rawInventoryData.inventory?.filter(item => 
        item.brand_name === 'Callahan-Smith'
      ) || [];

      // This part of the code filters supplier analysis for Callahan-Smith suppliers only
      const filteredSupplierAnalysis = rawInventoryData.supplierAnalysis?.filter(supplier => {
        // Check if this supplier has any Callahan-Smith inventory
        const hasCallahanSmithInventory = filteredInventory.some(item => 
          item.supplier === supplier.supplier_name
        );
        return hasCallahanSmithInventory;
      }) || [];

      const inventoryData = {
        ...rawInventoryData,
        inventory: filteredInventory,
        supplierAnalysis: filteredSupplierAnalysis
      };

      console.log("✅ Client: BrandBuddy inventory data filtered for Callahan-Smith:", {
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
 * Inventory table hook for pagination and view management
 * 🔒 SECURE: Client-side data management for table display
 */
export const useInventoryTable = (inventory: any[] = [], pageSize: number = 15) => {
  return useQuery({
    queryKey: ["inventory-table", inventory.length, pageSize],
    queryFn: () => {
      // This part of the code processes inventory data for table display
      const displayInventory = inventory.slice(0, pageSize);
      const hasMore = inventory.length > pageSize;

      console.log(
        `🔒 Client: Callahan-Smith inventory table prepared - showing ${displayInventory.length} of ${inventory.length} SKUs`,
      );

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

  return {
    refreshInventory: () => {
      console.log("🔒 Client: Forcing BrandBuddy inventory data refresh...");
      queryClient.invalidateQueries({ queryKey: ["inventory-data"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-table"] });
    },
    clearInventoryCache: () => {
      console.log("🔒 Client: Clearing BrandBuddy inventory cache...");
      queryClient.removeQueries({ queryKey: ["inventory-data"] });
      queryClient.removeQueries({ queryKey: ["inventory-table"] });
    },
  };
};
