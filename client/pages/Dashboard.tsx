import React from "react";
import { Layout } from "@/components/layout/Layout";
import { useDashboardDataFast, useDashboardInsights } from "@/hooks/useDashboardData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useTour } from "@/contexts/TourContext";

// BrandBuddy Overview Components
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { KPISection } from "@/components/dashboard/KPISection";

// This part of the code provides world-class insight loading experience
const InsightLoadingMessage = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-start">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5 mr-3"></div>
      <div>
        <h4 className="text-sm font-medium text-blue-800">🤖 AI Analyzing Operations</h4>
        <p className="text-sm text-blue-700 mt-1">
          Senior Operations Director AI is analyzing {" "}
          <span className="font-medium">shipment patterns, inventory levels, and supplier performance</span>
          {" "} to provide strategic insights...
        </p>
        <div className="mt-2 text-xs text-blue-600">
          • Detecting operational bottlenecks<br/>
          • Calculating financial impact estimates<br/>
          • Generating actionable recommendations
        </div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  // This part of the code uses progressive loading for better performance
  // Load fast data first, then AI insights separately in background
  const { data, isLoading, error, refetch } = useDashboardDataFast();
  const { 
    data: insightsData, 
    isLoading: insightsLoading, 
    error: insightsError 
  } = useDashboardInsights();
  
  // This part of the code provides tour functionality for the overview page
  const { startOverviewTour } = useTour();

  // This part of the code formats the current date for the overview header
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tour Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Operations Overview</h1>
          <button
            onClick={startOverviewTour}
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors"
          >
            📍 Take Overview Tour
          </button>
        </div>


        {isLoading && (
          <LoadingState message="Loading BrandBuddy overview data..." />
        )}

        {error && (
          <ErrorDisplay
            message={
              error.message ||
              "Unable to load data - Refresh to retry or check API connection"
            }
            onRetry={() => refetch()}
          />
        )}

        {data && (
          <>
            {/* BrandBuddy KPI Cards - Now using consistent KPISection component */}
            <div className="tour-section-wrapper kpi-tour-target" data-tour="kpi-section">
              <div className="tour-content-boundary">
                <KPISection kpis={data.kpis} isLoading={isLoading} />
              </div>
            </div>

            {/* Insight Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                🔴 Critical
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                💰 Revenue Risk
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⚠️ Supplier Issue
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🔵 Needs Approval
              </span>
            </div>

            {/* AI Insights Section - Progressive loading with fast data + separate AI insights */}
            <div className="tour-section-wrapper insights-tour-target" data-tour="insights-section">
              <div className="tour-content-boundary">
            {insightsLoading && !insightsData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
                  <span className="text-sm text-gray-500">(Loading...)</span>
                </div>
                <InsightLoadingMessage />
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
                subtitle={`(${insightsData?.insights?.length || 0})`}
              />
            )}
              </div>
            </div>

            {/* Daily Brief Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Daily Brief</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Brand Operations Summary */}
                  <div className="border-l-4 border-red-600 pl-4">
                    <h3 className="font-medium text-gray-900">Callahan-Smith Operations Summary</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {insightsData?.insights?.length > 0 
                        ? `${insightsData.insights.length} insights identified for immediate attention. `
                        : insightsLoading 
                          ? "Analyzing operations for insights... "
                          : "All operations running smoothly. No critical issues detected. "
                      }
                      {data.products?.length > 0 && `Managing ${data.products.length} products across operations.`}
                    </p>
                  </div>

                  {/* AI Executive Brief - Progressive loading */}
                  {insightsLoading ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5 mr-3"></div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800">Generating Executive Brief</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            AI is analyzing operational data to provide strategic briefing...
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : insightsData?.dailyBrief ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">
                        {insightsData.dailyBrief}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">AI Assistant Connection Required</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Check OpenAI API connection to receive executive briefing analysis.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-red-600">
                        {data.kpis?.atRiskOrders || 0}
                      </div>
                      <div className="text-xs text-gray-500">Orders Behind SLA</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-red-600">
                        {data.kpis?.unfulfillableSKUs || 0}
                      </div>
                      <div className="text-xs text-gray-500">Inventory Stockouts</div>
                    </div>
                  </div>

                  {/* Top Priority Today - Progressive loading */}
                  {insightsData?.insights && insightsData.insights.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-1">🔴 Top Priority Today</h4>
                      <p className="text-sm text-red-700">
                        {insightsData.insights[0]?.title || "Review operational insights"}
                      </p>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Last Updated:</span> {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}