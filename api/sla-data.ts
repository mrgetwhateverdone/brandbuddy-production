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
  financialImpact: {
    totalSLABreachCost: number;
    averageBreachCost: number;
    opportunityCost: number; // estimated lost sales
    potentialSavings: number; // if performance improved to target
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
  };
  optimizationRecommendations: Array<{
    type: 'supplier' | 'route' | 'inventory' | 'contract';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    estimatedImpact: string;
    actionRequired: string;
    timeline: string;
    difficulty: 'easy' | 'medium' | 'complex';
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
  const dailyPerformance: any[] = [];
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
 * This part of the code calculates comprehensive financial impact of SLA performance
 * Estimates costs, savings, trends, and supplier-specific impacts
 */
function calculateFinancialImpact(products: ProductData[], shipments: ShipmentData[]) {
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

  // This part of the code calculates total SLA breach costs
  const totalSLABreachCost = lateShipments.reduce((total, shipment) => {
    const shipmentValue = (shipment.unit_cost || 50) * shipment.expected_quantity;
    const rushShippingCost = shipmentValue * 0.15; // 15% penalty
    const expeditingCost = 25; // Fixed expediting cost per shipment
    return total + rushShippingCost + expeditingCost;
  }, 0);

  const averageBreachCost = lateShipments.length > 0 
    ? totalSLABreachCost / lateShipments.length 
    : 0;

  // This part of the code estimates opportunity cost (lost sales due to stockouts)
  const stockoutProducts = products.filter(p => p.on_hand === 0 && p.active);
  const opportunityCost = stockoutProducts.reduce((total, product) => {
    // Estimate 5 days of lost sales per stockout
    const estimatedDailySales = (product.unit_cost || 50) * 1.4 * 3; // 40% margin, 3 units/day
    return total + (estimatedDailySales * 5);
  }, 0);

  // This part of the code calculates potential savings if performance improved to 95%
  const currentCompliance = shipments.length > 0 
    ? (shipments.length - lateShipments.length) / shipments.length * 100 
    : 0;
  const targetCompliance = 95;
  const improvementNeeded = Math.max(0, targetCompliance - currentCompliance);
  const potentialSavings = totalSLABreachCost * (improvementNeeded / 100);

  // This part of the code calculates monthly trends (simplified - last 6 months)
  const monthlyTrend: any[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    
    const monthShipments = shipments.filter(s => {
      const shipmentDate = new Date(s.arrival_date);
      return shipmentDate.getMonth() === date.getMonth() && 
             shipmentDate.getFullYear() === date.getFullYear();
    });
    
    const monthLateShipments = monthShipments.filter(s => {
      if (!s.expected_arrival_date || !s.arrival_date) return false;
      try {
        const expected = new Date(s.expected_arrival_date);
        const actual = new Date(s.arrival_date);
        return actual > expected;
      } catch {
        return false;
      }
    });
    
    const breachCost = monthLateShipments.reduce((sum, s) => {
      const value = (s.unit_cost || 50) * s.expected_quantity;
      return sum + (value * 0.15) + 25;
    }, 0);
    
    // Estimate missed opportunity as 20% of breach cost
    const missedOpportunity = breachCost * 0.2;
    
    monthlyTrend.push({
      month: monthStr,
      breachCost: Math.round(breachCost),
      missedOpportunity: Math.round(missedOpportunity)
    });
  }

  // This part of the code calculates supplier cost breakdown
  const supplierCosts: { [key: string]: { totalCost: number; breachCount: number; totalValue: number } } = {};
  
  lateShipments.forEach(s => {
    const supplier = s.supplier || 'Unknown Supplier';
    const shipmentValue = (s.unit_cost || 50) * s.expected_quantity;
    const cost = (shipmentValue * 0.15) + 25;
    
    if (!supplierCosts[supplier]) {
      supplierCosts[supplier] = { totalCost: 0, breachCount: 0, totalValue: 0 };
    }
    
    supplierCosts[supplier].totalCost += cost;
    supplierCosts[supplier].breachCount += 1;
    supplierCosts[supplier].totalValue += shipmentValue;
  });

  const supplierCostBreakdown = Object.entries(supplierCosts)
    .map(([supplier, data]) => ({
      supplier,
      totalCost: Math.round(data.totalCost),
      avgCostPerBreach: Math.round(data.totalCost / data.breachCount),
      breachCount: data.breachCount
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 10); // Top 10 most costly suppliers

  return {
    totalSLABreachCost: Math.round(totalSLABreachCost),
    averageBreachCost: Math.round(averageBreachCost),
    opportunityCost: Math.round(opportunityCost),
    potentialSavings: Math.round(potentialSavings),
    monthlyTrend,
    supplierCostBreakdown
  };
}

/**
 * This part of the code generates actionable optimization recommendations
 * Provides specific insights for improving SLA performance with ROI estimates
 */
function generateOptimizationRecommendations(
  products: ProductData[], 
  shipments: ShipmentData[], 
  supplierScorecard: any[],
  financialImpact: any
) {
  const recommendations: any[] = [];

  // This part of the code identifies underperforming suppliers
  const poorPerformers = supplierScorecard.filter(s => s.performanceScore < 80);
  if (poorPerformers.length > 0) {
    const totalRiskValue = poorPerformers.reduce((sum, s) => sum + s.totalValue, 0);
    recommendations.push({
      type: 'supplier' as const,
      priority: 'high' as const,
      title: 'Diversify High-Risk Supplier Dependencies',
      description: `${poorPerformers.length} suppliers performing below 80% SLA compliance represent significant operational risk`,
      estimatedImpact: `Reduce risk exposure by $${Math.round(totalRiskValue * 0.1).toLocaleString()}`,
      actionRequired: 'Identify 2-3 backup suppliers for each poor performer and negotiate trial agreements',
      timeline: '2-4 weeks',
      difficulty: 'medium' as const
    });
  }

  // This part of the code identifies quantity accuracy issues
  const quantityIssues = supplierScorecard.filter(s => s.quantityAccuracy < 90);
  if (quantityIssues.length > 0) {
    recommendations.push({
      type: 'supplier' as const,
      priority: 'medium' as const,
      title: 'Implement Stricter Quality Controls',
      description: `${quantityIssues.length} suppliers with quantity accuracy below 90% cause processing delays`,
      estimatedImpact: 'Reduce processing time by 2-3 days, save $15-25 per shipment',
      actionRequired: 'Implement pre-shipment verification processes and quality checkpoints',
      timeline: '3-6 weeks',
      difficulty: 'medium' as const
    });
  }

  // This part of the code identifies inventory buffer opportunities
  const stockoutProducts = products.filter(p => p.on_hand === 0 && p.active);
  if (stockoutProducts.length > 0) {
    recommendations.push({
      type: 'inventory' as const,
      priority: 'high' as const,
      title: 'Optimize Safety Stock Levels',
      description: `${stockoutProducts.length} SKUs currently out of stock, causing potential lost sales`,
      estimatedImpact: `Prevent $${Math.round(stockoutProducts.length * 750).toLocaleString()} in lost sales monthly`,
      actionRequired: 'Calculate optimal safety stock levels using lead time variability analysis',
      timeline: '1-2 weeks',
      difficulty: 'easy' as const
    });
  }

  // This part of the code identifies route optimization opportunities
  const multiStateSuppliers = [...new Set(shipments.map(s => s.ship_from_state).filter(Boolean))];
  if (multiStateSuppliers.length > 5) {
    recommendations.push({
      type: 'route' as const,
      priority: 'medium' as const,
      title: 'Consolidate Shipping Routes',
      description: `Shipments from ${multiStateSuppliers.length} different states create complexity and delays`,
      estimatedImpact: 'Reduce transit time by 1-2 days, save 5-10% on shipping costs',
      actionRequired: 'Analyze supplier locations and consolidate orders by geographic region',
      timeline: '4-8 weeks',
      difficulty: 'complex' as const
    });
  }

  // This part of the code identifies contract renegotiation opportunities
  const highValuePoorPerformers = supplierScorecard.filter(s => 
    s.performanceScore < 85 && s.totalValue > 100000
  );
  if (highValuePoorPerformers.length > 0) {
    recommendations.push({
      type: 'contract' as const,
      priority: 'high' as const,
      title: 'Renegotiate High-Value Supplier Contracts',
      description: `${highValuePoorPerformers.length} high-value suppliers underperforming need contract adjustments`,
      estimatedImpact: `Potential savings of $${Math.round(financialImpact.totalSLABreachCost * 0.3).toLocaleString()} annually`,
      actionRequired: 'Schedule contract reviews with SLA penalties and performance bonuses',
      timeline: '6-12 weeks',
      difficulty: 'complex' as const
    });
  }

  // This part of the code identifies technology/automation opportunities
  if (financialImpact.totalSLABreachCost > 50000) {
    recommendations.push({
      type: 'route' as const,
      priority: 'medium' as const,
      title: 'Implement Automated SLA Monitoring',
      description: 'High SLA breach costs justify investment in automated tracking and alerting',
      estimatedImpact: `ROI within 6 months, prevent 30-40% of current breach costs`,
      actionRequired: 'Implement real-time shipment tracking and automated delay notifications',
      timeline: '8-12 weeks',
      difficulty: 'complex' as const
    });
  }

  return recommendations.sort((a, b) => {
    // Sort by priority (high, medium, low) then by estimated impact
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * This part of the code generates AI-powered SLA insights using Customer Success Director expertise
 */
async function generateAISLAInsights(
  products: ProductData[],
  shipments: ShipmentData[],
  slaData: any
): Promise<any[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 OpenAI API key check: hasApiKey:', !!apiKey, 'length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('❌ No OpenAI API key found - returning empty insights');
    return [];
  }

  try {
    const atRiskShipments = slaData.kpis.atRiskShipments || 0;
    const poorPerformers = slaData.supplierScorecard.filter((s: any) => s.performanceScore < 80);
    const highValuePoorPerformers = slaData.supplierScorecard.filter((s: any) => 
      s.performanceScore < 85 && s.totalValue > 100000
    );

    const prompt = `You are a Customer Success Director with 19+ years of experience in service level management, customer retention, and operational excellence. You have maintained 99%+ SLA compliance rates and improved customer satisfaction scores by implementing proactive service management strategies.

Analyze SLA performance data including on-time delivery rates, processing times, and service level agreements. Identify areas where SLAs are consistently missed and root causes. Suggest workflows like 'Create automated SLA monitoring with escalation triggers', 'Implement service recovery processes for SLA breaches', or 'Set up proactive customer communication for potential delays'. Apply your expertise in customer service excellence and performance management to ensure service commitments are consistently met.

SLA PERFORMANCE DASHBOARD:
==========================

CRITICAL METRICS:
- Overall SLA Compliance: ${slaData.kpis.overallSLACompliance || 0}% (Target: 95%)
- Average Delivery Performance: ${slaData.kpis.averageDeliveryPerformance || 0} days variance
- At-Risk Shipments: ${atRiskShipments} currently at risk
- Total SLA Breach Cost: $${(slaData.kpis.costOfSLABreaches || 0).toLocaleString()}

SUPPLIER PERFORMANCE:
- Total Suppliers: ${slaData.supplierScorecard.length} partners
- Poor Performers (<80%): ${poorPerformers.length} suppliers
- High-Value Poor Performers: ${highValuePoorPerformers.length} critical suppliers
- Total Shipments Tracked: ${shipments.length}

FINANCIAL IMPACT:
- SLA Breach Costs: $${(slaData.financialImpact.totalSLABreachCost || 0).toLocaleString()}
- Opportunity Cost: $${(slaData.financialImpact.opportunityCost || 0).toLocaleString()}
- Potential Savings: $${(slaData.financialImpact.potentialSavings || 0).toLocaleString()}
- Average Breach Cost: $${Math.round(slaData.financialImpact.averageBreachCost || 0).toLocaleString()}

Based on your proven track record of maintaining 99%+ SLA compliance and improving customer satisfaction scores, provide strategic insights focused on service level management, proactive customer communication, and performance optimization. Apply your expertise in customer service excellence to identify root causes and implement service recovery processes.

Format as JSON array with 3-5 strategic insights:
[
  {
    "id": "sla-insight-1",
    "title": "Strategic SLA insight based on proven service management methodologies",
    "description": "Expert analysis referencing SLA data with specific numbers and actionable recommendations drawing from your 19+ years of experience in operational excellence",
    "severity": "critical|warning|info",
    "dollarImpact": calculated_financial_impact,
    "suggestedActions": ["Create automated SLA monitoring with escalation triggers", "Implement service recovery processes for SLA breaches", "Set up proactive customer communication for potential delays"],
    "createdAt": "${new Date().toISOString()}",
    "source": "dashboard_agent"
  }
]

Focus on immediate SLA improvement priorities, customer retention strategies, and proactive service management based on your expertise in maintaining exceptional service levels.`;

    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    console.log('🤖 SLA Agent: Calling OpenAI for comprehensive SLA insights...');
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';
    console.log('🤖 Raw OpenAI response:', aiContent);

    // This part of the code uses JSON parsing like working dashboard API
    try {
      const insights = JSON.parse(aiContent);
      console.log('✅ SLA insights parsed successfully:', insights.length);
      
      // This part of the code ensures proper structure for client consumption
      return insights.map((insight: any, index: number) => ({
        id: insight.id || `sla-insight-${index}`,
        title: insight.title || `SLA Alert ${index + 1}`,
        description: insight.description || insight.content || 'Analysis pending',
        severity: insight.severity || 'warning',
        dollarImpact: insight.dollarImpact || Math.round((slaData.kpis.costOfSLABreaches || 0) * 0.2),
        suggestedActions: insight.suggestedActions || ["Create automated SLA monitoring", "Implement service recovery processes", "Set up proactive customer communication"],
        createdAt: insight.createdAt || new Date().toISOString(),
        source: insight.source || "dashboard_agent",
      }));
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      return [];
    }

  } catch (error) {
    console.error("❌ SLA AI analysis failed:", error);
  }
  
  // Return empty insights when AI fails - no fallback data generation
  return [];
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

    // This part of the code calculates all SLA metrics for Phase 2
    const kpis = calculateSLAKPIs(products, shipments);
    const performanceTrends = calculatePerformanceTrends(shipments);
    const supplierScorecard = calculateSupplierScorecard(products, shipments);
    const financialImpact = calculateFinancialImpact(products, shipments);
    const optimizationRecommendations = generateOptimizationRecommendations(products, shipments, supplierScorecard, financialImpact);

    // Prepare data for insights generation
    const slaData = {
      kpis,
      performanceTrends,
      supplierScorecard,
      financialImpact,
      optimizationRecommendations
    };

    const insights = await generateAISLAInsights(products, shipments, slaData);

    const response: SLAData = {
      kpis,
      performanceTrends,
      supplierScorecard,
      financialImpact,
      optimizationRecommendations,
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
