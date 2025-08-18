import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code provides orders data endpoint for Vercel serverless deployment
 * Uses shipments data as orders since shipments have order-like fields (PO numbers, status, dates)
 */

// TinyBird Shipments API Response - standardized interface
interface ShipmentData {
  company_url: string;
  shipment_id: string;
  brand_id: string | null;
  brand_name: string;
  brand_domain: string | null;
  created_date: string;
  purchase_order_number: string | null;
  status: string;
  supplier: string | null;
  expected_arrival_date: string | null;
  warehouse_id: string | null;
  ship_from_city: string | null;
  ship_from_state: string | null;
  ship_from_postal_code: string | null;
  ship_from_country: string | null;
  external_system_url: string | null;
  inventory_item_id: string;
  sku: string | null;
  expected_quantity: number;
  received_quantity: number;
  unit_cost: number | null;
  external_id: string | null;
  receipt_id: string;
  arrival_date: string;
  receipt_inventory_item_id: string;
  receipt_quantity: number;
  tracking_number: string[];
  notes: string;
}

// Order data derived from shipment structure
interface OrderData {
  order_id: string;
  created_date: string;
  brand_name: string;
  status: string;
  sla_status: string;
  expected_date: string | null;
  arrival_date: string;
  supplier: string | null;
  warehouse_id: string | null;
  product_sku: string | null;
  expected_quantity: number;
  received_quantity: number;
  unit_cost: number | null;
  ship_from_country: string | null;
  notes: string;
  shipment_id: string;
  inventory_item_id: string;
}

/**
 * This part of the code fetches shipments data from TinyBird API to use as orders
 * Matches the existing implementation to ensure consistent data structure
 */
async function fetchShipments(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "WAREHOUSE_BASE_URL and WAREHOUSE_TOKEN environment variables are required",
    );
  }

  // This part of the code fetches from inbound_shipments_details_mv API with Callahan-Smith brand filter
  const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * This part of the code transforms shipment data into order-like structure
 * Maps shipment fields to order fields for consistent interface
 */
function transformShipmentsToOrders(shipments: ShipmentData[]): OrderData[] {
  return shipments.map(shipment => {
    const orderId = shipment.purchase_order_number || shipment.shipment_id;
    const slaStatus = calculateSLAStatus(shipment.expected_arrival_date, shipment.arrival_date, shipment.status);
    
    return {
      order_id: orderId,
      created_date: shipment.created_date,
      brand_name: shipment.brand_name,
      status: mapShipmentStatusToOrderStatus(shipment.status),
      sla_status: slaStatus,
      expected_date: shipment.expected_arrival_date,
      arrival_date: shipment.arrival_date,
      supplier: shipment.supplier,
      warehouse_id: shipment.warehouse_id,
      product_sku: shipment.sku,
      expected_quantity: shipment.expected_quantity,
      received_quantity: shipment.received_quantity,
      unit_cost: shipment.unit_cost,
      ship_from_country: shipment.ship_from_country,
      notes: shipment.notes,
      shipment_id: shipment.shipment_id,
      inventory_item_id: shipment.inventory_item_id,
    };
  });
}

/**
 * This part of the code maps shipment status to order-friendly status terms
 */
function mapShipmentStatusToOrderStatus(status: string): string {
  const statusLower = status.toLowerCase();
  
  // Map shipment statuses to order statuses
  if (statusLower.includes('completed') || statusLower.includes('delivered')) return 'completed';
  if (statusLower.includes('shipped') || statusLower.includes('transit')) return 'shipped';
  if (statusLower.includes('receiving') || statusLower.includes('processing')) return 'processing';
  if (statusLower.includes('pending') || statusLower.includes('open')) return 'pending';
  if (statusLower.includes('cancelled')) return 'cancelled';
  if (statusLower.includes('delayed') || statusLower.includes('late')) return 'delayed';
  
  return status; // Return original if no mapping found
}

/**
 * This part of the code calculates SLA status based on dates and current status
 */
function calculateSLAStatus(expectedDate: string | null, arrivalDate: string, status: string): string {
  if (!expectedDate) return 'unknown';
  
  const expected = new Date(expectedDate);
  const actual = new Date(arrivalDate);
  const now = new Date();
  
  // If completed and on time
  if (status.toLowerCase().includes('completed') || status.toLowerCase().includes('delivered')) {
    return actual <= expected ? 'on_time' : 'late';
  }
  
  // If still pending/processing
  if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('processing')) {
    const daysDiff = (now.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 2) return 'breach';
    if (daysDiff > 0) return 'at_risk';
    return 'on_time';
  }
  
  // Default logic for other statuses
  return actual <= expected ? 'on_time' : 'late';
}

