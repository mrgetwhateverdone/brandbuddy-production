import { Layout } from "@/components/layout/Layout";
import { useSLADataFast, useSLAInsights } from "@/hooks/useSLAData";
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

// This part of the code provides world-class insight loading experience for SLA
const SLAInsightLoadingMessage = () => (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
    <div className="flex items-start">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600 mt-0.5 mr-3"></div>
      <div>
        <h4 className="text-sm font-medium text-orange-800">🤖 AI Analyzing SLA Performance</h4>
        <p className="text-sm text-orange-700 mt-1">
          Chief Logistics Officer AI is analyzing {" "}
          <span className="font-medium">delivery performance, supplier compliance, and SLA breach patterns</span>
          {" "} to provide strategic insights...
        </p>
        <div className="mt-2 text-xs text-orange-600">
          • Analyzing delivery performance trends<br/>
          • Calculating SLA compliance costs<br/>
          • Generating supplier optimization insights
        </div>
      </div>
    </div>
  </div>
);

/**
 * This part of the code creates the main SLA Performance page
 * Displays comprehensive SLA analytics with hero KPIs, trends, and supplier scorecards
 */
export default function SLA() {
  // This part of the code uses progressive loading for better performance
  // Load fast data first, then AI insights separately in background
  const { data, isLoading, error, refetch } = useSLADataFast();
  const { 
    data: insightsData, 
    isLoading: insightsLoading, 
    error: insightsError 
  } = useSLAInsights();
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
        <SLAKPISection kpis={data.kpis} kpiContext={data.kpiContext} isLoading={isLoading} />

        {/* This part of the code displays AI insights for SLA performance with Progressive Loading */}
        {isPageAIEnabled('sla') && (
          <>
            {insightsLoading && !insightsData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">SLA Intelligence</h2>
                  <span className="text-sm text-gray-500">(Loading...)</span>
                </div>
                <SLAInsightLoadingMessage />
              </div>
            ) : insightsError ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">SLA Intelligence</h2>
                  <span className="text-sm text-red-500">(Failed to load)</span>
                </div>
                <ErrorDisplay
                  message="Unable to load AI insights - Using SLA data without AI recommendations"
                  onRetry={() => window.location.reload()}
                />
              </div>
            ) : (
              <InsightsSection
                insights={insightsData?.insights || []}
                isLoading={false}
                title="SLA Intelligence"
                subtitle={`${insightsData?.insights?.length || 0} insights from SLA Performance Agent`}
              />
            )}
          </>
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
