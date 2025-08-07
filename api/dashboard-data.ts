import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code standardizes the data interfaces to match the server implementation
 * Ensuring consistency between local development and Vercel production environments
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
 * Matches the server implementation to ensure consistent data structure
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
 * Matches the server implementation to ensure consistent data structure
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

/**
 * This part of the code generates AI insights using real financial data
 * Matches the server implementation calculations for consistent results
 */
interface InsightData {
  type: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  dollarImpact?: number;
}

async function generateInsights(
  products: ProductData[],
  shipments: ShipmentData[],
): Promise<InsightData[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // This part of the code generates data-driven insights with real financial impact when AI is not available
    const insights: InsightData[] = [];
    const financialImpacts = calculateFinancialImpacts(products, shipments);
    
    const atRiskCount = shipments.filter(
      (shipment) =>
        shipment.expected_quantity !== shipment.received_quantity ||
        shipment.status === "cancelled",
    ).length;
    
    const atRiskPercentage = shipments.length > 0 ? (atRiskCount / shipments.length * 100).toFixed(1) : 0;
    
    // Only include insights if they represent actual issues or notable conditions
    if (atRiskCount > 0 && financialImpacts.quantityDiscrepancyImpact > 0) {
      insights.push({
        type: "warning",
        title: "Quantity Discrepancy Impact",
        description: `${atRiskCount} shipments (${atRiskPercentage}%) have quantity discrepancies with financial impact of $${financialImpacts.quantityDiscrepancyImpact.toLocaleString()}.`,
        severity: financialImpacts.quantityDiscrepancyImpact > 10000 ? "critical" : "warning",
        dollarImpact: financialImpacts.quantityDiscrepancyImpact,
      });
    }
    
    if (financialImpacts.cancelledShipmentsImpact > 0) {
      const cancelledCount = shipments.filter(s => s.status === "cancelled").length;
      insights.push({
        type: "warning", 
        title: "Cancelled Shipments Impact",
        description: `${cancelledCount} cancelled shipments represent $${financialImpacts.cancelledShipmentsImpact.toLocaleString()} in lost inventory value.`,
        severity: financialImpacts.cancelledShipmentsImpact > 5000 ? "critical" : "warning",
        dollarImpact: financialImpacts.cancelledShipmentsImpact,
      });
    }
    
    const inactiveProducts = products.filter((p) => !p.active).length;
    if (inactiveProducts > 0 && financialImpacts.inactiveProductsValue > 0) {
      insights.push({
        type: "info",
        title: "Inactive Product Revenue Loss",
        description: `${inactiveProducts} inactive products represent potential monthly revenue loss of $${financialImpacts.inactiveProductsValue.toLocaleString()}.`,
        severity: "info",
        dollarImpact: financialImpacts.inactiveProductsValue,
      });
    }
    
    return insights;
  }

  try {
    const financialImpacts = calculateFinancialImpacts(products, shipments);
    
    // This part of the code calculates enhanced operational intelligence metrics
    const atRiskShipments = shipments.filter(s => s.expected_quantity !== s.received_quantity).length;
    const cancelledShipments = shipments.filter(s => s.status === "cancelled").length;
    const inactiveProducts = products.filter(p => !p.active).length;
    const activeProducts = products.filter(p => p.active).length;
    const totalShipmentValue = shipments.reduce((sum, s) => sum + (s.received_quantity * (s.unit_cost || 0)), 0);
    
    // Enhanced analytics calculations
    const uniqueBrands = new Set(products.map(p => p.brand_name)).size;
    const uniqueSuppliers = new Set(products.map(p => p.supplier_name)).size;
    const skuUtilization = activeProducts / products.length * 100;
    const onTimeShipments = shipments.filter(s => s.status === "completed" || s.status === "delivered").length;
    const delayedShipments = shipments.filter(s => s.status.includes("delayed") || s.status === "late").length;
    const quantityAccuracy = shipments.length > 0 ? (shipments.filter(s => s.expected_quantity === s.received_quantity).length / shipments.length) * 100 : 100;
    const avgOrderValue = totalShipmentValue / shipments.length;
    const costPerShipment = totalShipmentValue / shipments.length;
    
    // Geographic and supplier risk analysis
    const geoRiskCountries = shipments.filter(s => s.ship_from_country && ['China', 'Russia', 'Ukraine', 'Taiwan'].includes(s.ship_from_country)).length;
    const geoRiskPercent = shipments.length > 0 ? (geoRiskCountries / shipments.length) * 100 : 0;
    const topRiskCountries = Array.from(new Set(shipments.filter(s => s.ship_from_country && ['China', 'Russia', 'Ukraine', 'Taiwan'].includes(s.ship_from_country)).map(s => s.ship_from_country))).slice(0, 3);
    
    // Supplier concentration analysis
    const supplierCounts = shipments.reduce((acc, s) => {
      const supplier = s.supplier || 'Unknown';
      acc[supplier] = (acc[supplier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSuppliers = Object.entries(supplierCounts).sort(([,a], [,b]) => b - a).slice(0, 3);
    const supplierConcentration = topSuppliers.reduce((sum, [,count]) => sum + count, 0) / shipments.length * 100;
    
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
            content: `You are a senior 3PL operations analyst. Analyze this comprehensive logistics data and provide strategic insights with quantified financial impact.

OPERATIONAL INTELLIGENCE:
=========================

INVENTORY & PRODUCT ANALYSIS:
- Total Products: ${products.length} (${activeProducts} active, ${inactiveProducts} inactive)
- Product Diversity: ${uniqueBrands} brands across ${uniqueSuppliers} suppliers
- SKU Utilization: ${skuUtilization.toFixed(1)}% active portfolio
- Inactive Product Value: $${financialImpacts.inactiveProductsValue.toLocaleString()}/month lost opportunity

SHIPMENT & FULFILLMENT PERFORMANCE:
- Total Shipments: ${shipments.length} (${onTimeShipments} on-time, ${delayedShipments} delayed)
- Quantity Accuracy: ${quantityAccuracy.toFixed(1)}% (${atRiskShipments} with variances)
- Financial Impact of Delays: $${financialImpacts.quantityDiscrepancyImpact.toLocaleString()}
- Cancelled Shipment Impact: $${financialImpacts.cancelledShipmentsImpact.toLocaleString()}

RISK & FINANCIAL EXPOSURE:
- At-Risk Shipment Value: $${Math.round(totalShipmentValue).toLocaleString()}
- Geographic Risk Concentration: ${geoRiskPercent.toFixed(1)}% from ${topRiskCountries.join(', ')}
- Supplier Concentration Risk: ${supplierConcentration.toFixed(1)}% (top 3 suppliers)
- Total Financial Risk: $${financialImpacts.totalFinancialRisk.toLocaleString()}

EFFICIENCY & OPTIMIZATION OPPORTUNITIES:
- Average Order Value: $${avgOrderValue.toFixed(2)}
- Cost Per Shipment: $${costPerShipment.toFixed(2)}
- Processing Efficiency: ${quantityAccuracy.toFixed(1)}% accuracy rate
- Portfolio Optimization: ${((inactiveProducts / products.length) * 100).toFixed(1)}% inactive SKUs

PROVIDE STRATEGIC ANALYSIS (2-4 insights based on data significance):
Focus on the most critical operational issues with >$50K impact potential.

Each insight must include:
- Specific dollar impact (calculated from real data)
- Timeline for implementation (30/60/90 days)
- Success metrics to track progress
- Actionable next steps (1-4 actions based on complexity)

FORMAT AS ACTIONABLE JSON:
[
  {
    "type": "warning",
    "title": "Strategic Issue Title",
    "description": "Detailed analysis with financial impact, timeline, and specific recommendations for operational improvement",
    "severity": "critical|warning|info",
    "dollarImpact": actual_calculated_dollar_amount,
    "suggestedActions": ["Review supplier contracts with XYZ Corp", "Implement inventory cycle counting for inactive SKUs", "Schedule leadership review of geographic risk exposure"]
  }
]

CRITICAL: suggestedActions must be:
- Specific, actionable tasks (not generic placeholders)
- Ordered by priority (most important first, least important last)
- Relevant to the actual data analyzed
- Between 1-4 actions based on insight complexity
- Include specific company names, SKU categories, or process names when available`,
          },
        ],
        max_tokens: 800,
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
    console.error("OpenAI analysis failed:", error);
  }

  // This part of the code generates data-driven insights with real financial impact when AI fails
  const insights: InsightData[] = [];
  const financialImpacts = calculateFinancialImpacts(products, shipments);
  
  const atRiskCount = shipments.filter(
    (shipment) =>
      shipment.expected_quantity !== shipment.received_quantity ||
      shipment.status === "cancelled",
  ).length;
  
  const atRiskPercentage = shipments.length > 0 ? (atRiskCount / shipments.length * 100).toFixed(1) : 0;
  
  // Only include insights if they represent actual issues or notable conditions
  if (atRiskCount > 0 && financialImpacts.quantityDiscrepancyImpact > 0) {
    insights.push({
      type: "warning",
      title: "Quantity Discrepancy Impact",
      description: `${atRiskCount} shipments (${atRiskPercentage}%) have quantity discrepancies with financial impact of $${financialImpacts.quantityDiscrepancyImpact.toLocaleString()}.`,
      severity: financialImpacts.quantityDiscrepancyImpact > 10000 ? "critical" : "warning",
      dollarImpact: financialImpacts.quantityDiscrepancyImpact,
    });
  }
  
  if (financialImpacts.cancelledShipmentsImpact > 0) {
    const cancelledCount = shipments.filter(s => s.status === "cancelled").length;
    insights.push({
      type: "warning", 
      title: "Cancelled Shipments Impact",
      description: `${cancelledCount} cancelled shipments represent $${financialImpacts.cancelledShipmentsImpact.toLocaleString()} in lost inventory value.`,
      severity: financialImpacts.cancelledShipmentsImpact > 5000 ? "critical" : "warning",
      dollarImpact: financialImpacts.cancelledShipmentsImpact,
    });
  }
  
  const inactiveProducts = products.filter((p) => !p.active).length;
  if (inactiveProducts > 0 && financialImpacts.inactiveProductsValue > 0) {
    insights.push({
      type: "info",
      title: "Inactive Product Revenue Loss",
      description: `${inactiveProducts} inactive products represent potential monthly revenue loss of $${financialImpacts.inactiveProductsValue.toLocaleString()}.`,
      severity: "info",
      dollarImpact: financialImpacts.inactiveProductsValue,
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
      "📊 Vercel API: Fetching dashboard data with split environment variables...",
    );

    const [products, shipments] = await Promise.all([
      fetchProducts(),
      fetchShipments(),
    ]);

    const insights = await generateInsights(products, shipments);

    // This part of the code calculates KPIs using standardized logic matching server implementation
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

    const dashboardData = {
      products,
      shipments,
      kpis: {
        totalOrdersToday: totalOrdersToday > 0 ? totalOrdersToday : null,
        atRiskOrders: atRiskOrders > 0 ? atRiskOrders : null,
        openPOs: openPOs > 0 ? openPOs : null,
        unfulfillableSKUs,
      },
      quickOverview: {
        topIssues: atRiskOrders,
        whatsWorking: shipments.filter(
          (shipment) =>
            shipment.expected_quantity === shipment.received_quantity &&
            shipment.status !== "cancelled",
        ).length,
        dollarImpact: Math.round(shipments
          .filter(
            (shipment) => shipment.expected_quantity !== shipment.received_quantity,
          )
          .reduce((sum, shipment) => {
            const quantityDiff = Math.abs(
              shipment.expected_quantity - shipment.received_quantity,
            );
            const cost = shipment.unit_cost || 0;
            return sum + quantityDiff * cost;
          }, 0)),
        completedWorkflows: new Set(
          shipments
            .filter(
              (shipment) =>
                shipment.status === "receiving" || shipment.status === "completed",
            )
            .map((shipment) => shipment.purchase_order_number),
        ).size,
      },
      warehouseInventory: (() => {
        // This part of the code provides proper warehouse deduplication using Map
        const warehouseMap = new Map();
        shipments.forEach((s) => {
          if (s.warehouse_id && !warehouseMap.has(s.warehouse_id)) {
            warehouseMap.set(s.warehouse_id, {
              id: s.warehouse_id,
              name: s.supplier, // Use supplier as warehouse name to match server logic
            });
          }
        });
        
        return Array.from(warehouseMap.values());
      })().map((warehouse) => {
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
              .reduce((sum, shipment, _, arr) => sum + (shipment.unit_cost || 0), 0) / 
            warehouseShipments.filter(s => s.unit_cost !== null).length
          : 0;
        
        return {
          warehouseId: warehouse.id,
          totalInventory,
          productCount: warehouseProducts.length,
          averageCost: Math.round(averageCost || 0),
        };
      }),
      insights: insights.map((insight, index) => ({
        id: `insight-${index}`,
        title: insight.title,
        description: insight.description,
        severity:
          insight.severity === "critical"
            ? ("critical" as const)
            : insight.severity === "warning"
              ? ("warning" as const)
              : ("info" as const),
        dollarImpact: insight.dollarImpact || 0, // This part of the code uses real financial impact from AI or calculations
        suggestedActions: [
          `Review ${insight.title.toLowerCase()}`,
          "Take corrective action",
        ],
        createdAt: new Date().toISOString(),
        source: "dashboard_agent" as const,
      })),
      anomalies: [
        ...(unfulfillableSKUs > 100
          ? [
              {
                id: "anomaly-1",
                type: "high_unfulfillable_skus" as const,
                title: "High Unfulfillable SKUs",
                description: `${unfulfillableSKUs} SKUs cannot be fulfilled`,
                severity: "critical" as const,
                icon: "⚠️",
                createdAt: new Date().toISOString(),
              },
            ]
          : []),
        ...(totalOrdersToday === 0
          ? [
              {
                id: "anomaly-2",
                type: "low_order_volume" as const,
                title: "Low Order Volume",
                description: "No orders detected today",
                severity: "info" as const,
                icon: "📊",
                createdAt: new Date().toISOString(),
              },
            ]
          : []),
      ],
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ Vercel API: Dashboard data compiled successfully");
    res.status(200).json({
      success: true,
      data: dashboardData,
      message: "Dashboard data retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Vercel API Error:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
