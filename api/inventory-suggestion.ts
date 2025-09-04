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
            content: `You are a Senior Inventory Operations Manager with 15+ years experience at Fortune 500 companies. You've managed $50M+ inventory portfolios and specialize in demand forecasting, reorder optimization, and supplier relationship management. You've prevented stockouts that would have cost millions and identified obsolete inventory saving companies 20%+ in carrying costs.

ANALYSIS REQUIREMENTS:
- Provide detailed business impact assessment (not generic observations)
- Include specific financial implications and operational risks
- Reference industry best practices and proven methodologies
- Give 2-3 ACTIONABLE next steps with WHO to contact and WHAT to do TODAY
- Use actual data points: SKU numbers, suppliers, quantities, dollar amounts
- Focus on immediate value-creating actions that solve real problems

ACTIONABLE EXAMPLES:
✅ "Contact ${supplier} directly to expedite emergency reorder for SKU-${sku}"  
✅ "Escalate to procurement team for backup supplier sourcing"
✅ "Schedule immediate reorder of 50+ units through existing supplier contract"
❌ "Monitor inventory levels regularly" (too vague, no specific action)
❌ "Consider adjusting reorder points" (no specific target or person)

RESPONSE FORMAT (JSON):
{
  "analysis": "3-4 sentences with specific business impact, operational risks, and financial implications based on the data",
  "actions": ["Specific action 1 with WHO (name/role) to contact", "Specific action 2 with WHAT (exact numbers/deadlines) to do"]
}`
          },
          {
            role: "user",
            content: `Analyze this inventory item and provide expert recommendations:

INVENTORY ITEM ANALYSIS:
- SKU: ${sku}
- Product: ${productName}
- Brand: ${brandName}
- Current Status: ${status}
- Supplier: ${supplier}
- On Hand Quantity: ${onHand} units
- Committed Quantity: ${committed} units
- Available for Sale: ${available} units
- Unit Cost: $${unitCost.toFixed(2)}
- Total Inventory Value: $${inventoryValue.toLocaleString()}
- Days in System: ${daysSinceCreated} days
- Estimated Annual Turnover: ${turnoverRate}x
- Active Status: ${itemData.active ? 'Active' : 'Inactive'}

BUSINESS CONTEXT:
This is a ${brandName} product managed in our inventory system. Current ${status} status indicates immediate attention required. With ${available} units available and ${committed} committed, we need strategic action to optimize inventory position and prevent business disruption.

Provide detailed analysis focusing on:
1. Immediate business risks and financial impact
2. Operational implications for fulfillment and customer satisfaction  
3. 2-3 specific actions with WHO to contact and WHAT to do TODAY`
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
          `Contact ${supplier} directly to optimize ${sku} stock levels immediately`,
          `Escalate to procurement team for emergency reorder of ${Math.max(20, onHand)} units by end of week`
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
  `1. Contact ${supplier} directly to address ${sku} inventory optimization\n2. Escalate to procurement team for immediate reorder planning`}

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
