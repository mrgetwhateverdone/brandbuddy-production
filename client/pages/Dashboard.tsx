import React from "react";
import { Layout } from "@/components/layout/Layout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";

// BrandBuddy Overview Components
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { KPISection } from "@/components/dashboard/KPISection";


export default function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboardData();

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
            <KPISection kpis={data.kpis} isLoading={isLoading} />

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

            {/* AI Insights Section - Using real OpenAI insights from Callahan-Smith data */}
            <InsightsSection 
              insights={data.insights} 
              isLoading={isLoading}
              title="Insights"
              subtitle={`(${data.insights?.length || 0})`}
            />

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
                      {data.insights?.length > 0 
                        ? `${data.insights.length} insights identified for immediate attention. `
                        : "All operations running smoothly. No critical issues detected. "
                      }
                      {data.products?.length > 0 && `Managing ${data.products.length} products across operations.`}
                    </p>
                  </div>

                  {/* AI Executive Brief */}
                  {data.dailyBrief ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">
                        {data.dailyBrief}
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

                  {/* Top Priority Today */}
                  {data.insights && data.insights.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-1">🔴 Top Priority Today</h4>
                      <p className="text-sm text-red-700">
                        {data.insights[0]?.title || "Review operational insights"}
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
