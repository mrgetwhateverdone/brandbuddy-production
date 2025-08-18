import { useMemo } from "react";
import { Building2, TrendingUp, AlertTriangle, Users, Target, ShieldAlert } from "lucide-react";
import type { OrderData } from "@/types/api";

interface SupplierPerformanceSectionProps {
  orders: OrderData[];
  isLoading?: boolean;
}

interface SupplierMetrics {
  name: string;
  totalOrders: number;
  totalValue: number;
  onTimeDeliveries: number;
  delayedOrders: number;
  cancelledOrders: number;
  onTimePercentage: number;
  avgOrderValue: number;
}

export function SupplierPerformanceSection({ orders, isLoading }: SupplierPerformanceSectionProps) {
  // This part of the code calculates supplier performance metrics from real data
  const supplierMetrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        suppliers: [],
        totalSuppliers: 0,
        topPerformer: null,
        concentrationRisk: 0
      };
    }

    // This part of the code groups orders by supplier and calculates metrics
    const supplierGroups = orders.reduce((acc, order) => {
      const supplier = order.supplier || 'Unknown Supplier';
      if (!acc[supplier]) {
        acc[supplier] = [];
      }
      acc[supplier].push(order);
      return acc;
    }, {} as Record<string, OrderData[]>);

    // This part of the code calculates performance metrics for each supplier
    const suppliers: SupplierMetrics[] = Object.entries(supplierGroups).map(([name, supplierOrders]) => {
      const totalOrders = supplierOrders.length;
      const totalValue = supplierOrders.reduce((sum, order) => 
        sum + ((order.unit_cost || 0) * order.expected_quantity), 0
      );
      
      const onTimeDeliveries = supplierOrders.filter(order => 
        order.sla_status.includes('on_time') || order.status.includes('completed')
      ).length;
      
      const delayedOrders = supplierOrders.filter(order => 
        order.status.includes('delayed') || order.sla_status.includes('at_risk') || order.sla_status.includes('breach')
      ).length;
      
      const cancelledOrders = supplierOrders.filter(order => 
        order.status.includes('cancelled')
      ).length;
      
      const onTimePercentage = totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0;
      const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

      return {
        name,
        totalOrders,
        totalValue,
        onTimeDeliveries,
        delayedOrders,
        cancelledOrders,
        onTimePercentage,
        avgOrderValue
      };
    }).sort((a, b) => b.totalValue - a.totalValue); // Sort by total value

    // This part of the code identifies the top performer
    const topPerformer = suppliers.length > 0 ? suppliers.reduce((best, current) => 
      current.onTimePercentage > best.onTimePercentage ? current : best
    ) : null;

    // This part of the code calculates supplier concentration risk
    const topSupplierVolume = suppliers[0]?.totalOrders || 0;
    const concentrationRisk = orders.length > 0 ? (topSupplierVolume / orders.length) * 100 : 0;

    return {
      suppliers,
      totalSuppliers: suppliers.length,
      topPerformer,
      concentrationRisk
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

  // This part of the code defines the supplier overview KPI cards
  const supplierKPIs = [
    {
      title: "Active Suppliers",
      value: supplierMetrics.totalSuppliers.toString(),
      description: "Total supplier count",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Top Performer",
      value: supplierMetrics.topPerformer ? `${supplierMetrics.topPerformer.onTimePercentage.toFixed(0)}%` : "N/A",
      description: supplierMetrics.topPerformer?.name.slice(0, 20) + (supplierMetrics.topPerformer?.name.length > 20 ? "..." : "") || "No data",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Concentration Risk",
      value: `${supplierMetrics.concentrationRisk.toFixed(0)}%`,
      description: "Single supplier dependency",
      icon: ShieldAlert,
      color: supplierMetrics.concentrationRisk > 50 ? "text-red-600" : "text-yellow-600",
      bgColor: supplierMetrics.concentrationRisk > 50 ? "bg-red-50" : "bg-yellow-50",
    },
    {
      title: "Avg Supplier Value",
      value: supplierMetrics.suppliers.length > 0 
        ? formatCurrency(supplierMetrics.suppliers.reduce((sum, s) => sum + s.totalValue, 0) / supplierMetrics.suppliers.length)
        : "$0",
      description: "Average value per supplier",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Supplier Performance Dashboard
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
        Supplier Performance Dashboard
      </h2>

      {/* This part of the code displays the supplier performance KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {supplierKPIs.map((card, index) => {
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

      {/* This part of the code displays detailed supplier performance rankings */}
      {supplierMetrics.suppliers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Top Performing Suppliers
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Ranked by on-time delivery performance and order volume
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    On-Time %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Order Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplierMetrics.suppliers.slice(0, 10).map((supplier, index) => (
                  <tr key={supplier.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 ${
                          index === 0 ? 'bg-green-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          index === 2 ? 'bg-purple-500' : 'bg-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {((supplier.totalOrders / orders.length) * 100).toFixed(1)}% of total orders
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`text-sm font-medium ${
                          supplier.onTimePercentage >= 90 ? 'text-green-600' :
                          supplier.onTimePercentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {supplier.onTimePercentage.toFixed(1)}%
                        </div>
                        <div className={`w-2 h-2 rounded-full ml-2 ${
                          supplier.onTimePercentage >= 90 ? 'bg-green-500' :
                          supplier.onTimePercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(supplier.totalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(supplier.avgOrderValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {supplier.delayedOrders > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {supplier.delayedOrders} delayed
                          </span>
                        )}
                        {supplier.cancelledOrders > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {supplier.cancelledOrders} cancelled
                          </span>
                        )}
                        {supplier.delayedOrders === 0 && supplier.cancelledOrders === 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            No issues
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
