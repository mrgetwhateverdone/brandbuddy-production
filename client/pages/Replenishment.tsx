import { Layout } from "@/components/layout/Layout";
import { useReplenishmentData } from "@/hooks/useReplenishmentData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";

// Replenishment Components
import { ReplenishmentKPISection } from "@/components/replenishment/ReplenishmentKPISection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";

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
      <div className="p-6">
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

        {/* This part of the code will display additional replenishment sections in future iterations */}
        {/* Future sections: Critical Items Table, Reorder Suggestions, Supplier Performance */}
      </div>
    </Layout>
  );
}
