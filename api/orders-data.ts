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
 * This part of the code generates AI-powered KPI context for Orders with accurate percentages and insights
 * Uses the same orders data source as KPI calculations to ensure consistency
 */
async function generateOrdersKPIContext(
  kpis: any, 
  orders: OrderData[]
): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 Orders KPI Context Agent API Key Check:', !!apiKey, 'Length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('❌ No AI service key - using calculated fallbacks for Orders KPI context');
    return generateOrdersKPIFallbackContext(kpis, orders);
  }

  try {
    // This part of the code analyzes the SAME orders data used for KPI calculations to ensure accuracy
    const totalOrders = orders.length;
    const totalUniqueOrderIds = new Set(orders.map(o => o.order_id).filter(Boolean)).size;
    const today = new Date().toISOString().split("T")[0];
    const todaysOrders = orders.filter(o => o.created_date.split("T")[0] === today);
    
    const atRiskDetails = orders.filter(o => 
      o.status.includes('delayed') || 
      o.sla_status.includes('at_risk') || 
      o.sla_status.includes('breach') ||
      o.expected_quantity !== o.received_quantity
    );
    
    // This part of the code extracts supplier and issue data for contextual explanations
    const topAffectedSuppliers = [...new Set(atRiskDetails.map(o => o.supplier).filter(Boolean))].slice(0, 3);
    const quantityDiscrepancies = atRiskDetails.filter(o => o.expected_quantity !== o.received_quantity).length;
    const slaIssues = atRiskDetails.filter(o => o.sla_status.includes('at_risk') || o.sla_status.includes('breach')).length;
    const historicalDaily = Math.round(totalOrders / 30); // Rough historical average

    const prompt = `You are a Chief Fulfillment Officer analyzing order fulfillment KPIs. Provide meaningful percentage context and business explanations:

ORDERS OPERATIONAL DATA:
========================
Total Orders in System: ${totalOrders}
Unique Order IDs: ${totalUniqueOrderIds}
Today's New Orders: ${todaysOrders.length}
Historical Daily Average: ${historicalDaily}

CURRENT KPI VALUES:
- Orders Today: ${kpis.ordersToday}
- At-Risk Orders: ${kpis.atRiskOrders} 
- Open POs: ${kpis.openPOs}
- Unfulfillable SKUs: ${kpis.unfulfillableSKUs}

DETAILED BREAKDOWN:
- Quantity Discrepancies: ${quantityDiscrepancies} orders
- SLA Issues: ${slaIssues} orders
- Top Affected Suppliers: ${topAffectedSuppliers.join(", ")}
- Daily Volume Performance: ${todaysOrders.length} vs ${historicalDaily} avg

Calculate accurate percentages using proper denominators and provide fulfillment-focused business context for each KPI.

REQUIRED JSON OUTPUT:
{
  "ordersToday": {
    "percentage": "[if_meaningful]%", 
    "context": "[daily_volume_vs_historical_context]",
    "description": "New orders received today"
  },
  "atRiskOrders": {
    "percentage": "[accurate_percentage]%",
    "context": "[supplier_and_issue_breakdown]", 
    "description": "Orders with delays or issues ([percentage] of total orders)"
  },
  "openPOs": {
    "percentage": "[accurate_percentage]%",
    "context": "[fulfillment_workload_context]",
    "description": "Active purchase orders ([percentage] of order volume)"
  },
  "unfulfillableSKUs": {
    "percentage": "[accurate_percentage]%",
    "context": "[fulfillment_impact_context]",
    "description": "SKUs with fulfillment issues ([percentage] of problem orders)"
  }
}`;

    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_FAST || "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(25000), // 25 second timeout to prevent Vercel function timeouts
    });

    if (response.ok) {
      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || '';
      console.log('🤖 Orders KPI Context Agent Raw Response:', aiContent.substring(0, 300) + '...');
      
      try {
        const parsed = JSON.parse(aiContent);
        console.log('✅ Orders KPI Context Agent: AI context parsed successfully');
        return parsed;
      } catch (parseError) {
        console.error('❌ Orders KPI Context JSON Parse Error:', parseError);
        console.log('❌ Orders KPI Context: JSON parse failed, using fallback');
        return generateOrdersKPIFallbackContext(kpis, orders);
      }
    } else {
      console.error('❌ Orders KPI Context OpenAI API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error("❌ Orders KPI Context AI analysis failed:", error);
  }

  // This part of the code provides fallback when AI fails - ensures KPI context always available
  console.log('❌ Orders KPI Context: AI service failed, using calculated fallback');
  return generateOrdersKPIFallbackContext(kpis, orders);
}

