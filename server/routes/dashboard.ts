import { RequestHandler } from "express";
import { logger } from "../../shared/services/logger";
import { dataFetchingService, type ProductData, type ShipmentData } from "../services/DataFetchingService";

/**
 * Server-side proxy for TinyBird and OpenAI APIs
 * Keeps all API keys secure on server-side only
 * URLs kept completely intact as they work
 */

// Note: ProductData and ShipmentData interfaces now imported from DataFetchingService
// This eliminates interface duplication and ensures type consistency

// This part of the code defines dashboard-specific types to eliminate any usage
interface DashboardData {
  products: ProductData[];
  shipments: ShipmentData[];
  kpis?: DashboardKPIs;
  insights?: DashboardInsight[];
  // Additional properties used in the routes
  warehouseInventory?: any[];
  quickOverview?: any;
  anomalies?: any[];
  performanceMetrics?: any;
  brandPerformance?: any;
  dataInsights?: any;
  operationalBreakdown?: any;
  lastUpdated?: string;
}

interface DashboardKPIs {
  totalProducts: number;
  totalShipments: number;
  totalValue: number;
  efficiency: number;
  // Legacy properties for backward compatibility
  totalOrdersToday?: number | null;
  atRiskOrders?: number | null;
  openPOs?: number | null;
  unfulfillableSKUs?: number;
  // Analytics properties
  orderVolumeGrowth?: number;
  returnRate?: number;
  fulfillmentEfficiency?: number;
  inventoryHealthScore?: number;
}

interface DashboardInsight {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category?: 'financial' | 'operational' | 'performance';
  impact?: string;
  recommendation?: string;
  dollarImpact?: number;
  suggestedActions?: string[];
  createdAt?: string;
  source?: string;
}

// This part of the code defines the raw AI response structure (unknown JSON shape)
interface RawAIInsight {
  id?: string;
  title?: string;
  description?: string;
  content?: string;
  severity?: 'critical' | 'warning' | 'info';
  category?: string;
  impact?: string;
  recommendation?: string;
  dollarImpact?: number;
  suggestedActions?: string[];
}

/**
 * Secure TinyBird Products API proxy
 * Environment keys not exposed to client
 */
