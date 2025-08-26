import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code provides AI insights ONLY for dashboard
 * Loads after fast data for progressive enhancement
 * Optimized for speed with reduced token limits
 */

// TinyBird Product Details API Response - standardized interface (minimal for insights)
interface ProductData {
  product_id: string;
  brand_name: string;
  product_name: string;
  product_sku: string | null;
  unit_quantity: number;
  unit_cost: number | null;
  active: boolean;
  supplier_name: string;
  created_date: string;
}

// TinyBird Shipments API Response - standardized interface (minimal for insights)
interface ShipmentData {
  shipment_id: string;
  brand_name: string;
  created_date: string;
  status: string;
  supplier: string | null;
  expected_quantity: number;
  received_quantity: number;
  unit_cost: number | null;
}

/**
 * This part of the code generates AI insights using real financial data
 * Optimized for speed with reduced token limits
 */
interface InsightData {
  type: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  dollarImpact?: number;
  suggestedActions?: string[];
}

/**
 * This part of the code fetches minimal data needed for insights only
 */
async function fetchProductsForInsights(): Promise<ProductData[]> {
  const baseUrl = process.env.TINYBIRD_BASE_URL;
  const token = process.env.TINYBIRD_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "TINYBIRD_BASE_URL and TINYBIRD_TOKEN environment variables are required",
    );
  }

  const url = `${baseUrl}?token=${token}&limit=100&brand_name=Callahan-Smith`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return (result.data || []).map((p: any) => ({
    product_id: p.product_id,
    brand_name: p.brand_name,
    product_name: p.product_name,
    product_sku: p.product_sku,
    unit_quantity: p.unit_quantity,
    unit_cost: p.unit_cost,
    active: p.active,
    supplier_name: p.supplier_name,
    created_date: p.created_date,
  }));
}

/**
 * This part of the code fetches minimal shipments data needed for insights only
 */
async function fetchShipmentsForInsights(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "WAREHOUSE_BASE_URL and WAREHOUSE_TOKEN environment variables are required",
    );
  }

  const url = `${baseUrl}?token=${token}&limit=150&brand_name=Callahan-Smith`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return (result.data || []).map((s: any) => ({
    shipment_id: s.shipment_id,
    brand_name: s.brand_name,
    created_date: s.created_date,
    status: s.status,
    supplier: s.supplier,
    expected_quantity: s.expected_quantity,
    received_quantity: s.received_quantity,
    unit_cost: s.unit_cost,
  }));
}

/**
 * This part of the code calculates real financial impact for insights
 */
function calculateFinancialImpacts(products: ProductData[], shipments: ShipmentData[]) {
  const quantityDiscrepancyImpact = shipments
    .filter(s => s.expected_quantity !== s.received_quantity && s.unit_cost)
    .reduce((sum, shipment) => {
      const quantityDiff = Math.abs(shipment.expected_quantity - shipment.received_quantity);
      return sum + (quantityDiff * (shipment.unit_cost || 0));
    }, 0);

  const cancelledShipmentsImpact = shipments
    .filter(s => s.status === "cancelled" && s.unit_cost)
    .reduce((sum, shipment) => {
      return sum + (shipment.expected_quantity * (shipment.unit_cost || 0));
    }, 0);

  const inactiveProductsValue = products
    .filter(p => !p.active && p.unit_cost)
    .reduce((sum, product) => {
      return sum + ((product.unit_cost || 0) * Math.min(product.unit_quantity, 10));
    }, 0);

  return {
    quantityDiscrepancyImpact: Math.round(quantityDiscrepancyImpact),
    cancelledShipmentsImpact: Math.round(cancelledShipmentsImpact),
    inactiveProductsValue: Math.round(inactiveProductsValue),
    totalFinancialRisk: Math.round(quantityDiscrepancyImpact + cancelledShipmentsImpact + inactiveProductsValue)
  };
}

