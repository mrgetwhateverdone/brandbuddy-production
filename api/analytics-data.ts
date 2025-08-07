import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code provides analytics data endpoint for Vercel serverless deployment
 * Ensuring consistency with dashboard data while providing analytics-specific metrics
 */

// TinyBird Product Details API Response - standardized interface
interface ProductData {
  product_id: string;
  company_url: string;
  brand_id: string | null;
  brand_name: string;
  brand_domain: string | null;
  created_date: string;
  product_name: string;
  product_sku: string | null;
  gtin: string | null;
  is_kit: boolean;
  active: boolean;
  product_supplier: string | null;
  country_of_origin: string | null;
  harmonized_code: string | null;
  product_external_url: string | null;
  inventory_item_id: string;
  unit_quantity: number;
  supplier_name: string;
  unit_cost: number | null;
  supplier_external_id: string | null;
  updated_date: string | null;
}

// TinyBird Shipments API Response - standardized interface
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
 * This part of the code fetches products data from TinyBird API using standardized parameters
 * Matches the dashboard implementation to ensure consistent data structure
 */
async function fetchProducts(): Promise<ProductData[]> {
  const baseUrl = process.env.TINYBIRD_BASE_URL;
  const token = process.env.TINYBIRD_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "TINYBIRD_BASE_URL and TINYBIRD_TOKEN environment variables are required",
    );
  }

  // This part of the code fetches from product_details_mv API with COMP002_packiyo company filter
  const url = `${baseUrl}?token=${token}&limit=100&company_url=COMP002_packiyo`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * This part of the code fetches shipments data from TinyBird API using standardized parameters
 * Matches the dashboard implementation to ensure consistent data structure
 */
async function fetchShipments(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "WAREHOUSE_BASE_URL and WAREHOUSE_TOKEN environment variables are required",
    );
  }

  // This part of the code fetches from inbound_shipments_details_mv API with COMP002_3PL company filter
  const url = `${baseUrl}?token=${token}&limit=150&company_url=COMP002_3PL`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * This part of the code calculates analytics-specific KPIs from real data
 */
