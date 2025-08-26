import type { VercelRequest, VercelResponse } from "@vercel/node";
import { insightCache } from "./cache/insight-cache";

/**
 * This part of the code provides AI insights ONLY for orders
 * Loads after fast data for progressive enhancement
 * Optimized for speed with reduced token limits + intelligent caching
 */

// Order data derived from shipment structure (minimal for insights)
interface OrderData {
  order_id: string;
  created_date: string;
  brand_name: string;
  status: string;
  sla_status: string;
  expected_date: string | null;
  arrival_date: string;
  supplier: string | null;
  expected_quantity: number;
  received_quantity: number;
  unit_cost: number | null;
  ship_from_country: string | null;
}

// TinyBird Shipments API Response (minimal for insights)
interface ShipmentData {
  shipment_id: string;
  brand_name: string;
  created_date: string;
  purchase_order_number: string | null;
  status: string;
  supplier: string | null;
  expected_arrival_date: string | null;
  expected_quantity: number;
  received_quantity: number;
  unit_cost: number | null;
  ship_from_country: string | null;
}

/**
 * This part of the code fetches minimal data needed for orders insights only
 */
async function fetchShipmentsForInsights(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "WAREHOUSE_BASE_URL and WAREHOUSE_TOKEN environment variables are required",
    );
  }

  const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return (result.data || []).map((s: any) => ({
    shipment_id: s.shipment_id,
    brand_name: s.brand_name,
    created_date: s.created_date,
    purchase_order_number: s.purchase_order_number,
    status: s.status,
    supplier: s.supplier,
    expected_arrival_date: s.expected_arrival_date,
    expected_quantity: s.expected_quantity,
    received_quantity: s.received_quantity,
    unit_cost: s.unit_cost,
    ship_from_country: s.ship_from_country,
  }));
}

/**
 * This part of the code transforms minimal shipment data for insights
 */
function transformShipmentsToOrdersForInsights(shipments: ShipmentData[]): OrderData[] {
  return shipments.map(shipment => ({
    order_id: shipment.purchase_order_number || shipment.shipment_id,
    created_date: shipment.created_date,
    brand_name: shipment.brand_name,
    status: shipment.status,
    sla_status: shipment.status.includes('delayed') ? 'at_risk' : 'on_time',
    expected_date: shipment.expected_arrival_date,
    arrival_date: shipment.created_date, // Simplified for insights
    supplier: shipment.supplier,
    expected_quantity: shipment.expected_quantity,
    received_quantity: shipment.received_quantity,
    unit_cost: shipment.unit_cost,
    ship_from_country: shipment.ship_from_country,
  }));
}

/**
 * This part of the code generates orders-specific AI insights
 */