/**
 * This part of the code calculates orders-specific KPIs from transformed data
 */
function calculateOrdersKPIs(orders: OrderData[]): any {
  const today = new Date().toISOString().split("T")[0];
  
  // This part of the code counts orders created today
  const ordersToday = orders.filter(order => 
    order.created_date.split("T")[0] === today
  ).length;
  
  // This part of the code counts at-risk orders (delayed, at_risk SLA, quantity discrepancies)
  const atRiskOrders = orders.filter(order =>
    order.status.includes('delayed') || 
    order.sla_status.includes('at_risk') || 
    order.sla_status.includes('breach') ||
    order.expected_quantity !== order.received_quantity
  ).length;
  
  // This part of the code counts open purchase orders
  const openPOs = new Set(
    orders
      .filter(order => 
        order.order_id && 
        !order.status.includes('completed') && 
        !order.status.includes('cancelled')
      )
      .map(order => order.order_id)
  ).size;
  
  // This part of the code counts unfulfillable SKUs (orders with zero received quantity)
  const unfulfillableSKUs = orders.filter(order => 
    order.received_quantity === 0 && 
    order.status !== 'pending'
  ).length;
  
  return {
    ordersToday,
    atRiskOrders,
    openPOs,
    unfulfillableSKUs,
  };
}

/**
 * This part of the code calculates inbound shipment intelligence metrics
 */
