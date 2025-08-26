import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code provides FAST dashboard data without AI insights
 * Loads only real data (products, shipments, KPIs) for immediate page rendering
 * AI insights load separately in background for better performance
 */

// TinyBird Product Details API Response - standardized interface
interface ProductData {
  product_id: string;
  company_url: string;
  brand_id: string | null;
  brand_name: string;
  brand_domain: string | null;
  created_date: string;
  product_name: string;
  product_sku: string | null;
  gtin: string | null;
  is_kit: boolean;
  active: boolean;
  product_supplier: string | null;
  country_of_origin: string | null;
  harmonized_code: string | null;
  product_external_url: string | null;
  inventory_item_id: string;
  unit_quantity: number;
  supplier_name: string;
  unit_cost: number | null;
  supplier_external_id: string | null;
  updated_date: string | null;
}

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

/**
 * This part of the code fetches products data from TinyBird API using standardized parameters
 * Fast data fetching without AI processing for immediate page load
 */
async function fetchProducts(): Promise<ProductData[]> {
  const baseUrl = process.env.TINYBIRD_BASE_URL;
  const token = process.env.TINYBIRD_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "TINYBIRD_BASE_URL and TINYBIRD_TOKEN environment variables are required",
    );
  }

  // This part of the code fetches from product_details_mv API with Callahan-Smith brand filter
  const url = `${baseUrl}?token=${token}&limit=100&brand_name=Callahan-Smith`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * This part of the code fetches shipments data from TinyBird API using standardized parameters
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
  const url = `${baseUrl}?token=${token}&limit=150&brand_name=Callahan-Smith`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * This part of the code calculates real financial impact from operational data
 * Uses actual unit costs and quantity discrepancies for accurate dollar amounts
 */
function calculateFinancialImpacts(products: ProductData[], shipments: ShipmentData[]) {
  // Calculate impact from quantity discrepancies
  const quantityDiscrepancyImpact = shipments
    .filter(s => s.expected_quantity !== s.received_quantity && s.unit_cost)
    .reduce((sum, shipment) => {
      const quantityDiff = Math.abs(shipment.expected_quantity - shipment.received_quantity);
      return sum + (quantityDiff * (shipment.unit_cost || 0));
    }, 0);

  // Calculate impact from cancelled shipments
  const cancelledShipmentsImpact = shipments
    .filter(s => s.status === "cancelled" && s.unit_cost)
    .reduce((sum, shipment) => {
      return sum + (shipment.expected_quantity * (shipment.unit_cost || 0));
    }, 0);

  // Calculate lost revenue from inactive products
  const inactiveProductsValue = products
    .filter(p => !p.active && p.unit_cost)
    .reduce((sum, product) => {
      // Conservative estimate of weekly lost revenue potential for inactive SKUs
      return sum + ((product.unit_cost || 0) * Math.min(product.unit_quantity, 10));
    }, 0);

  // Calculate total inventory value at risk
  const atRiskInventoryValue = shipments
    .filter(s => s.expected_quantity !== s.received_quantity || s.status === "cancelled")
    .reduce((sum, shipment) => {
      return sum + (shipment.received_quantity * (shipment.unit_cost || 0));
    }, 0);

  return {
    quantityDiscrepancyImpact: Math.round(quantityDiscrepancyImpact),
    cancelledShipmentsImpact: Math.round(cancelledShipmentsImpact),
    inactiveProductsValue: Math.round(inactiveProductsValue),
    atRiskInventoryValue: Math.round(atRiskInventoryValue),
    totalFinancialRisk: Math.round(quantityDiscrepancyImpact + cancelledShipmentsImpact + inactiveProductsValue)
  };
}

/**
 * This part of the code calculates real margin risks using actual brand and cost data
 * Calculates risk factors based on brand performance, SKU complexity, and cost pressures
 */
interface MarginRiskAlert {
  brandName: string;
  currentMargin: number;
  riskLevel: "High" | "Medium" | "Low";
  riskScore: number;
  primaryDrivers: string[];
  financialImpact: number;
  skuCount: number;
  avgUnitCost: number;
  inactivePercentage: number;
}

