import type { DashboardKPIs, ShipmentData } from "@/types/api";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";
import { FormattedNumber } from "@/components/ui/formatted-value";
import { formatKPIValue } from "@/lib/formatters";

interface KPISectionProps {
  kpis: DashboardKPIs;
  shipments?: ShipmentData[]; // This part of the code adds shipments data for percentage calculations
  isLoading?: boolean;
}

export function KPISection({ kpis, shipments, isLoading }: KPISectionProps) {
  const { formatNumber } = useSettingsIntegration();
  
  // This part of the code calculates meaningful percentages for KPIs
  // Use the shipments data to calculate proper denominators that match backend logic
  const totalShipments = shipments?.length || 0;
  const totalUniqueOrders = totalShipments > 0 ? new Set(shipments?.map(s => s.purchase_order_number || s.shipment_id)).size : 0;
  
  // Calculate percentages using appropriate denominators with bounds checking
  const atRiskPercentage = totalShipments > 0 ? 
    Math.min(100, ((kpis.atRiskOrders || 0) / totalShipments * 100)).toFixed(1) : '0.0';
  const openPOsPercentage = totalUniqueOrders > 0 ? 
    Math.min(100, ((kpis.openPOs || 0) / totalUniqueOrders * 100)).toFixed(1) : '0.0';
  
  // Only show percentages when we have meaningful data and avoid nonsensical values
  const showAtRiskPercentage = totalShipments > 0 && (kpis.atRiskOrders || 0) <= totalShipments;
  const showOpenPOsPercentage = totalUniqueOrders > 0 && (kpis.openPOs || 0) <= totalUniqueOrders;
  const kpiCards = [
    {
      title: "Total Orders Today",
      value: kpis.totalOrdersToday,
      description: "New orders received today",
      className: "bg-white",
      colorClass: "text-blue-600",
    },
    {
      title: "At-Risk Orders",
      value: kpis.atRiskOrders,
      description: showAtRiskPercentage ? `Orders with delays or issues (${atRiskPercentage}%)` : "Orders with delays or issues",
      className: "bg-white",
      colorClass: (kpis.atRiskOrders || 0) > 0 ? "text-red-600" : "text-gray-600",
    },
    {
      title: "Open POs",
      value: kpis.openPOs,
      description: showOpenPOsPercentage ? `Active purchase orders (${openPOsPercentage}%)` : "Active purchase orders",
      className: "bg-white",
      colorClass: "text-green-600",
    },
    {
      title: "Unfulfillable SKUs",
      value: kpis.unfulfillableSKUs,
      description: "SKUs with fulfillment issues",
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
          
          {/* This part of the code displays the KPI description */}
          <div className="text-sm text-gray-500">
            {kpi.description}
          </div>
        </div>
      ))}
    </div>
  );
}
