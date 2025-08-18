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
  
  // Time analytics
  const sixMonthsAgo = new Date(Date.now() - (6 * 30 * 24 * 60 * 60 * 1000));
  const oldOrders = orders.filter(o => new Date(o.created_date) < sixMonthsAgo).length;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // This part of the code returns empty insights when no API key is available - no fallback data
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
            content: `You are an Order Analysis Agent - a specialized AI assistant analyzing comprehensive order operations data. Provide strategic insights based on complete order analytics including KPIs, supplier performance, financial metrics, time patterns, and status intelligence.

COMPREHENSIVE ORDER ANALYSIS:
============================

ORDER VALUE INTELLIGENCE:
- Total Order Portfolio Value: $${totalOrderValue.toLocaleString()}
- Average Order Value: $${avgOrderValue.toFixed(2)}
- Daily Order Velocity: ${kpis.ordersToday || 0} orders today
- At-Risk Orders: ${kpis.atRiskOrders} (${inboundIntelligence.totalInbound > 0 ? ((kpis.atRiskOrders / inboundIntelligence.totalInbound) * 100).toFixed(1) : 0}% of portfolio)
- Open Purchase Orders: ${kpis.openPOs} active POs
- Unfulfillable SKUs: ${kpis.unfulfillableSKUs} with fulfillment issues

SUPPLIER PERFORMANCE MATRIX:
- Active Supplier Count: ${Object.keys(supplierGroups).length} suppliers
- Top Volume Supplier: ${topSupplier ? topSupplier[0] : 'N/A'} (${topSupplier ? topSupplier[1].length : 0} orders)
- Supplier Concentration Risk: ${topSupplier && orders.length > 0 ? ((topSupplier[1].length / orders.length) * 100).toFixed(1) : 0}% from top supplier
- Total Inbound Shipments: ${inboundIntelligence.totalInbound}
- Delayed Shipments: ${inboundIntelligence.delayedShipments.count} (${(inboundIntelligence.delayedShipments.percentage || 0).toFixed(1)}%)
- Average Lead Time Variance: ${(inboundIntelligence.avgDelayDays || 0).toFixed(1)} days delay
- Supplier Reliability Rate: ${inboundIntelligence.totalInbound > 0 ? (((inboundIntelligence.totalInbound - inboundIntelligence.delayedShipments.count) / inboundIntelligence.totalInbound) * 100).toFixed(1) : 100}%

STATUS & LIFECYCLE INTELLIGENCE:
- Cancellation Rate: ${cancellationRate.toFixed(1)}% (Industry benchmark: 15%)
- Processing Efficiency: ${inboundIntelligence.totalInbound > 0 ? (((inboundIntelligence.totalInbound - kpis.atRiskOrders) / inboundIntelligence.totalInbound) * 100).toFixed(1) : 100}% orders on track
- Perfect Order Rate: ${inboundIntelligence.totalInbound > 0 ? (((inboundIntelligence.totalInbound - inboundIntelligence.delayedShipments.count) / inboundIntelligence.totalInbound) * 100).toFixed(1) : 100}%
- Order Lifecycle Health Score: ${Math.max(0, Math.min(100, ((orders.length - cancelledOrders - kpis.atRiskOrders) / Math.max(orders.length, 1)) * 100)).toFixed(0)}/100

TIME-BASED PATTERN ANALYSIS:
- Order Age Distribution: ${oldOrders} orders (${orders.length > 0 ? ((oldOrders / orders.length) * 100).toFixed(1) : 0}%) older than 6 months
- Supply Chain Velocity: ${inboundIntelligence.avgDelayDays > 0 ? (1 / (inboundIntelligence.avgDelayDays + 1) * 100).toFixed(1) : 95}% optimal speed
- Inventory Fulfillment Rate: ${((orders.length - kpis.unfulfillableSKUs) / Math.max(orders.length, 1) * 100).toFixed(1)}%

FINANCIAL RISK ASSESSMENT:
- Financial Impact of Delays: $${inboundIntelligence.valueAtRisk.toLocaleString()}
- Supply Chain Risk Score: ${Math.min(10, Math.max(1, (inboundIntelligence.delayedShipments.percentage || 0) / 10 + (kpis.atRiskOrders / Math.max(inboundIntelligence.totalInbound, 1)) * 10)).toFixed(1)}/10
- Geographic Risk Exposure: ${inboundIntelligence.geopoliticalRisks ? 
  `${inboundIntelligence.geopoliticalRisks.riskCountries.join(', ')} (${inboundIntelligence.geopoliticalRisks.affectedShipments} shipments affected)` : 
  'Low geographic concentration risk'}
- Recovery Capacity: ${Math.max(1, 10 - (inboundIntelligence.delayedShipments.percentage || 0) / 10).toFixed(1)}/10

AS ORDER ANALYSIS AGENT, PROVIDE STRATEGIC OPERATIONAL INSIGHTS (2-4 insights):
Focus on comprehensive order analytics covering value optimization, supplier performance, time efficiency, and status intelligence with measurable business impact.

Each insight should address implementable changes with 30-90 day impact timelines based on the complete order analytics dashboard.

FORMAT AS ORDER ANALYSIS PLAYBOOK JSON:
[
  {
    "type": "warning",
    "title": "Order Analytics Strategic Initiative",
    "description": "Comprehensive analysis covering order value, supplier performance, time patterns, and status intelligence with specific implementation roadmap",
    "severity": "critical|warning|info",
    "dollarImpact": calculated_financial_impact,
    "suggestedActions": ["Optimize high-value order processing for top suppliers", "Implement real-time status tracking for aging orders", "Diversify supplier portfolio to reduce concentration risk"]
  }
]

CRITICAL REQUIREMENTS for Order Analysis Agent:
- Reference specific data from order value, supplier, time, and status analytics
- Include supplier names, financial impacts, or processing timeframes when relevant  
- Address operational issues across the entire orders dashboard scope
- Ordered by business impact (financial/operational urgency first)
- Between 2-4 actionable insights based on comprehensive order analysis
- Focus on measurable ROI and operational efficiency improvements`,
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

  // This part of the code returns empty insights when AI fails - no fallback data
  return [];
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
