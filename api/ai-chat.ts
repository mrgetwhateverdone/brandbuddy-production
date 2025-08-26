import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ProductData, ShipmentData } from "../client/types/api";
// This part of the code imports only the necessary types to fix compilation warnings

/**
 * This part of the code defines the quick actions available for AI assistant
 * Each action provides predefined prompts that leverage real operational data
 */
const QUICK_ACTIONS = [
  {
    id: "top-brands",
    label: "Name my top brands",
    prompt: "Based on my current operational data, name my top 5 brands by total activity (SKUs + shipments). Include specific metrics for each brand and their operational performance."
  },
  {
    id: "warehouse-status", 
    label: "List my warehouses",
    prompt: "List all my active warehouses with their current SLA performance, shipment volume, and operational status. Rank them by performance and identify any that need attention."
  },
  {
    id: "daily-priorities",
    label: "What should I act on today?",
    prompt: "Analyze my current operations and identify the top 3-5 most critical issues I should address today. Focus on at-risk shipments, processing problems, and financial impact."
  },
  {
    id: "at-risk-orders",
    label: "Show at-risk orders",
    prompt: "Identify all shipments and orders that are currently at-risk. Include quantity discrepancies, cancelled orders, and delayed shipments with their potential financial impact."
  }
];

/**
 * This part of the code defines the AI chat message interface for real-time conversations
 * Supports user messages and AI responses with operational context
 */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ChatRequest {
  message: string;
  conversation?: ChatMessage[];
  includeContext?: boolean;
}

interface ChatResponse {
  response: string;
  conversationId: string;
  timestamp: string;
  context?: {
    dataTimestamp: string;
    sourcesUsed: string[];
  };
}

/**
 * This part of the code fetches all real operational data for AI context
 * Combines data from multiple TinyBird endpoints to provide comprehensive context
 */
async function fetchAllOperationalData(): Promise<{
  products: ProductData[];
  shipments: ShipmentData[];
  timestamp: string;
}> {
  const baseUrl = process.env.TINYBIRD_BASE_URL;
  const token = process.env.TINYBIRD_TOKEN;
  const warehouseBaseUrl = process.env.WAREHOUSE_BASE_URL;
  const warehouseToken = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token || !warehouseBaseUrl || !warehouseToken) {
    throw new Error("Required TinyBird environment variables are missing");
  }

  // This part of the code fetches products and shipments in parallel for optimal performance
  const [productsResponse, shipmentsResponse] = await Promise.all([
    fetch(`${baseUrl}?token=${token}&limit=150&brand_name=Callahan-Smith`),
    fetch(`${warehouseBaseUrl}?token=${warehouseToken}&limit=200&brand_name=Callahan-Smith`)
  ]);

  if (!productsResponse.ok || !shipmentsResponse.ok) {
    throw new Error("Failed to fetch operational data from TinyBird");
  }

  const [productsResult, shipmentsResult] = await Promise.all([
    productsResponse.json(),
    shipmentsResponse.json()
  ]);

  return {
    products: productsResult.data || [],
    shipments: shipmentsResult.data || [],
    timestamp: new Date().toISOString()
  };
}

/**
 * This part of the code generates comprehensive operational context for AI conversations
 * Creates a detailed context string with real metrics and business intelligence
 */
