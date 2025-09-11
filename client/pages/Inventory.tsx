import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useInventoryDataFast, useInventoryInsights, useInventoryTable } from "@/hooks/useInventoryData";
import { useOrdersData } from "@/hooks/useOrdersData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";
import type { InventoryItem } from "@/types/api";

// Inventory Components
import { InventoryKPISection } from "@/components/inventory/InventoryKPISection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { InventoryTableSection } from "@/components/inventory/InventoryTableSection";
import { SKUPerformanceDashboard } from "@/components/inventory/SKUPerformanceDashboard";
import { SupplierPerformanceSection } from "@/components/inventory/SupplierPerformanceSection";
import { ViewAllInventoryModal } from "@/components/inventory/ViewAllInventoryModal";
import { InventoryItemAIExplanationModal } from "@/components/inventory/InventoryItemAIExplanationModal";




export default function Inventory() {
  // This part of the code uses progressive loading for better performance
  // Load fast data first, then AI insights separately in background
  const { data, isLoading, error, refetch } = useInventoryDataFast();
  const { 
    data: insightsData, 
    isLoading: insightsLoading, 
    error: insightsError
  } = useInventoryInsights();
  const { data: ordersData, isLoading: ordersLoading } = useOrdersData();
  const { isPageAIEnabled, getTablePageSize } = useSettingsIntegration();
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [showItemAnalysisModal, setShowItemAnalysisModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  

  // This part of the code processes inventory data for table display
  const inventory = data?.inventory || [];
  const tableData = useInventoryTable(inventory, 10);
  const displayInventory = tableData.data?.displayInventory || [];
  const hasMore = tableData.data?.hasMore || false;
  const totalCount = tableData.data?.totalCount || 0;

  // This part of the code handles opening the view all inventory modal
  const handleViewAll = () => {
    setShowViewAllModal(true);
  };

  // This part of the code handles closing the view all inventory modal
  const handleCloseModal = () => {
    setShowViewAllModal(false);
  };

  // This part of the code handles opening the AI analysis modal for a specific inventory item
  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowItemAnalysisModal(true);
  };

  // This part of the code handles closing the AI analysis modal
  const handleCloseItemAnalysisModal = () => {
    setShowItemAnalysisModal(false);
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading BrandBuddy inventory data..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorDisplay
          message={
            error.message ||
            "Unable to load inventory data - Refresh to retry or check API connection"
          }
          onRetry={() => refetch()}
        />
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <ErrorDisplay
          message="No inventory data available"
          onRetry={() => refetch()}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* This part of the code displays the inventory KPI cards */}
        <InventoryKPISection 
          kpis={data.kpis} 
          kpiContext={data.kpiContext} 
          isLoading={isLoading} 
        />

        {/* This part of the code displays AI insights for inventory management with Progressive Loading */}
        {isPageAIEnabled('inventory') && (
          <>
            {insightsLoading && !insightsData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-gray-500">(Loading...)</span>
                </div>
                <LoadingState message="Loading AI insights..." />
              </div>
            ) : insightsError ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-red-500">(Failed to load)</span>
                </div>
                <ErrorDisplay
                  message="Unable to load AI insights - Using inventory data without AI recommendations"
                  onRetry={() => window.location.reload()}
                />
              </div>
            ) : (
              <InsightsSection
                insights={insightsData?.insights || []}
                isLoading={false}
                title="Insights"
                subtitle={`${insightsData?.insights?.length || 0} insights from SKU Intelligence Agent`}
              />
            )}
          </>
        )}

        {/* This part of the code displays the main inventory table */}
        <InventoryTableSection
          inventory={displayInventory}
          totalCount={totalCount}
          hasMore={hasMore}
          isLoading={isLoading}
          onViewAll={handleViewAll}
          onViewItem={handleViewItem}
        />

        {/* This part of the code displays SKU performance intelligence dashboard */}
        <SKUPerformanceDashboard
          inventory={inventory}
          isLoading={isLoading}
        />

        {/* This part of the code displays supplier performance dashboard */}
        <SupplierPerformanceSection
          orders={ordersData?.orders || []}
          isLoading={isLoading || ordersLoading}
        />


        {/* This part of the code displays the view all inventory modal */}
        <ViewAllInventoryModal
          isOpen={showViewAllModal}
          onClose={handleCloseModal}
          inventory={inventory}
          totalCount={totalCount}
          onViewItem={handleViewItem}
        />

        {/* This part of the code displays the AI analysis modal when triggered */}
        <InventoryItemAIExplanationModal
          isOpen={showItemAnalysisModal}
          onClose={handleCloseItemAnalysisModal}
          item={selectedItem}
        />
      </div>
    </Layout>
  );
}
