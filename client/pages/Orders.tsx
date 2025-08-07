import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useOrdersData, useOrdersTable } from "@/hooks/useOrdersData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import type { OrderData } from "@/types/api";

// Orders Components
import { OrdersKPISection } from "@/components/orders/OrdersKPISection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { OrdersTableSection } from "@/components/orders/OrdersTableSection";
import { InboundIntelligenceSection } from "@/components/orders/InboundIntelligenceSection";
import { CarrierPerformanceSection } from "@/components/orders/CarrierPerformanceSection";
import { ViewAllOrdersModal } from "@/components/orders/ViewAllOrdersModal";
import { ViewAllShipmentsModal } from "@/components/orders/ViewAllShipmentsModal";
import { OrderAIExplanationModal } from "@/components/orders/OrderAIExplanationModal";

export default function Orders() {
  const { data, isLoading, error, refetch } = useOrdersData();
  const { orders, totalCount, hasMore } = useOrdersTable(15);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [showViewAllShipmentsModal, setShowViewAllShipmentsModal] = useState(false);
  const [showAIExplanationModal, setShowAIExplanationModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

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
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* This part of the code handles loading state for the entire orders dashboard */}
        {isLoading && (
          <LoadingState message="Loading CargoCore orders data..." />
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
            <OrdersKPISection kpis={data.kpis} isLoading={isLoading} />

            {/* AI Insights Section - Orders Agent Insights */}
            <InsightsSection insights={data.insights} isLoading={isLoading} />

            {/* Main Orders Table Section - Shows top 15 orders with AI explanations */}
            <OrdersTableSection
              orders={orders}
              totalCount={totalCount}
              hasMore={hasMore}
              isLoading={isLoading}
              onViewAll={handleViewAll}
              onViewOrder={handleViewOrder}
            />

            {/* Inbound Shipments Intelligence Section - Complex intelligence dashboard */}
            <InboundIntelligenceSection
              inboundIntelligence={data.inboundIntelligence}
              isLoading={isLoading}
              onViewAll={handleViewAllShipments}
            />

            {/* Carrier Performance Section - Placeholder for future implementation */}
            <CarrierPerformanceSection isLoading={isLoading} />
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
