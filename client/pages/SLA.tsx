import { Layout } from "@/components/layout/Layout";
import { useSLAData } from "@/hooks/useSLAData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";

// SLA Components
import { SLAKPISection } from "@/components/sla/SLAKPISection";
import { SLAPerformanceTrendsSection } from "@/components/sla/SLAPerformanceTrendsSection";
import { SupplierScorecardSection } from "@/components/sla/SupplierScorecardSection";
import { FinancialImpactSection } from "@/components/sla/FinancialImpactSection";
import { SLAOptimizationSection } from "@/components/sla/SLAOptimizationSection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";

/**
 * This part of the code creates the main SLA Performance page
 * Displays comprehensive SLA analytics with hero KPIs, trends, and supplier scorecards
 */
export default function SLA() {
  const { data, isLoading, error, refetch } = useSLAData();
  const { isPageAIEnabled } = useSettingsIntegration();

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading SLA performance data..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorDisplay
          message={
            error.message ||
            "Unable to load SLA performance data - Refresh to retry or check API connection"
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
          message="No SLA performance data available"
          onRetry={() => refetch()}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* This part of the code displays the hero SLA KPI cards */}
        <SLAKPISection kpis={data.kpis} isLoading={isLoading} />

        {/* This part of the code displays AI insights for SLA performance */}
        {isPageAIEnabled('sla') && (
          <InsightsSection
            insights={data.insights}
            isLoading={isLoading}
            title="SLA Intelligence"
            subtitle={`${data.insights?.length || 0} insights from SLA Performance Agent`}
            loadingMessage="SLA Performance Agent is analyzing delivery performance and identifying optimization opportunities..."
          />
        )}

        {/* This part of the code displays performance trends and patterns */}
        <SLAPerformanceTrendsSection 
          trends={data.performanceTrends} 
          isLoading={isLoading} 
        />

        {/* This part of the code displays supplier performance scorecard */}
        <SupplierScorecardSection 
          suppliers={data.supplierScorecard} 
          isLoading={isLoading} 
        />

        {/* This part of the code displays financial impact analysis */}
        <FinancialImpactSection 
          financialImpact={data.financialImpact} 
          isLoading={isLoading} 
        />

        {/* This part of the code displays optimization recommendations */}
        <SLAOptimizationSection 
          recommendations={data.optimizationRecommendations} 
          isLoading={isLoading} 
        />
      </div>
    </Layout>
  );
}
