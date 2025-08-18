import { useMemo } from "react";
import { DollarSign, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import type { OrderData } from "@/types/api";

interface OrderValueAnalysisSectionProps {
  orders: OrderData[];
  isLoading?: boolean;
}

export function OrderValueAnalysisSection({ orders, isLoading }: OrderValueAnalysisSectionProps) {
  // This part of the code calculates order value metrics from real data
  const valueMetrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalValue: 0,
        avgValue: 0,
        highValueAtRisk: 0,
        valueByStatus: {}
      };
    }

    // This part of the code calculates total order value
    const totalValue = orders.reduce((sum, order) => {
      const orderValue = (order.unit_cost || 0) * order.expected_quantity;
      return sum + orderValue;
    }, 0);

    // This part of the code calculates average order value
    const avgValue = totalValue / orders.length;

    // This part of the code identifies high-value at-risk orders (above $200 threshold)
    const highValueThreshold = 200;
    const atRiskOrders = orders.filter(order => 
      order.status.includes('delayed') || 
      order.sla_status.includes('at_risk') || 
      order.sla_status.includes('breach') ||
      order.status.includes('cancelled')
    );
    
    const highValueAtRisk = atRiskOrders
      .filter(order => (order.unit_cost || 0) * order.expected_quantity > highValueThreshold)
      .reduce((sum, order) => sum + ((order.unit_cost || 0) * order.expected_quantity), 0);

    // This part of the code calculates value breakdown by status
    const valueByStatus = orders.reduce((acc, order) => {
      const status = order.status;
      const value = (order.unit_cost || 0) * order.expected_quantity;
      acc[status] = (acc[status] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalValue,
      avgValue,
      highValueAtRisk,
      valueByStatus
    };
  }, [orders]);

  // This part of the code formats currency values for display
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${Math.round(value).toLocaleString()}`;
    }
  };

  // This part of the code gets the top 3 status categories by value
  const topStatusesByValue = useMemo(() => {
    const sortedStatuses = Object.entries(valueMetrics.valueByStatus)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    return sortedStatuses.map(([status, value]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      value: formatCurrency(value),
      rawValue: value
    }));
  }, [valueMetrics.valueByStatus]);

  // This part of the code defines the KPI cards with dynamic data
  const kpiCards = [
    {
      title: "Total Order Value",
      value: formatCurrency(valueMetrics.totalValue),
      description: "Sum of all active orders",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(valueMetrics.avgValue),
      description: "Average per order",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "High-Value at Risk",
      value: formatCurrency(valueMetrics.highValueAtRisk),
      description: "Orders &gt;$200 with issues",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Value by Status",
      value: topStatusesByValue[0]?.value || "$0",
      description: `${topStatusesByValue[0]?.status || 'N/A'} leads`,
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Order Value Analysis
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mr-3" />
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Order Value Analysis
      </h2>

      {/* This part of the code displays the value analysis KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${card.bgColor} mr-3`}>
                  <IconComponent className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    {card.title}
                  </div>
                  <div className={`text-lg font-bold ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-gray-500">
                    {card.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* This part of the code displays detailed value breakdown by status */}
      {topStatusesByValue.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Value Distribution by Status
          </h3>
          <div className="space-y-2">
            {topStatusesByValue.map((statusData, index) => {
              const percentage = valueMetrics.totalValue > 0 
                ? (statusData.rawValue / valueMetrics.totalValue) * 100 
                : 0;
              
              return (
                <div key={statusData.status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded mr-2 ${
                      index === 0 ? 'bg-red-500' : 
                      index === 1 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm text-gray-700">{statusData.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {statusData.value}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
