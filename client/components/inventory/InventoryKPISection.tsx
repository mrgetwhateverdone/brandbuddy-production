import type { InventoryKPIs } from "@/types/api";
import { formatCurrency, formatNumber } from "@/lib/formatters";

interface InventoryKPISectionProps {
  kpis: InventoryKPIs;
  isLoading?: boolean;
}

export function InventoryKPISection({ kpis, isLoading }: InventoryKPISectionProps) {
  // This part of the code defines enhanced KPI cards with business-critical metrics
  // This part of the code uses centralized formatting utilities

  const kpiCards = [
    {
      title: "Total Active SKUs",
      value: kpis.totalActiveSKUs,
      description: "Products available for sale",
      className: "bg-white",
      colorClass: "text-blue-600",
      format: (val: number | null) => formatNumber(val),
    },
    {
      title: "Total Inventory Value",
      value: kpis.totalInventoryValue,
      description: "Total portfolio investment",
      className: "bg-white",
      colorClass: "text-green-600",
      format: formatCurrency,
    },
    {
      title: "Low Stock Alerts",
      value: kpis.lowStockAlerts,
      description: "SKUs requiring replenishment",
      className: "bg-white",
      colorClass: kpis.lowStockAlerts > 0 ? "text-orange-600" : "text-gray-600",
      format: (val: number | null) => val?.toString() || "0",
    },
    {
      title: "Inactive SKUs",
      value: kpis.inactiveSKUs,
      description: "Products requiring review",
      className: "bg-white",
      colorClass: kpis.inactiveSKUs > 0 ? "text-red-600" : "text-gray-600",
      format: (val: number | null) => val?.toString() || "0",
    },
  ];

  // This part of the code handles the display logic for different states
  const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    if (value === 0) return "—";
    return value.toString();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="text-sm font-medium text-gray-500 mb-1">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="text-2xl font-semibold mb-1">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="text-sm text-gray-500">
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpiCards.map((kpi, index) => (
        <div
          key={index}
          className={`${kpi.className} p-4 rounded-lg border border-gray-200 shadow-sm`}
        >
          {/* This part of the code displays the KPI title */}
          <div className="text-sm font-medium text-gray-500 mb-1">
            {kpi.title}
          </div>
          
          {/* This part of the code displays the KPI value with appropriate coloring */}
          <div className={`text-2xl font-semibold mb-1 ${kpi.colorClass}`}>
            {kpi.format ? kpi.format(kpi.value) : formatValue(kpi.value)}
          </div>
          
          {/* This part of the code displays the KPI description */}
          <div className="text-sm text-gray-500">
            {kpi.description}
          </div>
        </div>
      ))}
    </div>
  );
}