/**
 * This part of the code provides calculated Orders KPI context when AI is unavailable
 * Uses the same data relationships as the AI to ensure consistent percentages
 */
function generateOrdersKPIFallbackContext(kpis: any, orders: OrderData[]) {
  const totalOrders = orders.length;
  const totalUniqueOrderIds = new Set(orders.map(o => o.order_id).filter(Boolean)).size;
  const historicalDaily = Math.round(totalOrders / 30);
  
  return {
    ordersToday: {
      percentage: historicalDaily > 0 && kpis.ordersToday > 0 ? 
        `${((kpis.ordersToday / historicalDaily) * 100).toFixed(1)}%` : null,
      context: `${kpis.ordersToday} today vs ${historicalDaily} daily average`,
      description: historicalDaily > 0 && kpis.ordersToday !== historicalDaily ? 
        `New orders received today (${((kpis.ordersToday / historicalDaily) * 100).toFixed(1)}% of daily avg)` :
        "New orders received today"
    },
    atRiskOrders: {
      percentage: totalOrders > 0 ? `${((kpis.atRiskOrders / totalOrders) * 100).toFixed(1)}%` : null,
      context: `${kpis.atRiskOrders} problematic orders from ${totalOrders} total`,
      description: totalOrders > 0 ?
        `Orders with delays or issues (${((kpis.atRiskOrders / totalOrders) * 100).toFixed(1)}% of total orders)` :
        "Orders with delays or issues"
    },
    openPOs: {
      percentage: totalUniqueOrderIds > 0 ? `${((kpis.openPOs / totalUniqueOrderIds) * 100).toFixed(1)}%` : null,
      context: `${kpis.openPOs} active from ${totalUniqueOrderIds} total order IDs`,
      description: totalUniqueOrderIds > 0 ?
        `Active purchase orders (${((kpis.openPOs / totalUniqueOrderIds) * 100).toFixed(1)}% of order volume)` :
        "Active purchase orders"
    },
    unfulfillableSKUs: {
      percentage: kpis.atRiskOrders > 0 ? `${((kpis.unfulfillableSKUs / kpis.atRiskOrders) * 100).toFixed(1)}%` : null,
      context: `${kpis.unfulfillableSKUs} zero-quantity orders from ${kpis.atRiskOrders} problematic`,
      description: kpis.atRiskOrders > 0 ?
        `SKUs with fulfillment issues (${((kpis.unfulfillableSKUs / kpis.atRiskOrders) * 100).toFixed(1)}% of problem orders)` :
        "SKUs with fulfillment issues"
    }
  };
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
  console.log('🔑 Orders Agent API Key Check:', !!apiKey, 'Length:', apiKey?.length || 0);
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY not found in environment variables for Orders Agent - returning empty insights (NO FALLBACK)');
    // Return empty insights when OpenAI is not available - NO FALLBACK like daily brief
    return [];
  }

  try {
    // This part of the code extracts specific data for actionable AI recommendations
    const topAtRiskOrders = orders
      .filter(o => o.sla_status === 'at_risk' || o.sla_status === 'breach')
      .sort((a, b) => (b.unit_cost || 0) * b.expected_quantity - (a.unit_cost || 0) * a.expected_quantity)
      .slice(0, 5)
      .map(o => ({
        po: o.order_id,
        value: Math.round((o.unit_cost || 0) * o.expected_quantity),
        supplier: o.supplier,
        daysPastDue: Math.max(0, Math.ceil((new Date().getTime() - new Date(o.expected_date || o.created_date).getTime()) / (1000 * 60 * 60 * 24)))
      }));

    const topDelayedShipments = orders
      .filter(o => o.status.includes('delayed') || o.sla_status.includes('breach'))
      .slice(0, 3)
      .map(o => ({
        po: o.order_id,
        supplier: o.supplier,
        sku: o.product_sku,
        impact: Math.round((o.unit_cost || 0) * o.expected_quantity)
      }));

    const unfulfillableItems = orders
      .filter(o => o.received_quantity === 0 && o.expected_quantity > 0)
      .slice(0, 4)
      .map(o => ({
        sku: o.product_sku,
        shortfall: o.expected_quantity,
        supplier: o.supplier,
        po: o.order_id
      }));

    const supplierPerformanceIssues = Object.entries(
      orders.reduce((acc, o) => {
        if (o.expected_quantity !== o.received_quantity) {
          const supplier = o.supplier || 'Unknown';
          if (!acc[supplier]) acc[supplier] = { issues: 0, value: 0 };
          acc[supplier].issues++;
          acc[supplier].value += Math.abs(o.expected_quantity - o.received_quantity) * (o.unit_cost || 0);
        }
        return acc;
      }, {} as Record<string, { issues: number; value: number }>)
    ).sort(([,a], [,b]) => b.value - a.value).slice(0, 3);

    console.log('🔍 Orders AI Enhancement - At-Risk Orders:', topAtRiskOrders.length);
    console.log('🔍 Orders AI Enhancement - Delayed Shipments:', topDelayedShipments.length);
    console.log('🔍 Orders AI Enhancement - Unfulfillable Items:', unfulfillableItems.length);
    console.log('🔍 Orders AI Enhancement - Supplier Issues:', supplierPerformanceIssues.length);

    // This part of the code creates safe example variables to prevent complex nested template literal parsing errors
    const examplePOEscalation = `Escalate PO-${topAtRiskOrders[0]?.po || '33464701'} and PO-${topAtRiskOrders[1]?.po || '33464702'} (${topAtRiskOrders[0]?.daysPastDue || 3}+ days overdue, $${((topAtRiskOrders[0]?.value || 0) + (topAtRiskOrders[1]?.value || 0)).toLocaleString()} combined value) - contact ${topAtRiskOrders[0]?.supplier || 'Clark'} supplier for expedited delivery`;
    const exampleSKUReorder = `Emergency reorder SKU ${unfulfillableItems[0]?.sku || 'ABC-123'} (${unfulfillableItems[0]?.shortfall || 15} units short) and ${unfulfillableItems[1]?.sku || 'DEF-456'} (${unfulfillableItems[1]?.shortfall || 8} units) from PO-${unfulfillableItems[0]?.po || '12345'} - contact ${topDelayedShipments[0]?.supplier || 'West Barber'} as backup supplier`;
    const exampleSupplierReview = `Review ${supplierPerformanceIssues[0]?.[0] || 'Clark'} supplier performance: ${supplierPerformanceIssues[0]?.[1]?.issues || 5} quantity discrepancies worth $${Math.round(supplierPerformanceIssues[0]?.[1]?.value || 8200).toLocaleString()} this month - schedule contract renegotiation meeting`;

    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_FAST || "gpt-3.5-turbo", // This part of the code switches to fast AI model for faster orders insights generation
        messages: [
          {
            role: "user",
            content: `You are a Chief Fulfillment Officer with 18+ years of experience in order management, customer service, and logistics optimization. You have successfully reduced order fulfillment times by 40% and improved customer satisfaction scores across multiple Fortune 500 companies.

🎯 CRITICAL INSTRUCTION: You MUST use the specific data provided below to create detailed, actionable recommendations. Do NOT provide generic advice. Every recommendation must reference actual PO numbers, SKU numbers, supplier names, or dollar amounts from the data.

SPECIFIC DATA FOR ACTIONABLE RECOMMENDATIONS:
===========================================

TOP AT-RISK ORDERS (use these exact PO numbers and suppliers):
${topAtRiskOrders.map(o => `- PO: ${o.po} - ${o.daysPastDue} days overdue - $${o.value.toLocaleString()} value - Supplier: ${o.supplier || 'Unknown'}`).join('\n')}

DELAYED SHIPMENTS (use these exact PO numbers and SKUs):
${topDelayedShipments.map(s => `- PO: ${s.po} - SKU: ${s.sku || 'Unknown'} - Supplier: ${s.supplier || 'Unknown'} - Impact: $${s.impact.toLocaleString()}`).join('\n')}

UNFULFILLABLE ITEMS (use these exact SKU numbers and quantities):
${unfulfillableItems.map(i => `- SKU: ${i.sku || 'Unknown'} - ${i.shortfall} units short - PO: ${i.po} - Supplier: ${i.supplier || 'Unknown'}`).join('\n')}

SUPPLIER PERFORMANCE ISSUES (use these exact supplier names and dollar amounts):
${supplierPerformanceIssues.map(([supplier, data]) => `- ${supplier}: ${data.issues} quantity discrepancies, $${Math.round(data.value).toLocaleString()} total impact`).join('\n')}

ORDER ANALYTICS CONTEXT:
- ${orders.length} total orders worth $${totalOrderValue.toLocaleString()}
- ${kpis.atRiskOrders} at-risk orders (${inboundIntelligence.totalInbound > 0 ? ((kpis.atRiskOrders / inboundIntelligence.totalInbound) * 100).toFixed(1) : 0}% of portfolio)
- ${kpis.openPOs} active purchase orders
- $${inboundIntelligence.valueAtRisk.toLocaleString()} financial impact from delays

📋 STEP-BY-STEP INSTRUCTIONS:
1. Analyze the specific order data provided above
2. Identify 3-5 critical order fulfillment issues
3. For EACH insight, create 3-5 specific recommendations that reference the actual data
4. Include exact PO numbers, SKU numbers, supplier names, and dollar amounts
5. Focus on actionable next steps with specific contacts and timelines

🎯 MANDATORY OUTPUT FORMAT:
[
  {
    "type": "warning",
    "title": "[Issue Title Based on Specific Order Data]",
    "description": "Analysis referencing specific POs, SKUs, suppliers, and dollar amounts from the data above. Include financial impact and root cause.",
    "severity": "critical|warning|info",
    "dollarImpact": [actual_number_from_data],
    "suggestedActions": [
      "[Action 1: Reference specific PO number, SKU, or supplier from data]",
      "[Action 2: Include actual dollar amounts and quantities]",
      "[Action 3: Name specific suppliers or warehouses to contact]",
      "[Action 4: Use real data points, not generic terms]",
      "[Action 5: Provide concrete next steps with timelines]"
    ]
  }
]

✅ EXAMPLES OF SPECIFIC RECOMMENDATIONS (reference these patterns):
"${examplePOEscalation}"
"${exampleSKUReorder}"
"${exampleSupplierReview}"

❌ AVOID GENERIC RECOMMENDATIONS LIKE:
- "Set up automated alerts for orders approaching SLA deadlines" (no specific POs)
- "Create supplier performance scorecards" (no specific suppliers)
- "Implement order prioritization workflow" (no specific orders)

🚨 CRITICAL SUCCESS CRITERIA:
- Each suggestedAction MUST include specific data from above sections
- Use actual PO numbers, SKU numbers, supplier names, dollar amounts
- Provide concrete next steps with specific parties to contact
- Include implementation timelines and expected ROI
- Reference exact data points, not general concepts

Generate exactly 3-5 insights with 3-5 specific actions each.`,
          },
        ],
        max_tokens: 1500, // Increased for detailed insights and recommendations
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(25000), // 25 second timeout to prevent Vercel function timeouts
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log('🤖 Orders Agent Raw AI Response:', content.substring(0, 500) + '...');
        try {
          const parsed = JSON.parse(content);
          console.log('✅ Orders Agent Parsed Insights:', parsed.length, 'insights with actions:', parsed.map(p => p.suggestedActions?.length || 0));
          return parsed;
        } catch (parseError) {
          console.error('❌ Orders Agent JSON Parse Error:', parseError);
          console.error('❌ Raw content that failed:', content?.substring(0, 500));
          console.log('❌ Orders: JSON parse failed, returning empty insights (NO FALLBACK)');
          return [];
        }
      }
    } else {
      console.error('❌ Orders Agent OpenAI API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Orders Agent OpenAI analysis failed:', error);
  }

  // Return empty insights when AI fails - NO FALLBACK like daily brief
  console.log('❌ Orders: AI service failed, returning empty insights (NO FALLBACK)');
  return [];
}

