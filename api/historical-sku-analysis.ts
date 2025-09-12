import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code provides dedicated historical SKU analysis endpoint
 * Optimized for recent sales data and trend analysis - only called when user requests it
 */

interface HistoricalAnalysis {
  sku: string;
  analysis: string;
  salesTrend: string;
  demandForecast: string;
  riskAssessment: string;
  recommendations: string[];
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("📈 API: Historical SKU analysis request received");

  // This part of the code handles CORS and method validation
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are supported',
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }

  try {
    // This part of the code extracts and validates SKU data for historical analysis
    const { itemData } = req.body;
    
    if (!itemData || !itemData.sku) {
      console.error("❌ API: Missing inventory item data or SKU for historical analysis");
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Inventory item data with SKU is required',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    console.log("📊 API: Generating historical analysis for SKU:", itemData.sku);

    // This part of the code generates historical analysis using optimized sales data
    const historicalAnalysis = await generateHistoricalAnalysis(itemData);

    console.log("✅ API: Historical analysis generated successfully:", itemData.sku);

    return res.status(200).json({
      success: true,
      data: historicalAnalysis,
      timestamp: new Date().toISOString()
    } as APIResponse<HistoricalAnalysis>);

  } catch (error) {
    console.error("❌ API: Historical analysis failed:", error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate historical analysis',
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }
}

/**
 * This part of the code fetches optimized recent sales history for trend analysis
 * Uses limit=20 to get most recent records regardless of date
 */
async function fetchRecentSalesHistory(sku: string): Promise<string> {
  const baseUrl = process.env.ORDERS_BASE_URL;
  const token = process.env.ORDERS_TOKEN;

  if (!baseUrl || !token) {
    console.warn("⚠️ Historical analysis: Orders endpoint not configured");
    return "Sales history unavailable - endpoint not configured";
  }

  try {
    // This part of the code fetches recent sales data with optimized parameters
    const url = `${baseUrl}?token=${token}&sku=${sku}&brand_name=Callahan-Smith&limit=20`;
    console.log("📈 Fetching recent 20 sales records for historical analysis:", sku);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log("⚠️ Sales history fetch failed:", response.status);
      return "Sales history temporarily unavailable";
    }

    const result = await response.json();
    const salesData = result.data || [];
    
    if (salesData.length === 0) {
      return "No recent sales history found for this SKU";
    }

    return buildEnhancedSalesContext(salesData);

  } catch (error) {
    console.log("⚠️ Sales history error:", error);
    return "Sales history temporarily unavailable";
  }
}

/**
 * This part of the code processes recent sales data into enhanced business intelligence
 * Optimized for most recent records rather than date-based filtering
 */
function buildEnhancedSalesContext(salesData: any[]): string {
  // This part of the code sorts sales records chronologically (most recent first)
  const sorted = salesData.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
  
  if (sorted.length === 0) return "No sales data available";
  
  // This part of the code analyzes the most recent sales records for accurate trends
  const recentRecords = sorted.slice(0, Math.min(sorted.length, 12)); // Use up to 12 most recent records
  const totalUnits = recentRecords.reduce((sum, record) => sum + (record.units_sold || 0), 0);
  const avgUnitsPerRecord = recentRecords.length > 0 ? (totalUnits / recentRecords.length).toFixed(1) : "0";
  
  const totalRevenue = recentRecords.reduce((sum, record) => sum + (record.revenue || 0), 0);
  const avgRevenuePer = totalUnits > 0 ? (totalRevenue / totalUnits).toFixed(2) : "0";
  
  // This part of the code determines sales trend from most recent vs older records  
  const mostRecent = sorted[0];
  const olderRecord = sorted[Math.min(sorted.length - 1, 5)]; // Compare to 6th most recent
  const trend = mostRecent.units_sold > olderRecord.units_sold ? "increasing" : 
               mostRecent.units_sold < olderRecord.units_sold ? "decreasing" : "stable";

  // This part of the code gets the most recent sale date for context
  const mostRecentDate = new Date(mostRecent.month).toLocaleDateString();

  return `Sales Performance (recent ${recentRecords.length} records): ${trend} demand trend, averaging ${avgUnitsPerRecord} units per period, $${avgRevenuePer} revenue per unit, total period: ${totalUnits} units sold, most recent sale: ${mostRecentDate}`;
}

/**
 * This part of the code generates comprehensive historical analysis using GPT-3.5 turbo
 * Focused specifically on sales trends, demand patterns, and historical context
 */
