import { VercelRequest, VercelResponse } from '@vercel/node';

interface InventoryItemSuggestion {
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
  console.log("🤖 API: Inventory suggestion request received");

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
    // This part of the code extracts and validates inventory item data
    const { itemData } = req.body;
    
    if (!itemData || !itemData.sku) {
      console.error("❌ API: Missing inventory item data or SKU");
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Inventory item data with SKU is required',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    console.log("📊 API: Analyzing inventory item for AI suggestion:", {
      sku: itemData.sku,
      status: itemData.status,
      supplier: itemData.supplier
    });

    // This part of the code generates AI suggestion using our proven GPT-3.5 turbo pattern
    const suggestion = await generateInventorySuggestion(itemData);

    console.log("✅ API: Inventory suggestion generated successfully:", itemData.sku);

    return res.status(200).json({
      success: true,
      data: suggestion,
      timestamp: new Date().toISOString()
    } as APIResponse<InventoryItemSuggestion>);

  } catch (error) {
    console.error("❌ API: Inventory suggestion failed:", error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate inventory suggestion',
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }
}

/**
 * Generate AI suggestion for specific inventory item using GPT-3.5 turbo
 * 🎯 PROVEN PATTERN: Fast, reliable, cost-effective (matches order-suggestion.ts)
 */
async function generateInventorySuggestion(itemData: any): Promise<InventoryItemSuggestion> {
  console.log("🤖 API: Starting AI analysis for inventory item:", itemData.sku);

  // This part of the code validates OpenAI API key
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  // This part of the code determines priority based on inventory status and impact
  const getPriority = (item: any): "low" | "medium" | "high" => {
    const totalValue = item.total_value || 0;
    const isOutOfStock = item.status?.includes('Out of Stock');
    const isLowStock = item.status?.includes('Low Stock');
    const isInactive = !item.active;
    
    if (isOutOfStock || (isLowStock && totalValue > 5000)) return "high";
    if (isLowStock || isInactive || totalValue > 1000) return "medium";
    return "low";
  };

  // This part of the code creates a focused prompt for individual inventory analysis
  const status = itemData.status || 'unknown';
  const onHand = itemData.on_hand || 0;
  const committed = itemData.committed || 0;
  const available = itemData.available || 0;
  const unitCost = itemData.unit_cost || 0;
  const supplier = itemData.supplier || 'Unknown supplier';
  const sku = itemData.sku;
  const productName = itemData.product_name || 'Unknown Product';
  const brandName = itemData.brand_name || 'Unknown Brand';
  
  const inventoryValue = Math.round(itemData.total_value || 0);
  const daysSinceCreated = itemData.days_since_created || 0;
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
            content: `You are a Senior Inventory Operations Manager with 15+ years experience at Fortune 500 companies. You specialize in inventory optimization, demand forecasting, and supply chain risk management.

ANALYSIS REQUIREMENTS:
- Analyze the specific inventory item data to identify immediate risks and opportunities
- Provide concrete business impact assessment based on the actual numbers
- Generate actionable recommendations using the real supplier names, quantities, and financial data provided
- Focus on preventing stockouts, optimizing cash flow, and reducing carrying costs
- Consider the item's status, turnover rate, and financial impact in your analysis

OUTPUT REQUIREMENTS:
- Analysis: 3-4 sentences explaining specific business risks and financial implications
- Actions: 2-3 concrete next steps with WHO to contact and WHAT to do
- Use only the real data provided (suppliers, SKUs, quantities, costs)
- No generic advice - everything must be specific to this item's situation

RESPONSE FORMAT (JSON):
{
  "analysis": "Specific analysis based on the actual inventory data provided",
  "actions": ["Action 1 with specific WHO and WHAT based on real data", "Action 2 with specific metrics and deadlines"]
}`
          },
          {
            role: "user",
            content: `Analyze this specific inventory item within the context of our overall inventory operations:

TARGET INVENTORY ITEM:
- SKU: ${sku}
- Product: ${productName} 
- Brand: ${brandName}
- Status: ${status}
- Supplier: ${supplier}
- Stock Levels: ${onHand} on hand, ${committed} committed, ${available} available
- Financial: $${unitCost.toFixed(2)} unit cost, $${inventoryValue.toLocaleString()} total value
- Performance: ${daysSinceCreated} days in system, ${turnoverRate}x annual turnover
- Active: ${itemData.active ? 'Yes' : 'No'}

Based on this item's specific situation, what are the immediate business risks and what concrete actions should we take today? Consider the financial impact, operational risks, and supply chain implications specific to this SKU's data.

Generate your analysis and recommendations based purely on the numbers and situation presented.`
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
          `Contact ${supplier} to address ${sku} inventory situation based on current ${status} status`,
          `Review ${available} available units against demand requirements for immediate action planning`
        ]
      };
    }

    // This part of the code constructs the final inventory suggestion
    const priority = getPriority(itemData);
    const estimatedImpact = priority === "high" ? `$${inventoryValue.toLocaleString()} inventory value at risk` :
                           priority === "medium" ? `$${Math.round(inventoryValue * 0.3).toLocaleString()} optimization potential` :
                           `$${Math.round(inventoryValue * 0.1).toLocaleString()} improvement opportunity`;

    // This part of the code formats the comprehensive suggestion response
    const fullSuggestion = `${parsedResponse.analysis || aiContent}

**Recommended Actions:**
${parsedResponse.actions && parsedResponse.actions.length > 0 ? 
  parsedResponse.actions.map((action: string, index: number) => `${index + 1}. ${action}`).join('\n') : 
  `1. Contact ${supplier} to review ${sku} inventory levels (${available} available, ${status} status)\n2. Assess reorder requirements based on current ${onHand} units on hand and ${turnoverRate}x annual turnover`}

**Financial Impact:** ${estimatedImpact}`;

    const result: InventoryItemSuggestion = {
      sku: itemData.sku,
      suggestion: fullSuggestion,
      priority: priority,
      actionable: true,
      estimatedImpact: estimatedImpact
    };

    console.log("✅ API: Inventory suggestion constructed:", {
      sku: result.sku,
      priority: result.priority,
      hasActions: parsedResponse.actions?.length || 0
    });

    return result;

  } catch (error) {
    console.error("❌ API: OpenAI call failed for inventory item:", itemData.sku, error);
    throw error;
  }
}
