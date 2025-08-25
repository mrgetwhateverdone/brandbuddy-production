import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code defines interfaces for SLA data analysis
 * Follows the proven patterns from working APIs (dashboard, orders, inventory)
 */

// TinyBird Product Data Interface - standardized
interface ProductData {
  company_url: string;
  brand_id: string;
  brand_name: string;
  brand_domain: string | null;
  product_id: string;
  product_name: string;
  sku: string;
  barcode: string | null;
  quantity_unit: string | null;
  brand_specific_identifier: string | null;
  active: boolean;
  on_hand: number;
  available: number;
  committed: number;
  total_value: number;
  unit_cost: number | null;
  unit_quantity: number;
  days_since_created: number;
  status: string;
  supplier_external_id: string | null;
  updated_date: string | null;
}

// TinyBird Shipment Data Interface - standardized
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

// SLA Data Response Interface
interface SLAData {
  kpis: {
    overallSLACompliance: number | null;
    averageDeliveryPerformance: number | null; // days early/late
    atRiskShipments: number;
    costOfSLABreaches: number;
  };
  performanceTrends: {
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
  };
  supplierScorecard: Array<{
    supplier: string;
    performanceScore: number; // 0-100
    slaCompliance: number;
    quantityAccuracy: number;
    totalShipments: number;
    totalValue: number;
    trend: 'improving' | 'declining' | 'stable';
    riskProfile: 'low' | 'medium' | 'high';
  }>;
  insights: Array<{
    type: 'critical' | 'warning' | 'info';
    category: 'performance' | 'financial' | 'operational';
    message: string;
    data?: any;
  }>;
}

/**
 * This part of the code fetches products data from TinyBird API
 * Uses the proven environment variable pattern from working APIs
 */
