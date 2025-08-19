import React from "react";
import { FormattedCurrency } from "../ui/formatted-value";

interface ReplenishmentKPIs {
  criticalSKUs: number;
  replenishmentValue: number;
  supplierAlerts: number;
  reorderRecommendations: number;
}

interface ReplenishmentKPISectionProps {
  kpis: ReplenishmentKPIs;
  isLoading?: boolean;
}

export function ReplenishmentKPISection({ kpis, isLoading }: ReplenishmentKPISectionProps) {
  // This part of the code formats values for display, handling null/undefined cases
  const formatValue = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === 'number' && isNaN(value)) return "—";
    return value.toString();
  };

  // This part of the code defines the replenishment KPI cards with clean styling matching inventory page
  const kpiCards = [
    {
      title: "Critical SKUs",
      value: kpis.criticalSKUs,
      description: "Products with <10 units stock",
      colorClass: kpis.criticalSKUs > 0 ? "text-red-600" : "text-gray-600",
      format: formatValue,
    },
    {
      title: "Replenishment Value",
      value: kpis.replenishmentValue,
      description: "Total value needing reorder",
      colorClass: "text-green-600",
      format: (val: number) => <FormattedCurrency value={val} />,
    },
    {
      title: "Supplier Alerts",
      value: kpis.supplierAlerts,
      description: "Suppliers with delays/issues",
      colorClass: kpis.supplierAlerts > 0 ? "text-orange-600" : "text-gray-600",
      format: formatValue,
    },
    {
      title: "Reorder Recommendations",
      value: kpis.reorderRecommendations,
      description: "AI-suggested purchase orders",
      colorClass: "text-blue-600",
      format: formatValue,
    },
  ];

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
          className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm`}
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