function calculateMarginRisks(products: ProductData[], shipments: ShipmentData[]): MarginRiskAlert[] {
  // This part of the code groups products by brand for real margin analysis
  const brandGroups = new Map<string, {
    products: ProductData[];
    shipments: ShipmentData[];
    totalValue: number;
    avgCost: number;
  }>();

  // Group products by brand with real data
  products.forEach(product => {
    const brandName = product.brand_name || 'Unknown Brand';
    if (!brandGroups.has(brandName)) {
      brandGroups.set(brandName, {
        products: [],
        shipments: [],
        totalValue: 0,
        avgCost: 0
      });
    }
    brandGroups.get(brandName)!.products.push(product);
  });

  // Associate shipments with brands
  shipments.forEach(shipment => {
    const brandName = shipment.brand_name || 'Unknown Brand';
    if (brandGroups.has(brandName)) {
      brandGroups.get(brandName)!.shipments.push(shipment);
    }
  });

  // This part of the code calculates real risk factors for each brand
  const marginRisks: MarginRiskAlert[] = [];
  
  brandGroups.forEach((data, brandName) => {
    if (data.products.length === 0) return;

    const avgUnitCost = data.products
      .filter(p => p.unit_cost !== null)
      .reduce((sum, p) => sum + (p.unit_cost || 0), 0) / data.products.filter(p => p.unit_cost !== null).length;
    
    const skuCount = data.products.length;
    const inactiveCount = data.products.filter(p => !p.active).length;
    const inactivePercentage = (inactiveCount / skuCount) * 100;
    
    // Calculate real financial impact from brand shipments
    const brandShipmentImpact = data.shipments
      .filter(s => s.expected_quantity !== s.received_quantity && s.unit_cost)
      .reduce((sum, s) => {
        const diff = Math.abs(s.expected_quantity - s.received_quantity);
        return sum + (diff * (s.unit_cost || 0));
      }, 0);

    // This part of the code calculates risk score based on real operational factors
    let riskScore = 0;
    const riskFactors: string[] = [];

    // SKU complexity pressure (more SKUs = higher operational risk)
    if (skuCount > 50) {
      riskScore += 25;
      riskFactors.push("High SKU complexity");
    } else if (skuCount > 20) {
      riskScore += 15;
      riskFactors.push("Moderate SKU complexity");
    }

    // Cost pressure analysis (higher costs = margin pressure)
    if (avgUnitCost > 50) {
      riskScore += 30;
      riskFactors.push("High unit costs");
    } else if (avgUnitCost > 20) {
      riskScore += 15;
      riskFactors.push("Elevated unit costs");
    }

    // Inactive inventory pressure
    if (inactivePercentage > 30) {
      riskScore += 25;
      riskFactors.push("High inactive inventory");
    } else if (inactivePercentage > 15) {
      riskScore += 10;
      riskFactors.push("Growing inactive inventory");
    }

    // Shipment performance pressure
    if (brandShipmentImpact > 5000) {
      riskScore += 20;
      riskFactors.push("Shipment discrepancies");
    }

    // Only include brands with meaningful risk
    if (riskScore > 0 && data.products.length > 5) {
      const currentMargin = Math.max(0, 100 - (avgUnitCost / 100 * 100)); // Simplified margin calculation
      
      marginRisks.push({
        brandName,
        currentMargin: Math.round(currentMargin),
        riskLevel: riskScore >= 60 ? "High" : riskScore >= 30 ? "Medium" : "Low",
        riskScore,
        primaryDrivers: riskFactors,
        financialImpact: Math.round(brandShipmentImpact + (inactiveCount * avgUnitCost * 12)), // Annual impact estimate
        skuCount,
        avgUnitCost: Math.round(avgUnitCost),
        inactivePercentage: Math.round(inactivePercentage)
      });
    }
  });

  // Return top risk brands, sorted by risk score
  return marginRisks
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5); // Limit to top 5 risk brands
}

/**
 * This part of the code detects real cost variances in shipment data
 * Analyzes unit costs across suppliers and warehouses to identify anomalies
 */
interface CostVarianceAnomaly {
  type: "Cost Spike" | "Quantity Discrepancy" | "Supplier Variance";
  title: string;
  description: string;
  severity: "High" | "Medium";
  warehouseId: string | null;
  supplier: string | null;
  currentValue: number;
  expectedValue: number;
  variance: number;
  riskFactors: string[];
  financialImpact: number;
}

