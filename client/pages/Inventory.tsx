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


// This part of the code provides enhanced insight loading experience with timeout awareness
const InventoryInsightLoadingMessage = ({ duration }: { duration?: number }) => {
  const isSlowLoading = duration && duration > 10000; // Show timeout warning after 10 seconds
  
  return (
    <div className={`${isSlowLoading ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
      <div className="flex items-start">
        <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${isSlowLoading ? 'border-yellow-600' : 'border-green-600'} mt-0.5 mr-3`}></div>
        <div>
          <h4 className={`text-sm font-medium ${isSlowLoading ? 'text-yellow-800' : 'text-green-800'}`}>
            🤖 AI Analyzing Inventory {isSlowLoading && '(Taking longer than usual)'}
          </h4>
          <p className={`text-sm ${isSlowLoading ? 'text-yellow-700' : 'text-green-700'} mt-1`}>
            SKU Intelligence Agent is analyzing {" "}
            <span className="font-medium">inventory performance, reorder points, and supplier efficiency</span>
            {" "} to provide actionable insights...
          </p>
          <div className={`mt-2 text-xs ${isSlowLoading ? 'text-yellow-600' : 'text-green-600'}`}>
            • Optimizing inventory turnover rates<br/>
            • Identifying reorder opportunities<br/>
            • Analyzing supplier performance metrics
            {isSlowLoading && <><br/>• Processing complex inventory patterns (timeout protection: 25s)</>}
          </div>
        </div>
      </div>
    </div>
  );
};

// This part of the code provides enhanced error handling with timeout detection and manual retry
const InventoryInsightErrorHandler = ({ error, onRetry }: { error: any, onRetry: () => void }) => {
  const isTimeoutError = error?.message?.includes('timeout') || error?.message?.includes('AbortError');
  const isNetworkError = error?.message?.includes('network') || error?.message?.includes('fetch');
  
  const getErrorMessage = () => {
    if (isTimeoutError) {
      return "AI insights timed out after 25 seconds - This can happen during high demand periods";
    }
    if (isNetworkError) {
      return "Network connection issue prevented loading AI insights";
    }
    return "Unable to load AI insights - Operating with inventory data only";
  };

  const getErrorIcon = () => {
    if (isTimeoutError) return "⏱️";
    if (isNetworkError) return "📡";
    return "🔌";
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="text-orange-600 text-lg mr-3">{getErrorIcon()}</div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-orange-800">Insights Temporarily Unavailable</h4>
          <p className="text-sm text-orange-700 mt-1">
            {getErrorMessage()}
          </p>
          <div className="mt-3 flex items-center space-x-3">
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              🔄 Retry Insights
            </button>
            <span className="text-xs text-orange-600">
              {isTimeoutError && "• Try again in a few moments"}
              {isNetworkError && "• Check your internet connection"}
              {!isTimeoutError && !isNetworkError && "• All inventory data remains available"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Inventory() {
  // This part of the code uses progressive loading for better performance
  // Load fast data first, then AI insights separately in background
  const { data, isLoading, error, refetch } = useInventoryDataFast();
  const { 
    data: insightsData, 
    isLoading: insightsLoading, 
    error: insightsError,
    refetch: refetchInsights
  } = useInventoryInsights();
  const { data: ordersData, isLoading: ordersLoading } = useOrdersData();
  const { isPageAIEnabled, getTablePageSize } = useSettingsIntegration();
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [showItemAnalysisModal, setShowItemAnalysisModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // This part of the code tracks loading duration for timeout awareness
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [loadingDuration, setLoadingDuration] = useState<number>(0);

  // This part of the code manages loading duration tracking
  useEffect(() => {
    if (insightsLoading && !loadingStartTime) {
      setLoadingStartTime(Date.now());
    } else if (!insightsLoading && loadingStartTime) {
      setLoadingStartTime(null);
      setLoadingDuration(0);
    }
  }, [insightsLoading, loadingStartTime]);

  // This part of the code updates loading duration every second
  useEffect(() => {
    if (!insightsLoading || !loadingStartTime) return;
    
    const interval = setInterval(() => {
      setLoadingDuration(Date.now() - loadingStartTime);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [insightsLoading, loadingStartTime]);

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
                  <span className="text-sm text-gray-500">
                    {loadingDuration > 10000 ? "(Slow loading...)" : "(Loading...)"}
                  </span>
                </div>
                <InventoryInsightLoadingMessage duration={loadingDuration} />
              </div>
            ) : insightsError ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-red-500">(Failed to load)</span>
                </div>
                <InventoryInsightErrorHandler 
                  error={insightsError} 
                  onRetry={() => refetchInsights()} 
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