async function fetchProducts(): Promise<ProductData[]> {
  const baseUrl = process.env.TINYBIRD_BASE_URL;
  const token = process.env.TINYBIRD_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("Missing TinyBird configuration");
  }

  const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
  
  console.log(`🔍 SLA API: Fetching products from: ${baseUrl.split('?')[0]}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Products fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * This part of the code fetches shipments data from TinyBird API  
 * Uses separate warehouse environment variables for shipments
 */
async function fetchShipments(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("Missing Warehouse TinyBird configuration");
  }

  const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
  
  console.log(`🔍 SLA API: Fetching shipments from: ${baseUrl.split('?')[0]}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Shipments fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * This part of the code calculates comprehensive SLA KPIs
 * Uses defensive programming to prevent crashes
 */
function calculateSLAKPIs(products: ProductData[], shipments: ShipmentData[]) {
  if (!shipments || shipments.length === 0) {
    return {
      overallSLACompliance: null,
      averageDeliveryPerformance: null,
      atRiskShipments: 0,
      costOfSLABreaches: 0
    };
  }

  // This part of the code calculates overall SLA compliance
  const onTimeShipments = shipments.filter(s => {
    if (!s.expected_arrival_date || !s.arrival_date) return false;
    try {
      const expected = new Date(s.expected_arrival_date);
      const actual = new Date(s.arrival_date);
      return actual <= expected && s.expected_quantity === s.received_quantity;
    } catch {
      return false;
    }
  }).length;

  const overallSLACompliance = Math.round((onTimeShipments / shipments.length) * 100);

  // This part of the code calculates average delivery performance (days early/late)
  const deliveryPerformances = shipments
    .filter(s => s.expected_arrival_date && s.arrival_date)
    .map(s => {
      try {
        const expected = new Date(s.expected_arrival_date!);
        const actual = new Date(s.arrival_date);
        return (actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24);
      } catch {
        return 0;
      }
    });

  const averageDeliveryPerformance = deliveryPerformances.length > 0
    ? Math.round((deliveryPerformances.reduce((sum, days) => sum + days, 0) / deliveryPerformances.length) * 10) / 10
    : null;

  // This part of the code identifies at-risk shipments (in-transit but trending late)
  const atRiskShipments = shipments.filter(s => {
    const inTransit = s.status.toLowerCase().includes('transit') || 
                     s.status.toLowerCase().includes('processing') ||
                     s.status.toLowerCase().includes('pending');
    
    if (!inTransit || !s.expected_arrival_date) return false;
    
    try {
      const expected = new Date(s.expected_arrival_date);
      const now = new Date();
      const daysUntilExpected = (expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      // Consider at-risk if expected arrival is within 2 days or already past
      return daysUntilExpected <= 2;
    } catch {
      return false;
    }
  }).length;

  // This part of the code calculates cost of SLA breaches
  const lateShipments = shipments.filter(s => {
    if (!s.expected_arrival_date || !s.arrival_date) return false;
    try {
      const expected = new Date(s.expected_arrival_date);
      const actual = new Date(s.arrival_date);
      return actual > expected || s.expected_quantity !== s.received_quantity;
    } catch {
      return false;
    }
  });

  // Estimate cost based on shipment value (unit_cost * quantity) with average rush shipping cost
  const costOfSLABreaches = lateShipments.reduce((total, shipment) => {
    const shipmentValue = (shipment.unit_cost || 50) * shipment.expected_quantity;
    const estimatedRushCost = shipmentValue * 0.15; // 15% rush shipping penalty
    return total + estimatedRushCost;
  }, 0);

  return {
    overallSLACompliance,
    averageDeliveryPerformance,
    atRiskShipments,
    costOfSLABreaches: Math.round(costOfSLABreaches)
  };
}

/**
 * This part of the code analyzes performance trends and patterns
 * Identifies daily/weekly patterns for Phase 1
 */
function calculatePerformanceTrends(shipments: ShipmentData[]) {
  if (!shipments || shipments.length === 0) {
    return {
      dailyPerformance: [],
      weeklyPatterns: []
    };
  }

  // This part of the code calculates daily performance over last 30 days
  const dailyPerformance = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const dayShipments = shipments.filter(s => s.arrival_date.startsWith(dateStr));
    const onTimeCount = dayShipments.filter(s => {
      if (!s.expected_arrival_date) return false;
      try {
        const expected = new Date(s.expected_arrival_date);
        const actual = new Date(s.arrival_date);
        return actual <= expected && s.expected_quantity === s.received_quantity;
      } catch {
        return false;
      }
    }).length;

    const slaCompliance = dayShipments.length > 0 ? Math.round((onTimeCount / dayShipments.length) * 100) : 0;

    dailyPerformance.push({
      date: dateStr,
      slaCompliance,
      totalShipments: dayShipments.length,
      onTimeShipments: onTimeCount
    });
  }

  // This part of the code calculates weekly patterns (performance by day of week)
  const weeklyData: { [key: string]: { total: number; onTime: number; count: number } } = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  shipments.forEach(s => {
    if (!s.arrival_date || !s.expected_arrival_date) return;
    
    try {
      const arrivalDate = new Date(s.arrival_date);
      const dayOfWeek = dayNames[arrivalDate.getDay()];
      
      if (!weeklyData[dayOfWeek]) {
        weeklyData[dayOfWeek] = { total: 0, onTime: 0, count: 0 };
      }
      
      weeklyData[dayOfWeek].total++;
      weeklyData[dayOfWeek].count++;
      
      const expected = new Date(s.expected_arrival_date);
      if (arrivalDate <= expected && s.expected_quantity === s.received_quantity) {
        weeklyData[dayOfWeek].onTime++;
      }
    } catch {
      // Skip invalid dates
    }
  });

  const weeklyPatterns = dayNames.map(day => ({
    dayOfWeek: day,
    avgPerformance: weeklyData[day] ? Math.round((weeklyData[day].onTime / weeklyData[day].total) * 100) : 0,
    shipmentCount: weeklyData[day] ? weeklyData[day].count : 0
  }));

  return {
    dailyPerformance,
    weeklyPatterns
  };
}

/**
 * This part of the code calculates supplier performance scorecard
 * Ranks suppliers and identifies trends and risk profiles
 */
function calculateSupplierScorecard(products: ProductData[], shipments: ShipmentData[]) {
  if (!shipments || shipments.length === 0) return [];

  const supplierData: { [key: string]: {
    shipments: ShipmentData[];
    products: ProductData[];
    totalValue: number;
  } } = {};

  // This part of the code groups data by supplier
  shipments.forEach(s => {
    const supplier = s.supplier || 'Unknown Supplier';
    if (!supplierData[supplier]) {
      supplierData[supplier] = { shipments: [], products: [], totalValue: 0 };
    }
    supplierData[supplier].shipments.push(s);
    supplierData[supplier].totalValue += (s.unit_cost || 50) * s.received_quantity;
  });

  // This part of the code calculates performance metrics for each supplier
  return Object.entries(supplierData).map(([supplier, data]) => {
    const { shipments: supplierShipments } = data;
    
    // Calculate SLA compliance
    const onTimeShipments = supplierShipments.filter(s => {
      if (!s.expected_arrival_date || !s.arrival_date) return false;
      try {
        const expected = new Date(s.expected_arrival_date);
        const actual = new Date(s.arrival_date);
        return actual <= expected;
      } catch {
        return false;
      }
    }).length;

    const slaCompliance = Math.round((onTimeShipments / supplierShipments.length) * 100);

    // Calculate quantity accuracy
    const accurateShipments = supplierShipments.filter(s => 
      s.expected_quantity === s.received_quantity
    ).length;
    const quantityAccuracy = Math.round((accurateShipments / supplierShipments.length) * 100);

    // Calculate performance score (weighted average)
    const performanceScore = Math.round((slaCompliance * 0.6) + (quantityAccuracy * 0.4));

    // Determine trend (simplified - based on recent vs older performance)
    const recentShipments = supplierShipments.filter(s => {
      const shipmentDate = new Date(s.created_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return shipmentDate >= thirtyDaysAgo;
    });

    const recentPerformance = recentShipments.length > 0 
      ? recentShipments.filter(s => {
          if (!s.expected_arrival_date || !s.arrival_date) return false;
          try {
            return new Date(s.arrival_date) <= new Date(s.expected_arrival_date);
          } catch {
            return false;
          }
        }).length / recentShipments.length * 100
      : slaCompliance;

    let trend: 'improving' | 'declining' | 'stable';
    if (recentPerformance > slaCompliance + 5) trend = 'improving';
    else if (recentPerformance < slaCompliance - 5) trend = 'declining';
    else trend = 'stable';

    // Determine risk profile
    let riskProfile: 'low' | 'medium' | 'high';
    if (performanceScore >= 90 && data.totalValue < 50000) riskProfile = 'low';
    else if (performanceScore >= 75 || data.totalValue < 100000) riskProfile = 'medium';
    else riskProfile = 'high';

    return {
      supplier,
      performanceScore,
      slaCompliance,
      quantityAccuracy,
      totalShipments: supplierShipments.length,
      totalValue: Math.round(data.totalValue),
      trend,
      riskProfile
    };
  }).sort((a, b) => b.performanceScore - a.performanceScore);
}

/**
 * This part of the code generates basic SLA insights
 * Provides fallback insights for Phase 1 (no OpenAI dependency)
 */
function generateSLAInsights(products: ProductData[], shipments: ShipmentData[], slaData: any) {
  const insights = [];
  
  // This part of the code generates performance insights
  if (slaData.kpis.overallSLACompliance && slaData.kpis.overallSLACompliance < 85) {
    insights.push({
      type: 'critical' as const,
      category: 'performance' as const,
      message: `SLA compliance at ${slaData.kpis.overallSLACompliance}% is below target (95%). Focus on top underperforming suppliers.`
    });
  }

  if (slaData.kpis.atRiskShipments > 5) {
    insights.push({
      type: 'warning' as const,
      category: 'operational' as const,
      message: `${slaData.kpis.atRiskShipments} shipments are currently at risk of missing SLA targets.`
    });
  }

  if (slaData.kpis.costOfSLABreaches > 10000) {
    insights.push({
      type: 'warning' as const,
      category: 'financial' as const,
      message: `SLA breaches cost $${slaData.kpis.costOfSLABreaches.toLocaleString()} this period. Consider supplier diversification.`
    });
  }

  // This part of the code generates supplier insights
  const poorPerformers = slaData.supplierScorecard.filter((s: any) => s.performanceScore < 80);
  if (poorPerformers.length > 0) {
    insights.push({
      type: 'warning' as const,
      category: 'operational' as const,
      message: `${poorPerformers.length} suppliers performing below 80% compliance. Review contracts for ${poorPerformers[0].supplier}.`
    });
  }

  insights.push({
    type: 'info' as const,
    category: 'performance' as const,
    message: `Tracking ${shipments.length} shipments across ${slaData.supplierScorecard.length} suppliers for comprehensive SLA analysis.`
  });

  return insights;
}

/**
 * This part of the code handles the main API request
 * Follows the proven pattern from working APIs with comprehensive error handling
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("📊 SLA API: Fetching comprehensive SLA performance data...");

    const [allProducts, allShipments] = await Promise.all([
      fetchProducts(),
      fetchShipments(),
    ]);

    // This part of the code filters data for Callahan-Smith brand (client-side filtering as backup)
    const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    
    console.log(`🔍 SLA Data filtered for Callahan-Smith: ${products.length} products, ${shipments.length} shipments`);

    // This part of the code calculates all SLA metrics for Phase 1
    const kpis = calculateSLAKPIs(products, shipments);
    const performanceTrends = calculatePerformanceTrends(shipments);
    const supplierScorecard = calculateSupplierScorecard(products, shipments);

    // Prepare data for insights generation
    const slaData = {
      kpis,
      performanceTrends,
      supplierScorecard
    };

    const insights = generateSLAInsights(products, shipments, slaData);

    const response: SLAData = {
      kpis,
      performanceTrends,
      supplierScorecard,
      insights
    };

    console.log("✅ SLA API: Successfully calculated comprehensive SLA performance data");
    res.status(200).json(response);

  } catch (error) {
    console.error("❌ SLA API Error:", error);
    res.status(500).json({ 
      error: "Failed to fetch SLA data",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
