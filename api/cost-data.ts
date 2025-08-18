import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { CostKPIs, CostCenter, CostData, AIInsight, SupplierPerformance, HistoricalCostTrend } from "../client/types/api";

/**
 * This part of the code provides cost management data endpoint for Vercel serverless deployment
 * Uses existing shipments data to calculate warehouse costs and performance metrics
 */

// TinyBird Shipments API Response - reuse existing interface
interface ShipmentData {
  company_url: string;
  shipment_id: string;
  brand_id: string | null;
  brand_name: string;
  brand_domain: string | null;
  created_date: string;
  purchase_order_number: string | null;
  status: string;
  supplier: string | null;
  expected_arrival_date: string | null;
  warehouse_id: string | null;
  ship_from_city: string | null;
  ship_from_state: string | null;
  ship_from_postal_code: string | null;
  ship_from_country: string | null;
  external_system_url: string | null;
  inventory_item_id: string;
  sku: string | null;
  expected_quantity: number;
  received_quantity: number;
  unit_cost: number | null;
  external_id: string | null;
  receipt_id: string;
  arrival_date: string;
  receipt_inventory_item_id: string;
  receipt_quantity: number;
  tracking_number: string[];
  notes: string;
}

/**
 * This part of the code fetches shipment data from TinyBird API
 */