async function generateInsights(
  products: ProductData[],
  shipments: ShipmentData[],
): Promise<InsightData[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 Dashboard Insights API Key Check:', !!apiKey, 'Length:', apiKey?.length || 0);
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY not found in environment variables');
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
        title: "Improve Shipment and Fulfillment Performance", 
        description: `${atRiskCount} shipments (${atRiskPercentage}%) have quantity discrepancies with financial impact of $${financialImpacts.quantityDiscrepancyImpact.toLocaleString()}.`,
        severity: financialImpacts.quantityDiscrepancyImpact > 10000 ? "critical" : "warning",
        dollarImpact: financialImpacts.quantityDiscrepancyImpact,
      });
    }
    
    if (financialImpacts.cancelledShipmentsImpact > 0) {
      const cancelledCount = shipments.filter(s => s.status === "cancelled").length;
      insights.push({
        type: "warning", 
        title: "Reduce Supplier Concentration Risk",
        description: `${cancelledCount} cancelled shipments represent $${financialImpacts.cancelledShipmentsImpact.toLocaleString()} in lost inventory value.`,
        severity: financialImpacts.cancelledShipmentsImpact > 5000 ? "critical" : "warning",
        dollarImpact: financialImpacts.cancelledShipmentsImpact,
      });
    }
    
    const inactiveProducts = products.filter((p) => !p.active).length;
    if (inactiveProducts > 0 && financialImpacts.inactiveProductsValue > 0) {
      insights.push({
        type: "info",
        title: "Optimize Inventory and Product Portfolio",
        description: `${inactiveProducts} inactive products represent potential opportunity cost of $${financialImpacts.inactiveProductsValue.toLocaleString()}.`,
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
            content: `You are a Senior Operations Director with 15+ years of experience in supply chain management and business intelligence. You specialize in identifying critical operational bottlenecks and implementing data-driven solutions that improve efficiency and reduce costs.

Analyze the current operational data including ${shipments.length} shipments, ${products.length} products, and ${new Set(shipments.map(s => s.supplier)).size} suppliers. Identify the top 3-5 most critical operational issues that need immediate attention. Focus on: shipment delays, inventory discrepancies, cost overruns, and performance bottlenecks. For each issue, provide specific actionable workflows like 'Implement automated reorder triggers for low-stock items' or 'Create escalation process for at-risk shipments'. Include financial impact estimates and ROI projections based on your extensive industry experience.

OPERATIONAL DATA OVERVIEW:
==========================================

BRAND PORTFOLIO STATUS:
- Managing ${products.length} products (${activeProducts} active, ${inactiveProducts} inactive)
- Working with ${uniqueSuppliers} suppliers across operations
- Current SKU utilization at ${skuUtilization.toFixed(1)}%
- Potential opportunity cost from inactive products: $${financialImpacts.inactiveProductsValue.toLocaleString()}

TODAY'S OPERATIONAL PERFORMANCE:
- Processed ${shipments.length} shipments (${onTimeShipments} on-time, ${delayedShipments} delayed)
- Quantity accuracy running at ${quantityAccuracy.toFixed(1)}% (${atRiskShipments} with variances)
- Financial impact from discrepancies: $${financialImpacts.quantityDiscrepancyImpact.toLocaleString()}
- Cancelled shipment losses: $${financialImpacts.cancelledShipmentsImpact.toLocaleString()}

RISK ASSESSMENT:
- Total value at risk: $${Math.round(totalShipmentValue).toLocaleString()}
- Supplier concentration risk: ${supplierConcentration.toFixed(1)}% from top 3 suppliers
- Total financial exposure: $${financialImpacts.totalFinancialRisk.toLocaleString()}

Based on your proven track record of reducing operational costs by 30-40% and improving efficiency metrics across multiple organizations, provide strategic insights with specific workflows that address the most critical operational bottlenecks. Each recommendation should include estimated financial impact and implementation timeline.

CRITICAL: You MUST provide exactly 3-5 strategic insights. Each insight MUST include 3-5 specific, actionable suggestedActions.

Format as JSON with 3-5 strategic insights:
[
  {
    "type": "warning",
    "title": "Strategic operational insight title",
    "description": "Professional analysis of the operational issue with specific data points, financial impact, and implementation strategy. Include your expert assessment of root causes and proven solutions.",
    "severity": "critical|warning|info",
    "dollarImpact": calculated_financial_impact,
    "suggestedActions": ["Implement automated reorder triggers for critical SKUs below safety stock", "Create escalation workflow for shipments approaching SLA deadlines", "Set up supplier performance scorecard with penalty clauses", "Establish real-time inventory monitoring dashboard", "Configure automated supplier notification system"]
  }
]

EACH INSIGHT MUST HAVE 3-5 DETAILED SUGGESTED ACTIONS. NO EXCEPTIONS.

Draw from your extensive experience in operational excellence and provide insights that deliver measurable business value.`,
          },
        ],
        max_tokens: 300, // OPTIMIZED for 3x speed improvement
        temperature: 0.2,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log('🤖 Dashboard Insights Raw OpenAI Response:', content.substring(0, 500) + '...');
        try {
          const parsed = JSON.parse(content);
          console.log('✅ Dashboard Insights Parsed:', parsed.length, 'insights with actions:', parsed.map(p => p.suggestedActions?.length || 0));
          return parsed;
        } catch (parseError) {
          console.error('❌ Dashboard Insights JSON Parse Error:', parseError);
          console.error('❌ Raw content that failed:', content?.substring(0, 500));
          throw parseError;
        }
      }
    } else {
      console.error('❌ OpenAI API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Dashboard Insights OpenAI analysis failed:', error);
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
      title: "Improve Shipment and Fulfillment Performance",
      description: `${atRiskCount} shipments (${atRiskPercentage}%) have quantity discrepancies with financial impact of $${financialImpacts.quantityDiscrepancyImpact.toLocaleString()}.`,
      severity: financialImpacts.quantityDiscrepancyImpact > 10000 ? "critical" : "warning",
      dollarImpact: financialImpacts.quantityDiscrepancyImpact,
    });
  }
  
  if (financialImpacts.cancelledShipmentsImpact > 0) {
    const cancelledCount = shipments.filter(s => s.status === "cancelled").length;
    insights.push({
      type: "warning", 
        title: "Reduce Supplier Concentration Risk",
      description: `${cancelledCount} cancelled shipments represent $${financialImpacts.cancelledShipmentsImpact.toLocaleString()} in lost inventory value.`,
      severity: financialImpacts.cancelledShipmentsImpact > 5000 ? "critical" : "warning",
      dollarImpact: financialImpacts.cancelledShipmentsImpact,
    });
  }
  
  const inactiveProducts = products.filter((p) => !p.active).length;
  if (inactiveProducts > 0 && financialImpacts.inactiveProductsValue > 0) {
    insights.push({
      type: "info",
      title: "Optimize Inventory and Product Portfolio",
      description: `${inactiveProducts} inactive products represent potential opportunity cost of $${financialImpacts.inactiveProductsValue.toLocaleString()}.`,
      severity: "info",
      dollarImpact: financialImpacts.inactiveProductsValue,
    });
  }
  
  return insights;
}

