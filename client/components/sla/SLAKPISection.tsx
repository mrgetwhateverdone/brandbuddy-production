import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import type { SLAKPIs } from "@/hooks/useSLAData";

interface SLAKPISectionProps {
  kpis: SLAKPIs;
  isLoading?: boolean;
}

/**
 * This part of the code displays the hero SLA KPI cards
 * Shows overall compliance, delivery performance, at-risk shipments, and breach costs
 */
export function SLAKPISection({ kpis, isLoading }: SLAKPISectionProps) {
  // This part of the code formats currency values consistently
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${Math.round(value).toLocaleString()}`;
  };

  // This part of the code formats KPI values without unnecessary decimals
  const formatKPIValue = (value: number | null) => {
    if (value == null) return "—";
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  // This part of the code defines the SLA KPI cards with dynamic styling
  const kpiCards = [
    {
      title: "Overall SLA Compliance",
      value: kpis?.overallSLACompliance,
      unit: "%",
      target: 95,
      description: "On-time delivery performance",
      icon: TrendingUp,
      colorClass: (kpis?.overallSLACompliance || 0) >= 95 ? "text-green-600" : 
                  (kpis?.overallSLACompliance || 0) >= 85 ? "text-yellow-600" : "text-red-600",
      bgClass: (kpis?.overallSLACompliance || 0) >= 95 ? "bg-green-50" : 
               (kpis?.overallSLACompliance || 0) >= 85 ? "bg-yellow-50" : "bg-red-50"
    },
    {
      title: "Avg Delivery Performance",
      value: Math.abs(kpis?.averageDeliveryPerformance || 0),
      unit: (kpis?.averageDeliveryPerformance || 0) < 0 ? " days early" : " days late",
      description: "Average days early or late",
      icon: (kpis?.averageDeliveryPerformance || 0) < 0 ? TrendingUp : TrendingDown,
      colorClass: (kpis?.averageDeliveryPerformance || 0) < 0 ? "text-green-600" : "text-red-600",
      bgClass: (kpis?.averageDeliveryPerformance || 0) < 0 ? "bg-green-50" : "bg-red-50"
    },
    {
      title: "At-Risk Shipments",
      value: kpis?.atRiskShipments,
      description: "Currently trending late",
      icon: AlertTriangle,
      colorClass: (kpis?.atRiskShipments || 0) === 0 ? "text-green-600" : 
                  (kpis?.atRiskShipments || 0) <= 5 ? "text-yellow-600" : "text-red-600",
      bgClass: (kpis?.atRiskShipments || 0) === 0 ? "bg-green-50" : 
               (kpis?.atRiskShipments || 0) <= 5 ? "bg-yellow-50" : "bg-red-50"
    },
    {
      title: "Cost of SLA Breaches",
      value: kpis?.costOfSLABreaches,
      format: "currency",
      description: "Impact of late/incomplete shipments",
      icon: DollarSign,
      colorClass: "text-red-600",
      bgClass: "bg-red-50"
    }
  ];

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      {/* This part of the code displays the SLA KPI cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => {
          const IconComponent = card.icon;
          
          // This part of the code formats the display value
          const displayValue = card.format === 'currency' 
            ? formatCurrency(card.value || 0)
            : formatKPIValue(card.value);

          return (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${card.bgClass} mr-3`}>
                  <IconComponent className={`h-5 w-5 ${card.colorClass}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    {card.title}
                  </div>
                  <div className={`text-lg font-bold ${card.colorClass}`}>
                    {displayValue}{card.unit || ""}
                  </div>
                  <div className="text-xs text-gray-500">
                    {card.description}
                    {card.target && (
                      <span className="ml-1">
                        (Target: {card.target}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
