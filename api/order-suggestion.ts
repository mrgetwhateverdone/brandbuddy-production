import { VercelRequest, VercelResponse } from '@vercel/node';

interface OrderSuggestion {
  orderId: string;
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
  console.log("🤖 API: Order suggestion request received");

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
    // This part of the code extracts and validates order data
    const { orderData } = req.body;
    
    if (!orderData || !orderData.order_id) {
      console.error("❌ API: Missing order data or order_id");
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Order data with order_id is required',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    console.log("📊 API: Analyzing order for AI suggestion:", {
      orderId: orderData.order_id,
      status: orderData.status,
      supplier: orderData.supplier
    });

    // This part of the code generates AI suggestion using our proven GPT-3.5 turbo pattern
    const suggestion = await generateOrderSuggestion(orderData);

    console.log("✅ API: Order suggestion generated successfully:", orderData.order_id);

    return res.status(200).json({
      success: true,
      data: suggestion,
      timestamp: new Date().toISOString()
    } as APIResponse<OrderSuggestion>);

  } catch (error) {
    console.error("💥 API: Order suggestion generation failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return res.status(500).json({
      success: false,
      error: 'Generation failed',
      message: `Failed to generate order suggestion: ${errorMessage}`,
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }
}

/**
 * Generate AI suggestion for specific order using GPT-3.5 turbo
 * 🎯 PROVEN PATTERN: Fast, reliable, cost-effective
 */
async function generateOrderSuggestion(orderData: any): Promise<OrderSuggestion> {
  console.log("🤖 API: Starting GPT-3.5 turbo analysis for order:", orderData.order_id);

  // This part of the code validates OpenAI API key
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  // This part of the code determines priority based on order status and impact
  const getPriority = (order: any): "low" | "medium" | "high" => {
    const totalValue = (order.unit_cost || 0) * (order.expected_quantity || 0);
    const isDelayed = order.status?.includes('delayed') || order.sla_status?.includes('breach');
    const isCancelled = order.status?.includes('cancelled');
    
    if (isCancelled || (isDelayed && totalValue > 5000)) return "high";
    if (isDelayed || totalValue > 1000) return "medium";
    return "low";
  };

  // This part of the code creates a focused prompt for individual order analysis
  const orderStatus = orderData.status || 'unknown';
  const expectedQty = orderData.expected_quantity || 0;
  const receivedQty = orderData.received_quantity || 0;
  const unitCost = orderData.unit_cost || 0;
  const supplier = orderData.supplier || 'Unknown supplier';
  const sku = orderData.product_sku || 'Unknown SKU';
  
  const shortfall = Math.max(0, expectedQty - receivedQty);
  const orderValue = Math.round(unitCost * expectedQty);
  const impact = shortfall > 0 ? Math.round(unitCost * shortfall) : 0;

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
        model: "gpt-3.5-turbo", // Fast and cost-effective (proven working)
        messages: [
          {
            role: "system",
            content: `You are an Order Analysis Specialist. Analyze individual orders and provide 2-3 sentence analysis plus 1-2 specific actionable recommendations.

CRITICAL REQUIREMENTS:
- Keep analysis to 2-3 sentences maximum
- Provide 1-2 specific actionable recommendations
- Reference actual PO numbers, SKUs, suppliers, and dollar amounts
- Focus on immediate actions the user can take today

RESPONSE FORMAT (JSON):
{
  "analysis": "2-3 sentence analysis of the specific order issue",
  "recommendations": ["Specific action 1", "Specific action 2"]
}`
          },
          {
            role: "user",
            content: `Analyze this specific order:

ORDER DETAILS:
- PO Number: ${orderData.order_id}
- Status: ${orderStatus}
- SKU: ${sku}
- Supplier: ${supplier}
- Expected: ${expectedQty} units
- Received: ${receivedQty} units
- Unit Cost: $${unitCost}
- Order Value: $${orderValue.toLocaleString()}
${shortfall > 0 ? `- Shortfall: ${shortfall} units ($${impact.toLocaleString()} impact)` : ''}

Provide 2-3 sentence analysis and 1-2 specific actionable recommendations for this order.`
          }
        ],
        max_tokens: 200, // Keep responses concise
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
        analysis: aiContent.substring(0, 200),
        recommendations: ["Review order status with supplier", "Contact procurement team"]
      };
    }

    // This part of the code constructs the final order suggestion
    const priority = getPriority(orderData);
    const hasIssues = shortfall > 0 || orderStatus.includes('delayed') || orderStatus.includes('cancelled');

    const suggestion: OrderSuggestion = {
      orderId: orderData.order_id,
      suggestion: parsedResponse.analysis || "Order analysis completed",
      priority,
      actionable: hasIssues,
      estimatedImpact: impact > 0 ? `$${impact.toLocaleString()}` : undefined
    };

    console.log("✅ API: Order suggestion structured successfully:", {
      orderId: suggestion.orderId,
      priority: suggestion.priority,
      actionable: suggestion.actionable
    });

    return suggestion;

  } catch (error) {
    console.error("💥 API: OpenAI call failed for order:", orderData.order_id, error);
    
    // This part of the code provides a graceful fallback when AI fails
    const priority = getPriority(orderData);
    
    return {
      orderId: orderData.order_id,
      suggestion: "Analysis Unavailable - Unable to connect to AI service. Please try again or contact support.",
      priority,
      actionable: false,
      estimatedImpact: impact > 0 ? `$${impact.toLocaleString()}` : undefined
    };
  }
}
