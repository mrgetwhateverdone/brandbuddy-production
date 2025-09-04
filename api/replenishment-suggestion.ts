import { VercelRequest, VercelResponse } from '@vercel/node';

interface ReplenishmentItemSuggestion {
  sku: string;
  suggestion: string;
  priority: "low" | "medium" | "high";
  actionable: boolean;
  estimatedImpact?: string;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("🤖 API: Replenishment suggestion request received");

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
    // This part of the code extracts and validates replenishment item data
    const { itemData } = req.body;
    
    if (!itemData || !itemData.sku) {
      console.error("❌ API: Missing replenishment item data or SKU");
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Replenishment item data with SKU is required',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    console.log("📊 API: Analyzing replenishment item for AI suggestion:", {
      sku: itemData.sku,
      status: itemData.status,
      supplier: itemData.supplier
    });

    // This part of the code generates AI suggestion using our proven GPT-3.5 turbo pattern
    const suggestion = await generateReplenishmentSuggestion(itemData);

    console.log("✅ API: Replenishment suggestion generated successfully:", itemData.sku);

    return res.status(200).json({
      success: true,
      data: suggestion,
      timestamp: new Date().toISOString()
    } as APIResponse<ReplenishmentItemSuggestion>);

  } catch (error) {
    console.error("❌ API: Replenishment suggestion failed:", error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate replenishment suggestion',
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }
}

/**
 * Generate AI suggestion for specific replenishment item using GPT-3.5 turbo
 * 🎯 PROVEN PATTERN: Fast, reliable, cost-effective (matches order/inventory-suggestion.ts)
 */
