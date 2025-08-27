import { useQuery } from "@tanstack/react-query";
import { internalApi } from "@/services/internalApi";
import { useSettingsIntegration } from "./useSettingsIntegration";

/**
 * This part of the code defines the SLA data hook
 * Follows the proven patterns from other data hooks (useOrdersData, useInventoryData)
 */

export interface SLAKPIs {
  overallSLACompliance: number | null;
  averageDeliveryPerformance: number | null; // days early/late
  atRiskShipments: number;
  costOfSLABreaches: number;
}

export interface SLAPerformanceTrends {
  dailyPerformance: Array<{
    date: string;
    slaCompliance: number;
    totalShipments: number;
    onTimeShipments: number;
  }>;
  weeklyPatterns: Array<{
    dayOfWeek: string;
    avgPerformance: number;
    shipmentCount: number;
  }>;
}

export interface SLASupplierScorecard {
  supplier: string;
  performanceScore: number; // 0-100
  slaCompliance: number;
  quantityAccuracy: number;
  totalShipments: number;
  totalValue: number;
  trend: 'improving' | 'declining' | 'stable';
  riskProfile: 'low' | 'medium' | 'high';
}

export interface SLAInsight {
  type: 'critical' | 'warning' | 'info';
  category: 'performance' | 'financial' | 'operational';
  message: string;
  data?: any;
}

export interface SLAFinancialImpact {
  totalSLABreachCost: number;
  averageBreachCost: number;
  opportunityCost: number;
  potentialSavings: number;
  monthlyTrend: Array<{
    month: string;
    breachCost: number;
    missedOpportunity: number;
  }>;
  supplierCostBreakdown: Array<{
    supplier: string;
    totalCost: number;
    avgCostPerBreach: number;
    breachCount: number;
  }>;
}

export interface SLAOptimizationRecommendation {
  type: 'supplier' | 'route' | 'inventory' | 'contract';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedImpact: string;
  actionRequired: string;
  timeline: string;
  difficulty: 'easy' | 'medium' | 'complex';
}

export interface SLAData {
  kpis: SLAKPIs;
  performanceTrends: SLAPerformanceTrends;
  supplierScorecard: SLASupplierScorecard[];
  financialImpact: SLAFinancialImpact;
  optimizationRecommendations: SLAOptimizationRecommendation[];
  insights: SLAInsight[];
}

/**
 * This part of the code provides the main SLA data hook
 * Uses TanStack Query for caching and real-time updates
 */
export function useSLAData() {
  const { getSLASettings } = useSettingsIntegration();
  
  return useQuery({
    queryKey: ['sla-data'],
    queryFn: () => internalApi.getSLAData(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes auto-refresh
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });
}

/**
 * FAST SLA data hook without AI insights for immediate page load
 * 🔒 SECURE: Uses internal API - NO external keys exposed
 */
export function useSLADataFast() {
  const { getSLASettings } = useSettingsIntegration();
  
  return useQuery({
    queryKey: ['sla-data-fast'],
    queryFn: () => internalApi.getSLADataFast(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes auto-refresh
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });
}

/**
 * SLA AI insights hook for progressive loading
 * 🔒 SECURE: Uses internal API for AI insights only
 */
export function useSLAInsights() {
  const { getSLASettings } = useSettingsIntegration();
  
  return useQuery({
    queryKey: ['sla-insights'],
    queryFn: () => internalApi.getSLAInsights(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes auto-refresh
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });
}

/**
 * This part of the code provides a hook for refreshing SLA data
 * Useful for manual refresh functionality
 */
export function useRefreshSLA() {
  const { refetch } = useSLAData();
  
  return {
    refreshSLA: () => refetch()
  };
}
