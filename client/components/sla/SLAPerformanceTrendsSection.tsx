import { Calendar, TrendingUp, BarChart3 } from "lucide-react";
import type { SLAPerformanceTrends } from "@/hooks/useSLAData";

interface SLAPerformanceTrendsSectionProps {
  trends: SLAPerformanceTrends;
  isLoading?: boolean;
}

/**
 * This part of the code displays SLA performance trends and patterns
 * Shows daily performance over 30 days and weekly patterns by day of week
 */
export function SLAPerformanceTrendsSection({ trends, isLoading }: SLAPerformanceTrendsSectionProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Performance Trends & Patterns
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-8 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // This part of the code calculates summary statistics for recent performance
  const recentDays = trends?.dailyPerformance?.slice(-7) || [];
  const avgRecentPerformance = recentDays.length > 0 
    ? Math.round(recentDays.reduce((sum, day) => sum + day.slaCompliance, 0) / recentDays.length)
    : 0;

  // This part of the code finds the best and worst performing days of the week
  const sortedWeeklyPatterns = [...(trends?.weeklyPatterns || [])].sort((a, b) => b.avgPerformance - a.avgPerformance);
  const bestDay = sortedWeeklyPatterns[0];
  const worstDay = sortedWeeklyPatterns[sortedWeeklyPatterns.length - 1];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Performance Trends & Patterns
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This part of the code displays daily performance trends */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-gray-900">
                30-Day Performance Trend
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Daily SLA compliance over the last month
            </p>
          </div>
          
          <div className="p-6">
            {/* Summary metrics */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Recent 7-Day Average: {avgRecentPerformance}%
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {avgRecentPerformance >= 90 ? "Excellent performance" : 
                 avgRecentPerformance >= 80 ? "Good performance" : 
                 "Needs improvement"}
              </div>
            </div>

            {/* This part of the code displays a simple text-based chart for Phase 1 */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 mb-2">Last 10 Days:</div>
              {trends?.dailyPerformance?.slice(-10).map((day, index) => (
                <div key={day.date} className="flex items-center justify-between py-1">
                  <div className="text-xs text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          day.slaCompliance >= 95 ? 'bg-green-500' :
                          day.slaCompliance >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(day.slaCompliance, 5)}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-gray-900 w-8 text-right">
                      {day.slaCompliance}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* This part of the code displays weekly patterns by day of week */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-sm font-medium text-gray-900">
                Weekly Performance Patterns
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Performance by day of the week
            </p>
          </div>
          
          <div className="p-6">
            {/* Performance insights */}
            <div className="mb-4 space-y-2">
              {bestDay && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                    <div className="text-sm font-medium text-green-900">
                      Best: {bestDay.dayOfWeek} ({bestDay.avgPerformance}%)
                    </div>
                  </div>
                </div>
              )}
              
              {worstDay && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-red-600 mr-2 rotate-180" />
                    <div className="text-sm font-medium text-red-900">
                      Needs Focus: {worstDay.dayOfWeek} ({worstDay.avgPerformance}%)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Weekly breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 mb-2">Day of Week Breakdown:</div>
              {trends?.weeklyPatterns?.map((pattern) => (
                <div key={pattern.dayOfWeek} className="flex items-center justify-between py-1">
                  <div className="text-xs text-gray-600 w-16">
                    {pattern.dayOfWeek.slice(0, 3)}
                  </div>
                  <div className="flex items-center flex-1 ml-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          pattern.avgPerformance >= 95 ? 'bg-green-500' :
                          pattern.avgPerformance >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(pattern.avgPerformance, 5)}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-gray-900 w-8 text-right">
                      {pattern.avgPerformance}%
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      ({pattern.shipmentCount} shipments)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
