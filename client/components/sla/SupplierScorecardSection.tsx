import { TrendingUp, TrendingDown, ArrowRight, Users, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SLASupplierScorecard } from "@/hooks/useSLAData";

interface SupplierScorecardSectionProps {
  suppliers: SLASupplierScorecard[];
  isLoading?: boolean;
}

/**
 * This part of the code displays the supplier performance scorecard
 * Shows rankings, performance scores, trends, and risk profiles
 */
export function SupplierScorecardSection({ suppliers, isLoading }: SupplierScorecardSectionProps) {
  // This part of the code formats currency values consistently
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${Math.round(value).toLocaleString()}`;
  };

  // This part of the code determines trend icon and color
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowRight className="h-4 w-4 text-gray-600" />;
    }
  };

  // This part of the code determines risk profile badge styling
  const getRiskProfileBadge = (riskProfile: string) => {
    switch (riskProfile) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High Risk</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Supplier Performance Scorecard
        </h2>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mr-3" />
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This part of the code calculates summary statistics
  const totalSuppliers = suppliers?.length || 0;
  const excellentPerformers = suppliers?.filter(s => s.performanceScore >= 90).length || 0;
  const atRiskSuppliers = suppliers?.filter(s => s.riskProfile === 'high').length || 0;
  const avgPerformanceScore = totalSuppliers > 0 
    ? Math.round(suppliers.reduce((sum, s) => sum + s.performanceScore, 0) / totalSuppliers)
    : 0;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Supplier Performance Scorecard
      </h2>

      {/* This part of the code displays summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-blue-600">Total Suppliers</div>
              <div className="text-2xl font-bold text-blue-900">{totalSuppliers}</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-green-600">Excellent (90%+)</div>
              <div className="text-2xl font-bold text-green-900">{excellentPerformers}</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-red-600">High Risk</div>
              <div className="text-2xl font-bold text-red-900">{atRiskSuppliers}</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-purple-600">Avg Score</div>
              <div className="text-2xl font-bold text-purple-900">{avgPerformanceScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* This part of the code displays the supplier rankings table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">
            Supplier Rankings & Performance
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Ranked by overall performance score (0-100)
          </p>
        </div>
        
        <div className="p-6">
          {suppliers && suppliers.length > 0 ? (
            <div className="space-y-3">
              {suppliers.slice(0, 10).map((supplier, index) => (
                <div key={supplier.supplier} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    {/* Ranking badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {supplier.supplier}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {supplier.totalShipments} shipments
                        </span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {formatCurrency(supplier.totalValue)} value
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Performance metrics */}
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {supplier.performanceScore}%
                      </div>
                      <div className="text-xs text-gray-500">
                        SLA: {supplier.slaCompliance}% | Qty: {supplier.quantityAccuracy}%
                      </div>
                    </div>
                    
                    {/* Trend indicator */}
                    <div className="flex items-center">
                      {getTrendIcon(supplier.trend)}
                    </div>
                    
                    {/* Risk profile badge */}
                    <div>
                      {getRiskProfileBadge(supplier.riskProfile)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No supplier data available</p>
            </div>
          )}

          {suppliers && suppliers.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing top 10 of {suppliers.length} suppliers
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