function detectCostVariances(products: ProductData[], shipments: ShipmentData[]): CostVarianceAnomaly[] {
  const anomalies: CostVarianceAnomaly[] = [];

  // This part of the code calculates baseline costs for variance detection
  const supplierBaselines = new Map<string, { avgCost: number; shipmentCount: number }>();
  
  // Calculate supplier cost baselines from real data
  shipments.forEach(shipment => {
    if (!shipment.unit_cost || !shipment.supplier) return;
    
    const supplier = shipment.supplier;
    if (!supplierBaselines.has(supplier)) {
      supplierBaselines.set(supplier, { avgCost: 0, shipmentCount: 0 });
    }
    
    const baseline = supplierBaselines.get(supplier)!;
    baseline.avgCost = (baseline.avgCost * baseline.shipmentCount + shipment.unit_cost) / (baseline.shipmentCount + 1);
    baseline.shipmentCount += 1;
  });

  // This part of the code detects cost spikes based on supplier baselines
  shipments.forEach(shipment => {
    if (!shipment.unit_cost || !shipment.supplier) return;
    
    const baseline = supplierBaselines.get(shipment.supplier);
    if (!baseline || baseline.shipmentCount < 3) return; // Need sufficient baseline data
    
    const variance = Math.abs(shipment.unit_cost - baseline.avgCost) / baseline.avgCost;
    
    if (variance > 0.4) { // 40% variance threshold
      const financialImpact = Math.abs(shipment.unit_cost - baseline.avgCost) * shipment.received_quantity;
      
      if (financialImpact > 1000) { // Only flag significant financial impact
        anomalies.push({
          type: "Cost Spike",
          title: `${shipment.supplier} Cost Anomaly`,
          description: `Unit cost of $${shipment.unit_cost} is ${Math.round(variance * 100)}% above expected $${Math.round(baseline.avgCost)} baseline`,
          severity: variance > 0.8 ? "High" : "Medium",
          warehouseId: shipment.warehouse_id,
          supplier: shipment.supplier,
          currentValue: shipment.unit_cost,
          expectedValue: Math.round(baseline.avgCost),
          variance: Math.round(variance * 100),
          riskFactors: [
            variance > 0.8 ? "Extreme cost deviation" : "Significant cost increase",
            financialImpact > 5000 ? "High financial impact" : "Material financial impact"
          ],
          financialImpact: Math.round(financialImpact)
        });
      }
    }
  });

  // This part of the code detects quantity discrepancy patterns
  const warehouseDiscrepancies = new Map<string, { discrepancies: number; totalShipments: number; impact: number }>();
  
  shipments.forEach(shipment => {
    if (!shipment.warehouse_id) return;
    
    if (!warehouseDiscrepancies.has(shipment.warehouse_id)) {
      warehouseDiscrepancies.set(shipment.warehouse_id, { discrepancies: 0, totalShipments: 0, impact: 0 });
    }
    
    const data = warehouseDiscrepancies.get(shipment.warehouse_id)!;
    data.totalShipments += 1;
    
    if (shipment.expected_quantity !== shipment.received_quantity) {
      data.discrepancies += 1;
      const diff = Math.abs(shipment.expected_quantity - shipment.received_quantity);
      data.impact += diff * (shipment.unit_cost || 0);
    }
  });

  // Flag warehouses with high discrepancy rates
  warehouseDiscrepancies.forEach((data, warehouseId) => {
    const discrepancyRate = data.discrepancies / data.totalShipments;
    
    if (discrepancyRate > 0.3 && data.impact > 2000 && data.totalShipments > 5) { // 30% discrepancy rate threshold
      anomalies.push({
        type: "Quantity Discrepancy",
        title: `Warehouse ${warehouseId} Processing Issues`,
        description: `${Math.round(discrepancyRate * 100)}% of shipments have quantity discrepancies with $${Math.round(data.impact)} financial impact`,
        severity: discrepancyRate > 0.5 ? "High" : "Medium",
        warehouseId,
        supplier: null,
        currentValue: Math.round(discrepancyRate * 100),
        expectedValue: 5, // 5% expected discrepancy rate
        variance: Math.round((discrepancyRate - 0.05) * 100),
        riskFactors: [
          discrepancyRate > 0.5 ? "Critical processing accuracy" : "Poor processing accuracy",
          data.impact > 10000 ? "High financial impact" : "Material financial impact"
        ],
        financialImpact: Math.round(data.impact)
      });
    }
  });

  // Return anomalies sorted by financial impact
  return anomalies
    .sort((a, b) => b.financialImpact - a.financialImpact)
    .slice(0, 8); // Limit to top 8 most impactful anomalies
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(
      "⚡ FAST API: Fetching dashboard data WITHOUT AI insights for immediate page load...",
    );

    const [allProducts, allShipments] = await Promise.all([
      fetchProducts(),
      fetchShipments(),
    ]);

    // This part of the code ensures we only use Callahan-Smith data by filtering client-side as well
    const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    
    console.log(`🔍 FAST: Data filtered for Callahan-Smith: ${products.length} products, ${shipments.length} shipments`);

    // This part of the code calculates new real-data analysis features
    const marginRisks = calculateMarginRisks(products, shipments);
    const costVariances = detectCostVariances(products, shipments);

    // This part of the code calculates KPIs using standardized logic matching server implementation
    const today = new Date().toISOString().split("T")[0];
    
    const totalOrdersToday = shipments.filter(
      (shipment) => shipment.created_date === today,
    ).length;

    const atRiskOrders = shipments.filter(
      (shipment) =>
        shipment.expected_quantity !== shipment.received_quantity ||
        shipment.status === "cancelled",
    ).length;

    const openPOs = new Set(
      shipments
        .filter(
          (shipment) =>
            shipment.purchase_order_number &&
            shipment.status !== "completed" &&
            shipment.status !== "cancelled",
        )
        .map((shipment) => shipment.purchase_order_number),
    ).size;

    const unfulfillableSKUs = products.filter(
      (product) => !product.active,
    ).length;

    const dashboardData = {
      products,
      shipments,
      kpis: {
        totalOrdersToday: totalOrdersToday > 0 ? totalOrdersToday : null,
        atRiskOrders: atRiskOrders > 0 ? atRiskOrders : null,
        openPOs: openPOs > 0 ? openPOs : null,
        unfulfillableSKUs,
      },
      quickOverview: {
        topIssues: atRiskOrders,
        whatsWorking: shipments.filter(
          (shipment) =>
            shipment.expected_quantity === shipment.received_quantity &&
            shipment.status !== "cancelled",
        ).length,
        dollarImpact: Math.round(shipments
          .filter(
            (shipment) => shipment.expected_quantity !== shipment.received_quantity,
          )
          .reduce((sum, shipment) => {
            const quantityDiff = Math.abs(
              shipment.expected_quantity - shipment.received_quantity,
            );
            const cost = shipment.unit_cost || 0;
            return sum + quantityDiff * cost;
          }, 0)),
        completedWorkflows: new Set(
          shipments
            .filter(
              (shipment) =>
                shipment.status === "receiving" || shipment.status === "completed",
            )
            .map((shipment) => shipment.purchase_order_number),
        ).size,
      },
      warehouseInventory: (() => {
        // This part of the code provides proper warehouse deduplication using Map
        const warehouseMap = new Map();
        shipments.forEach((s) => {
          if (s.warehouse_id && !warehouseMap.has(s.warehouse_id)) {
            warehouseMap.set(s.warehouse_id, {
              id: s.warehouse_id,
              name: s.supplier, // Use supplier as warehouse name to match server logic
            });
          }
        });
        
        return Array.from(warehouseMap.values());
      })().map((warehouse) => {
        // This part of the code calculates real warehouse inventory from actual shipment data
        const warehouseShipments = shipments.filter(s => s.warehouse_id === warehouse.id);
        const warehouseProducts = products.filter(p => 
          warehouseShipments.some(s => s.inventory_item_id === p.inventory_item_id)
        );
        
        const totalInventory = warehouseShipments.reduce((sum, shipment) => 
          sum + shipment.received_quantity, 0
        );
        
        const averageCost = warehouseShipments.length > 0 
          ? warehouseShipments
              .filter(s => s.unit_cost !== null)
              .reduce((sum, shipment, _, arr) => sum + (shipment.unit_cost || 0), 0) / 
            warehouseShipments.filter(s => s.unit_cost !== null).length
          : 0;
        
        return {
          warehouseId: warehouse.id,
          totalInventory,
          productCount: warehouseProducts.length,
          averageCost: Math.round(averageCost || 0),
        };
      }),
      // NOTE: insights will be loaded separately by dashboard-insights endpoint
      insights: [], // Empty for fast loading - insights load separately
      anomalies: [
        ...(unfulfillableSKUs > 100
          ? [
              {
                id: "anomaly-1",
                type: "high_unfulfillable_skus" as const,
                title: "High Unfulfillable SKUs",
                description: `${unfulfillableSKUs} SKUs cannot be fulfilled`,
                severity: "critical" as const,
                icon: "⚠️",
                createdAt: new Date().toISOString(),
              },
            ]
          : []),
        ...(totalOrdersToday === 0
          ? [
              {
                id: "anomaly-2",
                type: "low_order_volume" as const,
                title: "Low Order Volume",
                description: "No orders detected today",
                severity: "info" as const,
                icon: "📊",
                createdAt: new Date().toISOString(),
              },
            ]
          : []),
      ],
      marginRisks, // This part of the code adds real margin risk analysis data
      costVariances, // This part of the code adds real cost variance detection data
      dailyBrief: null, // Will be loaded separately by insights endpoint
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ FAST API: Dashboard data compiled successfully (NO AI insights for speed)");
    res.status(200).json({
      success: true,
      data: dashboardData,
      message: "Fast dashboard data retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ FAST API Error:", error);
    res.status(500).json({
      error: "Failed to fetch fast dashboard data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
