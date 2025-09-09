import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useOrdersDataFast, useOrdersInsights, useOrdersTable } from "@/hooks/useOrdersData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import type { OrderData } from "@/types/api";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";
import { useTour } from "@/contexts/TourContext";

// Orders Components
import { OrdersKPISection } from "@/components/orders/OrdersKPISection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { OrdersTableSection } from "@/components/orders/OrdersTableSection";
import { InboundIntelligenceSection } from "@/components/orders/InboundIntelligenceSection";
import { OrderValueAnalysisSection } from "@/components/orders/OrderValueAnalysisSection";
import { SupplierPerformanceSection } from "@/components/orders/SupplierPerformanceSection";
import { TimeAnalyticsSection } from "@/components/orders/TimeAnalyticsSection";
import { StatusIntelligenceSection } from "@/components/orders/StatusIntelligenceSection";
import { ViewAllOrdersModal } from "@/components/orders/ViewAllOrdersModal";
import { ViewAllShipmentsModal } from "@/components/orders/ViewAllShipmentsModal";
import { OrderAIExplanationModal } from "@/components/orders/OrderAIExplanationModal";

// This part of the code provides world-class insight loading experience for Orders
const OrdersInsightLoadingMessage = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-start">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5 mr-3"></div>
      <div>
        <h4 className="text-sm font-medium text-blue-800">🤖 AI Analyzing Orders</h4>
        <p className="text-sm text-blue-700 mt-1">
          Chief Fulfillment Officer AI is analyzing {" "}
          <span className="font-medium">order patterns, fulfillment rates, and supplier performance</span>
          {" "} to provide strategic insights...
        </p>
        <div className="mt-2 text-xs text-blue-600">
          • Analyzing order processing efficiency<br/>
          • Calculating fulfillment cost impacts<br/>
          • Generating supplier performance insights
        </div>
      </div>
    </div>
  </div>
);

export default function Orders() {
  // This part of the code uses progressive loading for better performance
  // Load fast data first, then AI insights separately in background
  const { data, isLoading, error, refetch } = useOrdersDataFast();
  const { 
    data: insightsData, 
    isLoading: insightsLoading, 
    error: insightsError 
  } = useOrdersInsights();
  const { getTablePageSize } = useSettingsIntegration();
  const { orders, totalCount, hasMore } = useOrdersTable(10);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [showViewAllShipmentsModal, setShowViewAllShipmentsModal] = useState(false);
  const [showAIExplanationModal, setShowAIExplanationModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  
  // This part of the code provides tour functionality for the orders page
  const { startOrdersTour } = useTour();

  // This part of the code handles opening the view all orders modal
  const handleViewAll = () => {
    setShowViewAllModal(true);
  };

  // This part of the code handles closing the view all orders modal
  const handleCloseModal = () => {
    setShowViewAllModal(false);
  };

  // This part of the code handles opening the view all shipments modal
  const handleViewAllShipments = () => {
    setShowViewAllShipmentsModal(true);
  };

  // This part of the code handles closing the view all shipments modal
  const handleCloseShipmentsModal = () => {
    setShowViewAllShipmentsModal(false);
  };

  // This part of the code handles opening the AI explanation modal for a specific order
  const handleViewOrder = (order: OrderData) => {
    setSelectedOrder(order);
    setShowAIExplanationModal(true);
  };

  // This part of the code handles closing the AI explanation modal
  const handleCloseAIExplanationModal = () => {
    setShowAIExplanationModal(false);
    setSelectedOrder(null);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tour Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <button
            onClick={startOrdersTour}
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors"
          >
            📦 Take Orders Tour
          </button>
        </div>
        {/* This part of the code handles loading state for the entire orders dashboard */}
        {isLoading && (
          <LoadingState message="Loading BrandBuddy orders data..." />
        )}

        {/* This part of the code handles error state with retry functionality */}
        {error && (
          <ErrorDisplay
            message={
              error.message ||
              "Unable to load orders data - Refresh to retry or check API connection"
            }
            onRetry={() => refetch()}
          />
        )}

        {/* This part of the code renders all orders sections when data is available */}
        {data && (
          <>
            {/* KPI Section - Orders Today, At-Risk Orders, Open POs, Unfulfillable SKUs */}
            <div data-tour="orders-kpi">
              <OrdersKPISection 
                kpis={data.kpis} 
                kpiContext={data.kpiContext} 
                isLoading={isLoading} 
              />
            </div>

            {/* AI Insights Section - Order Analysis Agent Insights with Progressive Loading */}
            {insightsLoading && !insightsData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-gray-500">(Loading...)</span>
                </div>
                <OrdersInsightLoadingMessage />
              </div>
            ) : insightsError ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-red-500">(Failed to load)</span>
                </div>
                <ErrorDisplay
                  message="Unable to load AI insights - Using real data without AI recommendations"
                  onRetry={() => window.location.reload()}
                />
              </div>
            ) : (
              <InsightsSection 
                insights={insightsData?.insights || []} 
                isLoading={false}
                title="Insights"
                subtitle={`${insightsData?.insights?.length || 0} insights from Order Analysis Agent`}
              />
            )}

            {/* Main Orders Table Section - Shows top 15 orders with AI explanations */}
            <div data-tour="orders-table">
              <OrdersTableSection
                orders={orders}
                totalCount={totalCount}
                hasMore={hasMore}
                isLoading={isLoading}
                onViewAll={handleViewAll}
                onViewOrder={handleViewOrder}
              />
            </div>

            {/* Inbound Shipments Intelligence Section - Complex intelligence dashboard */}
            <div data-tour="orders-actions">
              <InboundIntelligenceSection
                inboundIntelligence={data.inboundIntelligence}
                isLoading={isLoading}
                onViewAll={handleViewAllShipments}
              />
            </div>

            {/* Order Value Analysis Section - Financial insights and value metrics */}
            <OrderValueAnalysisSection
              orders={data.orders || []}
              isLoading={isLoading}
            />

            {/* Supplier Performance Dashboard Section - Supplier rankings and metrics */}
            <SupplierPerformanceSection
              orders={data.orders || []}
              isLoading={isLoading}
            />

            {/* Time-Based Analytics Section - Order age and processing time analysis */}
            <TimeAnalyticsSection
              orders={data.orders || []}
              isLoading={isLoading}
            />

            {/* Status-Driven Intelligence Section - Order lifecycle and efficiency metrics */}
            <StatusIntelligenceSection
              orders={data.orders || []}
              isLoading={isLoading}
            />
          </>
        )}

        {/* This part of the code displays the view all orders modal when triggered */}
        <ViewAllOrdersModal
          isOpen={showViewAllModal}
          onClose={handleCloseModal}
          orders={data?.orders || []}
          totalCount={data?.orders?.length || 0}
          onViewOrder={handleViewOrder}
        />

        {/* This part of the code displays the view all shipments modal when triggered */}
        <ViewAllShipmentsModal
          isOpen={showViewAllShipmentsModal}
          onClose={handleCloseShipmentsModal}
          shipments={data?.orders || []} // Use all orders data as shipments since orders are derived from shipments
          title="All Inbound Shipments"
        />

        {/* This part of the code displays the AI explanation modal when triggered */}
        <OrderAIExplanationModal
          isOpen={showAIExplanationModal}
          onClose={handleCloseAIExplanationModal}
          order={selectedOrder}
        />
      </div>
    </Layout>
  );
}
