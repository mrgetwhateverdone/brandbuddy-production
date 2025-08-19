import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ProductData, ShipmentData } from "@/types/api";

interface ReplenishmentKPIs {
  criticalSKUs: number;
  replenishmentValue: number;
  supplierAlerts: number;
  reorderRecommendations: number;
}

interface ReplenishmentData {
  kpis: ReplenishmentKPIs;
  insights: any[];
  criticalItems: any[];
  supplierPerformance: any[];
  reorderSuggestions: any[];
  lastUpdated: string;
}

// This part of the code fetches product data from TinyBird for replenishment analysis
async function fetchProducts(): Promise<ProductData[]> {
  const TINYBIRD_BASE_URL = process.env.TINYBIRD_BASE_URL;
  const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN;

  if (!TINYBIRD_BASE_URL || !TINYBIRD_TOKEN) {
    console.log("⚠️ TinyBird credentials not available");
    return [];
  }

  try {
    const url = `${TINYBIRD_BASE_URL}/v0/pipes/product_details_mv.json?brand_name=Callahan-Smith&token=${TINYBIRD_TOKEN}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TinyBird API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.log("⚠️ TinyBird fetch failed:", error);
    return [];
  }
}

// This part of the code fetches shipment data from TinyBird for supplier performance analysis
async function fetchShipments(): Promise<ShipmentData[]> {
  const TINYBIRD_BASE_URL = process.env.TINYBIRD_BASE_URL;
  const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN;

  if (!TINYBIRD_BASE_URL || !TINYBIRD_TOKEN) {
    console.log("⚠️ TinyBird credentials not available");
    return [];
  }

  try {
    const url = `${TINYBIRD_BASE_URL}/v0/pipes/inbound_shipments_details_mv.json?brand_name=Callahan-Smith&token=${TINYBIRD_TOKEN}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TinyBird API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.log("⚠️ TinyBird fetch failed:", error);
    return [];
  }
}