async function fetchShipments(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    console.error("❌ Vercel API: WAREHOUSE_BASE_URL and WAREHOUSE_TOKEN environment variables are required");
    return [];
  }

  try {
    console.log("🔒 Phase 1: Fetching cost management data from TinyBird...");
    
    // This part of the code uses the exact same URL pattern as working dashboard API
    const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
    console.log("🔒 Cost API: Fetching from:", url.replace(token, 'TOKEN_HIDDEN'));

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Cost API: TinyBird request failed with status ${response.status}`);
      return [];
    }

    const result = await response.json();
    console.log(`✅ Cost API: Received ${result.data?.length || 0} shipment records`);
    
    return result.data || [];
  } catch (error) {
    console.error("❌ Cost API: Error fetching shipments:", error);
    return [];
  }
}

/**
 * This part of the code calculates enhanced cost KPIs from real shipment data
 */
function calculateCostKPIs(shipments: ShipmentData[]): CostKPIs {
  if (shipments.length === 0) {
    return {
      // Enhanced metrics
      totalMonthlyCosts: 0,
      costEfficiencyRate: 0,
      topPerformingWarehouses: 0,
      totalCostCenters: 0,
      // Legacy metrics
      totalWarehouses: 0,
      avgSLAPerformance: 0,
      monthlyThroughput: 0,
      activeCostCenters: 0,
    };
  }

  // This part of the code calculates total monthly costs from real shipment data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyShipments = shipments.filter(s => {
    const arrivalDate = new Date(s.arrival_date);
    return arrivalDate.getMonth() === currentMonth && arrivalDate.getFullYear() === currentYear;
  });
  
  const totalMonthlyCosts = Math.round(monthlyShipments.reduce((sum, s) => {
    const cost = (s.unit_cost || 0) * s.received_quantity;
    return sum + cost;
  }, 0));

  // This part of the code calculates cost efficiency rate (expected vs received)
  const efficiencyRates = shipments
    .filter(s => s.expected_quantity > 0 && s.received_quantity > 0)
    .map(s => (s.received_quantity / s.expected_quantity) * 100);
  const costEfficiencyRate = efficiencyRates.length > 0 
    ? Math.round(efficiencyRates.reduce((sum, rate) => sum + rate, 0) / efficiencyRates.length)
    : 0;

  // This part of the code counts unique warehouses
  const uniqueWarehouses = new Set(
    shipments
      .filter(s => s.warehouse_id)
      .map(s => s.warehouse_id)
  ).size;

  // This part of the code counts top performing warehouses (>90% SLA)
  const warehousePerformance = new Map<string, { onTime: number, total: number }>();
  shipments.forEach(s => {
    if (!s.warehouse_id) return;
    if (!warehousePerformance.has(s.warehouse_id)) {
      warehousePerformance.set(s.warehouse_id, { onTime: 0, total: 0 });
    }
    const performance = warehousePerformance.get(s.warehouse_id)!;
    performance.total++;
    if (s.expected_quantity === s.received_quantity && s.status !== "cancelled") {
      performance.onTime++;
    }
  });
  
  const topPerformingWarehouses = Array.from(warehousePerformance.values())
    .filter(p => p.total > 0 && (p.onTime / p.total) >= 0.9)
    .length;

  // This part of the code calculates SLA performance (legacy metric)
  const onTimeShipments = shipments.filter(s => 
    s.expected_quantity === s.received_quantity && 
    s.status !== "cancelled"
  ).length;
  const avgSLA = shipments.length > 0 ? Math.round((onTimeShipments / shipments.length) * 100) : 0;

  // This part of the code calculates monthly throughput
  const totalThroughput = monthlyShipments.reduce((sum, s) => sum + (s.received_quantity || 0), 0);

  // This part of the code counts active cost centers (warehouses with recent activity)
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 30); // Last 30 days
  
  const activeCenters = new Set(
    shipments
      .filter(s => s.warehouse_id && new Date(s.arrival_date) > recentDate)
      .map(s => s.warehouse_id)
  ).size;

  return {
    // Enhanced Real Cost Metrics
    totalMonthlyCosts,
    costEfficiencyRate,
    topPerformingWarehouses,
    totalCostCenters: uniqueWarehouses,
    // Legacy metrics for compatibility
    totalWarehouses: uniqueWarehouses,
    avgSLAPerformance: avgSLA,
    monthlyThroughput: totalThroughput,
    activeCostCenters: activeCenters,
  };
}

/**
 * This part of the code transforms shipments into enhanced cost center data by warehouse
 */
function calculateCostCenters(shipments: ShipmentData[]): CostCenter[] {
  if (shipments.length === 0) {
    return [];
  }

  // This part of the code groups shipments by warehouse with cost calculations
  const warehouseMap = new Map<string, {
    shipments: ShipmentData[];
    totalQuantity: number;
    onTimeCount: number;
    totalCosts: number;
  }>();

  shipments.forEach(shipment => {
    if (!shipment.warehouse_id) return;

    const warehouseId = shipment.warehouse_id;
    if (!warehouseMap.has(warehouseId)) {
      warehouseMap.set(warehouseId, {
        shipments: [],
        totalQuantity: 0,
        onTimeCount: 0,
        totalCosts: 0,
      });
    }

    const warehouse = warehouseMap.get(warehouseId)!;
    warehouse.shipments.push(shipment);
    warehouse.totalQuantity += shipment.received_quantity || 0;
    
    // This part of the code calculates real costs from shipment data
    const shipmentCost = (shipment.unit_cost || 0) * shipment.received_quantity;
    warehouse.totalCosts += shipmentCost;
    
    // This part of the code counts on-time shipments
    if (shipment.expected_quantity === shipment.received_quantity && shipment.status !== "cancelled") {
      warehouse.onTimeCount++;
    }
  });

  // This part of the code converts warehouse data to enhanced cost centers
  return Array.from(warehouseMap.entries())
    .map(([warehouseId, data]) => {
      const slaPerformance = data.shipments.length > 0 
        ? Math.round((data.onTimeCount / data.shipments.length) * 100) 
        : 0;

      // This part of the code determines warehouse status based on recent activity
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      const hasRecentActivity = data.shipments.some(s => 
        new Date(s.arrival_date) > recentDate
      );

      // This part of the code calculates enhanced cost metrics
      const monthlyCosts = Math.round(data.totalCosts);
      const costPerShipment = data.shipments.length > 0 
        ? Math.round(monthlyCosts / data.shipments.length) 
        : 0;
      
      // This part of the code calculates cost efficiency (expected vs received ratio)
      const efficiencyRates = data.shipments
        .filter(s => s.expected_quantity > 0)
        .map(s => (s.received_quantity / s.expected_quantity) * 100);
      const costEfficiency = efficiencyRates.length > 0
        ? Math.round(efficiencyRates.reduce((sum, rate) => sum + rate, 0) / efficiencyRates.length)
        : 0;

      // This part of the code calculates utilization rate (recent activity vs total)
      const recentShipments = data.shipments.filter(s => new Date(s.arrival_date) > recentDate).length;
      const utilizationRate = data.shipments.length > 0
        ? Math.round((recentShipments / data.shipments.length) * 100)
        : 0;

      // This part of the code calculates cost breakdown using industry standards
      const costBreakdown = {
        receiving: Math.round(monthlyCosts * 0.40), // 40% for receiving operations
        storage: Math.round(monthlyCosts * 0.30),   // 30% for storage costs
        processing: Math.round(monthlyCosts * 0.20), // 20% for processing
        overhead: Math.round(monthlyCosts * 0.10),   // 10% for overhead
      };

      return {
        warehouse_id: warehouseId,
        warehouse_name: `Warehouse ${warehouseId.slice(-4)}`, // Simple name from ID
        monthly_throughput: data.totalQuantity,
        sla_performance: slaPerformance,
        status: hasRecentActivity ? 'Active' as const : 'Inactive' as const,
        total_shipments: data.shipments.length,
        on_time_shipments: data.onTimeCount,
        // Enhanced cost metrics
        monthly_costs: monthlyCosts,
        cost_per_shipment: costPerShipment,
        cost_efficiency: costEfficiency,
        utilization_rate: utilizationRate,
        cost_breakdown: costBreakdown,
      };
    })
    .sort((a, b) => b.monthly_costs - a.monthly_costs); // Sort by total costs
}

/**
 * This part of the code calculates supplier performance metrics from real shipment data
 */
function calculateSupplierPerformance(shipments: ShipmentData[]): SupplierPerformance[] {
  if (shipments.length === 0) {
    return [];
  }

  // This part of the code groups shipments by supplier with cost calculations
  const supplierMap = new Map<string, {
    shipments: ShipmentData[];
    totalCost: number;
    onTimeCount: number;
  }>();

  shipments.forEach(shipment => {
    const supplier = shipment.supplier || 'Unknown Supplier';
    
    if (!supplierMap.has(supplier)) {
      supplierMap.set(supplier, {
        shipments: [],
        totalCost: 0,
        onTimeCount: 0,
      });
    }

    const supplierData = supplierMap.get(supplier)!;
    supplierData.shipments.push(shipment);
    
    // This part of the code calculates real costs from shipment data
    const shipmentCost = (shipment.unit_cost || 0) * shipment.received_quantity;
    supplierData.totalCost += shipmentCost;
    
    // This part of the code counts on-time shipments
    if (shipment.expected_quantity === shipment.received_quantity && shipment.status !== "cancelled") {
      supplierData.onTimeCount++;
    }
  });

  // This part of the code calculates average cost for variance analysis
  const allSupplierData = Array.from(supplierMap.values());
  const totalCosts = allSupplierData.reduce((sum, data) => sum + data.totalCost, 0);
  const totalShipments = allSupplierData.reduce((sum, data) => sum + data.shipments.length, 0);
  const avgCostPerShipment = totalShipments > 0 ? totalCosts / totalShipments : 0;

  // This part of the code converts supplier data to performance metrics
  return Array.from(supplierMap.entries())
    .map(([supplierName, data]) => {
      const avgCostPerUnit = data.shipments.length > 0
        ? data.totalCost / data.shipments.reduce((sum, s) => sum + s.received_quantity, 0)
        : 0;
      
      const slaPerformance = data.shipments.length > 0 
        ? Math.round((data.onTimeCount / data.shipments.length) * 100) 
        : 0;

      const supplierAvgCostPerShipment = data.shipments.length > 0 
        ? data.totalCost / data.shipments.length 
        : 0;
      
      const costVariance = avgCostPerShipment > 0 
        ? Math.round(((supplierAvgCostPerShipment - avgCostPerShipment) / avgCostPerShipment) * 100)
        : 0;

      // This part of the code calculates efficiency score based on SLA and cost variance
      const efficiencyScore = Math.round((slaPerformance * 0.7) + ((100 - Math.abs(costVariance)) * 0.3));

      // This part of the code determines supplier status
      let status: 'Efficient' | 'Needs Attention' | 'High Cost';
      if (efficiencyScore >= 80 && costVariance <= 10) {
        status = 'Efficient';
      } else if (efficiencyScore < 60 || costVariance > 25) {
        status = 'High Cost';
      } else {
        status = 'Needs Attention';
      }

      return {
        supplier_name: supplierName,
        total_cost: Math.round(data.totalCost),
        avg_cost_per_unit: Math.round(avgCostPerUnit * 100) / 100,
        sla_performance: slaPerformance,
        shipment_count: data.shipments.length,
        cost_variance: costVariance,
        efficiency_score: efficiencyScore,
        status,
      };
    })
    .sort((a, b) => b.total_cost - a.total_cost); // Sort by total cost
}

/**
 * This part of the code calculates historical cost trends from real shipment data
 */
function calculateHistoricalTrends(shipments: ShipmentData[]): HistoricalCostTrend[] {
  if (shipments.length === 0) {
    return [];
  }

  // This part of the code groups shipments by month
  const monthlyData = new Map<string, {
    totalCost: number;
    shipmentCount: number;
  }>();

  shipments.forEach(shipment => {
    const arrivalDate = new Date(shipment.arrival_date);
    const monthKey = `${arrivalDate.getFullYear()}-${(arrivalDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        totalCost: 0,
        shipmentCount: 0,
      });
    }

    const monthData = monthlyData.get(monthKey)!;
    const shipmentCost = (shipment.unit_cost || 0) * shipment.received_quantity;
    monthData.totalCost += shipmentCost;
    monthData.shipmentCount++;
  });

  // This part of the code converts to trend data with month-over-month calculations
  const sortedEntries = Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b));

  return sortedEntries.map(([month, data], index) => {
    const avgCostPerShipment = data.shipmentCount > 0 
      ? Math.round(data.totalCost / data.shipmentCount) 
      : 0;

    // This part of the code calculates month-over-month percentage change
    let costChangePercentage = 0;
    if (index > 0) {
      const prevData = sortedEntries[index - 1][1];
      const prevAvgCost = prevData.shipmentCount > 0 ? prevData.totalCost / prevData.shipmentCount : 0;
      if (prevAvgCost > 0) {
        costChangePercentage = Math.round(((avgCostPerShipment - prevAvgCost) / prevAvgCost) * 100);
      }
    }

    return {
      month,
      total_cost: Math.round(data.totalCost),
      shipment_count: data.shipmentCount,
      avg_cost_per_shipment: avgCostPerShipment,
      cost_change_percentage: costChangePercentage,
    };
  }).slice(-12); // This part of the code returns last 12 months
}

