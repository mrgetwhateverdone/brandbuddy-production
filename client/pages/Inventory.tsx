import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useInventoryData, useInventoryTable } from "@/hooks/useInventoryData";
import { useOrdersData } from "@/hooks/useOrdersData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";

// Inventory Components
import { InventoryKPISection } from "@/components/inventory/InventoryKPISection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { InventoryTableSection } from "@/components/inventory/InventoryTableSection";
import { SKUPerformanceDashboard } from "@/components/inventory/SKUPerformanceDashboard";
import { SupplierPerformanceSection } from "@/components/inventory/SupplierPerformanceSection";
import { ViewAllInventoryModal } from "@/components/inventory/ViewAllInventoryModal";

export default function Inventory() {
  const { data, isLoading, error, refetch } = useInventoryData();
  const { data: ordersData, isLoading: ordersLoading } = useOrdersData();
  const { isPageAIEnabled, getTablePageSize } = useSettingsIntegration();
  const [showViewAllModal, setShowViewAllModal] = useState(false);

  // This part of the code processes inventory data for table display
  const inventory = data?.inventory || [];
  const tableData = useInventoryTable(inventory, getTablePageSize());
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
      <div className="p-6">
        {/* This part of the code displays the inventory KPI cards */}
        <InventoryKPISection kpis={data.kpis} isLoading={isLoading} />

        {/* This part of the code displays AI insights for inventory management */}
        {isPageAIEnabled('inventory') && (
          <InsightsSection
            insights={data.insights}
            isLoading={isLoading}
            title="Insights"
            subtitle={`${data.insights.length} insights from SKU Intelligence Agent`}
            loadingMessage="SKU Intelligence Agent is analyzing inventory levels and identifying optimization opportunities..."
          />
        )}

        {/* This part of the code displays the main inventory table */}
        <InventoryTableSection
          inventory={displayInventory}
          totalCount={totalCount}
          hasMore={hasMore}
          isLoading={isLoading}
          onViewAll={handleViewAll}
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
        />
      </div>
    </Layout>
  );
}