async function generateReplenishmentSuggestion(itemData: any): Promise<ReplenishmentItemSuggestion> {
  console.log("🤖 API: Starting AI analysis for replenishment item:", itemData.sku);

  // This part of the code validates OpenAI API key
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  // This part of the code determines priority based on replenishment urgency and impact
  const getPriority = (item: any): "low" | "medium" | "high" => {
    const totalValue = item.total_value || 0;
    const isOutOfStock = item.status?.includes('Out of Stock');
    const isLowStock = item.status?.includes('Low Stock') || item.status?.includes('Critical');
    const isInactive = !item.active;
    
    if (isOutOfStock || (isLowStock && totalValue > 5000)) return "high";
    if (isLowStock || isInactive || totalValue > 1000) return "medium";
    return "low";
  };

  // This part of the code creates a focused prompt for individual replenishment analysis
  const status = itemData.status || 'unknown';
  const onHand = itemData.on_hand || itemData.unit_quantity || 0;
  const committed = itemData.committed || Math.floor(onHand * 0.1);
  const available = itemData.available || Math.max(0, onHand - committed);
  const unitCost = itemData.unit_cost || 0;
  const supplier = itemData.supplier || itemData.supplier_name || 'Unknown supplier';
  const sku = itemData.sku || itemData.product_sku;
  const productName = itemData.product_name || 'Unknown Product';
  const brandName = itemData.brand_name || 'Unknown Brand';
  
  const inventoryValue = Math.round((onHand * unitCost) || itemData.total_value || 0);
  const daysSinceCreated = itemData.days_since_created || Math.floor((Date.now() - new Date(itemData.created_date || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
  const turnoverRate = daysSinceCreated > 0 ? Math.round(365 / daysSinceCreated * 10) / 10 : 0;

  try {
    // This part of the code makes the OpenAI API call with proven timeout pattern
    const openaiUrl = "https://api.openai.com/v1/chat/completions";
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(25000), // 25-second timeout (proven working)
      body: JSON.stringify({
        model: process.env.AI_MODEL_FAST || "gpt-3.5-turbo", // Fast and cost-effective (proven working)
        messages: [
          {
            role: "system",
            content: `You are a Senior Supply Chain Planning Manager with 15+ years experience at Fortune 500 companies. You specialize in demand forecasting, reorder optimization, supplier relationship management, and inventory replenishment strategies.

ANALYSIS REQUIREMENTS:
- Analyze the specific product replenishment data to identify immediate supply chain risks and opportunities
- Provide concrete business impact assessment based on actual consumption patterns and supplier performance
- Generate actionable recommendations using real supplier names, lead times, and financial data provided
- Focus on preventing stockouts, optimizing reorder timing, and minimizing working capital impact
- Consider consumption velocity, supplier reliability, and seasonal demand patterns

OUTPUT REQUIREMENTS:
- Analysis: 3-4 sentences explaining specific replenishment risks and business implications
- Actions: 2-3 concrete next steps with WHO to contact and WHAT to do TODAY
- Use only the real data provided (suppliers, SKUs, quantities, costs, lead times)
- No generic advice - everything must be specific to this product's replenishment situation

RESPONSE FORMAT (JSON):
{
  "analysis": "Specific replenishment analysis based on the actual product data provided",
  "actions": ["Action 1 with specific WHO and WHAT based on real data", "Action 2 with specific metrics and deadlines"]
}`
          },
          {
            role: "user",
            content: `Analyze this product's replenishment needs and provide expert supply chain recommendations:

REPLENISHMENT ITEM ANALYSIS:
- SKU: ${sku}
- Product: ${productName}
- Brand: ${brandName}
- Current Status: ${status}
- Supplier: ${supplier}
- Stock Levels: ${onHand} on hand, ${committed} committed, ${available} available
- Financial: $${unitCost.toFixed(2)} unit cost, $${inventoryValue.toLocaleString()} total inventory value
- Performance: ${daysSinceCreated} days in system, ${turnoverRate}x annual turnover
- Active Status: ${itemData.active ? 'Active' : 'Inactive'}

SUPPLY CHAIN CONTEXT:
This ${brandName} product requires strategic replenishment planning. Current ${status} status with ${available} units available indicates immediate supply chain attention needed. Analyze consumption velocity, supplier lead times, and reorder optimization opportunities.

Based on this product's specific replenishment situation, what are the immediate supply chain risks and what concrete actions should we take today? Consider lead time optimization, supplier performance, and working capital efficiency.`
          }
        ],
        max_tokens: 300, // Increased for detailed analysis
        temperature: 0.1, // Low temperature for consistent, factual responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API: OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // This part of the code processes the AI response
    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content received from OpenAI");
    }

    console.log("🤖 API: Raw AI response received");

    // This part of the code parses the structured JSON response
    let parsedResponse;
    try {
      // Clean the response and parse JSON
      const cleanedContent = aiContent.trim().replace(/```json\n?|\n?```/g, '');
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.warn("⚠️ API: Failed to parse JSON, using fallback format");
      // Fallback: treat the whole response as analysis
      parsedResponse = {
        analysis: aiContent.substring(0, 300),
        actions: [
          `Contact ${supplier} to review ${sku} replenishment schedule (${available} available, ${status} status)`,
          `Assess reorder timing based on current ${turnoverRate}x velocity and ${daysSinceCreated}-day inventory cycle`
        ]
      };
    }

    // This part of the code constructs the final replenishment suggestion
    const priority = getPriority(itemData);
    const estimatedImpact = priority === "high" ? `$${inventoryValue.toLocaleString()} stockout risk` :
                           priority === "medium" ? `$${Math.round(inventoryValue * 0.3).toLocaleString()} optimization potential` :
                           `$${Math.round(inventoryValue * 0.1).toLocaleString()} efficiency improvement`;

    // This part of the code formats the comprehensive suggestion response
    const fullSuggestion = `${parsedResponse.analysis || aiContent}

Recommended Actions:
${parsedResponse.actions && parsedResponse.actions.length > 0 ? 
  parsedResponse.actions.map((action: string, index: number) => `${index + 1}. ${action}`).join('\n') : 
  `1. Contact ${supplier} to review ${sku} replenishment schedule (${available} available units)\n2. Assess optimal reorder timing based on ${turnoverRate}x annual velocity and supplier lead times`}

Financial Impact: ${estimatedImpact}`;

    const result: ReplenishmentItemSuggestion = {
      sku: itemData.sku || itemData.product_sku,
      suggestion: fullSuggestion,
      priority: priority,
      actionable: true,
      estimatedImpact: estimatedImpact
    };

    console.log("✅ API: Replenishment suggestion constructed:", {
      sku: result.sku,
      priority: result.priority,
      hasActions: parsedResponse.actions?.length || 0
    });

    return result;

  } catch (error) {
    console.error("❌ API: OpenAI call failed for replenishment item:", itemData.sku || itemData.product_sku, error);
    throw error;
  }
}