/**
 * This part of the code generates enhanced cost management insights
 */
function generateCostInsights(
  shipments: ShipmentData[],
  kpis: CostKPIs,
  costCenters: CostCenter[]
): AIInsight[] {
  const insights: AIInsight[] = [];
  
  if (shipments.length === 0) {
    insights.push({
      id: "cost-insight-1",
      title: "Information Not Available",
      description: "Cost management data is not available. Data source connection required.",
      severity: "info" as const,
      dollarImpact: 0,
      suggestedActions: ["Check data source connection"],
      createdAt: new Date().toISOString(),
      source: "cost_agent" as const,
    });
    return insights;
  }

  // This part of the code generates SLA performance insight
  if (kpis.avgSLAPerformance < 85) {
    insights.push({
      id: "cost-insight-sla",
      title: "SLA Performance Below Target",
      description: `Average SLA performance is ${kpis.avgSLAPerformance}%, below the 85% target. Poor SLA performance increases operational costs through customer service overhead and potential contract penalties.`,
      severity: "warning" as const,
      dollarImpact: Math.round((85 - kpis.avgSLAPerformance) * 100), // Simple cost estimate
      suggestedActions: [
        "Review warehouse operational procedures",
        "Analyze delayed shipment patterns",
        "Implement performance improvement initiatives"
      ],
      createdAt: new Date().toISOString(),
      source: "cost_agent" as const,
    });
  }

  // This part of the code generates warehouse utilization insight
  const inactiveWarehouses = costCenters.filter(w => w.status === 'Inactive').length;
  if (inactiveWarehouses > 0) {
    insights.push({
      id: "cost-insight-utilization",
      title: "Underutilized Warehouse Capacity",
      description: `${inactiveWarehouses} of ${kpis.totalWarehouses} warehouses show minimal activity in the last 30 days. Underutilized facilities represent fixed costs without proportional revenue generation.`,
      severity: "warning" as const,
      dollarImpact: inactiveWarehouses * 5000, // Estimated monthly fixed costs
      suggestedActions: [
        "Review warehouse consolidation opportunities",
        "Analyze demand patterns by facility",
        "Consider cost reallocation strategies"
      ],
      createdAt: new Date().toISOString(),
      source: "cost_agent" as const,
    });
  }

  // This part of the code generates throughput efficiency insight
  if (kpis.monthlyThroughput > 0) {
    const avgThroughputPerWarehouse = Math.round(kpis.monthlyThroughput / kpis.totalWarehouses);
    insights.push({
      id: "cost-insight-efficiency",
      title: "Warehouse Throughput Analysis",
      description: `Current throughput averages ${avgThroughputPerWarehouse.toLocaleString()} units per warehouse monthly. Optimizing throughput distribution can reduce per-unit handling costs.`,
      severity: "info" as const,
      dollarImpact: 0,
      suggestedActions: [
        "Analyze throughput distribution patterns",
        "Identify high-performing warehouse practices",
        "Implement best practices across facilities"
      ],
      createdAt: new Date().toISOString(),
      source: "cost_agent" as const,
    });
  }

  return insights;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔒 Phase 1: Building simple cost management dashboard...");

    // This part of the code fetches real data and calculates cost metrics
    const shipments = await fetchShipments();
    
    if (shipments.length === 0) {
      // This part of the code returns clean empty state when no data is available
      return res.status(200).json({
        success: true,
        data: {
          kpis: {
            // Enhanced metrics
            totalMonthlyCosts: 0,
            costEfficiencyRate: 0,
            topPerformingWarehouses: 0,
            totalCostCenters: 0,
            // Legacy metrics
            totalWarehouses: 0,
            avgSLAPerformance: 0,
            monthlyThroughput: 0,
            activeCostCenters: 0,
          },
          insights: [{
            id: "cost-insight-1",
            title: "Information Not Available",
            description: "Cost management data is not available. Data source connection required.",
            severity: "info" as const,
            dollarImpact: 0,
            suggestedActions: ["Check data source connection"],
            createdAt: new Date().toISOString(),
            source: "cost_agent" as const,
          }],
          costCenters: [],
          supplierPerformance: [],
          historicalTrends: [],
          lastUpdated: new Date().toISOString(),
        },
        message: "No cost management data available",
        timestamp: new Date().toISOString(),
      });
    }

    // This part of the code calculates enhanced cost management metrics
    const kpis = calculateCostKPIs(shipments);
    const costCenters = calculateCostCenters(shipments);
    const supplierPerformance = calculateSupplierPerformance(shipments);
    const historicalTrends = calculateHistoricalTrends(shipments);
    const insights = generateCostInsights(shipments, kpis, costCenters);

    const costData: CostData = {
      kpis,
      insights,
      costCenters,
      supplierPerformance,
      historicalTrends,
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ Vercel API: Cost management data compiled successfully");
    res.status(200).json({
      success: true,
      data: costData,
      message: "Cost management data loaded successfully",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Vercel API: Cost management error:", error);
    res.status(500).json({
      success: false,
      error: "Internal API Error",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
    });
  }
}
