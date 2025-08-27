import { Layout } from "@/components/layout/Layout";
import { useInboundDataFast, useInboundInsights } from "@/hooks/useInboundData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";

// Inbound Components
import { InboundKPISection } from "@/components/inbound/InboundKPISection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { TodayArrivalsSection } from "@/components/inbound/TodayArrivalsSection";
import { ReceivingPerformanceSection } from "@/components/inbound/ReceivingPerformanceSection";
import { SupplierDeliverySection } from "@/components/inbound/SupplierDeliverySection";

// This part of the code provides world-class insight loading experience for Inbound
const InboundInsightLoadingMessage = () => (
  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
    <div className="flex items-start">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mt-0.5 mr-3"></div>
      <div>
        <h4 className="text-sm font-medium text-indigo-800">🤖 AI Analyzing Inbound Operations</h4>
        <p className="text-sm text-indigo-700 mt-1">
          Chief Receiving Officer AI is analyzing {" "}
          <span className="font-medium">shipment arrivals, receiving efficiency, and supplier delivery patterns</span>
          {" "} to provide strategic insights...
        </p>
        <div className="mt-2 text-xs text-indigo-600">
          • Analyzing receiving workflow optimization<br/>
          • Calculating delivery performance metrics<br/>
          • Generating dock scheduling insights
        </div>
      </div>
    </div>
  </div>
);

export default function Inbound() {
  // This part of the code uses progressive loading for better performance
  // Load fast data first, then AI insights separately in background
  const { data, isLoading, error, refetch } = useInboundDataFast();
  const { 
    data: insightsData, 
    isLoading: insightsLoading, 
    error: insightsError 
  } = useInboundInsights();
  const { isPageAIEnabled } = useSettingsIntegration();

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading BrandBuddy inbound operations data..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorDisplay
          message={
            error.message ||
            "Unable to load inbound data - Refresh to retry or check API connection"
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
          message="No inbound data available"
          onRetry={() => refetch()}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* This part of the code displays the inbound operations KPI cards */}
        <InboundKPISection kpis={data.kpis} isLoading={isLoading} />

        {/* This part of the code displays AI insights for inbound operations management with Progressive Loading */}
        {isPageAIEnabled('inbound') && (
          <>
            {insightsLoading && !insightsData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-gray-500">(Loading...)</span>
                </div>
                <InboundInsightLoadingMessage />
              </div>
            ) : insightsError ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-red-500">(Failed to load)</span>
                </div>
                <ErrorDisplay
                  message="Unable to load AI insights - Using inbound data without AI recommendations"
                  onRetry={() => window.location.reload()}
                />
              </div>
            ) : (
              <InsightsSection
                insights={insightsData?.insights || []}
                isLoading={false}
                title="Insights"
                subtitle={`${insightsData?.insights?.length || 0} insights from Inbound Operations Agent`}
              />
            )}
          </>
        )}

        {/* This part of the code displays today's arriving shipments for receiving planning */}
        <TodayArrivalsSection
          shipments={data.shipments || []}
          isLoading={isLoading}
        />

        {/* This part of the code displays receiving performance and efficiency metrics */}
        <ReceivingPerformanceSection
          shipments={data.shipments || []}
          isLoading={isLoading}
        />

        {/* This part of the code displays supplier delivery performance scorecard */}
        <SupplierDeliverySection
          shipments={data.shipments || []}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
}
