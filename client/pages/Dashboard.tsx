import React from "react";
import { Layout } from "@/components/layout/Layout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { LoadingState } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";

// BrandBuddy Overview Components
import { InsightsSection } from "@/components/dashboard/InsightsSection";


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
        {/* BrandBuddy Overview Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
            <p className="text-gray-500 mt-1">{getCurrentDate()}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => refetch()} 
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
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
            {/* BrandBuddy KPI Cards - Revenue at Risk, Inventory Stockouts, Orders Behind SLA, Operational Health Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Revenue at Risk */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-500">Revenue at Risk</h3>
                      <span className="ml-2 text-green-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {data.kpis?.atRiskOrders ? `$${(data.kpis.atRiskOrders * 150).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inventory Stockouts */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-500">Inventory Stockouts</h3>
                      <span className="ml-2 text-green-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {data.kpis?.unfulfillableSKUs !== undefined ? data.kpis.unfulfillableSKUs : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Orders Behind SLA */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-500">Orders Behind SLA</h3>
                      <span className="ml-2 text-green-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {data.kpis?.atRiskOrders !== null ? data.kpis?.atRiskOrders || '0' : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Operational Health Score */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-500">Operational Health Score</h3>
                      <span className="ml-2 text-green-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {data.kpis ? Math.round(((data.kpis.totalOrdersToday || 0) / Math.max((data.kpis.atRiskOrders || 0) + (data.kpis.totalOrdersToday || 1), 1)) * 100) + '%' : 'N/A'}
                    </p>
                  </div>
                </div>
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
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Check endpoints are connected for information</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