function generateOperationalContext(products: ProductData[], shipments: ShipmentData[]): string {
  const timestamp = new Date().toLocaleString();
  
  // This part of the code calculates real-time operational metrics
  const totalSKUs = products.length;
  const activeSKUs = products.filter(p => p.active).length;
  const inactiveSKUs = totalSKUs - activeSKUs;
  
  const totalShipments = shipments.length;
  const todayShipments = shipments.filter(s => {
    const shipmentDate = new Date(s.created_date).toDateString();
    const today = new Date().toDateString();
    return shipmentDate === today;
  }).length;
  
  const atRiskShipments = shipments.filter(s => 
    s.expected_quantity !== s.received_quantity || 
    s.status === "cancelled"
  ).length;
  
  const completedShipments = shipments.filter(s => 
    s.status === "completed" || s.status === "delivered"
  ).length;
  
  // This part of the code analyzes brand performance from real data
  const brandCounts = new Map<string, { skus: number; shipments: number }>();
  products.forEach(p => {
    const brand = p.brand_name || "Unknown";
    if (!brandCounts.has(brand)) {
      brandCounts.set(brand, { skus: 0, shipments: 0 });
    }
    brandCounts.get(brand)!.skus += 1;
  });
  
  shipments.forEach(s => {
    const brand = s.brand_name || "Unknown";
    if (brandCounts.has(brand)) {
      brandCounts.get(brand)!.shipments += 1;
    }
  });
  
  const topBrands = Array.from(brandCounts.entries())
    .sort(([,a], [,b]) => (b.skus + b.shipments) - (a.skus + a.shipments))
    .slice(0, 5);
  
  // This part of the code analyzes warehouse and supplier performance
  const warehousePerformance = new Map<string, { shipments: number; onTime: number }>();
  shipments.forEach(s => {
    if (!s.warehouse_id) return;
    
    if (!warehousePerformance.has(s.warehouse_id)) {
      warehousePerformance.set(s.warehouse_id, { shipments: 0, onTime: 0 });
    }
    
    const perf = warehousePerformance.get(s.warehouse_id)!;
    perf.shipments += 1;
    
    if (s.expected_quantity === s.received_quantity && s.status !== "cancelled") {
      perf.onTime += 1;
    }
  });
  
  const topWarehouses = Array.from(warehousePerformance.entries())
    .map(([id, perf]) => ({
      id,
      shipments: perf.shipments,
      slaRate: perf.shipments > 0 ? Math.round((perf.onTime / perf.shipments) * 100) : 0
    }))
    .sort((a, b) => b.slaRate - a.slaRate)
    .slice(0, 3);
  
  // This part of the code calculates financial impact from operational issues
  const financialImpact = shipments
    .filter(s => s.expected_quantity !== s.received_quantity && s.unit_cost)
    .reduce((sum, s) => {
      const qtyDiff = Math.abs(s.expected_quantity - s.received_quantity);
      return sum + (qtyDiff * (s.unit_cost || 0));
    }, 0);
  
  // This part of the code generates contextual intelligence for AI responses
  return `CURRENT 3PL OPERATIONS CONTEXT (${timestamp}):

=== REAL-TIME METRICS ===
• Total SKUs: ${totalSKUs} (${activeSKUs} active, ${inactiveSKUs} inactive)
• Orders Today: ${todayShipments}
• At-Risk Shipments: ${atRiskShipments} out of ${totalShipments}
• Completed Shipments: ${completedShipments}
• Financial Impact: $${Math.round(financialImpact).toLocaleString()}

=== TOP PERFORMING BRANDS ===
${topBrands.map(([brand, data], idx) => 
  `${idx + 1}. ${brand} (${data.skus} SKUs, ${data.shipments} shipments)`
).join('\n')}

=== WAREHOUSE PERFORMANCE ===
${topWarehouses.map((wh, idx) => 
  `${idx + 1}. Warehouse ${wh.id}: ${wh.slaRate}% SLA (${wh.shipments} shipments)`
).join('\n')}

=== OPERATIONAL STATUS ===
• Inventory Health: ${Math.round((activeSKUs / totalSKUs) * 100)}% active SKUs
• Processing Accuracy: ${Math.round(((totalShipments - atRiskShipments) / totalShipments) * 100)}%
• Today's Activity: ${todayShipments} new shipments
• Critical Issues: ${atRiskShipments} shipments need attention

=== RECENT ACTIVITY SAMPLE ===
${shipments.slice(0, 3).map(s => 
  `• ${s.purchase_order_number || s.shipment_id}: ${s.brand_name}, ${s.status}, ${s.expected_quantity !== s.received_quantity ? "Qty Variance" : "On Track"}`
).join('\n')}

This operational data is live from your TinyBird warehouse management system as of ${timestamp}.`;
}



/**
 * This part of the code handles AI conversation with real operational context
 * Integrates with OpenAI API while maintaining data security
 */
interface AISettings {
  model: string;
  maxTokens: number;
  contextLevel: string;
}

