import React from "react";
import { AlertTriangle, DollarSign, Users, Target } from "lucide-react";
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
  // This part of the code defines the replenishment KPI cards with icons and styling
  const kpiCards = [
    {
      title: "Critical SKUs",
      value: kpis.criticalSKUs,
      description: "Products with <5 days stock",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      title: "Replenishment Value",
      value: <FormattedCurrency value={kpis.replenishmentValue} />,
      description: "Total value needing reorder",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Supplier Alerts",
      value: kpis.supplierAlerts,
      description: "Suppliers with delays/issues",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      title: "Reorder Recommendations",
      value: kpis.reorderRecommendations,
      description: "AI-suggested purchase orders",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        
        return (
          <div
            key={index}
            className={`bg-white rounded-lg shadow-sm border ${kpi.borderColor} p-6 hover:shadow-md transition-shadow duration-200`}
          >
            {/* This part of the code displays the KPI header with icon and title */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <Icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
            </div>

            {/* This part of the code displays the KPI value and description */}
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {kpi.value}
              </div>
              <div className="text-sm font-medium text-gray-700">
                {kpi.title}
              </div>
              <div className="text-xs text-gray-500">
                {kpi.description}
              </div>
            </div>

            {/* This part of the code adds a visual indicator for critical metrics */}
            {kpi.title === "Critical SKUs" && kpis.criticalSKUs > 0 && (
              <div className="mt-3 flex items-center text-xs text-red-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Immediate attention required
              </div>
            )}

            {kpi.title === "Supplier Alerts" && kpis.supplierAlerts > 0 && (
              <div className="mt-3 flex items-center text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Review supplier performance
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