export const getProductsData: RequestHandler = async (_req, res) => {
  const routeLogger = logger.createLogger({ endpoint: "products", component: "getProductsData" });
  
  try {
    routeLogger.info("Fetching TinyBird products data securely");

    const result = await dataFetchingService.fetchProducts({
      endpoint: "products",
      brandFilter: "Callahan-Smith"
    });

    routeLogger.info("Products data fetched successfully", {
      count: result.data.length
    });

    res.json({
      success: true,
      data: result.data,
      count: result.data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    routeLogger.error("TinyBird products fetch failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch products data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Secure TinyBird Shipments API proxy
 * Environment keys not exposed to client
 */
export const getShipmentsData: RequestHandler = async (_req, res) => {
  const routeLogger = logger.createLogger({ endpoint: "shipments", component: "getShipmentsData" });
  
  try {
    routeLogger.info("Fetching TinyBird shipments data securely");

    const result = await dataFetchingService.fetchShipments({
      endpoint: "shipments",
      brandFilter: "Callahan-Smith"
    });

    routeLogger.info("Shipments data fetched successfully", {
      count: result.data.length
    });

    res.json({
      success: true,
      data: result.data,
      count: result.data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    routeLogger.error("TinyBird shipments fetch failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch shipments data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Secure OpenAI Insights generation proxy
 * API key not exposed to client
 */
export const generateInsights: RequestHandler = async (req, res) => {
  try {
    console.log("🔒 Server: Generating AI insights securely...");

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY environment variable not configured");
    }

    const { analysisData } = req.body;
    if (!analysisData) {
      return res.status(400).json({
        success: false,
        error: "Analysis data required for insight generation",
      });
    }

    const prompt = buildAnalysisPrompt(analysisData);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API Error: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    const insights = parseInsightsResponse(result.choices[0].message.content);

    console.log(
      "✅ Server: AI insights generated successfully:",
      insights.length,
      "insights",
    );

    return res.json({
      success: true,
      insights,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Server: AI insight generation failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate AI insights",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Combined dashboard data endpoint
 * Fetches all data server-side and returns processed result
 */
export const getDashboardData: RequestHandler = async (req, res) => {
  const routeLogger = logger.createLogger({ endpoint: "dashboard", component: "getDashboardData" });
  const { mode } = req.query;
  
  try {
    // Handle insights-only mode for progressive loading
    if (mode === 'insights') {
      return handleInsightsMode(req, res);
    }
    
    // Handle fast mode (without insights)
    if (mode === 'fast') {
      return handleFastMode(req, res);
    }
    
    routeLogger.info("Fetching complete dashboard data securely");

    // This part of the code uses shared data service to fetch both datasets
    const { products, shipments } = await dataFetchingService.fetchProductsAndShipments(
      "dashboard",
      { productLimit: 100, shipmentLimit: 150, brandFilter: "Callahan-Smith" }
    );

    // Calculate all metrics server-side
    const kpis = calculateKPIs(products, shipments);
    const quickOverview = calculateQuickOverview(products, shipments);
    const warehouseInventory = getInventoryByWarehouse(products, shipments);
    const anomalies = detectAnomalies(products, shipments);

      // Try to generate AI insights (optional - don't fail if this fails)
  let insights: DashboardInsight[] = [];
  try {
    insights = await generateInsightsInternal({
      products,
      shipments,
      warehouseInventory,
      kpis,
    });
    } catch (error) {
      routeLogger.warn("AI insights generation failed, continuing without insights", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }

    const dashboardData = {
      products,
      shipments,
      kpis,
      quickOverview,
      warehouseInventory,
      insights,
      anomalies,
      lastUpdated: new Date().toISOString(),
    };

    routeLogger.info("Complete dashboard data processed successfully", {
      productCount: products.length,
      shipmentCount: shipments.length,
      insightCount: insights.length,
      anomalyCount: anomalies.length
    });

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    routeLogger.error("Dashboard data processing failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Handle insights-only mode for progressive loading
async function handleInsightsMode(req: any, res: any) {
  const routeLogger = logger.createLogger({ endpoint: "dashboard-insights", component: "handleInsightsMode" });
  
  try {
    routeLogger.info("Fetching dashboard insights only");

    const { products, shipments } = await dataFetchingService.fetchProductsAndShipments(
      "dashboard-insights",
      { productLimit: 100, shipmentLimit: 150, brandFilter: "Callahan-Smith" }
    );

    // Generate AI insights only
    let insights: DashboardInsight[] = [];
    try {
      insights = await generateInsightsInternal({
        products,
        shipments,
        warehouseInventory: getInventoryByWarehouse(products, shipments),
        kpis: calculateKPIs(products, shipments),
      });
    } catch (error) {
      routeLogger.warn("AI insights generation failed", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }

    routeLogger.info("Dashboard insights generated successfully", {
      insightCount: insights.length
    });

    res.json({
      success: true,
      data: {
        insights,
        dailyBrief: null, // Can be added later
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    routeLogger.error("Dashboard insights processing failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard insights",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Handle fast mode (without insights)
async function handleFastMode(req: any, res: any) {
  const routeLogger = logger.createLogger({ endpoint: "dashboard-fast", component: "handleFastMode" });
  
  try {
    routeLogger.info("Fetching fast dashboard data (no insights)");

    const { products, shipments } = await dataFetchingService.fetchProductsAndShipments(
      "dashboard-fast",
      { productLimit: 100, shipmentLimit: 150, brandFilter: "Callahan-Smith" }
    );

    // Calculate metrics without AI insights
    const kpis = calculateKPIs(products, shipments);
    const quickOverview = calculateQuickOverview(products, shipments);
    const warehouseInventory = getInventoryByWarehouse(products, shipments);
    const anomalies = detectAnomalies(products, shipments);

    const dashboardData = {
      products,
      shipments,
      kpis,
      quickOverview,
      warehouseInventory,
      insights: [], // No insights in fast mode
      anomalies,
      lastUpdated: new Date().toISOString(),
    };

    routeLogger.info("Fast dashboard data processed successfully", {
      productCount: products.length,
      shipmentCount: shipments.length,
      anomalyCount: anomalies.length
    });

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    routeLogger.error("Fast dashboard data processing failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch fast dashboard data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Internal helper functions (not exposed)
// Note: fetchProductsInternal and fetchShipmentsInternal functions removed
// Now using shared dataFetchingService for consistent data fetching

/**
 * This part of the code calculates real financial impact from operational data
 * Uses actual unit costs and quantity discrepancies for accurate dollar amounts
 */
function calculateFinancialImpacts(products: ProductData[], shipments: ShipmentData[]) {
  // Calculate impact from quantity discrepancies
  const quantityDiscrepancyImpact = shipments
    .filter(s => s.expected_quantity !== s.received_quantity && s.unit_cost)
    .reduce((sum, shipment) => {
      const quantityDiff = Math.abs(shipment.expected_quantity - shipment.received_quantity);
      return sum + (quantityDiff * (shipment.unit_cost || 0));
    }, 0);

  // Calculate impact from cancelled shipments
  const cancelledShipmentsImpact = shipments
    .filter(s => s.status === "cancelled" && s.unit_cost)
    .reduce((sum, shipment) => {
      return sum + (shipment.expected_quantity * (shipment.unit_cost || 0));
    }, 0);

  // Calculate lost revenue from inactive products
  const inactiveProductsValue = products
    .filter(p => !p.active && p.unit_cost)
    .reduce((sum, product) => {
      // Estimate monthly lost revenue potential
      return sum + ((product.unit_cost || 0) * product.unit_quantity * 30);
    }, 0);

  // Calculate total inventory value at risk
  const atRiskInventoryValue = shipments
    .filter(s => s.expected_quantity !== s.received_quantity || s.status === "cancelled")
    .reduce((sum, shipment) => {
      return sum + (shipment.received_quantity * (shipment.unit_cost || 0));
    }, 0);

  return {
    quantityDiscrepancyImpact: Math.round(quantityDiscrepancyImpact),
    cancelledShipmentsImpact: Math.round(cancelledShipmentsImpact),
    inactiveProductsValue: Math.round(inactiveProductsValue),
    atRiskInventoryValue: Math.round(atRiskInventoryValue),
    totalFinancialRisk: Math.round(quantityDiscrepancyImpact + cancelledShipmentsImpact + inactiveProductsValue)
  };
}

async function generateInsightsInternal(data: DashboardData): Promise<DashboardInsight[]> {
  const prompt = buildAnalysisPrompt(data);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) throw new Error("OpenAI API Error");

  const result = await response.json();
  return parseInsightsResponse(result.choices[0].message.content);
}

function buildAnalysisPrompt(data: DashboardData): string {
  const { products, shipments } = data;
  
  const financialImpacts = calculateFinancialImpacts(products, shipments);
  const totalProducts = products.length;
  const totalShipments = shipments.length;
  const inactiveProducts = products.filter((p: ProductData) => !p.active).length;
  const atRiskShipments = shipments.filter((s: ShipmentData) => s.expected_quantity !== s.received_quantity).length;
  const cancelledShipments = shipments.filter((s: ShipmentData) => s.status === "cancelled").length;
  const totalShipmentValue = shipments.reduce((sum: number, s: ShipmentData) => sum + (s.received_quantity * (s.unit_cost || 0)), 0);

  return `
You are a 3PL operations analyst. Analyze this real logistics data and generate 2-3 actionable insights with real financial impact.

OPERATIONAL DATA:
- Total Products: ${totalProducts} (${inactiveProducts} inactive)
- Total Shipments: ${totalShipments} (${atRiskShipments} with quantity discrepancies, ${cancelledShipments} cancelled)
- Total Shipment Value: $${Math.round(totalShipmentValue).toLocaleString()}

FINANCIAL IMPACT ANALYSIS:
- Quantity Discrepancy Impact: $${financialImpacts.quantityDiscrepancyImpact.toLocaleString()}
- Cancelled Shipments Impact: $${financialImpacts.cancelledShipmentsImpact.toLocaleString()}
- Inactive Products Lost Revenue: $${financialImpacts.inactiveProductsValue.toLocaleString()}/month
- Total Financial Risk: $${financialImpacts.totalFinancialRisk.toLocaleString()}

Generate insights focusing on the highest financial impact areas. Include specific dollar amounts and percentages.

FORMAT AS JSON ARRAY:
[
  {
    "title": "Specific Issue Title",
    "description": "Detailed analysis with financial impact and recommendations",
    "severity": "critical|warning|info",
    "dollarImpact": actual_dollar_amount,
    "suggestedActions": ["Action 1", "Action 2"]
  }
]
`;
}

function parseInsightsResponse(content: string) {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found");

    const insights = JSON.parse(jsonMatch[0]);
    const timestamp = new Date().toISOString();

    return insights.map((insight: RawAIInsight, index: number): DashboardInsight => ({
      id: `ai-insight-${Date.now()}-${index}`,
      title: insight.title || "AI Generated Insight",
      description: insight.description || "Analysis from operational data",
      severity: insight.severity || "info",
      dollarImpact: insight.dollarImpact || 0,
      suggestedActions: Array.isArray(insight.suggestedActions)
        ? insight.suggestedActions
        : [],
      createdAt: timestamp,
      source: "dashboard_agent",
    }));
  } catch (error) {
    console.error("Failed to parse AI insights:", error);
    // This part of the code returns empty insights when AI parsing fails - only show real data-driven insights
    return [];
  }
}

// KPI calculation functions (same logic as client-side)
function calculateKPIs(products: ProductData[], shipments: ShipmentData[]) {
  const today = new Date().toISOString().split("T")[0];

  const totalOrdersToday = shipments.filter(
    (shipment) => shipment.created_date === today,
  ).length;

  const atRiskOrders = shipments.filter(
    (shipment) =>
      shipment.expected_quantity !== shipment.received_quantity ||
      shipment.status === "cancelled",
  ).length;

  const openPOs = new Set(
    shipments
      .filter(
        (shipment) =>
          shipment.purchase_order_number &&
          shipment.status !== "completed" &&
          shipment.status !== "cancelled",
      )
      .map((shipment) => shipment.purchase_order_number),
  ).size;

  const unfulfillableSKUs = products.filter(
    (product) => !product.active,
  ).length;

  return {
    totalProducts: products.length,
    totalShipments: shipments.length,
    totalValue: shipments.reduce((sum, s) => sum + (s.received_quantity * (s.unit_cost || 0)), 0),
    efficiency: shipments.length > 0 ? (shipments.filter(s => s.expected_quantity === s.received_quantity).length / shipments.length) * 100 : 0,
    totalOrdersToday: totalOrdersToday > 0 ? totalOrdersToday : null,
    atRiskOrders: atRiskOrders > 0 ? atRiskOrders : null,
    openPOs: openPOs > 0 ? openPOs : null,
    unfulfillableSKUs,
  };
}

function calculateQuickOverview(
  _products: ProductData[],
  shipments: ShipmentData[],
) {
  const atRiskCount = shipments.filter(
    (shipment) =>
      shipment.expected_quantity !== shipment.received_quantity ||
      shipment.status === "cancelled",
  ).length;

  const onTrackCount = shipments.filter(
    (shipment) =>
      shipment.expected_quantity === shipment.received_quantity &&
      shipment.status !== "cancelled",
  ).length;

  const dollarImpact = shipments
    .filter(
      (shipment) => shipment.expected_quantity !== shipment.received_quantity,
    )
    .reduce((sum, shipment) => {
      const quantityDiff = Math.abs(
        shipment.expected_quantity - shipment.received_quantity,
      );
      const cost = shipment.unit_cost || 0;
      return sum + quantityDiff * cost;
    }, 0);

  const completedWorkflows = new Set(
    shipments
      .filter(
        (shipment) =>
          shipment.status === "receiving" || shipment.status === "completed",
      )
      .map((shipment) => shipment.purchase_order_number),
  ).size;

  return {
    topIssues: atRiskCount,
    whatsWorking: onTrackCount,
    dollarImpact: Math.round(dollarImpact),
    completedWorkflows,
  };
}

function getInventoryByWarehouse(
  products: ProductData[],
  shipments: ShipmentData[],
) {
  // This part of the code provides realistic warehouse-specific inventory numbers  
  // Using proper Map-based deduplication to ensure unique warehouses
  const warehouseMap = new Map();
  shipments.forEach((s) => {
    if (s.warehouse_id && !warehouseMap.has(s.warehouse_id)) {
      warehouseMap.set(s.warehouse_id, {
        id: s.warehouse_id,
        name: s.supplier, // Use supplier as warehouse name
      });
    }
  });
  
  return Array.from(warehouseMap.values()).map((warehouse) => {
    // This part of the code calculates real warehouse inventory from actual shipment data
    const warehouseShipments = shipments.filter(s => s.warehouse_id === warehouse.id);
    const warehouseProducts = products.filter(p => 
      warehouseShipments.some(s => s.inventory_item_id === p.inventory_item_id)
    );
    
    const totalInventory = warehouseShipments.reduce((sum, shipment) => 
      sum + shipment.received_quantity, 0
    );
    
    const averageCost = warehouseShipments.length > 0 
      ? warehouseShipments
          .filter(s => s.unit_cost !== null)
          .reduce((sum, shipment) => sum + (shipment.unit_cost || 0), 0) / 
        warehouseShipments.filter(s => s.unit_cost !== null).length
      : 0;
    
    return {
      warehouseId: warehouse.id,
      totalInventory,
      productCount: warehouseProducts.length,
      averageCost: Math.round(averageCost || 0),
    };
  });
}

function detectAnomalies(products: ProductData[], shipments: ShipmentData[]) {
  const anomalies = [];

  const unfulfillableCount = products.filter((p) => !p.active).length;
  if (unfulfillableCount > 100) {
    anomalies.push({
      id: "high-unfulfillable-skus",
      type: "high_unfulfillable_skus",
      title: "High Unfulfillable SKUs",
      description: `${unfulfillableCount} SKUs cannot be fulfilled`,
      severity: "critical",
      icon: "⚠️",
      createdAt: new Date().toISOString(),
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = shipments.filter((s) => s.created_date === today).length;
  if (todayOrders === 0) {
    anomalies.push({
      id: "low-order-volume",
      type: "low_order_volume",
      title: "Low Order Volume",
      description: "No orders detected today",
      severity: "info",
      icon: "📊",
      createdAt: new Date().toISOString(),
    });
  }

  return anomalies;
}

/**
 * Analytics data endpoint
 * Fetches and processes data for the analytics dashboard
 */
export const getAnalyticsData: RequestHandler = async (_req, res) => {
  const routeLogger = logger.createLogger({ endpoint: "analytics", component: "getAnalyticsData" });
  
  try {
    routeLogger.info("Fetching complete analytics data securely");

    // This part of the code uses shared data service to fetch both datasets
    const { products, shipments } = await dataFetchingService.fetchProductsAndShipments(
      "analytics",
      { productLimit: 100, shipmentLimit: 150, brandFilter: "Callahan-Smith" }
    );

    // This part of the code calculates analytics-specific metrics
    const kpis = calculateAnalyticsKPIs(products, shipments);
    const performanceMetrics = calculatePerformanceMetrics(products, shipments);
    const dataInsights = calculateDataInsights(products, shipments);
    const operationalBreakdown = calculateOperationalBreakdown(products, shipments);
    const brandPerformance = calculateBrandPerformance(products, shipments);

    // This part of the code tries to generate analytics-specific AI insights
    let insights: DashboardInsight[] = [];
    try {
      insights = await generateAnalyticsInsightsInternal({
        products,
        shipments,
        kpis,
        performanceMetrics,
        brandPerformance,
      });
    } catch (error) {
      routeLogger.warn("Analytics AI insights generation failed, continuing without insights", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }

    const analyticsData = {
      kpis,
      insights,
      performanceMetrics,
      dataInsights,
      operationalBreakdown,
      brandPerformance,
      lastUpdated: new Date().toISOString(),
    };

    routeLogger.info("Complete analytics data processed successfully", {
      productCount: products.length,
      shipmentCount: shipments.length,
      insightCount: insights.length
    });

    res.json({
      success: true,
      data: analyticsData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    routeLogger.error("Analytics data processing failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Analytics calculation functions
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
    totalProducts: products.length,
    totalShipments: shipments.length,
    totalValue: shipments.reduce((sum, s) => sum + (s.received_quantity * (s.unit_cost || 0)), 0),
    efficiency: fulfillmentEfficiency,
    orderVolumeGrowth: Math.round(orderVolumeGrowth * 10) / 10,
    returnRate: Math.round(returnRate * 10) / 10,
    fulfillmentEfficiency: Math.round(fulfillmentEfficiency * 10) / 10,
    inventoryHealthScore: Math.round(inventoryHealthScore * 10) / 10,
  };
}

function calculatePerformanceMetrics(_products: ProductData[], shipments: ShipmentData[]) {
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

function calculateBrandPerformance(products: ProductData[], _shipments: ShipmentData[]) {
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
      if (index === 0) performanceLevel = "Leading Brand";
      else if (index <= 2) performanceLevel = "Top Performer";
      else if (index <= Math.ceil(brandRankings.length * 0.3)) performanceLevel = "Strong Performer";
      else if (index <= Math.ceil(brandRankings.length * 0.7)) performanceLevel = "Average Performer";
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

async function generateAnalyticsInsightsInternal(data: DashboardData): Promise<DashboardInsight[]> {
  const prompt = buildAnalyticsPrompt(data);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) throw new Error("OpenAI API Error");

  const result = await response.json();
  return parseAnalyticsInsightsResponse(result.choices[0].message.content);
}

function buildAnalyticsPrompt(data: DashboardData): string {
  const { kpis } = data;
  const performanceMetrics = data.performanceMetrics || {};
  const brandPerformance = data.brandPerformance || {};
  
  return `
You are a 3PL analytics specialist. Analyze this analytics data and generate 2-3 actionable insights focused on performance trends and optimization opportunities.

ANALYTICS KPIS:
- Order Volume Growth: ${kpis?.orderVolumeGrowth || 0}%
- Return Rate: ${kpis?.returnRate || 0}%
- Fulfillment Efficiency: ${kpis?.fulfillmentEfficiency || 0}%
- Inventory Health Score: ${kpis?.inventoryHealthScore || 0}%

PERFORMANCE METRICS:
- Order Volume Growth Rate: ${performanceMetrics?.orderVolumeTrend?.growthRate || 0}%
- Fulfillment Efficiency Rate: ${performanceMetrics?.fulfillmentPerformance?.efficiencyRate || 0}%
- Total Orders Analyzed: ${performanceMetrics?.orderVolumeTrend?.totalOrdersAnalyzed || 0}

BRAND PERFORMANCE:
- Total Brands: ${brandPerformance?.totalBrands || 0}
- Top Brand: ${brandPerformance?.topBrand?.name || 'N/A'} (${brandPerformance?.topBrand?.skuCount || 0} SKUs)
- Brand Distribution: ${brandPerformance?.brandRankings?.length || 0} ranked brands

Generate insights focusing on analytics trends, efficiency improvements, and brand performance optimization.

FORMAT AS JSON ARRAY:
[
  {
    "title": "Analytics Insight Title",
    "description": "Detailed analysis with trends and recommendations",
    "severity": "critical|warning|info",
    "dollarImpact": estimated_dollar_amount,
    "suggestedActions": ["Action 1", "Action 2"]
  }
]
`;
}

function parseAnalyticsInsightsResponse(content: string) {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found");

    const insights = JSON.parse(jsonMatch[0]);
    const timestamp = new Date().toISOString();

    return insights.map((insight: RawAIInsight, index: number): DashboardInsight => ({
      id: `analytics-insight-${Date.now()}-${index}`,
      title: insight.title || "Analytics Insight",
      description: insight.description || "Analytics trend analysis",
      severity: insight.severity || "info",
      dollarImpact: insight.dollarImpact || 0,
      suggestedActions: Array.isArray(insight.suggestedActions)
        ? insight.suggestedActions
        : [],
      createdAt: timestamp,
      source: "analytics_agent",
    }));
  } catch (error) {
    console.error("Failed to parse analytics insights:", error);
    return [];
  }
}