// This part of the code handles fast mode for quick orders data loading without AI insights
async function handleFastMode(req: VercelRequest, res: VercelResponse) {
  console.log("⚡ Orders Fast Mode: Loading data without AI insights...");
  
  // This part of the code fetches shipments and transforms them into orders
  const allShipments = await fetchShipments();
  
  // This part of the code filters shipments to ensure only Callahan-Smith data is processed
  const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
  console.log(`🔍 Fast Mode - Data filtered for Callahan-Smith: ${allShipments.length} total → ${shipments.length} Callahan-Smith shipments`);
  
  const orders = transformShipmentsToOrders(shipments);

  // This part of the code calculates all orders metrics from transformed data
  const kpis = calculateOrdersKPIs(orders);
  const inboundIntelligence = calculateInboundIntelligence(orders);

  // ⚡ FAST MODE: Empty KPI context - AI enhancement loads separately
  const kpiContext = {};

  const ordersData = {
    orders: orders.slice(0, 500), // Show up to 500 orders for comprehensive view while maintaining performance
    kpis,
    kpiContext, // ⚡ Empty in fast mode - AI context loads separately
    insights: [], // Empty for fast mode
    inboundIntelligence,
    lastUpdated: new Date().toISOString(),
  };

  console.log("✅ Orders Fast Mode: Data compiled successfully");
  res.status(200).json({
    success: true,
    data: ordersData,
    message: "Orders fast data retrieved successfully",
    timestamp: new Date().toISOString(),
  });
}

