import { useMemo } from "react";
import { Clock, Calendar, TrendingDown, AlertCircle } from "lucide-react";
import type { OrderData } from "@/types/api";

interface TimeAnalyticsSectionProps {
  orders: OrderData[];
  isLoading?: boolean;
}

export function TimeAnalyticsSection({ orders, isLoading }: TimeAnalyticsSectionProps) {
  // This part of the code calculates time-based analytics from real order data
  const timeMetrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        ordersOlderThan6Months: 0,
        ordersOlderThan6MonthsPercentage: 0,
        avgProcessingTime: 0,
        agingOrderRisk: 0,
        monthlyOrderCounts: {}
      };
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));

    // This part of the code calculates order age analysis
    const ordersOlderThan6Months = orders.filter(order => {
      const orderDate = new Date(order.created_date);
      return orderDate < sixMonthsAgo;
    });

    const ordersOlderThan6MonthsPercentage = orders.length > 0 
      ? (ordersOlderThan6Months.length / orders.length) * 100 
      : 0;

    // This part of the code calculates average processing time for completed orders
    const completedOrders = orders.filter(order => 
      order.status.includes('completed') || order.status.includes('received')
    );

    const avgProcessingTime = completedOrders.length > 0 
      ? completedOrders.reduce((sum, order) => {
          const orderDate = new Date(order.created_date);
          const arrivalDate = new Date(order.arrival_date);
          const diffDays = Math.max(0, (arrivalDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }, 0) / completedOrders.length
      : 0;

    // This part of the code calculates aging order risk value
    const agingOrders = orders.filter(order => {
      const orderDate = new Date(order.created_date);
      return orderDate < oneYearAgo && !order.status.includes('completed') && !order.status.includes('cancelled');
    });

    const agingOrderRisk = agingOrders.reduce((sum, order) => 
      sum + ((order.unit_cost || 0) * order.expected_quantity), 0
    );

    // This part of the code calculates monthly order volume trends
    const monthlyOrderCounts = orders.reduce((acc, order) => {
      const orderDate = new Date(order.created_date);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ordersOlderThan6Months: ordersOlderThan6Months.length,
      ordersOlderThan6MonthsPercentage,
      avgProcessingTime,
      agingOrderRisk,
      monthlyOrderCounts
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

  // This part of the code gets recent monthly trends (last 6 months)
  const recentMonthlyTrends = useMemo(() => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      months.push({
        key: monthKey,
        name: monthName,
        count: timeMetrics.monthlyOrderCounts[monthKey] || 0
      });
    }
    
    return months;
  }, [timeMetrics.monthlyOrderCounts]);

  // This part of the code defines the time analytics KPI cards
  const timeKPIs = [
    {
      title: "Order Age Analysis",
      value: `${timeMetrics.ordersOlderThan6MonthsPercentage.toFixed(0)}%`,
      description: `${timeMetrics.ordersOlderThan6Months} orders >6 months old`,
      icon: Calendar,
      color: timeMetrics.ordersOlderThan6MonthsPercentage > 30 ? "text-red-600" : "text-yellow-600",
      bgColor: timeMetrics.ordersOlderThan6MonthsPercentage > 30 ? "bg-red-50" : "bg-yellow-50",
    },
    {
      title: "Processing Time",
      value: `${timeMetrics.avgProcessingTime.toFixed(0)} days`,
      description: "Average order to delivery",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Aging Order Risk",
      value: formatCurrency(timeMetrics.agingOrderRisk),
      description: "Orders >1 year old value",
      icon: AlertCircle,
      color: timeMetrics.agingOrderRisk > 10000 ? "text-red-600" : "text-orange-600",
      bgColor: timeMetrics.agingOrderRisk > 10000 ? "bg-red-50" : "bg-orange-50",
    },
    {
      title: "Monthly Trend",
      value: recentMonthlyTrends.length > 1 
        ? `${recentMonthlyTrends[recentMonthlyTrends.length - 1].count - recentMonthlyTrends[recentMonthlyTrends.length - 2].count >= 0 ? '+' : ''}${recentMonthlyTrends[recentMonthlyTrends.length - 1].count - recentMonthlyTrends[recentMonthlyTrends.length - 2].count}`
        : "N/A",
      description: "vs previous month",
      icon: TrendingDown,
      color: recentMonthlyTrends.length > 1 && (recentMonthlyTrends[recentMonthlyTrends.length - 1].count - recentMonthlyTrends[recentMonthlyTrends.length - 2].count) >= 0 
        ? "text-green-600" : "text-red-600",
      bgColor: recentMonthlyTrends.length > 1 && (recentMonthlyTrends[recentMonthlyTrends.length - 1].count - recentMonthlyTrends[recentMonthlyTrends.length - 2].count) >= 0 
        ? "bg-green-50" : "bg-red-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Time-Based Analytics
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
        Time-Based Analytics
      </h2>

      {/* This part of the code displays the time analytics KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {timeKPIs.map((card, index) => {
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

      {/* This part of the code displays the monthly trends chart */}
      {recentMonthlyTrends.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Seasonal Patterns - Monthly Order Volume
          </h3>
          <div className="space-y-3">
            {recentMonthlyTrends.map((month, index) => {
              const maxCount = Math.max(...recentMonthlyTrends.map(m => m.count));
              const percentage = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
              
              return (
                <div key={month.key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-sm text-gray-600 w-16 flex-shrink-0">
                      {month.name}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === recentMonthlyTrends.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 ml-3">
                    {month.count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            • Red bar indicates current month • Higher bars show peak order periods
          </div>
        </div>
      )}
    </div>
  );
}
