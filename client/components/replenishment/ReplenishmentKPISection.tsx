import React from "react";
import { FormattedCurrency } from "../ui/formatted-value";
import type { ReplenishmentKPIs, ReplenishmentKPIContext } from "@/types/api";

interface ReplenishmentKPISectionProps {
  kpis: ReplenishmentKPIs;
  kpiContext?: ReplenishmentKPIContext; // This part of the code adds AI-powered KPI context for meaningful percentages
  isLoading?: boolean;
}

export function ReplenishmentKPISection({ kpis, kpiContext, isLoading }: ReplenishmentKPISectionProps) {
  // This part of the code formats values for display, handling null/undefined cases
  const formatValue = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === 'number' && isNaN(value)) return "—";
    return value.toString();
  };

  // This part of the code defines the replenishment KPI cards with AI-powered context for meaningful percentages and descriptions
  const kpiCards = [
    {
      title: "Critical SKUs",
      value: kpis.criticalSKUs,
      description: kpiContext?.criticalSKUs?.description || "Products with <10 units stock",
      context: kpiContext?.criticalSKUs?.context,
      colorClass: kpis.criticalSKUs > 0 ? "text-red-600" : "text-gray-600",
      format: formatValue,
    },
    {
      title: "Replenishment Value",
      value: kpis.replenishmentValue,
      description: kpiContext?.replenishmentValue?.description || "Total value needing reorder",
      context: kpiContext?.replenishmentValue?.context,
      colorClass: "text-green-600",
      format: (val: number) => <FormattedCurrency value={val} />,
    },
    {
      title: "Supplier Alerts",
      value: kpis.supplierAlerts,
      description: kpiContext?.supplierAlerts?.description || "Suppliers with delays/issues",
      context: kpiContext?.supplierAlerts?.context,
      colorClass: kpis.supplierAlerts > 0 ? "text-orange-600" : "text-gray-600",
      format: formatValue,
    },
    {
      title: "Reorder Recommendations",
      value: kpis.reorderRecommendations,
      description: kpiContext?.reorderRecommendations?.description || "AI-suggested purchase orders",
      context: kpiContext?.reorderRecommendations?.context,
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
          
          {/* This part of the code displays the KPI description with AI-powered context */}
          <div className="text-sm text-gray-500">
            {kpi.description}
          </div>
          
          {/* This part of the code displays additional AI context when available */}
          {kpi.context && !isLoading && (
            <div className="text-xs text-gray-400 mt-1 italic">
              {kpi.context}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}