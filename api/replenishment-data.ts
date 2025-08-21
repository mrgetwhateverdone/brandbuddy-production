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
  products: ProductData[];
  shipments: ShipmentData[];
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
    // This part of the code uses the same proven URL pattern as working inventory API
    const url = `${TINYBIRD_BASE_URL}?token=${TINYBIRD_TOKEN}&limit=1000&brand_name=Callahan-Smith`;
    console.log("🔒 Fetching products from TinyBird:", url.replace(TINYBIRD_TOKEN, "[TOKEN]"));
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log("⚠️ TinyBird API failed:", response.status, response.statusText);
      throw new Error(`TinyBird API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ TinyBird response:", result.data?.length || 0, "products");
    return result.data || [];
  } catch (error) {
    console.log("⚠️ TinyBird fetch failed:", error);
    return [];
  }
}

// This part of the code fetches shipment data from TinyBird for supplier performance analysis
async function fetchShipments(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    console.log("⚠️ Warehouse credentials not available");
    return [];
  }

  try {
    // This part of the code uses the same proven URL pattern as working orders API
    const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
    console.log("🔒 Fetching shipments from TinyBird:", url.replace(token, "[TOKEN]"));
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log("⚠️ TinyBird API failed:", response.status, response.statusText);
      throw new Error(`TinyBird API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ TinyBird response:", result.data?.length || 0, "shipments");
    return result.data || [];
  } catch (error) {
    console.log("⚠️ TinyBird fetch failed:", error);
    return [];
  }
}

// This part of the code calculates replenishment KPIs from inventory and shipment data
function calculateReplenishmentKPIs(products: ProductData[], shipments: ShipmentData[]): ReplenishmentKPIs {
  console.log('📊 Calculating replenishment KPIs for Callahan-Smith data:', {
    totalProducts: products.length,
    totalShipments: shipments.length,
    activeProducts: products.filter(p => p.active).length
  });
  
  // This part of the code identifies critical SKUs with low inventory levels (changed to <10 for more inclusive)
  const criticalSKUs = products.filter(p => 
    p.active && p.unit_quantity >= 0 && p.unit_quantity < 10
  ).length;

  // This part of the code calculates total value of items needing replenishment
  const lowStockItems = products.filter(p => 
    p.active && p.unit_quantity >= 0 && p.unit_quantity < 20
  );
  const replenishmentValue = lowStockItems.reduce((sum, p) => {
    const cost = p.unit_cost || 0;
    const suggestedOrder = Math.max(30 - p.unit_quantity, 0); // Suggest reorder to 30 units
    return sum + (suggestedOrder * cost);
  }, 0);

  // This part of the code identifies suppliers with recent shipment activity (extended to 60 days)
  const recentShipments = shipments.filter(s => {
    if (!s.created_date) return false;
    const shipmentDate = new Date(s.created_date);
    const daysAgo = (Date.now() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 60;
  });
  
  // Basic supplier alert calculation based on shipment status
  const supplierWithIssues = new Set();
  recentShipments.forEach(shipment => {
    if (shipment.status && (
      shipment.status.toLowerCase().includes('delay') || 
      shipment.status.toLowerCase().includes('exception') ||
      shipment.status.toLowerCase().includes('pending') ||
      shipment.status.toLowerCase().includes('problem')
    )) {
      if (shipment.supplier) supplierWithIssues.add(shipment.supplier);
    }
  });
  const supplierAlerts = supplierWithIssues.size;

  // This part of the code counts reorder recommendations
  const outOfStockItems = products.filter(p => p.active && p.unit_quantity === 0);
  const reorderRecommendations = Math.max(criticalSKUs, outOfStockItems.length, 1); // At least 1

  const kpiResults = {
    criticalSKUs,
    replenishmentValue: Math.round(replenishmentValue),
    supplierAlerts,
    reorderRecommendations
  };

  console.log('📊 KPI Results calculated:', kpiResults);
  return kpiResults;
}

// This part of the code generates AI insights for replenishment management using OpenAI
async function generateReplenishmentInsights(
  products: ProductData[],
  shipments: ShipmentData[],
  kpis: ReplenishmentKPIs
): Promise<any[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 OpenAI API key check: hasApiKey:', !!apiKey, 'length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('❌ No OpenAI API key found - returning empty insights');
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

    const prompt = `You are the Replenishment Intelligence Agent for BrandBuddy. Analyze this Callahan-Smith inventory data:

REPLENISHMENT ANALYSIS:
- Critical SKUs: ${kpis.criticalSKUs}
- Replenishment Value: $${kpis.replenishmentValue.toLocaleString()}
- Supplier Alerts: ${kpis.supplierAlerts}
- Total Products: ${products.length}

Provide 2-3 strategic insights focusing on urgent reorder priorities and supplier reliability.

FORMAT AS JSON ARRAY:
[
  {
    "type": "warning",
    "title": "Brief insight title",
    "description": "Specific actionable insight with financial impact",
    "severity": "critical",
    "dollarImpact": 5000
  }
]

Focus on immediate actions needed to prevent stockouts.`;

    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    console.log('🤖 Replenishment Agent: Calling OpenAI for insights...');
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.2,
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
          products: [],
          shipments: [],
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
      products, // Raw product data for client-side calculations
      shipments, // Raw shipment data for client-side calculations
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
