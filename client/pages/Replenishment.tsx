import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useReplenishmentDataFast, useReplenishmentInsights } from "@/hooks/useReplenishmentData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";
import { ReplenishmentItemAIExplanationModal } from "@/components/replenishment/ReplenishmentItemAIExplanationModal";
import type { ProductData } from "@/types/api";

// Replenishment Components
import { ReplenishmentKPISection } from "@/components/replenishment/ReplenishmentKPISection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { SupplierReliabilitySection } from "@/components/replenishment/SupplierReliabilitySection";
import { ReorderPointSection } from "@/components/replenishment/ReorderPointSection";
import { FinancialImpactSection } from "@/components/replenishment/FinancialImpactSection";

// This part of the code provides world-class insight loading experience for Replenishment
const ReplenishmentInsightLoadingMessage = () => (
  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
    <div className="flex items-start">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mt-0.5 mr-3"></div>
      <div>
        <h4 className="text-sm font-medium text-purple-800">🤖 AI Analyzing Replenishment</h4>
        <p className="text-sm text-purple-700 mt-1">
          Supply Chain Planning Director AI is analyzing {" "}
          <span className="font-medium">inventory levels, demand patterns, and supplier lead times</span>
          {" "} to provide strategic insights...
        </p>
        <div className="mt-2 text-xs text-purple-600">
          • Analyzing reorder point optimization<br/>
          • Calculating inventory carrying costs<br/>
          • Generating supplier performance insights
        </div>
      </div>
    </div>
  </div>
);

export default function Replenishment() {
  // This part of the code manages modal state for AI explanations
  const [selectedItem, setSelectedItem] = useState<ProductData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // This part of the code uses progressive loading for better performance
  // Load fast data first, then AI insights separately in background
  const { data, isLoading, error, refetch } = useReplenishmentDataFast();
  const { 
    data: insightsData, 
    isLoading: insightsLoading, 
    error: insightsError 
  } = useReplenishmentInsights();
  const { isPageAIEnabled } = useSettingsIntegration();

  // This part of the code handles opening AI analysis for products (both from product table and supplier analysis)
  const handleAnalyzeItem = (item: ProductData) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // This part of the code handles supplier analysis by showing the first product from that supplier
  const handleAnalyzeSupplier = (supplier: any) => {
    // Find the first product from this supplier for analysis
    const supplierProducts = data?.products?.filter(p => p.supplier_name === supplier.name) || [];
    if (supplierProducts.length > 0) {
      handleAnalyzeItem(supplierProducts[0]);
    }
  };

  // This part of the code closes the AI analysis modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading BrandBuddy replenishment intelligence..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorDisplay
          message={
            error.message ||
            "Unable to load replenishment data - Refresh to retry or check API connection"
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
          message="No replenishment data available"
          onRetry={() => refetch()}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* This part of the code displays the replenishment KPI cards */}
        <ReplenishmentKPISection 
          kpis={data.kpis} 
          kpiContext={data.kpiContext}
          isLoading={isLoading} 
        />

        {/* This part of the code displays AI insights for replenishment management with Progressive Loading */}
        {isPageAIEnabled('replenishment') && (
          <>
            {insightsLoading && !insightsData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-gray-500">(Loading...)</span>
                </div>
                <ReplenishmentInsightLoadingMessage />
              </div>
            ) : insightsError ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-red-500">(Failed to load)</span>
                </div>
                <ErrorDisplay
                  message="Unable to load AI insights - Using replenishment data without AI recommendations"
                  onRetry={() => window.location.reload()}
                />
              </div>
            ) : (
              <InsightsSection
                insights={insightsData?.insights || []}
                isLoading={false}
                title="Insights"
                subtitle={`${insightsData?.insights?.length || 0} insights from Replenishment Intelligence Agent`}
              />
            )}
          </>
        )}

        {/* This part of the code displays the Supplier Reliability Scorecard */}
        <SupplierReliabilitySection
          products={data.products || []}
          shipments={data.shipments || []}
          isLoading={isLoading}
          onAnalyzeSupplier={handleAnalyzeSupplier}
        />

        {/* This part of the code displays the Reorder Point Intelligence */}
        <ReorderPointSection
          products={data.products || []}
          isLoading={isLoading}
          onAnalyzeProduct={handleAnalyzeItem}
        />

        {/* This part of the code displays the Financial Impact Calculator */}
        <FinancialImpactSection
          products={data.products || []}
          kpis={data.kpis}
          isLoading={isLoading}
        />
      </div>

      {/* This part of the code displays the AI analysis modal for replenishment items */}
      <ReplenishmentItemAIExplanationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={selectedItem}
      />
    </Layout>
  );
}
