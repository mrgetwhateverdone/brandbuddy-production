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

// Analytics Insight interface for type safety
interface AnalyticsInsight {
  type: string;
  title: string;
  description: string;
  severity: string;
  dollarImpact: number;
  suggestedActions?: string[];
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

  // This part of the code fetches from product_details_mv API with Callahan-Smith brand filter
  const url = `${baseUrl}?token=${token}&limit=100&brand_name=Callahan-Smith`;
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

  // This part of the code fetches from inbound_shipments_details_mv API with Callahan-Smith brand filter
  const url = `${baseUrl}?token=${token}&limit=150&brand_name=Callahan-Smith`;
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
): Promise<AnalyticsInsight[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // This part of the code generates analytics insights without AI when API key is not available
    const insights: AnalyticsInsight[] = [];
    
    if (kpis.orderVolumeGrowth < -10) {
      insights.push({
        type: "warning",
        title: "Declining Order Volume",
        description: `Order volume has decreased by ${Math.abs(kpis.orderVolumeGrowth).toFixed(1)}% compared to previous period. This trend requires immediate attention to maintain business growth.`,
        severity: "warning",
        dollarImpact: 0, // No mock values - real impact calculation not available
      });
    }
    
    if (kpis.fulfillmentEfficiency < 80) {
      insights.push({
        type: "critical",
        title: "Low Fulfillment Efficiency",
        description: `Fulfillment efficiency at ${kpis.fulfillmentEfficiency.toFixed(1)}% is below optimal levels. Focus on process improvements to reach 90%+ efficiency.`,
        severity: "critical",
        dollarImpact: 0, // No mock values - real impact calculation not available
      });
    }
    
    if (brandPerformance.totalBrands > 5) {
      insights.push({
        type: "info",
        title: "Brand Portfolio Diversification",
        description: `Portfolio includes ${brandPerformance.totalBrands} brands with ${brandPerformance.topBrand.name} leading with ${brandPerformance.topBrand.skuCount} SKUs. Consider brand consolidation strategies.`,
        severity: "info",
        dollarImpact: 0, // No mock values - real impact calculation not available
      });
    }
    
    return insights;
  }

  try {
    // This part of the code calculates advanced analytics metrics for trend analysis
    const brandConcentration = brandPerformance.brandRankings.length > 0 ? 
      (brandPerformance.brandRankings.slice(0, Math.ceil(brandPerformance.brandRankings.length * 0.2))
        .reduce((sum, brand) => sum + brand.inventoryPercentage, 0)) : 0;
    
    const growthLeaders = brandPerformance.brandRankings
      .filter(brand => brand.inventoryPercentage > 10)
      .map(brand => brand.brandName).slice(0, 3);
    
    const decliningBrands = brandPerformance.brandRankings
      .filter(brand => brand.inventoryPercentage < 5)
      .map(brand => brand.brandName).slice(0, 3);
    
    const volumeVariance = performanceMetrics.orderVolumeTrend.totalOrdersAnalyzed > 0 ?
      Math.abs(performanceMetrics.orderVolumeTrend.growthRate) / 10 : 0;
    
    const consistencyScore = Math.max(0, 10 - volumeVariance);
    const trendConfidence = Math.min(95, 60 + (consistencyScore * 3.5));
    
    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    const response = await fetch(openaiUrl, {
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
            content: `You are a supply chain analytics specialist. Perform statistical analysis on this 3PL data to identify trends and optimization opportunities.

TREND ANALYSIS:
===============

ORDER VOLUME PATTERNS:
- Period-over-Period Growth: ${performanceMetrics.orderVolumeTrend.growthRate.toFixed(1)}% (${performanceMetrics.orderVolumeTrend.growthRate > 0 ? 'increasing' : 'decreasing'})
- Volume Variance: σ=${volumeVariance.toFixed(2)} (consistency: ${consistencyScore.toFixed(1)}/10)
- Total Orders Analyzed: ${performanceMetrics.orderVolumeTrend.totalOrdersAnalyzed}
- Trend Confidence: ${trendConfidence.toFixed(1)}% statistical significance

BRAND PERFORMANCE DISTRIBUTION:
- Brand Concentration: ${brandConcentration.toFixed(1)}% (top 20% brands)
- Total Brands: ${brandPerformance.totalBrands}
- Growth Leaders: ${growthLeaders.join(', ')} (high-volume brands)
- Emerging Brands: ${decliningBrands.join(', ')} (low-volume opportunities)

OPERATIONAL EFFICIENCY METRICS:
- Fulfillment Efficiency: ${kpis.fulfillmentEfficiency || 0}%
- Fulfillment Rate: ${performanceMetrics.fulfillmentPerformance.efficiencyRate.toFixed(1)}%
- Return Rate: ${kpis.returnRate || 0}% (quality indicator)
- Inventory Health Score: ${kpis.inventoryHealthScore || 0}%

PERFORMANCE CORRELATIONS:
- Brand Size vs Performance: ${brandPerformance.topBrand.skuCount} SKUs (top performer)
- Volume vs Efficiency: ${(performanceMetrics.fulfillmentPerformance.efficiencyRate / 100 * performanceMetrics.orderVolumeTrend.totalOrdersAnalyzed).toFixed(0)} efficient orders
- Growth vs Health: ${(kpis.orderVolumeGrowth || 0) > 0 && (kpis.inventoryHealthScore || 0) > 80 ? 'Positive correlation' : 'Risk area'}
- Brand Diversity Impact: ${brandPerformance.brandRankings.length} brands driving ${brandPerformance.topBrand.skuCount} total SKUs

PROVIDE ANALYTICAL INSIGHTS (2-4 insights based on statistical significance):
Focus on trends with >80% confidence and actionable optimization opportunities.

Include correlation analysis, trend projections, and statistical confidence levels.

FORMAT AS STATISTICAL ANALYSIS JSON:
[
  {
    "type": "warning",
    "title": "Analytics Insight Title",
    "description": "Statistical analysis with trend data, correlations, and predictive indicators for operational optimization",
    "severity": "critical|warning|info",
    "dollarImpact": calculated_dollar_impact,
    "suggestedActions": ["Investigate brand concentration risk with top 3 performers", "Implement demand forecasting for high-variance SKUs", "Schedule quarterly trend review with operations team"]
  }
]

CRITICAL: suggestedActions must be:
- Specific analytical tasks (not placeholder actions)
- Based on actual statistical findings in the data
- Ordered by impact (highest value first, supporting actions last)
- Include specific brand names, metrics, or timeframes
- Between 1-4 actions depending on insight complexity`,
          },
        ],
        max_tokens: 700,
        temperature: 0.2,
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
  const insights: AnalyticsInsight[] = [];
  
  if (kpis.orderVolumeGrowth < -10) {
    insights.push({
      type: "warning",
      title: "Declining Order Volume",
      description: `Order volume has decreased by ${Math.abs(kpis.orderVolumeGrowth).toFixed(1)}% compared to previous period. This trend requires immediate attention to maintain business growth.`,
      severity: "warning",
      dollarImpact: 0, // No mock values - real impact calculation not available
      suggestedActions: [
        "Analyze customer churn patterns for top brands",
        "Review pricing strategy against market conditions",
        "Implement customer retention campaigns"
      ]
    });
  }
  
  if (kpis.fulfillmentEfficiency < 80) {
    insights.push({
      type: "critical",
      title: "Low Fulfillment Efficiency",
      description: `Fulfillment efficiency at ${kpis.fulfillmentEfficiency.toFixed(1)}% is below optimal levels. Focus on process improvements to reach 90%+ efficiency.`,
      severity: "critical",
      dollarImpact: 0, // No mock values - real impact calculation not available
      suggestedActions: [
        "Audit warehouse processes for bottlenecks",
        "Implement staff training on efficiency best practices",
        "Review technology systems for automation opportunities"
      ]
    });
  }
  
  if (brandPerformance.totalBrands > 5) {
    insights.push({
      type: "info",
      title: "Brand Portfolio Diversification",
      description: `Portfolio includes ${brandPerformance.totalBrands} brands with ${brandPerformance.topBrand.name} leading with ${brandPerformance.topBrand.skuCount} SKUs. Consider brand consolidation strategies.`,
      severity: "info",
      dollarImpact: 0, // No mock values - real impact calculation not available
      suggestedActions: [
        `Monitor ${brandPerformance.topBrand.name} performance for concentration risk`,
        "Analyze profitability by brand to identify consolidation opportunities",
        "Schedule quarterly brand portfolio review"
      ]
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
