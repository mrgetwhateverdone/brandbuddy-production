import React from "react";
import { FormattedCurrency } from "../ui/formatted-value";
import type { InboundKPIs, InboundKPIContext } from "@/types/api";

interface InboundKPISectionProps {
  kpis: InboundKPIs;
  kpiContext?: InboundKPIContext; // This part of the code adds AI-powered KPI context for meaningful percentages
  isLoading?: boolean;
}

export function InboundKPISection({ kpis, kpiContext, isLoading }: InboundKPISectionProps) {
  // This part of the code formats values for display, handling null/undefined cases
  const formatValue = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === 'number' && isNaN(value)) return "—";
    return value.toString();
  };

  // This part of the code formats percentage values for display
  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === 'number' && isNaN(value)) return "—";
    return `${value}%`;
  };

  // This part of the code formats lead time with days suffix
  const formatLeadTime = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === 'number' && isNaN(value)) return "—";
    return `${value} days`;
  };

  // This part of the code defines the inbound operations KPI cards with AI-powered context for meaningful percentages and descriptions
  const kpiCards = [
    {
      title: "Today's Arrivals",
      value: kpis.todayArrivals,
      description: kpiContext?.todayArrivals?.description || "Shipments arriving today",
      context: kpiContext?.todayArrivals?.context,
      colorClass: kpis.todayArrivals > 0 ? "text-blue-600" : "text-gray-600",
      format: formatValue,
    },
    {
      title: "This Week Expected",
      value: kpis.thisWeekExpected,
      description: kpiContext?.thisWeekExpected?.description || "Shipments expected this week",
      context: kpiContext?.thisWeekExpected?.context,
      colorClass: "text-green-600",
      format: formatValue,
    },
    {
      title: "Average Lead Time",
      value: kpis.averageLeadTime,
      description: kpiContext?.averageLeadTime?.description || "Shipping to arrival time",
      context: kpiContext?.averageLeadTime?.context,
      colorClass: kpis.averageLeadTime > 10 ? "text-orange-600" : "text-gray-600",
      format: formatLeadTime,
    },
    {
      title: "Delayed Shipments",
      value: kpis.delayedShipments,
      description: kpiContext?.delayedShipments?.description || "Shipments behind schedule",
      context: kpiContext?.delayedShipments?.context,
      colorClass: kpis.delayedShipments > 0 ? "text-red-600" : "text-gray-600",
      format: formatValue,
    },
    {
      title: "Receiving Accuracy",
      value: kpis.receivingAccuracy,
      description: kpiContext?.receivingAccuracy?.description || "Expected vs received match",
      context: kpiContext?.receivingAccuracy?.context,
      colorClass: kpis.receivingAccuracy >= 95 ? "text-green-600" : kpis.receivingAccuracy >= 85 ? "text-orange-600" : "text-red-600",
      format: formatPercentage,
    },
    {
      title: "On-Time Delivery",
      value: kpis.onTimeDeliveryRate,
      description: kpiContext?.onTimeDeliveryRate?.description || "Supplier delivery performance",
      context: kpiContext?.onTimeDeliveryRate?.context,
      colorClass: kpis.onTimeDeliveryRate >= 95 ? "text-green-600" : kpis.onTimeDeliveryRate >= 85 ? "text-orange-600" : "text-red-600",
      format: formatPercentage,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
      {kpiCards.map((kpi, index) => (
        <div
          key={index}
          className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm`}
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