/**
 * This part of the code generates a conversational daily brief using OpenAI
 * Optimized for speed with reduced token limits
 */
async function generateDailyBrief(
  products: ProductData[],
  shipments: ShipmentData[],
  financialImpacts: any
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null; // No fallback - require real OpenAI connection
  }

  try {
    const atRiskShipments = shipments.filter(s => s.expected_quantity !== s.received_quantity).length;
    const cancelledShipments = shipments.filter(s => s.status === "cancelled").length;
    const inactiveProducts = products.filter(p => !p.active).length;
    const activeProducts = products.filter(p => p.active).length;
    const onTimeShipments = shipments.filter(s => s.status === "completed" || s.status === "delivered").length;

    // Calculate supplier concentration for risk analysis
    const supplierCounts = shipments.reduce((acc, s) => {
      const supplier = s.supplier || 'Unknown';
      acc[supplier] = (acc[supplier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSuppliers = Object.entries(supplierCounts).sort(([,a], [,b]) => b - a).slice(0, 3);
    const supplierConcentration = topSuppliers.length > 0 ? Math.round(topSuppliers.reduce((sum, [,count]) => sum + count, 0) / shipments.length * 100) : 0;

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
            content: `You are a senior operations assistant for BrandBuddy. Analyze today's operational data and provide a world-class executive briefing. Be direct, specific, and actionable.

BrandBuddy OPERATIONAL STATUS:
- Portfolio: ${products.length} total products (${activeProducts} active, ${inactiveProducts} inactive)
- Shipment Performance: ${shipments.length} processed (${onTimeShipments} on-time, ${atRiskShipments} with discrepancies, ${cancelledShipments} cancelled)
- Financial Exposure: $${financialImpacts.totalFinancialRisk.toLocaleString()} at risk from operational issues
- Supplier Risk: ${supplierConcentration}% concentration with top 3 suppliers
- Key Suppliers: ${topSuppliers.map(([name]) => name).join(', ')}

Write a 4-6 sentence executive brief that:
- Identifies today's highest-priority operational risks
- Quantifies financial impact in dollar terms
- Suggests immediate actions needed
- Mentions specific issues requiring attention

Example tone: "Today's high-priority risks center around delayed replenishment, missed inbound SLA, and fulfillment breakdown. Immediate actions are suggested on 3 of 4 issues to prevent over $22K in potential loss."

Do NOT include greetings, pleasantries, or source attributions. Start directly with the operational analysis.`,
          },
        ],
        max_tokens: 100, // OPTIMIZED for speed
        temperature: 0.2,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content.trim().replace(/"/g, ''); // Clean up quotes and whitespace
      }
    }
  } catch (error) {
    console.error("OpenAI daily brief failed:", error);
  }

  return null; // Return null if OpenAI fails - no fallback
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(
      "🤖 INSIGHTS API: Generating AI insights for dashboard (optimized for speed)...",
    );

    const [allProducts, allShipments] = await Promise.all([
      fetchProductsForInsights(),
      fetchShipmentsForInsights(),
    ]);

    // This part of the code ensures we only use Callahan-Smith data by filtering
    const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    
    console.log(`🔍 INSIGHTS: Data filtered for insights: ${products.length} products, ${shipments.length} shipments`);

    const insights = await generateInsights(products, shipments);
    
    // This part of the code calculates financial impacts for daily brief
    const financialImpacts = calculateFinancialImpacts(products, shipments);
    const dailyBrief = await generateDailyBrief(products, shipments, financialImpacts);

    const insightsData = {
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
        dollarImpact: insight.dollarImpact || 0,
        suggestedActions: insight.suggestedActions || [],
        createdAt: new Date().toISOString(),
        source: "dashboard_agent" as const,
      })),
      dailyBrief,
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ INSIGHTS API: Dashboard insights generated successfully");
    res.status(200).json({
      success: true,
      data: insightsData,
      message: "Dashboard insights generated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ INSIGHTS API Error:", error);
    res.status(500).json({
      error: "Failed to generate dashboard insights",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
