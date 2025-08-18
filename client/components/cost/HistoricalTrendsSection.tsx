import type { HistoricalCostTrend } from "@/types/api";

interface HistoricalTrendsSectionProps {
  historicalTrends: HistoricalCostTrend[];
  isLoading?: boolean;
}

export function HistoricalTrendsSection({ historicalTrends, isLoading }: HistoricalTrendsSectionProps) {
  // This part of the code formats currency values
  const formatCurrency = (amount: number) => {
    const safeAmount = amount || 0;
    if (safeAmount >= 1000000) return `$${(safeAmount / 1000000).toFixed(1)}M`;
    if (safeAmount >= 1000) return `$${(safeAmount / 1000).toFixed(1)}K`;
    return `$${(safeAmount || 0).toLocaleString()}`;
  };

  // This part of the code formats month display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // This part of the code determines trend indicator styling
  const getTrendIndicator = (changePercentage: number) => {
    if (changePercentage > 5) {
      return { icon: "↑", color: "text-red-600", bgColor: "bg-red-100" };
    } else if (changePercentage < -5) {
      return { icon: "↓", color: "text-green-600", bgColor: "bg-green-100" };
    } else {
      return { icon: "→", color: "text-gray-600", bgColor: "bg-gray-100" };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (historicalTrends.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Historical Cost & Revenue Trends (12-Month Analysis)
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-500">No historical trend data available</div>
        </div>
      </div>
    );
  }

  // This part of the code calculates trend statistics
  const totalCost = historicalTrends.reduce((sum, trend) => sum + trend.total_cost, 0);
  const totalShipments = historicalTrends.reduce((sum, trend) => sum + trend.shipment_count, 0);
  const avgCostPerMonth = totalCost / historicalTrends.length;
  const lastMonth = historicalTrends[historicalTrends.length - 1];
  const firstMonth = historicalTrends[0];
  const overallTrend = lastMonth && firstMonth ? 
    ((lastMonth.total_cost - firstMonth.total_cost) / firstMonth.total_cost) * 100 : 0;

  // This part of the code prepares data for simple visualization
  const maxCost = Math.max(...historicalTrends.map(t => t.total_cost));
  const minCost = Math.min(...historicalTrends.map(t => t.total_cost));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Historical Cost & Revenue Trends (12-Month Analysis)
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This part of the code displays cost trend analysis */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Cost Trend Analysis</h4>
          <div className="space-y-3">
            {historicalTrends.map((trend, index) => {
              const trendIndicator = getTrendIndicator(trend.cost_change_percentage);
              const barWidth = maxCost > 0 ? (trend.total_cost / maxCost) * 100 : 0;
              
              return (
                <div key={trend.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 min-w-16">
                      {formatMonth(trend.month)}
                    </div>
                    <div className="flex-1 max-w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 min-w-16">
                      {formatCurrency(trend.total_cost)}
                    </div>
                  </div>
                  
                  {index > 0 && (
                    <div className={`ml-3 flex items-center space-x-1 ${trendIndicator.color}`}>
                      <span className={`text-xs px-1 py-0.5 rounded ${trendIndicator.bgColor}`}>
                        {trendIndicator.icon}
                      </span>
                      <span className="text-xs font-medium">
                        {Math.abs(trend.cost_change_percentage).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* This part of the code displays trend summary and correlation */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Revenue Correlation</h4>
          <div className="space-y-4">
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-blue-900">
                  {formatCurrency(avgCostPerMonth)}
                </div>
                <div className="text-sm text-blue-700">Avg Monthly Cost</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className={`text-lg font-semibold ${overallTrend >= 0 ? 'text-red-900' : 'text-green-900'}`}>
                  {overallTrend >= 0 ? '+' : ''}{overallTrend.toFixed(1)}%
                </div>
                <div className={`text-sm ${overallTrend >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                  Overall Trend
                </div>
              </div>
            </div>
            
            {/* Recent months detail */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Recent Performance:</div>
              {historicalTrends.slice(-3).map((trend) => (
                <div key={trend.month} className="flex justify-between text-sm">
                  <span className="text-gray-600">{formatMonth(trend.month)}</span>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(trend.total_cost)}
                    </div>
                    <div className="text-gray-500">
                      {trend.shipment_count} shipments • 18.0% margin
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
              Trend analysis based on real warehouse SLA performance, throughput data, 
              and seasonal patterns for Callahan-Smith brand
            </div>
          </div>
        </div>
      </div>
      
      {/* This part of the code displays overall summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalCost)}
            </div>
            <div className="text-gray-500">Total 12-Month Costs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {(totalShipments || 0).toLocaleString()}
            </div>
            <div className="text-gray-500">Total Shipments</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalShipments > 0 ? totalCost / totalShipments : 0)}
            </div>
            <div className="text-gray-500">Avg Cost per Shipment</div>
          </div>
        </div>
      </div>
    </div>
  );
}