async function generateHistoricalAnalysis(itemData: any): Promise<HistoricalAnalysis> {
  console.log("🤖 API: Starting historical analysis for SKU:", itemData.sku);

  // This part of the code validates OpenAI API key
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  // This part of the code fetches recent sales history for comprehensive analysis
  const salesContext = await fetchRecentSalesHistory(itemData.sku);
  console.log("📈 Recent sales context loaded for historical analysis:", itemData.sku);

  // This part of the code prepares item data for historical analysis
  const sku = itemData.sku;
  const productName = itemData.product_name || 'Unknown Product';
  const onHand = itemData.on_hand || 0;
  const available = itemData.available || 0;
  const unitCost = itemData.unit_cost || 0;
  const inventoryValue = Math.round(itemData.total_value || 0);
  const supplier = itemData.supplier || 'Unknown supplier';

  try {
    // This part of the code makes the OpenAI API call with historical analysis focus
    const openaiUrl = "https://api.openai.com/v1/chat/completions";
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30000), // 30-second timeout for comprehensive analysis
      body: JSON.stringify({
        model: process.env.AI_MODEL_FAST || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a Senior Demand Planning Analyst with 15+ years experience in sales trend analysis and inventory forecasting. You specialize in interpreting sales history data to predict future demand patterns and optimize inventory levels.

HISTORICAL ANALYSIS REQUIREMENTS:
- Analyze sales trends and demand patterns from recent sales history data
- Identify seasonal patterns, growth trends, and demand volatility
- Assess inventory positioning relative to historical demand patterns
- Provide predictive insights based on sales trajectory
- Generate specific recommendations based on historical performance

OUTPUT REQUIREMENTS:
- Analysis: Historical sales pattern interpretation and trend analysis
- Sales Trend: Clear description of demand direction and velocity
- Demand Forecast: Predicted future demand based on historical patterns
- Risk Assessment: Inventory risks based on sales trends
- Recommendations: 3-4 specific actions based on historical insights

RESPONSE FORMAT (JSON):
{
  "analysis": "Comprehensive analysis of historical sales patterns and their implications",
  "salesTrend": "Clear description of sales trend direction and intensity", 
  "demandForecast": "Demand prediction based on historical patterns",
  "riskAssessment": "Risk evaluation based on sales trends and current inventory",
  "recommendations": ["Action 1 based on historical data", "Action 2 for trend management", "Action 3 for demand optimization", "Action 4 for risk mitigation"]
}`
          },
          {
            role: "user",
            content: `Perform comprehensive historical analysis for this inventory item:

CURRENT INVENTORY POSITION:
- SKU: ${sku}
- Product: ${productName}
- Current Stock: ${onHand} on hand, ${available} available
- Financial Position: $${unitCost.toFixed(2)} unit cost, $${inventoryValue.toLocaleString()} total value
- Supplier: ${supplier}

HISTORICAL SALES CONTEXT:
${salesContext}

Based on this historical sales data and current inventory position, provide comprehensive trend analysis, demand forecasting, and strategic recommendations. Focus on actionable insights derived from the sales patterns and their implications for inventory management.`
          }
        ],
        max_tokens: 500, // Increased for comprehensive historical analysis
        temperature: 0.2, // Slightly higher for more nuanced historical insights
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API: OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // This part of the code processes the historical analysis response
    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content received from OpenAI for historical analysis");
    }

    console.log("🤖 API: Raw historical analysis response received");

    // This part of the code parses the structured historical analysis response
    let parsedResponse;
    try {
      // Clean the response and parse JSON
      const cleanedContent = aiContent.trim().replace(/```json\n?|\n?```/g, '');
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.warn("⚠️ API: Failed to parse historical analysis JSON, using fallback format");
      // Fallback: treat the whole response as analysis
      parsedResponse = {
        analysis: aiContent.substring(0, 400),
        salesTrend: "Historical analysis available in main response",
        demandForecast: "Demand patterns require further analysis",
        riskAssessment: "Risk assessment included in main analysis",
        recommendations: [
          "Review historical sales data with supplier to optimize ordering",
          "Monitor demand trends closely for inventory planning adjustments"
        ]
      };
    }

    // This part of the code constructs the comprehensive historical analysis result
    const result: HistoricalAnalysis = {
      sku: itemData.sku,
      analysis: parsedResponse.analysis || "Historical analysis completed",
      salesTrend: parsedResponse.salesTrend || "Sales trend analysis available",
      demandForecast: parsedResponse.demandForecast || "Demand forecasting completed", 
      riskAssessment: parsedResponse.riskAssessment || "Risk assessment completed",
      recommendations: parsedResponse.recommendations || ["Monitor sales trends", "Adjust inventory levels"]
    };

    console.log("✅ API: Historical analysis constructed:", {
      sku: result.sku,
      hasAnalysis: !!result.analysis,
      recommendationCount: result.recommendations.length
    });

    return result;

  } catch (error) {
    console.error("❌ API: OpenAI call failed for historical analysis:", itemData.sku, error);
    throw error;
  }
}