function calculateInboundIntelligence(orders: OrderData[]): any {
  const totalInbound = orders.length;
  
  // This part of the code identifies delayed shipments
  const delayedOrders = orders.filter(order => 
    order.status.includes('delayed') || 
    order.sla_status.includes('breach') || 
    order.sla_status.includes('late')
  );
  
  // This part of the code calculates average delay days
  const avgDelayDays = delayedOrders.length > 0 
    ? delayedOrders.reduce((sum, order) => {
        if (!order.expected_date) return sum;
        const expected = new Date(order.expected_date);
        const actual = new Date(order.arrival_date);
        const diffDays = Math.max(0, (actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / delayedOrders.length
    : 0;
  
  // This part of the code calculates value at risk from delayed orders
  const valueAtRisk = delayedOrders.reduce((sum, order) => 
    sum + (order.expected_quantity * (order.unit_cost || 0)), 0
  );
  
  // This part of the code analyzes geopolitical risks
  const riskCountries = ['China', 'Russia', 'Iran', 'North Korea', 'Myanmar'];
  const riskOrders = orders.filter(order => 
    order.ship_from_country && riskCountries.includes(order.ship_from_country)
  );
  
  const geopoliticalRisks = riskOrders.length > 0 ? {
    riskCountries: [...new Set(riskOrders.map(order => order.ship_from_country).filter(Boolean))],
    affectedShipments: riskOrders.length,
    avgDelayIncrease: 0 // No simulated data
  } : undefined;
  
  return {
    totalInbound,
    delayedShipments: {
      count: delayedOrders.length,
      percentage: totalInbound > 0 ? (delayedOrders.length / totalInbound) * 100 : 0,
    },
    avgDelayDays: Math.round(avgDelayDays * 10) / 10,
    valueAtRisk: Math.round(valueAtRisk),
    geopoliticalRisks,
    recentShipments: orders, // All shipments available for frontend pagination
    delayedShipmentsList: delayedOrders, // All delayed shipments for comprehensive view
  };
}

/**
 * This part of the code generates orders-specific AI insights
 */
async function generateOrdersInsights(
  orders: OrderData[],
  kpis: any,
  inboundIntelligence: any
): Promise<any[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // This part of the code generates order insights without AI when API key is not available
    const insights = [];
    
    if (kpis.atRiskOrders > 0) {
      insights.push({
        type: "warning",
        title: "At-Risk Orders Detected",
        description: `${kpis.atRiskOrders} orders are currently at risk due to delays or SLA breaches. Immediate attention required to prevent customer impact.`,
        severity: kpis.atRiskOrders > 10 ? "critical" : "warning",
        dollarImpact: inboundIntelligence.valueAtRisk,
      });
    }
    
    if (inboundIntelligence.delayedShipments.percentage > 20) {
      insights.push({
        type: "critical",
        title: "High Delay Rate",
        description: `${inboundIntelligence.delayedShipments.percentage.toFixed(1)}% of shipments are delayed with an average delay of ${inboundIntelligence.avgDelayDays} days. Review supplier performance and logistics routing.`,
        severity: "critical",
        dollarImpact: Math.round(inboundIntelligence.valueAtRisk * 0.8),
      });
    }
    
    if (inboundIntelligence.geopoliticalRisks) {
      insights.push({
        type: "info",
        title: "Geopolitical Risk Assessment",
        description: `${inboundIntelligence.geopoliticalRisks.affectedShipments} shipments from risk-prone regions (${inboundIntelligence.geopoliticalRisks.riskCountries.join(', ')}). Consider supply chain diversification.`,
        severity: "info",
        dollarImpact: 0,
      });
    }
    
    return insights;
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
            content: `You are a supply chain optimization expert. Analyze order flow patterns and provide operational intelligence for process improvement.

FLOW ANALYSIS:
==============

ORDER VELOCITY & THROUGHPUT:
- Current Daily Orders: ${kpis.ordersToday || 0}
- At-Risk Orders: ${kpis.atRiskOrders} (${inboundIntelligence.totalInbound > 0 ? ((kpis.atRiskOrders / inboundIntelligence.totalInbound) * 100).toFixed(1) : 0}% of total)
- Open Purchase Orders: ${kpis.openPOs}
- Processing Bottlenecks: ${kpis.unfulfillableSKUs} unfulfillable SKUs
- Perfect Order Rate: ${inboundIntelligence.totalInbound > 0 ? (((inboundIntelligence.totalInbound - inboundIntelligence.delayedShipments.count) / inboundIntelligence.totalInbound) * 100).toFixed(1) : 100}%

SUPPLIER ECOSYSTEM INTELLIGENCE:
- Total Inbound Shipments: ${inboundIntelligence.totalInbound}
- Delayed Shipments: ${inboundIntelligence.delayedShipments.count} (${(inboundIntelligence.delayedShipments.percentage || 0).toFixed(1)}%)
- Average Lead Time Variance: ${(inboundIntelligence.avgDelayDays || 0).toFixed(1)} days delay
- Financial Impact of Delays: $${inboundIntelligence.valueAtRisk.toLocaleString()}
- Supplier Reliability Rate: ${inboundIntelligence.totalInbound > 0 ? (((inboundIntelligence.totalInbound - inboundIntelligence.delayedShipments.count) / inboundIntelligence.totalInbound) * 100).toFixed(1) : 100}%

DEMAND PATTERN RECOGNITION:
- Order Volume Trend: ${kpis.ordersToday > 0 ? 'Active daily flow' : 'Low volume period'}
- Inventory Availability: ${((orders.length - kpis.unfulfillableSKUs) / Math.max(orders.length, 1) * 100).toFixed(1)}% fulfillable
- Processing Efficiency: ${inboundIntelligence.totalInbound > 0 ? (((inboundIntelligence.totalInbound - kpis.atRiskOrders) / inboundIntelligence.totalInbound) * 100).toFixed(1) : 100}% orders on track
- Supply Chain Velocity: ${inboundIntelligence.avgDelayDays > 0 ? (1 / (inboundIntelligence.avgDelayDays + 1) * 100).toFixed(1) : 95}% optimal speed

RISK & RESILIENCE ASSESSMENT:
- Supply Chain Risk Score: ${Math.min(10, Math.max(1, (inboundIntelligence.delayedShipments.percentage || 0) / 10 + (kpis.atRiskOrders / Math.max(inboundIntelligence.totalInbound, 1)) * 10)).toFixed(1)}/10
- Geographic Risk Exposure: ${inboundIntelligence.geopoliticalRisks ? 
  `${inboundIntelligence.geopoliticalRisks.riskCountries.join(', ')} (${inboundIntelligence.geopoliticalRisks.affectedShipments} shipments affected)` : 
  'Low geographic concentration risk'}
- Financial Exposure: $${inboundIntelligence.valueAtRisk.toLocaleString()} at risk
- Recovery Capacity: ${Math.max(1, 10 - (inboundIntelligence.delayedShipments.percentage || 0) / 10).toFixed(1)}/10

PROVIDE OPERATIONAL STRATEGY (2-4 insights based on operational impact):
Focus on flow optimization and supplier performance issues with measurable ROI.

Each insight should address implementable changes with 30-90 day impact timelines.

FORMAT AS OPERATIONS PLAYBOOK JSON:
[
  {
    "type": "warning",
    "title": "Supply Chain Strategy Title",
    "description": "Operational analysis with flow optimization, supplier intelligence, and resilience recommendations with specific implementation steps",
    "severity": "critical|warning|info",
    "dollarImpact": calculated_financial_impact,
    "suggestedActions": ["Audit delayed shipments from high-risk suppliers", "Implement SLA tracking dashboard for critical orders", "Negotiate backup suppliers for geographic risk countries"]
  }
]

CRITICAL: suggestedActions must be:
- Specific operational tasks (not generic placeholders)
- Address real issues identified in the data analysis
- Ordered by urgency (most critical first, preventive measures last)
- Include specific supplier names, countries, or order types when relevant
- Between 1-4 actions based on the complexity of the operational issue`,
          },
        ],
        max_tokens: 700,
        temperature: 0.2,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    }
  } catch (error) {
    console.error("Orders AI analysis failed:", error);
  }

  // This part of the code generates fallback order insights when AI fails
  const insights = [];
  
  if (kpis.atRiskOrders > 0) {
    insights.push({
      type: "warning",
      title: "At-Risk Orders Detected",
      description: `${kpis.atRiskOrders} orders are currently at risk due to delays or SLA breaches. Immediate attention required to prevent customer impact.`,
      severity: kpis.atRiskOrders > 10 ? "critical" : "warning",
      dollarImpact: inboundIntelligence.valueAtRisk,
      suggestedActions: [
        "Review all at-risk orders for expedited processing",
        "Contact customers proactively about potential delays",
        "Implement daily status tracking for critical orders"
      ]
    });
  }
  
  if (inboundIntelligence.delayedShipments.percentage > 20) {
    insights.push({
      type: "critical",
      title: "High Delay Rate",
      description: `${inboundIntelligence.delayedShipments.percentage.toFixed(1)}% of shipments are delayed with an average delay of ${inboundIntelligence.avgDelayDays} days. Review supplier performance and logistics routing.`,
      severity: "critical",
      dollarImpact: Math.round(inboundIntelligence.valueAtRisk * 0.8),
      suggestedActions: [
        "Audit top 3 suppliers causing delays",
        "Implement alternative routing for critical shipments",
        "Negotiate stricter SLAs with underperforming suppliers"
      ]
    });
  }
  
  if (inboundIntelligence.geopoliticalRisks) {
    insights.push({
      type: "info",
      title: "Geopolitical Risk Assessment",
      description: `${inboundIntelligence.geopoliticalRisks.affectedShipments} shipments from risk-prone regions (${inboundIntelligence.geopoliticalRisks.riskCountries.join(', ')}). Consider supply chain diversification.`,
      severity: "info",
      dollarImpact: 0,
      suggestedActions: [
        `Identify backup suppliers outside ${inboundIntelligence.geopoliticalRisks.riskCountries.join(', ')}`,
        "Create contingency plans for affected shipments",
        "Review insurance coverage for geopolitical risks"
      ]
    });
  }
  
  return insights;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(
      "📦 Vercel API: Fetching orders data (using shipments as orders)...",
    );

    // This part of the code fetches shipments and transforms them into orders
    const allShipments = await fetchShipments();
    
    // This part of the code filters shipments to ensure only Callahan-Smith data is processed
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    console.log(`🔍 Data filtered for Callahan-Smith: ${allShipments.length} total → ${shipments.length} Callahan-Smith shipments`);
    
    const orders = transformShipmentsToOrders(shipments);

    // This part of the code calculates all orders metrics from transformed data
    const kpis = calculateOrdersKPIs(orders);
    const inboundIntelligence = calculateInboundIntelligence(orders);

    // This part of the code generates orders-specific AI insights
    const insightsData = await generateOrdersInsights(orders, kpis, inboundIntelligence);

    const ordersData = {
      orders: orders.slice(0, 500), // Show up to 500 orders for comprehensive view while maintaining performance
      kpis,
      insights: insightsData.map((insight, index) => ({
        id: `orders-insight-${index}`,
        title: insight.title,
        description: insight.description,
        severity:
          insight.severity === "critical"
            ? ("critical" as const)
            : insight.severity === "warning"
              ? ("warning" as const)
              : ("info" as const),
        dollarImpact: insight.dollarImpact || 0,
        suggestedActions: [
          `Address ${insight.title.toLowerCase()}`,
          "Implement corrective measures",
        ],
        createdAt: new Date().toISOString(),
        source: "orders_agent" as const,
      })),
      inboundIntelligence,
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ Vercel API: Orders data compiled successfully");
    res.status(200).json({
      success: true,
      data: ordersData,
      message: "Orders data retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Vercel API Error:", error);
    res.status(500).json({
      error: "Failed to fetch orders data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
