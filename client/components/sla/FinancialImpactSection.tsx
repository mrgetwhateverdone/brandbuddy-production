import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Target, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SLAFinancialImpact } from "@/hooks/useSLAData";

interface FinancialImpactSectionProps {
  financialImpact: SLAFinancialImpact;
  isLoading?: boolean;
}

/**
 * This part of the code displays comprehensive financial impact analysis
 * Shows breach costs, opportunity costs, trends, and supplier cost breakdown
 */
export function FinancialImpactSection({ financialImpact, isLoading }: FinancialImpactSectionProps) {
  // This part of the code formats currency values consistently
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${Math.round(value).toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Financial Impact Analysis
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // This part of the code calculates summary insights
  const totalFinancialImpact = financialImpact.totalSLABreachCost + financialImpact.opportunityCost;
  const roiPercentage = financialImpact.totalSLABreachCost > 0 
    ? Math.round((financialImpact.potentialSavings / financialImpact.totalSLABreachCost) * 100)
    : 0;

  // This part of the code gets the most recent month trend
  const latestMonth = financialImpact.monthlyTrend?.[financialImpact.monthlyTrend.length - 1];
  const previousMonth = financialImpact.monthlyTrend?.[financialImpact.monthlyTrend.length - 2];
  const monthlyTrend = latestMonth && previousMonth 
    ? latestMonth.breachCost - previousMonth.breachCost
    : 0;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Financial Impact Analysis
      </h2>

      {/* This part of the code displays summary financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-red-600">Total Breach Cost</div>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(financialImpact.totalSLABreachCost)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-orange-600">Opportunity Cost</div>
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(financialImpact.opportunityCost)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-green-600">Potential Savings</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(financialImpact.potentialSavings)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <PieChart className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-blue-600">ROI Potential</div>
              <div className="text-2xl font-bold text-blue-900">{roiPercentage}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This part of the code displays monthly cost trends */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Monthly Cost Trends
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  SLA breach costs and missed opportunities over time
                </p>
              </div>
              {monthlyTrend !== 0 && (
                <div className={`flex items-center ${monthlyTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {monthlyTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">
                    {formatCurrency(Math.abs(monthlyTrend))}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {financialImpact.monthlyTrend && financialImpact.monthlyTrend.length > 0 ? (
              <div className="space-y-3">
                {financialImpact.monthlyTrend.map((month, index) => {
                  const totalMonthCost = month.breachCost + month.missedOpportunity;
                  const isLatest = index === financialImpact.monthlyTrend.length - 1;
                  
                  return (
                    <div key={month.month} className={`flex items-center justify-between p-3 rounded-lg ${
                      isLatest ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 w-20">
                          {month.month}
                        </div>
                        {isLatest && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                            Current
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(totalMonthCost)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Breach: {formatCurrency(month.breachCost)} | Opportunity: {formatCurrency(month.missedOpportunity)}
                          </div>
                        </div>
                        
                        {/* Visual indicator bar */}
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              totalMonthCost > 50000 ? 'bg-red-500' :
                              totalMonthCost > 25000 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (totalMonthCost / 100000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* This part of the code displays supplier cost breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Supplier Cost Breakdown
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Top suppliers by SLA breach costs
            </p>
          </div>
          
          <div className="p-6">
            {financialImpact.supplierCostBreakdown && financialImpact.supplierCostBreakdown.length > 0 ? (
              <div className="space-y-3">
                {financialImpact.supplierCostBreakdown.slice(0, 8).map((supplier, index) => (
                  <div key={supplier.supplier} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 ${
                        index === 0 ? 'bg-red-500' : 
                        index === 1 ? 'bg-orange-500' : 
                        index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.supplier}
                        </div>
                        <div className="text-xs text-gray-500">
                          {supplier.breachCount} breaches
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(supplier.totalCost)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {formatCurrency(supplier.avgCostPerBreach)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No supplier cost data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* This part of the code displays key financial insights */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Target className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2">Financial Optimization Opportunity</h4>
            <p className="text-sm text-blue-800">
              By improving SLA compliance to 95%, you could save <strong>{formatCurrency(financialImpact.potentialSavings)}</strong> annually. 
              Current breach costs of <strong>{formatCurrency(financialImpact.totalSLABreachCost)}</strong> plus opportunity costs of{" "}
              <strong>{formatCurrency(financialImpact.opportunityCost)}</strong> represent{" "}
              <strong>{formatCurrency(totalFinancialImpact)}</strong> in total financial impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
