import type { DashboardKPIs, DashboardKPIContext } from "@/types/api";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";
import { formatKPIValue } from "@/lib/formatters";

interface KPISectionProps {
  kpis: DashboardKPIs;
  kpiContext?: DashboardKPIContext; // This part of the code adds AI-powered KPI context for meaningful percentages
  isLoading?: boolean;
}

export function KPISection({ kpis, kpiContext, isLoading }: KPISectionProps) {
  
  // This part of the code uses AI-powered context for meaningful KPI descriptions and percentages
  // Falls back to simple descriptions when AI context is not available
  const kpiCards = [
    {
      title: "Total Orders Today",
      value: kpis.totalOrdersToday,
      description: kpiContext?.totalOrdersToday?.description || "New orders received today",
      context: kpiContext?.totalOrdersToday?.context,
      className: "bg-white",
      colorClass: "text-blue-600",
    },
    {
      title: "At-Risk Orders",
      value: kpis.atRiskOrders,
      description: kpiContext?.atRiskOrders?.description || "Orders with delays or issues",
      context: kpiContext?.atRiskOrders?.context,
      className: "bg-white",
      colorClass: (kpis.atRiskOrders || 0) > 0 ? "text-red-600" : "text-gray-600",
    },
    {
      title: "Open POs",
      value: kpis.openPOs,
      description: kpiContext?.openPOs?.description || "Active purchase orders",
      context: kpiContext?.openPOs?.context,
      className: "bg-white",
      colorClass: "text-green-600",
    },
    {
      title: "Unfulfillable SKUs",
      value: kpis.unfulfillableSKUs,
      description: kpiContext?.unfulfillableSKUs?.description || "SKUs with fulfillment issues",
      context: kpiContext?.unfulfillableSKUs?.context,
      className: "bg-white",
      colorClass: (kpis.unfulfillableSKUs || 0) > 0 ? "text-orange-600" : "text-gray-600",
    },
  ];

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
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              // This part of the code uses centralized KPI formatting for consistency
              formatKPIValue(kpi.value)
            )}
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