// This part of the code handles insights mode for AI-generated orders insights only
async function handleInsightsMode(req: VercelRequest, res: VercelResponse) {
  console.log("🤖 Orders AI Enhancement Mode: Loading AI insights + KPI context...");
  
  // This part of the code fetches shipments and transforms them into orders
  const allShipments = await fetchShipments();
  
  // This part of the code filters shipments to ensure only Callahan-Smith data is processed
  const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
  console.log(`🔍 AI Enhancement Mode - Data filtered for Callahan-Smith: ${allShipments.length} total → ${shipments.length} Callahan-Smith shipments`);
  
  const orders = transformShipmentsToOrders(shipments);

  // This part of the code calculates all orders metrics from transformed data
  const kpis = calculateOrdersKPIs(orders);
  const inboundIntelligence = calculateInboundIntelligence(orders);

  // This part of the code generates AI enhancements (insights + KPI context) in parallel
  const [insightsData, kpiContext] = await Promise.all([
    generateOrdersInsights(orders, kpis, inboundIntelligence),
    generateOrdersKPIContext(kpis, orders)
  ]);

  console.log("✅ Orders AI Enhancement Mode: KPI context + insights compiled successfully");
  res.status(200).json({
    success: true,
    data: {
      kpiContext, // 🤖 AI-powered KPI context for enhanced cards
      insights: insightsData.map((insight, index) => ({
          id: `orders-insight-${index + 1}`,
          title: insight.title,
          description: insight.description,
          severity: (insight.severity === 'high' || insight.severity === 'critical') ? 'critical' as const :
                   (insight.severity === 'medium' || insight.severity === 'warning') ? 'warning' as const :
                   'info' as const,
          dollarImpact: insight.dollarImpact || 0,
          suggestedActions: insight.suggestedActions || [],
          createdAt: new Date().toISOString(),
          source: 'orders_agent' as const
        })),
      lastUpdated: new Date().toISOString(),
    },
    message: "Orders AI enhancements retrieved successfully",
    timestamp: new Date().toISOString(),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mode } = req.query;
    
    // This part of the code handles different loading modes for performance
    if (mode === 'fast') {
      return handleFastMode(req, res);
    } else if (mode === 'insights') {
      return handleInsightsMode(req, res);
    }
    
    // Default: full data with insights (backward compatibility)
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

    // This part of the code generates AI-powered KPI context for the default handler as well
    const kpiContext = await generateOrdersKPIContext(kpis, orders);

    // This part of the code generates orders-specific AI insights
    const insightsData = await generateOrdersInsights(orders, kpis, inboundIntelligence);

    const ordersData = {
      orders: orders.slice(0, 500), // Show up to 500 orders for comprehensive view while maintaining performance
      kpis,
      kpiContext, // 🆕 ADD AI-powered KPI context with accurate percentages and business insights
      insights: insightsData.map((insight, index) => ({
        id: `orders-insight-${index + 1}`,
        title: insight.title,
        description: insight.description,
        severity: (insight.severity === 'high' || insight.severity === 'critical') ? 'critical' as const :
                 (insight.severity === 'medium' || insight.severity === 'warning') ? 'warning' as const :
                 'info' as const,
        dollarImpact: insight.dollarImpact || 0,
        suggestedActions: insight.suggestedActions || [],
        createdAt: new Date().toISOString(),
        source: "orders_agent" as const,
      })),
      inboundIntelligence,
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ API: Orders data compiled successfully");
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
