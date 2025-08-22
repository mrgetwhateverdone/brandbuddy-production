import { Layout } from "@/components/layout/Layout";
import { useInboundData } from "@/hooks/useInboundData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";

// Inbound Components
import { InboundKPISection } from "@/components/inbound/InboundKPISection";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { TodayArrivalsSection } from "@/components/inbound/TodayArrivalsSection";
import { ReceivingPerformanceSection } from "@/components/inbound/ReceivingPerformanceSection";
import { SupplierDeliverySection } from "@/components/inbound/SupplierDeliverySection";

export default function Inbound() {
  const { data, isLoading, error, refetch } = useInboundData();
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

        {/* This part of the code displays AI insights for inbound operations management */}
        {isPageAIEnabled('inbound') && (
          <InsightsSection
            insights={data.insights}
            isLoading={isLoading}
            title="Insights"
            subtitle={`${data.insights.length} insights from Inbound Operations Agent`}
            loadingMessage="Inbound Operations Agent is analyzing shipment arrivals, receiving efficiency, and supplier delivery performance..."
          />
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