async function generateAIResponseWithSettings(
  userMessage: string, 
  operationalContext: string,
  conversation: ChatMessage[] = [],
  settings: AISettings
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  // This part of the code builds conversation history with operational context
  const messages = [
    {
      role: "system" as const,
      content: `You are CargoCore AI, an expert 3PL operations assistant with real-time access to operational data. 

YOUR ROLE:
- Provide specific, actionable insights based on REAL operational data
- Focus on logistics optimization, cost reduction, and performance improvement
- Give concrete recommendations with financial impact when possible
- Be direct and professional, avoiding generic responses

RESPONSE GUIDELINES:
- Always reference actual data when making recommendations
- Provide specific numbers, percentages, and dollar amounts
- Suggest actionable next steps the user can take immediately
- Highlight critical issues that need urgent attention
- Keep responses focused and under 200 words unless complex analysis is needed

CURRENT OPERATIONAL CONTEXT:
${operationalContext}

You have access to live data about products, shipments, warehouses, brands, and performance metrics. Use this data to provide intelligent, contextual responses.`
    },
    ...conversation.slice(-6), // Keep last 6 messages for context
    {
      role: "user" as const,
      content: userMessage
    }
  ];

  try {
    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_tokens: settings.maxTokens,
        temperature: 0.3,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("No response from OpenAI");
    }

    return aiResponse.trim();
  } catch (error) {
    console.error("AI Response Error:", error);
    throw new Error("Failed to generate AI response");
  }
}

/**
 * This part of the code handles both AI chat and quick actions endpoints
 * Supports POST for chat and GET for quick actions
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // This part of the code handles quick actions GET requests
  if (req.method === "GET" && req.url?.includes('quick-actions')) {
    try {
      console.log("🚀 Quick Actions API: Fetching available actions...");
      
      res.status(200).json({
        success: true,
        data: QUICK_ACTIONS,
        message: "Quick actions retrieved successfully",
        timestamp: new Date().toISOString()
      });
      return;

    } catch (error) {
      console.error("❌ Quick Actions API Error:", error);
      
      res.status(500).json({
        error: "Failed to fetch quick actions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
      return;
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🤖 AI Chat API: Processing chat request...");
    
    // This part of the code reads AI settings from request headers
    const aiModel = req.headers['x-ai-model'] as string || "gpt-4";
    const maxTokens = parseInt(req.headers['x-max-tokens'] as string) || 500;
    const contextLevel = req.headers['x-context-level'] as string || "full";
    
    console.log(`🎯 AI Settings: Model=${aiModel}, Tokens=${maxTokens}, Context=${contextLevel}`);
    
    const { message, conversation = [], includeContext = true }: ChatRequest = req.body;
    
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // This part of the code fetches real operational data for context
    let operationalContext = "";
    const sourcesUsed: string[] = [];
    
    if (includeContext) {
      console.log("🔄 AI Chat API: Fetching operational context...");
      
      try {
        const operationalData = await fetchAllOperationalData();
        operationalContext = generateOperationalContext(
          operationalData.products, 
          operationalData.shipments
        );
        sourcesUsed.push("Products Data", "Shipments Data", "Real-time Metrics");
        
        console.log("✅ AI Chat API: Operational context generated");
      } catch (contextError) {
        console.warn("⚠️ AI Chat API: Failed to fetch operational context:", contextError);
        operationalContext = "Note: Operating with limited context due to data access issues.";
        sourcesUsed.push("Limited Context");
      }
    }

    // This part of the code generates AI response with operational intelligence
    console.log("🧠 AI Chat API: Generating AI response...");
    
    // This part of the code passes user settings to the AI generation
    const aiResponse = await generateAIResponseWithSettings(
      message, 
      operationalContext, 
      conversation,
      { model: aiModel, maxTokens, contextLevel }
    );
    
    const response: ChatResponse = {
      response: aiResponse,
      conversationId: `chat-${Date.now()}`,
      timestamp: new Date().toISOString(),
      context: {
        dataTimestamp: new Date().toISOString(),
        sourcesUsed
      }
    };

    console.log("✅ AI Chat API: Response generated successfully");
    
    res.status(200).json({
      success: true,
      data: response,
      message: "AI response generated successfully"
    });

  } catch (error) {
    console.error("❌ AI Chat API Error:", error);
    
    res.status(500).json({
      error: "Failed to process chat request",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * This part of the code exports quick actions for client-side usage
 * Provides predefined prompts that leverage real operational data
 */
export { QUICK_ACTIONS };
