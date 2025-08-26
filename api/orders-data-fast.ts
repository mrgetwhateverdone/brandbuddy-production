import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code provides FAST orders data without AI insights
 * Loads only real order data for immediate page rendering
 * AI insights load separately in background for better performance
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
 * Fast data fetching without AI processing for immediate page load
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(
      "⚡ FAST ORDERS API: Fetching orders data WITHOUT AI insights for immediate page load...",
    );

    // This part of the code fetches shipments and transforms them into orders
    const allShipments = await fetchShipments();
    
    // This part of the code filters shipments to ensure only Callahan-Smith data is processed
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    console.log(`🔍 FAST ORDERS: Data filtered for Callahan-Smith: ${allShipments.length} total → ${shipments.length} Callahan-Smith shipments`);
    
    const orders = transformShipmentsToOrders(shipments);

    // This part of the code calculates all orders metrics from transformed data
    const kpis = calculateOrdersKPIs(orders);
    const inboundIntelligence = calculateInboundIntelligence(orders);

    const ordersData = {
      orders: orders.slice(0, 500), // Show up to 500 orders for comprehensive view while maintaining performance
      kpis,
      insights: [], // Empty for fast loading - insights load separately
      inboundIntelligence,
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ FAST ORDERS API: Orders data compiled successfully (NO AI insights for speed)");
    res.status(200).json({
      success: true,
      data: ordersData,
      message: "Fast orders data retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ FAST ORDERS API Error:", error);
    res.status(500).json({
      error: "Failed to fetch fast orders data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