function calculateAnalyticsKPIs(products: ProductData[], shipments: ShipmentData[]) {
  // This part of the code calculates order volume growth (simulated with recent data)
  const recentShipments = shipments.filter(s => {
    const shipmentDate = new Date(s.created_date);
    const daysAgo = (Date.now() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });
  const olderShipments = shipments.filter(s => {
    const shipmentDate = new Date(s.created_date);
    const daysAgo = (Date.now() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo > 30 && daysAgo <= 60;
  });
  
  const orderVolumeGrowth = olderShipments.length > 0 
    ? ((recentShipments.length - olderShipments.length) / olderShipments.length) * 100
    : 0;

  // This part of the code calculates return rate (shipments with quantity discrepancies)
  const problematicShipments = shipments.filter(s => 
    s.expected_quantity !== s.received_quantity
  ).length;
  const returnRate = shipments.length > 0 ? (problematicShipments / shipments.length) * 100 : 0;

  // This part of the code calculates fulfillment efficiency
  const fulfilledShipments = shipments.filter(s => 
    s.expected_quantity === s.received_quantity && s.status !== "cancelled"
  ).length;
  const fulfillmentEfficiency = shipments.length > 0 ? (fulfilledShipments / shipments.length) * 100 : 0;

  // This part of the code calculates inventory health score
  const activeProducts = products.filter(p => p.active).length;
  const inventoryHealthScore = products.length > 0 ? (activeProducts / products.length) * 100 : 0;

  return {
    orderVolumeGrowth: Math.round(orderVolumeGrowth * 10) / 10,
    returnRate: Math.round(returnRate * 10) / 10,
    fulfillmentEfficiency: Math.round(fulfillmentEfficiency * 10) / 10,
    inventoryHealthScore: Math.round(inventoryHealthScore * 10) / 10,
  };
}

/**
 * This part of the code calculates performance metrics for order and fulfillment trends
 */
function calculatePerformanceMetrics(products: ProductData[], shipments: ShipmentData[]) {
  // This part of the code calculates order volume trend metrics
  const recentShipments = shipments.filter(s => {
    const shipmentDate = new Date(s.created_date);
    const daysAgo = (Date.now() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });
  const olderShipments = shipments.filter(s => {
    const shipmentDate = new Date(s.created_date);
    const daysAgo = (Date.now() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo > 30 && daysAgo <= 60;
  });
  
  const growthRate = olderShipments.length > 0 
    ? ((recentShipments.length - olderShipments.length) / olderShipments.length) * 100
    : 0;

  // This part of the code calculates fulfillment performance metrics
  const onTimeShipments = shipments.filter(s => 
    s.expected_quantity === s.received_quantity && s.status !== "cancelled"
  ).length;
  const efficiencyRate = shipments.length > 0 ? (onTimeShipments / shipments.length) * 100 : 0;

  return {
    orderVolumeTrend: {
      growthRate: Math.round(growthRate * 10) / 10,
      totalOrdersAnalyzed: shipments.length,
    },
    fulfillmentPerformance: {
      efficiencyRate: Math.round(efficiencyRate * 10) / 10,
      onTimeOrders: onTimeShipments,
    },
  };
}

/**
 * This part of the code calculates data insights dashboard metrics
 */
function calculateDataInsights(products: ProductData[], shipments: ShipmentData[]) {
  // This part of the code calculates data insights metrics
  const uniqueWarehouses = new Set(shipments.filter(s => s.warehouse_id).map(s => s.warehouse_id)).size;
  const uniqueBrands = new Set(products.map(p => p.brand_name)).size;
  const activeProducts = products.filter(p => p.active).length;
  const totalDataPoints = products.length + shipments.length;

  // This part of the code calculates average SLA (based on shipment performance)
  const onTimeShipments = shipments.filter(s => 
    s.expected_quantity === s.received_quantity && s.status !== "cancelled"
  ).length;
  const avgSLA = shipments.length > 0 ? Math.round((onTimeShipments / shipments.length) * 100) : 0;

  return {
    totalDataPoints,
    activeWarehouses: {
      count: uniqueWarehouses,
      avgSLA,
    },
    uniqueBrands,
    inventoryHealth: {
      percentage: products.length > 0 ? Math.round((activeProducts / products.length) * 100) : 0,
      skusInStock: activeProducts,
    },
  };
}

/**
 * This part of the code calculates operational breakdown metrics
 */
function calculateOperationalBreakdown(products: ProductData[], shipments: ShipmentData[]) {
  // This part of the code calculates order analysis metrics
  const onTimeOrders = shipments.filter(s => 
    s.expected_quantity === s.received_quantity && s.status !== "cancelled"
  ).length;
  const delayedOrders = shipments.filter(s => 
    s.expected_quantity !== s.received_quantity || s.status === "cancelled"
  ).length;
  const onTimeRate = shipments.length > 0 ? (onTimeOrders / shipments.length) * 100 : 0;

  // This part of the code calculates inventory analysis metrics
  const inStock = products.filter(p => p.active && p.unit_quantity > 0).length;
  const lowStock = products.filter(p => p.active && p.unit_quantity > 0 && p.unit_quantity < 10).length;
  const outOfStock = products.filter(p => !p.active || p.unit_quantity === 0).length;
  const avgInventoryLevel = products.length > 0 
    ? Math.round(products.reduce((sum, p) => sum + p.unit_quantity, 0) / products.length)
    : 0;

  return {
    orderAnalysis: {
      totalOrders: shipments.length,
      onTimeOrders,
      delayedOrders,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
    },
    inventoryAnalysis: {
      totalSKUs: products.length,
      inStock,
      lowStock,
      outOfStock,
      avgInventoryLevel,
    },
  };
}

/**
 * This part of the code calculates brand performance rankings from TinyBird data
 */
function calculateBrandPerformance(products: ProductData[], shipments: ShipmentData[]) {
  // This part of the code groups products by brand and calculates performance metrics
  const brandGroups = new Map<string, { skuCount: number; totalQuantity: number }>();
  
  products.forEach(product => {
    const brandName = product.brand_name || 'Unknown Brand';
    if (!brandGroups.has(brandName)) {
      brandGroups.set(brandName, { skuCount: 0, totalQuantity: 0 });
    }
    const group = brandGroups.get(brandName)!;
    group.skuCount += 1;
    group.totalQuantity += product.unit_quantity;
  });

  // This part of the code creates sorted brand rankings
  const brandRankings = Array.from(brandGroups.entries())
    .map(([brandName, data]) => ({
      brandName,
      skuCount: data.skuCount,
      inventoryPercentage: products.length > 0 ? (data.skuCount / products.length) * 100 : 0,
    }))
    .sort((a, b) => b.skuCount - a.skuCount)
    .map((brand, index) => {
      // This part of the code assigns performance levels based on ranking
      let performanceLevel;
      const totalBrands = brandGroups.size;
      if (index === 0) performanceLevel = "Leading Brand";
      else if (index <= 2) performanceLevel = "Top Performer";
      else if (index <= Math.ceil(totalBrands * 0.3)) performanceLevel = "Strong Performer";
      else if (index <= Math.ceil(totalBrands * 0.7)) performanceLevel = "Average Performer";
      else performanceLevel = "Developing Brand";

      return {
        rank: index + 1,
        brandName: brand.brandName,
        skuCount: brand.skuCount,
        inventoryPercentage: Math.round(brand.inventoryPercentage * 100) / 100,
        performanceLevel,
      };
    });

  const topBrand = brandRankings.length > 0 ? brandRankings[0] : { brandName: "No Data", skuCount: 0 };

  return {
    totalBrands: brandGroups.size,
    topBrand: {
      name: topBrand.brandName,
      skuCount: topBrand.skuCount,
    },
    brandRankings,
  };
}

/**
 * This part of the code generates analytics-specific AI insights
 */
async function generateAnalyticsInsights(
  products: ProductData[],
  shipments: ShipmentData[],
  kpis: any,
  performanceMetrics: any,
  brandPerformance: any
): Promise<any[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // This part of the code generates analytics insights without AI when API key is not available
    const insights = [];
    
    if (kpis.orderVolumeGrowth < -10) {
      insights.push({
        type: "warning",
        title: "Declining Order Volume",
        description: `Order volume has decreased by ${Math.abs(kpis.orderVolumeGrowth).toFixed(1)}% compared to previous period. This trend requires immediate attention to maintain business growth.`,
        severity: "warning",
        dollarImpact: 5000,
      });
    }
    
    if (kpis.fulfillmentEfficiency < 80) {
      insights.push({
        type: "critical",
        title: "Low Fulfillment Efficiency",
        description: `Fulfillment efficiency at ${kpis.fulfillmentEfficiency.toFixed(1)}% is below optimal levels. Focus on process improvements to reach 90%+ efficiency.`,
        severity: "critical",
        dollarImpact: 10000,
      });
    }
    
    if (brandPerformance.totalBrands > 5) {
      insights.push({
        type: "info",
        title: "Brand Portfolio Diversification",
        description: `Portfolio includes ${brandPerformance.totalBrands} brands with ${brandPerformance.topBrand.name} leading with ${brandPerformance.topBrand.skuCount} SKUs. Consider brand consolidation strategies.`,
        severity: "info",
        dollarImpact: 2500,
      });
    }
    
    return insights;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: `You are a 3PL analytics specialist. Analyze this analytics data and generate 2-3 actionable insights focused on performance trends and optimization opportunities.

ANALYTICS KPIS:
- Order Volume Growth: ${kpis.orderVolumeGrowth}%
- Return Rate: ${kpis.returnRate}%
- Fulfillment Efficiency: ${kpis.fulfillmentEfficiency}%
- Inventory Health Score: ${kpis.inventoryHealthScore}%

PERFORMANCE METRICS:
- Order Volume Growth Rate: ${performanceMetrics.orderVolumeTrend.growthRate}%
- Fulfillment Efficiency Rate: ${performanceMetrics.fulfillmentPerformance.efficiencyRate}%
- Total Orders Analyzed: ${performanceMetrics.orderVolumeTrend.totalOrdersAnalyzed}

BRAND PERFORMANCE:
- Total Brands: ${brandPerformance.totalBrands}
- Top Brand: ${brandPerformance.topBrand.name} (${brandPerformance.topBrand.skuCount} SKUs)
- Brand Distribution: ${brandPerformance.brandRankings.length} ranked brands

Generate insights focusing on analytics trends, efficiency improvements, and brand performance optimization.

FORMAT AS JSON ARRAY:
[
  {
    "type": "warning",
    "title": "Analytics Insight Title",
    "description": "Detailed analysis with trends and recommendations",
    "severity": "critical|warning|info",
    "dollarImpact": estimated_dollar_amount
  }
]`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    }
  } catch (error) {
    console.error("Analytics AI analysis failed:", error);
  }

  // This part of the code generates fallback analytics insights when AI fails
  const insights = [];
  
  if (kpis.orderVolumeGrowth < -10) {
    insights.push({
      type: "warning",
      title: "Declining Order Volume",
      description: `Order volume has decreased by ${Math.abs(kpis.orderVolumeGrowth).toFixed(1)}% compared to previous period. This trend requires immediate attention to maintain business growth.`,
      severity: "warning",
      dollarImpact: 5000,
    });
  }
  
  if (kpis.fulfillmentEfficiency < 80) {
    insights.push({
      type: "critical",
      title: "Low Fulfillment Efficiency",
      description: `Fulfillment efficiency at ${kpis.fulfillmentEfficiency.toFixed(1)}% is below optimal levels. Focus on process improvements to reach 90%+ efficiency.`,
      severity: "critical",
      dollarImpact: 10000,
    });
  }
  
  if (brandPerformance.totalBrands > 5) {
    insights.push({
      type: "info",
      title: "Brand Portfolio Diversification",
      description: `Portfolio includes ${brandPerformance.totalBrands} brands with ${brandPerformance.topBrand.name} leading with ${brandPerformance.topBrand.skuCount} SKUs. Consider brand consolidation strategies.`,
      severity: "info",
      dollarImpact: 2500,
    });
  }
  
  return insights;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(
      "📊 Vercel API: Fetching analytics data with environment variables...",
    );

    const [products, shipments] = await Promise.all([
      fetchProducts(),
      fetchShipments(),
    ]);

    // This part of the code calculates all analytics metrics from real TinyBird data
    const kpis = calculateAnalyticsKPIs(products, shipments);
    const performanceMetrics = calculatePerformanceMetrics(products, shipments);
    const dataInsights = calculateDataInsights(products, shipments);
    const operationalBreakdown = calculateOperationalBreakdown(products, shipments);
    const brandPerformance = calculateBrandPerformance(products, shipments);

    // This part of the code generates analytics-specific AI insights
    const insightsData = await generateAnalyticsInsights(products, shipments, kpis, performanceMetrics, brandPerformance);

    const analyticsData = {
      kpis,
      insights: insightsData.map((insight, index) => ({
        id: `analytics-insight-${index}`,
        title: insight.title,
        description: insight.description,
        severity:
          insight.severity === "critical"
            ? ("critical" as const)
            : insight.severity === "warning"
              ? ("warning" as const)
              : ("info" as const),
        dollarImpact: insight.dollarImpact || 0,
        suggestedActions: [
          `Review ${insight.title.toLowerCase()}`,
          "Implement optimization strategy",
        ],
        createdAt: new Date().toISOString(),
        source: "analytics_agent" as const,
      })),
      performanceMetrics,
      dataInsights,
      operationalBreakdown,
      brandPerformance,
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ Vercel API: Analytics data compiled successfully");
    res.status(200).json({
      success: true,
      data: analyticsData,
      message: "Analytics data retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Vercel API Error:", error);
    res.status(500).json({
      error: "Failed to fetch analytics data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