async function generateOrdersInsights(
  orders: OrderData[],
  kpis: any,
  inboundIntelligence: any
): Promise<any[]> {
  // This part of the code checks cache first to avoid expensive OpenAI calls
  const cacheData = { orders: orders.length, kpis, inboundIntelligence };
  const cachedInsights = insightCache.get('orders-insights', cacheData);
  
  if (cachedInsights) {
    console.log('⚡ Using cached orders insights - No OpenAI call needed');
    return cachedInsights;
  }

  // This part of the code calculates comprehensive analytics for Order Analysis Agent
  const totalOrderValue = orders.reduce((sum, order) => sum + ((order.unit_cost || 0) * order.expected_quantity), 0);
  const avgOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0;
  
  // Supplier analytics
  const supplierGroups = orders.reduce((acc, order) => {
    const supplier = order.supplier || 'Unknown';
    if (!acc[supplier]) acc[supplier] = [];
    acc[supplier].push(order);
    return acc;
  }, {} as Record<string, OrderData[]>);
  const topSupplier = Object.entries(supplierGroups).sort(([, a], [, b]) => b.length - a.length)[0];
  
  // Status analytics
  const cancelledOrders = orders.filter(o => o.status.includes('cancelled')).length;
  const cancellationRate = orders.length > 0 ? (cancelledOrders / orders.length) * 100 : 0;
  
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 Orders Insights API Key Check:', !!apiKey, 'Length:', apiKey?.length || 0);
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY not found in environment variables for Orders Insights');
    return [];
  }

  try {
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
            content: `You are a Chief Fulfillment Officer with 18+ years of experience in order management, customer service, and logistics optimization. You have successfully reduced order fulfillment times by 40% and improved customer satisfaction scores across multiple Fortune 500 companies.

Based on ${orders.length} orders with ${kpis.atRiskOrders} at-risk and ${cancelledOrders} cancellations, identify critical order management improvements. Analyze patterns in order delays, cancellations, and SLA breaches. Recommend specific workflows such as 'Set up automated alerts for orders approaching SLA deadlines', 'Create supplier performance scorecards', or 'Implement order prioritization based on customer tier'. Draw from your proven track record of improving order accuracy and reducing fulfillment costs.

COMPREHENSIVE ORDER ANALYSIS:
============================

ORDER VALUE INTELLIGENCE:
- Total Order Portfolio Value: $${totalOrderValue.toLocaleString()}
- Average Order Value: $${avgOrderValue.toFixed(2)}
- Daily Order Velocity: ${kpis.ordersToday || 0} orders today
- At-Risk Orders: ${kpis.atRiskOrders} (${inboundIntelligence.totalInbound > 0 ? ((kpis.atRiskOrders / inboundIntelligence.totalInbound) * 100).toFixed(1) : 0}% of portfolio)
- Open Purchase Orders: ${kpis.openPOs} active POs

SUPPLIER PERFORMANCE MATRIX:
- Active Supplier Count: ${Object.keys(supplierGroups).length} suppliers
- Top Volume Supplier: ${topSupplier ? topSupplier[0] : 'N/A'} (${topSupplier ? topSupplier[1].length : 0} orders)
- Supplier Concentration Risk: ${topSupplier && orders.length > 0 ? ((topSupplier[1].length / orders.length) * 100).toFixed(1) : 0}% from top supplier
- Delayed Shipments: ${inboundIntelligence.delayedShipments.count} (${(inboundIntelligence.delayedShipments.percentage || 0).toFixed(1)}%)

STATUS & LIFECYCLE INTELLIGENCE:
- Cancellation Rate: ${cancellationRate.toFixed(1)}% (Industry benchmark: 15%)
- Processing Efficiency: ${inboundIntelligence.totalInbound > 0 ? (((inboundIntelligence.totalInbound - kpis.atRiskOrders) / inboundIntelligence.totalInbound) * 100).toFixed(1) : 100}% orders on track
- Financial Impact of Delays: $${inboundIntelligence.valueAtRisk.toLocaleString()}

CRITICAL: You MUST provide exactly 3-5 strategic insights. Each insight MUST include 3-5 specific, actionable suggestedActions.

FORMAT AS ORDER FULFILLMENT EXCELLENCE JSON:
[
  {
    "type": "warning",
    "title": "Order Fulfillment Strategic Initiative",
    "description": "Expert analysis covering order value, supplier performance, time patterns, and status intelligence with specific implementation roadmap based on proven industry best practices",
    "severity": "critical|warning|info",
    "dollarImpact": calculated_financial_impact,
    "suggestedActions": ["Set up automated alerts for orders approaching SLA deadlines", "Create supplier performance scorecards with penalty clauses", "Implement order prioritization workflow based on customer tier and value", "Configure escalation process for at-risk orders", "Establish real-time order tracking dashboard"]
  }
]

EACH INSIGHT MUST HAVE 3-5 DETAILED SUGGESTED ACTIONS. NO EXCEPTIONS.`,
          },
        ],
        max_tokens: 350, // OPTIMIZED for speed
        temperature: 0.2,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log('🤖 Orders Insights Raw OpenAI Response:', content.substring(0, 500) + '...');
        try {
          const parsed = JSON.parse(content);
          console.log('✅ Orders Insights Parsed:', parsed.length, 'insights with actions:', parsed.map(p => p.suggestedActions?.length || 0));
          
          // This part of the code caches the AI insights to avoid regenerating
          insightCache.set('orders-insights', cacheData, parsed);
          console.log('💾 Orders insights cached successfully');
          
          return parsed;
        } catch (parseError) {
          console.error('❌ Orders Insights JSON Parse Error:', parseError);
          console.error('❌ Raw content that failed:', content?.substring(0, 500));
          throw parseError;
        }
      }
    } else {
      console.error('❌ Orders Insights OpenAI API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Orders Insights OpenAI analysis failed:', error);
  }

  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(
      "🤖 ORDERS INSIGHTS API: Generating AI insights for orders (optimized for speed)...",
    );

    const allShipments = await fetchShipmentsForInsights();
    
    // This part of the code ensures we only use Callahan-Smith data
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    const orders = transformShipmentsToOrdersForInsights(shipments);
    
    console.log(`🔍 ORDERS INSIGHTS: Data filtered for insights: ${orders.length} orders`);

    // Calculate KPIs and intelligence for insights
    const atRiskOrders = orders.filter(order =>
      order.status.includes('delayed') || 
      order.sla_status.includes('at_risk') ||
      order.expected_quantity !== order.received_quantity
    ).length;

    const kpis = {
      ordersToday: orders.filter(o => o.created_date.split("T")[0] === new Date().toISOString().split("T")[0]).length,
      atRiskOrders,
      openPOs: new Set(orders.filter(o => !o.status.includes('completed')).map(o => o.order_id)).size,
      unfulfillableSKUs: orders.filter(o => o.received_quantity === 0).length,
    };

    const delayedOrders = orders.filter(order => order.status.includes('delayed'));
    const inboundIntelligence = {
      totalInbound: orders.length,
      delayedShipments: {
        count: delayedOrders.length,
        percentage: orders.length > 0 ? (delayedOrders.length / orders.length) * 100 : 0,
      },
      valueAtRisk: delayedOrders.reduce((sum, order) => sum + (order.expected_quantity * (order.unit_cost || 0)), 0),
    };

    const insights = await generateOrdersInsights(orders, kpis, inboundIntelligence);

    const insightsData = {
      insights: insights.map((insight, index) => ({
        id: `orders-insight-${index}`,
        title: insight.title,
        description: insight.description,
        severity: insight.severity === "critical" ? "critical" as const : insight.severity === "warning" ? "warning" as const : "info" as const,
        dollarImpact: insight.dollarImpact || 0,
        suggestedActions: insight.suggestedActions || [],
        createdAt: new Date().toISOString(),
        source: "orders_agent" as const,
      })),
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ ORDERS INSIGHTS API: Orders insights generated successfully");
    res.status(200).json({
      success: true,
      data: insightsData,
      message: "Orders insights generated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ ORDERS INSIGHTS API Error:", error);
    res.status(500).json({
      error: "Failed to generate orders insights",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
