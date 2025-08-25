import { Layout } from "@/components/layout/Layout";
import { useReplenishmentData } from "@/hooks/useReplenishmentData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";

// Replenishment Components
import { ReplenishmentKPISection } from "@/components/replenishment/ReplenishmentKPISection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { SupplierReliabilitySection } from "@/components/replenishment/SupplierReliabilitySection";
import { ReorderPointSection } from "@/components/replenishment/ReorderPointSection";
import { FinancialImpactSection } from "@/components/replenishment/FinancialImpactSection";

export default function Replenishment() {
  const { data, isLoading, error, refetch } = useReplenishmentData();
  const { isPageAIEnabled } = useSettingsIntegration();

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
        <ReplenishmentKPISection kpis={data.kpis} isLoading={isLoading} />

        {/* This part of the code displays AI insights for replenishment management */}
        {isPageAIEnabled('replenishment') && (
          <InsightsSection
            insights={data.insights}
            isLoading={isLoading}
            title="Insights"
            subtitle={`${data.insights.length} insights from Replenishment Intelligence Agent`}
            loadingMessage="Replenishment Intelligence Agent is analyzing inventory levels, supplier performance, and generating purchase recommendations..."
          />
        )}

        {/* This part of the code displays the Supplier Reliability Scorecard */}
        <SupplierReliabilitySection
          products={data.products || []}
          shipments={data.shipments || []}
          isLoading={isLoading}
        />

        {/* This part of the code displays the Reorder Point Intelligence */}
        <ReorderPointSection
          products={data.products || []}
          isLoading={isLoading}
        />

        {/* This part of the code displays the Financial Impact Calculator */}
        <FinancialImpactSection
          products={data.products || []}
          kpis={data.kpis}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
}