// This part of the code calculates replenishment KPIs from inventory and shipment data
function calculateReplenishmentKPIs(products: ProductData[], shipments: ShipmentData[]): ReplenishmentKPIs {
  // This part of the code identifies critical SKUs with low inventory levels
  const criticalSKUs = products.filter(p => 
    p.active && p.unit_quantity > 0 && p.unit_quantity < 5
  ).length;

  // This part of the code calculates total value of items needing replenishment
  const lowStockItems = products.filter(p => 
    p.active && p.unit_quantity > 0 && p.unit_quantity < 10
  );
  const replenishmentValue = lowStockItems.reduce((sum, p) => {
    const cost = p.unit_cost || 0;
    const suggestedOrder = Math.max(20 - p.unit_quantity, 0); // Suggest reorder to 20 units
    return sum + (suggestedOrder * cost);
  }, 0);

  // This part of the code identifies suppliers with delayed or problematic shipments
  const recentShipments = shipments.filter(s => {
    const shipmentDate = new Date(s.created_date);
    const daysAgo = (Date.now() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });
  const delayedShipments = recentShipments.filter(s => 
    s.expected_quantity !== s.received_quantity || s.status === 'delayed'
  );
  const supplierAlerts = new Set(delayedShipments.map(s => s.supplier)).size;

  // This part of the code counts AI-generated reorder recommendations
  const outOfStockItems = products.filter(p => p.active && p.unit_quantity === 0);
  const reorderRecommendations = criticalSKUs + outOfStockItems.length;

  return {
    criticalSKUs,
    replenishmentValue: Math.round(replenishmentValue),
    supplierAlerts,
    reorderRecommendations
  };
}

// This part of the code generates AI insights for replenishment management using OpenAI
async function generateReplenishmentInsights(
  products: ProductData[],
  shipments: ShipmentData[],
  kpis: ReplenishmentKPIs
): Promise<any[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // This part of the code returns empty insights when no API key is available - no fallback data
    return [];
  }

  try {
    // This part of the code prepares data for AI analysis
    const criticalItems = products.filter(p => 
      p.active && p.unit_quantity > 0 && p.unit_quantity < 5
    );
    const outOfStockItems = products.filter(p => p.active && p.unit_quantity === 0);
    const supplierIssues = shipments.filter(s => 
      s.expected_quantity !== s.received_quantity
    );

    const prompt = `You are the Replenishment Intelligence Agent for BrandBuddy. Analyze this Callahan-Smith inventory data and provide actionable replenishment insights.

INVENTORY ANALYSIS:
- Critical SKUs (< 5 units): ${kpis.criticalSKUs}
- Out of Stock SKUs: ${outOfStockItems.length}
- Replenishment Value Needed: $${kpis.replenishmentValue.toLocaleString()}
- Supplier Issues: ${kpis.supplierAlerts} suppliers with delays

CRITICAL ITEMS NEEDING IMMEDIATE ATTENTION:
${criticalItems.slice(0, 5).map(item => 
  `- ${item.product_name} (${item.product_sku}): ${item.unit_quantity} units left, Supplier: ${item.supplier_name}`
).join('\n')}

OUT OF STOCK ITEMS:
${outOfStockItems.slice(0, 3).map(item => 
  `- ${item.product_name} (${item.product_sku}): ZERO inventory, Supplier: ${item.supplier_name}`
).join('\n')}

SUPPLIER PERFORMANCE ISSUES:
${supplierIssues.slice(0, 3).map(s => 
  `- ${s.supplier}: Expected ${s.expected_quantity}, Received ${s.received_quantity} (${s.sku})`
).join('\n')}

Generate 2-4 specific, actionable insights focusing on:
1. URGENT REORDER PRIORITIES - Which SKUs need immediate purchase orders
2. SUPPLIER RELIABILITY - Which suppliers need attention or alternative sourcing
3. INVENTORY OPTIMIZATION - Patterns in stockouts and recommended safety levels
4. FINANCIAL IMPACT - Revenue risk from stockouts and optimal order timing

Each insight should be concise, specific to Callahan-Smith operations, and include dollar impact when relevant.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';

    // This part of the code parses AI response into structured insights
    const insights = [];
    const lines = aiContent.split('\n').filter(line => line.trim());
    
    let currentInsight = '';
    let insightCount = 0;
    
    for (const line of lines) {
      if (line.match(/^\d+\.|^[A-Z\s]+:/) && insightCount < 4) {
        if (currentInsight) {
          insights.push({
            id: `replenishment-insight-${insightCount}`,
            title: currentInsight.split(':')[0] || `Replenishment Alert ${insightCount + 1}`,
            description: currentInsight.split(':').slice(1).join(':').trim() || currentInsight,
            severity: insightCount === 0 ? 'critical' as const : 'warning' as const,
            dollarImpact: Math.round(kpis.replenishmentValue * 0.25 * (insightCount + 1)),
            suggestedActions: ["Review reorder points", "Contact supplier", "Analyze demand patterns"],
            createdAt: new Date().toISOString(),
            source: "replenishment_agent" as const,
          });
          insightCount++;
        }
        currentInsight = line.replace(/^\d+\.\s*/, '');
      } else if (currentInsight) {
        currentInsight += ' ' + line;
      }
    }

    // This part of the code adds final insight if exists
    if (currentInsight && insightCount < 4) {
      insights.push({
        id: `replenishment-insight-${insightCount}`,
        title: currentInsight.split(':')[0] || `Replenishment Alert ${insightCount + 1}`,
        description: currentInsight.split(':').slice(1).join(':').trim() || currentInsight,
        severity: 'warning' as const,
        dollarImpact: Math.round(kpis.replenishmentValue * 0.15),
        suggestedActions: ["Review reorder points", "Contact supplier"],
        createdAt: new Date().toISOString(),
        source: "replenishment_agent" as const,
      });
    }

    return insights;

  } catch (error) {
    console.error("Replenishment AI analysis failed:", error);
  }
  
  // This part of the code returns empty insights when AI fails - no fallback data
  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🚨 Building world-class replenishment intelligence for Callahan-Smith...");

    // This part of the code fetches real data for replenishment analysis
    const [allProducts, allShipments] = await Promise.all([
      fetchProducts(),
      fetchShipments()
    ]);

    // This part of the code ensures only Callahan-Smith data is processed
    const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    
    console.log(`🔍 Replenishment data filtered for Callahan-Smith: ${products.length} products, ${shipments.length} shipments`);

    if (products.length === 0) {
      // This part of the code returns empty state when no data is available
      return res.status(200).json({
        success: true,
        data: {
          kpis: {
            criticalSKUs: 0,
            replenishmentValue: 0,
            supplierAlerts: 0,
            reorderRecommendations: 0
          },
          insights: [{
            id: "replenishment-insight-1",
            title: "Information Not Available",
            description: "Replenishment data is not available. Data source connection required.",
            severity: "info" as const,
            dollarImpact: 0,
            suggestedActions: ["Check data source connection"],
            createdAt: new Date().toISOString(),
            source: "replenishment_agent" as const,
          }],
          criticalItems: [],
          supplierPerformance: [],
          reorderSuggestions: [],
          lastUpdated: new Date().toISOString(),
        },
        message: "No replenishment data available",
        timestamp: new Date().toISOString(),
      });
    }

    // This part of the code calculates replenishment intelligence
    const kpis = calculateReplenishmentKPIs(products, shipments);
    const insights = await generateReplenishmentInsights(products, shipments, kpis);

    const replenishmentData: ReplenishmentData = {
      kpis,
      insights,
      criticalItems: [], // Will be populated in future iterations
      supplierPerformance: [], // Will be populated in future iterations  
      reorderSuggestions: [], // Will be populated in future iterations
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ World-class replenishment intelligence generated:", {
      criticalSKUs: kpis.criticalSKUs,
      replenishmentValue: kpis.replenishmentValue,
      supplierAlerts: kpis.supplierAlerts,
      insights: insights.length
    });

    res.status(200).json({
      success: true,
      data: replenishmentData,
      message: "Replenishment data retrieved successfully",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Replenishment API error:", error);
    res.status(500).json({
      error: "Failed to fetch replenishment data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
