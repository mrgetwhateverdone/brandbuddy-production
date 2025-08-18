import { useMemo } from "react";
import { BarChart3, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import type { OrderData } from "@/types/api";

interface StatusIntelligenceSectionProps {
  orders: OrderData[];
  isLoading?: boolean;
}

export function StatusIntelligenceSection({ orders, isLoading }: StatusIntelligenceSectionProps) {
  // This part of the code calculates status-driven intelligence metrics from real data
  const statusMetrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        cancellationRate: 0,
        processingEfficiency: 0,
        ordersStuckInProcessing: 0,
        statusBreakdown: {},
        industryBenchmark: 15,
        healthScore: 0
      };
    }

    // This part of the code calculates cancellation rate
    const cancelledOrders = orders.filter(order => 
      order.status.includes('cancelled')
    ).length;
    const cancellationRate = (cancelledOrders / orders.length) * 100;

    // This part of the code calculates processing efficiency
    const processingOrders = orders.filter(order => 
      order.status.includes('processing')
    );
    
    // Find orders stuck in processing for >30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const ordersStuckInProcessing = processingOrders.filter(order => {
      const orderDate = new Date(order.created_date);
      return orderDate < thirtyDaysAgo;
    }).length;

    const processingEfficiency = processingOrders.length > 0 
      ? ((processingOrders.length - ordersStuckInProcessing) / processingOrders.length) * 100 
      : 100;

    // This part of the code calculates status breakdown
    const statusBreakdown = orders.reduce((acc, order) => {
      const status = order.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // This part of the code calculates overall health score
    const completedOrders = orders.filter(order => 
      order.status.includes('completed') || order.status.includes('received')
    ).length;
    const pendingOrders = orders.filter(order => 
      order.status.includes('pending')
    ).length;
    
    const healthScore = (
      (completedOrders / orders.length) * 40 + // 40% weight for completion
      ((100 - cancellationRate) / 100) * 30 + // 30% weight for low cancellation
      (processingEfficiency / 100) * 30 // 30% weight for processing efficiency
    );

    return {
      cancellationRate,
      processingEfficiency,
      ordersStuckInProcessing,
      statusBreakdown,
      industryBenchmark: 15, // Industry benchmark for cancellation rate
      healthScore
    };
  }, [orders]);

  // This part of the code gets status breakdown with percentages
  const statusBreakdownWithPercentages = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    return Object.entries(statusMetrics.statusBreakdown)
      .map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: (count / orders.length) * 100,
        color: getStatusColor(status)
      }))
      .sort((a, b) => b.count - a.count);
  }, [statusMetrics.statusBreakdown, orders]);

  // This part of the code determines status colors
  function getStatusColor(status: string) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('received')) return 'bg-green-500';
    if (statusLower.includes('processing')) return 'bg-blue-500';
    if (statusLower.includes('pending')) return 'bg-yellow-500';
    if (statusLower.includes('cancelled')) return 'bg-red-500';
    if (statusLower.includes('shipped')) return 'bg-purple-500';
    return 'bg-gray-500';
  }

  // This part of the code defines the status intelligence KPI cards
  const statusKPIs = [
    {
      title: "Cancellation Rate",
      value: `${statusMetrics.cancellationRate.toFixed(1)}%`,
      description: `${statusMetrics.cancellationRate > statusMetrics.industryBenchmark ? 'Above' : 'Below'} industry benchmark`,
      icon: XCircle,
      color: statusMetrics.cancellationRate > statusMetrics.industryBenchmark ? "text-red-600" : "text-green-600",
      bgColor: statusMetrics.cancellationRate > statusMetrics.industryBenchmark ? "bg-red-50" : "bg-green-50",
    },
    {
      title: "Processing Efficiency",
      value: `${statusMetrics.processingEfficiency.toFixed(0)}%`,
      description: `${statusMetrics.ordersStuckInProcessing} orders stuck >30 days`,
      icon: Clock,
      color: statusMetrics.processingEfficiency >= 80 ? "text-green-600" : statusMetrics.processingEfficiency >= 60 ? "text-yellow-600" : "text-red-600",
      bgColor: statusMetrics.processingEfficiency >= 80 ? "bg-green-50" : statusMetrics.processingEfficiency >= 60 ? "bg-yellow-50" : "bg-red-50",
    },
    {
      title: "Order Lifecycle Health",
      value: `${statusMetrics.healthScore.toFixed(0)}/100`,
      description: "Overall operational health",
      icon: CheckCircle,
      color: statusMetrics.healthScore >= 80 ? "text-green-600" : statusMetrics.healthScore >= 60 ? "text-yellow-600" : "text-red-600",
      bgColor: statusMetrics.healthScore >= 80 ? "bg-green-50" : statusMetrics.healthScore >= 60 ? "bg-yellow-50" : "bg-red-50",
    },
    {
      title: "Status Distribution",
      value: `${Object.keys(statusMetrics.statusBreakdown).length}`,
      description: "Different status categories",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Status-Driven Intelligence
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
        Status-Driven Intelligence
      </h2>

      {/* This part of the code displays the status intelligence KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statusKPIs.map((card, index) => {
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

      {/* This part of the code displays detailed status breakdown and recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Order Status Breakdown
          </h3>
          <div className="space-y-3">
            {statusBreakdownWithPercentages.map((statusData, index) => (
              <div key={statusData.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`w-3 h-3 rounded-full ${statusData.color}`} />
                  <span className="text-sm text-gray-700 truncate">
                    {statusData.status}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-0">
                    <div 
                      className={`h-2 rounded-full ${statusData.color}`}
                      style={{ width: `${statusData.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <span className="text-sm font-medium text-gray-900">
                    {statusData.count}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({statusData.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Panel */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Operational Recommendations
          </h3>
          <div className="space-y-4">
            {statusMetrics.cancellationRate > statusMetrics.industryBenchmark && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    High Cancellation Rate
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    {statusMetrics.cancellationRate.toFixed(1)}% vs {statusMetrics.industryBenchmark}% benchmark. 
                    Review order validation and supplier reliability.
                  </p>
                </div>
              </div>
            )}
            
            {statusMetrics.ordersStuckInProcessing > 0 && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Processing Bottleneck
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {statusMetrics.ordersStuckInProcessing} orders stuck in processing >30 days. 
                    Investigate workflow bottlenecks and resource allocation.
                  </p>
                </div>
              </div>
            )}
            
            {statusMetrics.healthScore >= 80 && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-800">
                    Excellent Performance
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    Order lifecycle health score of {statusMetrics.healthScore.toFixed(0)}/100. 
                    Maintain current operational standards.
                  </p>
                </div>
              </div>
            )}
            
            {statusMetrics.healthScore < 60 && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    Improvement Opportunity
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Health score of {statusMetrics.healthScore.toFixed(0)}/100 indicates room for improvement. 
                    Focus on completion rates and processing efficiency.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
