import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code standardizes the data interfaces to match the server implementation
 * Ensuring consistency between local development and Vercel production environments
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
 * Matches the server implementation to ensure consistent data structure
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
 * Matches the server implementation to ensure consistent data structure
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
 * This part of the code generates AI insights using real financial data
 * Matches the server implementation calculations for consistent results
 */
interface InsightData {
  type: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  dollarImpact?: number;
  suggestedActions?: string[];
}



async function generateInsights(
  products: ProductData[],
  shipments: ShipmentData[],
): Promise<InsightData[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 Dashboard Agent API Key Check:', !!apiKey, 'Length:', apiKey?.length || 0);
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY not found in environment variables - returning empty insights (NO FALLBACK)');
    // Return empty insights when OpenAI is not available - NO FALLBACK like daily brief
    return [];
  }

  try {
    // This part of the code extracts specific data for actionable AI recommendations
    const topAtRiskShipments = shipments
      .filter(s => s.expected_quantity !== s.received_quantity)
      .sort((a, b) => Math.abs(b.expected_quantity - b.received_quantity) * (b.unit_cost || 0) - Math.abs(a.expected_quantity - a.received_quantity) * (a.unit_cost || 0))
      .slice(0, 5)
      .map(s => ({
        shipmentId: s.shipment_id,
        supplier: s.supplier,
        expectedQty: s.expected_quantity,
        receivedQty: s.received_quantity,
        variance: s.expected_quantity - s.received_quantity,
        impact: Math.round(Math.abs(s.expected_quantity - s.received_quantity) * (s.unit_cost || 0))
      }));

    const topInactiveProducts = products
      .filter(p => !p.active && p.unit_cost)
      .sort((a, b) => (b.unit_cost || 0) * b.unit_quantity - (a.unit_cost || 0) * a.unit_quantity)
      .slice(0, 4)
      .map(p => ({
        sku: p.product_sku,
        name: p.product_name,
        supplier: p.supplier_name,
        opportunityCost: Math.round((p.unit_cost || 0) * Math.min(p.unit_quantity, 10))
      }));

    const topCancelledShipments = shipments
      .filter(s => s.status === "cancelled" && s.unit_cost)
      .sort((a, b) => (b.unit_cost || 0) * b.expected_quantity - (a.unit_cost || 0) * a.expected_quantity)
      .slice(0, 3)
      .map(s => ({
        shipmentId: s.shipment_id,
        supplier: s.supplier,
        lostValue: Math.round((s.unit_cost || 0) * s.expected_quantity),
        expectedQty: s.expected_quantity
      }));

    const supplierConcentrationRisks = Object.entries(
      shipments.reduce((acc, s) => {
        const supplier = s.supplier || 'Unknown';
        if (!acc[supplier]) acc[supplier] = { shipments: 0, value: 0 };
        acc[supplier].shipments++;
        acc[supplier].value += (s.received_quantity * (s.unit_cost || 0));
        return acc;
      }, {} as Record<string, { shipments: number; value: number }>)
    ).sort(([,a], [,b]) => b.shipments - a.shipments).slice(0, 3);

    console.log('🔍 Dashboard AI Enhancement - At-Risk Shipments:', topAtRiskShipments.length);
    console.log('🔍 Dashboard AI Enhancement - Inactive Products:', topInactiveProducts.length);
    console.log('🔍 Dashboard AI Enhancement - Cancelled Shipments:', topCancelledShipments.length);
    console.log('🔍 Dashboard AI Enhancement - Supplier Concentration:', supplierConcentrationRisks.length);

    const financialImpacts = calculateFinancialImpacts(products, shipments);
    
    // This part of the code calculates enhanced operational intelligence metrics
    const atRiskShipments = shipments.filter(s => s.expected_quantity !== s.received_quantity).length;
    const cancelledShipments = shipments.filter(s => s.status === "cancelled").length;
    const inactiveProducts = products.filter(p => !p.active).length;
    const activeProducts = products.filter(p => p.active).length;
    const totalShipmentValue = shipments.reduce((sum, s) => sum + (s.received_quantity * (s.unit_cost || 0)), 0);
    
    // Enhanced analytics calculations
    const uniqueBrands = new Set(products.map(p => p.brand_name)).size;
    const uniqueSuppliers = new Set(products.map(p => p.supplier_name)).size;
    const skuUtilization = activeProducts / products.length * 100;
    const onTimeShipments = shipments.filter(s => s.status === "completed" || s.status === "delivered").length;
    const delayedShipments = shipments.filter(s => s.status.includes("delayed") || s.status === "late").length;
    const quantityAccuracy = shipments.length > 0 ? (shipments.filter(s => s.expected_quantity === s.received_quantity).length / shipments.length) * 100 : 100;
    const avgOrderValue = totalShipmentValue / shipments.length;
    const costPerShipment = totalShipmentValue / shipments.length;
    
    // Geographic and supplier risk analysis
    const geoRiskCountries = shipments.filter(s => s.ship_from_country && ['China', 'Russia', 'Ukraine', 'Taiwan'].includes(s.ship_from_country)).length;
    const geoRiskPercent = shipments.length > 0 ? (geoRiskCountries / shipments.length) * 100 : 0;
    const topRiskCountries = Array.from(new Set(shipments.filter(s => s.ship_from_country && ['China', 'Russia', 'Ukraine', 'Taiwan'].includes(s.ship_from_country)).map(s => s.ship_from_country))).slice(0, 3);
    
    // Supplier concentration analysis
    const supplierCounts = shipments.reduce((acc, s) => {
      const supplier = s.supplier || 'Unknown';
      acc[supplier] = (acc[supplier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSuppliers = Object.entries(supplierCounts).sort(([,a], [,b]) => b - a).slice(0, 3);
    const supplierConcentration = topSuppliers.reduce((sum, [,count]) => sum + count, 0) / shipments.length * 100;
    
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
            content: `You are a Senior Operations Director with 15+ years of experience in supply chain management and business intelligence. You specialize in identifying critical operational bottlenecks and implementing data-driven solutions that improve efficiency and reduce costs.

SPECIFIC DATA FOR ACTIONABLE RECOMMENDATIONS:
===========================================

TOP AT-RISK SHIPMENTS (for immediate review):
${topAtRiskShipments.map(s => `- Shipment: ${s.shipmentId} - Supplier: ${s.supplier || 'Unknown'} - Variance: ${s.variance} units - Impact: $${s.impact.toLocaleString()}`).join('\n')}

INACTIVE PRODUCTS (for reactivation strategy):
${topInactiveProducts.map(p => `- SKU: ${p.sku || 'Unknown'} (${p.name || 'Unknown'}) - Supplier: ${p.supplier || 'Unknown'} - Opportunity Cost: $${p.opportunityCost.toLocaleString()}`).join('\n')}

CANCELLED SHIPMENTS (for supplier performance review):
${topCancelledShipments.map(s => `- Shipment: ${s.shipmentId} - Supplier: ${s.supplier || 'Unknown'} - Lost Value: $${s.lostValue.toLocaleString()} (${s.expectedQty} units)`).join('\n')}

SUPPLIER CONCENTRATION RISKS (for diversification):
${supplierConcentrationRisks.map(([supplier, data]) => `- ${supplier}: ${data.shipments} shipments, $${Math.round(data.value).toLocaleString()} total value`).join('\n')}

Analyze the current operational data including ${shipments.length} shipments, ${products.length} products, and ${new Set(shipments.map(s => s.warehouse_id)).size} warehouses. Identify the top 3-5 most critical operational issues that need immediate attention. Focus on: shipment delays, inventory discrepancies, cost overruns, and performance bottlenecks. For each issue, provide specific actionable workflows like 'Implement automated reorder triggers for low-stock items' or 'Create escalation process for at-risk shipments'. Include financial impact estimates and ROI projections based on your extensive industry experience.

OPERATIONAL DATA OVERVIEW:
==========================================

BRAND PORTFOLIO STATUS:
- Managing ${products.length} products (${activeProducts} active, ${inactiveProducts} inactive)
- Working with ${uniqueSuppliers} suppliers across operations
- Current SKU utilization at ${skuUtilization.toFixed(1)}%
- Potential opportunity cost from inactive products: $${financialImpacts.inactiveProductsValue.toLocaleString()}

TODAY'S OPERATIONAL PERFORMANCE:
- Processed ${shipments.length} shipments (${onTimeShipments} on-time, ${delayedShipments} delayed)
- Quantity accuracy running at ${quantityAccuracy.toFixed(1)}% (${atRiskShipments} with variances)
- Financial impact from discrepancies: $${financialImpacts.quantityDiscrepancyImpact.toLocaleString()}
- Cancelled shipment losses: $${financialImpacts.cancelledShipmentsImpact.toLocaleString()}

RISK ASSESSMENT:
- Total value at risk: $${Math.round(totalShipmentValue).toLocaleString()}
- ${geoRiskPercent.toFixed(1)}% of shipments from high-risk countries: ${topRiskCountries.join(', ')}
- Supplier concentration risk: ${supplierConcentration.toFixed(1)}% from top 3 suppliers
- Total financial exposure: $${financialImpacts.totalFinancialRisk.toLocaleString()}

Based on your proven track record of reducing operational costs by 30-40% and improving efficiency metrics across multiple organizations, provide strategic insights with specific workflows that address the most critical operational bottlenecks. Each recommendation should include estimated financial impact and implementation timeline.

CRITICAL: You MUST provide exactly 3-5 strategic insights. Each insight MUST include 3-5 specific, actionable suggestedActions.

Format as JSON with 3-5 strategic insights:
[
  {
    "type": "warning",
    "title": "Strategic operational insight title",
    "description": "Professional analysis of the operational issue with specific data points, financial impact, and implementation strategy. Include your expert assessment of root causes and proven solutions.",
    "severity": "critical|warning|info",
    "dollarImpact": calculated_financial_impact,
    "suggestedActions": ["Implement automated reorder triggers for critical SKUs below safety stock", "Create escalation workflow for shipments approaching SLA deadlines", "Set up supplier performance scorecard with penalty clauses", "Establish real-time inventory monitoring dashboard", "Configure automated supplier notification system"]
  }
]

EACH INSIGHT MUST HAVE 3-5 DETAILED SUGGESTED ACTIONS. NO EXCEPTIONS.

CRITICAL REQUIREMENTS for Actionable Recommendations:
- MUST reference specific Shipment IDs from the AT-RISK SHIPMENTS data above
- MUST include actual SKU numbers from the INACTIVE PRODUCTS data for reactivation recommendations  
- MUST name specific suppliers from the CANCELLED SHIPMENTS and SUPPLIER CONCENTRATION data
- MUST use real dollar amounts and quantities from the specific data sections above
- MUST provide concrete next steps with specific parties to contact (suppliers, warehouses, etc.)
- NO generic recommendations like "Implement automated reorder triggers" - use specific shipment IDs and SKU numbers

EXAMPLE SPECIFIC RECOMMENDATIONS:
✅ GOOD: "Review Shipment ${topAtRiskShipments[0]?.shipmentId || 'SH-12345'} with ${topAtRiskShipments[0]?.supplier || 'Clark supplier'} - ${topAtRiskShipments[0]?.variance || 15} unit variance causing $${topAtRiskShipments[0]?.impact?.toLocaleString() || '2,500'} impact"
✅ GOOD: "Reactivate high-value SKUs: ${topInactiveProducts[0]?.sku || 'ABC-123'}, ${topInactiveProducts[1]?.sku || 'DEF-456'} from ${topInactiveProducts[0]?.supplier || 'West Barber'} - $${(topInactiveProducts[0]?.opportunityCost || 0) + (topInactiveProducts[1]?.opportunityCost || 0)} opportunity cost"
✅ GOOD: "Schedule performance review with ${topCancelledShipments[0]?.supplier || 'Garcia Ltd'} - $${topCancelledShipments[0]?.lostValue?.toLocaleString() || '8,200'} lost from cancelled shipments"
❌ BAD: "Implement automated reorder triggers for low-stock items" (too generic, no specific data)
❌ BAD: "Create escalation process for at-risk shipments" (no specific shipment IDs mentioned)

Draw from your extensive experience in operational excellence and provide insights that deliver measurable business value.`,
          },
        ],
        max_tokens: 1500, // Increased for detailed insights and recommendations
        temperature: 0.2,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log('🤖 Dashboard Agent Raw OpenAI Response:', content.substring(0, 500) + '...');
        try {
          const parsed = JSON.parse(content);
          console.log('✅ Dashboard Agent Parsed Insights:', parsed.length, 'insights with actions:', parsed.map(p => p.suggestedActions?.length || 0));
          return parsed;
        } catch (parseError) {
          console.error('❌ Dashboard Agent JSON Parse Error:', parseError);
          console.error('❌ Raw content that failed:', content?.substring(0, 500));
          console.log('❌ Dashboard: JSON parse failed, returning empty insights (NO FALLBACK)');
          return [];
        }
      }
    } else {
      console.error('❌ OpenAI API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Dashboard OpenAI analysis failed:', error);
  }

  // Return empty insights when AI fails - NO FALLBACK like daily brief
  console.log('❌ Dashboard: OpenAI failed, returning empty insights (NO FALLBACK)');
  return [];
}

/**
 * This part of the code generates a conversational daily brief using OpenAI
 * Sounds like a real assistant giving a morning briefing
 */
async function generateDailyBrief(
  products: ProductData[],
  shipments: ShipmentData[],
  financialImpacts: any
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null; // No fallback - require real OpenAI connection
  }

  try {
    const atRiskShipments = shipments.filter(s => s.expected_quantity !== s.received_quantity).length;
    const cancelledShipments = shipments.filter(s => s.status === "cancelled").length;
    const inactiveProducts = products.filter(p => !p.active).length;
    const activeProducts = products.filter(p => p.active).length;
    const onTimeShipments = shipments.filter(s => s.status === "completed" || s.status === "delivered").length;

    // Calculate supplier concentration for risk analysis
    const supplierCounts = shipments.reduce((acc, s) => {
      const supplier = s.supplier || 'Unknown';
      acc[supplier] = (acc[supplier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSuppliers = Object.entries(supplierCounts).sort(([,a], [,b]) => b - a).slice(0, 3);
    const supplierConcentration = topSuppliers.length > 0 ? Math.round(topSuppliers.reduce((sum, [,count]) => sum + count, 0) / shipments.length * 100) : 0;

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
            content: `You are a senior operations assistant for Callahan-Smith brand. Analyze today's operational data and provide a world-class executive briefing. Be direct, specific, and actionable.

CALLAHAN-SMITH OPERATIONAL STATUS:
- Portfolio: ${products.length} total products (${activeProducts} active, ${inactiveProducts} inactive)
- Shipment Performance: ${shipments.length} processed (${onTimeShipments} on-time, ${atRiskShipments} with discrepancies, ${cancelledShipments} cancelled)
- Financial Exposure: $${financialImpacts.totalFinancialRisk.toLocaleString()} at risk from operational issues
- Supplier Risk: ${supplierConcentration}% concentration with top 3 suppliers
- Key Suppliers: ${topSuppliers.map(([name]) => name).join(', ')}

Write a 4-6 sentence executive brief that:
- Identifies today's highest-priority operational risks
- Quantifies financial impact in dollar terms
- Suggests immediate actions needed
- Mentions specific issues requiring attention

Example tone: "Today's high-priority risks center around delayed replenishment, missed inbound SLA, and fulfillment breakdown. Immediate actions are suggested on 3 of 4 issues to prevent over $22K in potential loss."

Do NOT include greetings, pleasantries, or source attributions. Start directly with the operational analysis.`,
          },
        ],
        max_tokens: 100, // OPTIMIZED for speed
        temperature: 0.2,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content.trim().replace(/"/g, ''); // Clean up quotes and whitespace
      }
    }
  } catch (error) {
    console.error("OpenAI daily brief failed:", error);
  }

  return null; // Return null if OpenAI fails - no fallback
}

/**
 * This part of the code analyzes real margin risks using actual brand and cost data
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

// This part of the code handles fast mode for quick data loading without AI insights
async function handleFastMode(req: VercelRequest, res: VercelResponse) {
  console.log("⚡ Dashboard Fast Mode: Loading data without AI insights...");
  
  const [allProducts, allShipments] = await Promise.all([
    fetchProducts(),
    fetchShipments(),
  ]);

  // This part of the code ensures we only use Callahan-Smith data by filtering client-side as well
  const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
  const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
  
  console.log(`🔍 Fast Mode - Data filtered for Callahan-Smith: ${products.length} products, ${shipments.length} shipments`);

  // This part of the code calculates new real-data analysis features without AI
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
    products: products.slice(0, 20),
    shipments: shipments.slice(0, 50),
    kpis: {
      totalOrdersToday: totalOrdersToday > 0 ? totalOrdersToday : null,
      atRiskOrders: atRiskOrders > 0 ? atRiskOrders : null,
      openPOs: openPOs > 0 ? openPOs : null,
      unfulfillableSKUs,
    },
    insights: [], // Empty for fast mode
    anomalies: [], // Empty for fast mode 
    marginRisks,
    costVariances,
    dailyBrief: "", // Empty for fast mode
    lastUpdated: new Date().toISOString(),
  };

  console.log("✅ Dashboard Fast Mode: Data compiled successfully");
  res.status(200).json({
    success: true,
    data: dashboardData,
    message: "Dashboard fast data retrieved successfully",
    timestamp: new Date().toISOString(),
  });
}

// This part of the code handles insights mode for AI-generated insights only
async function handleInsightsMode(req: VercelRequest, res: VercelResponse) {
  console.log("🤖 Dashboard Insights Mode: Loading AI insights only...");
  
  const [allProducts, allShipments] = await Promise.all([
    fetchProducts(),
    fetchShipments(),
  ]);

  // This part of the code ensures we only use Callahan-Smith data by filtering client-side as well
  const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
  const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
  
  console.log(`🔍 Insights Mode - Data filtered for Callahan-Smith: ${products.length} products, ${shipments.length} shipments`);

  const rawInsights = await generateInsights(products, shipments);
  
  // This part of the code maps insights to proper AIInsight format with all required properties
  console.log('🔍 Dashboard Insights Mode - Raw insights from AI:', rawInsights.length, 'insights');
  if (rawInsights.length > 0) {
    console.log('🔍 Sample insight:', JSON.stringify(rawInsights[0], null, 2));
  }
  
  const insights = rawInsights.map((insight, index) => ({
    id: `dashboard-insight-${index + 1}`,
    title: insight.title,
    description: insight.description,
    severity: insight.severity as "critical" | "warning" | "info",
    dollarImpact: insight.dollarImpact || 0,
    suggestedActions: insight.suggestedActions || [
      "Review shipment performance metrics",
      "Implement quality control checkpoints",
      "Establish supplier performance monitoring"
    ],
    createdAt: new Date().toISOString(),
    source: "dashboard_agent" as const,
  }));
  
  console.log('🔍 Dashboard Insights Mode - Mapped insights:', insights.length, 'insights');
  if (insights.length > 0) {
    console.log('🔍 Sample mapped insight:', JSON.stringify(insights[0], null, 2));
  }
  
  // This part of the code calculates financial impacts for daily brief
  const financialImpacts = calculateFinancialImpacts(products, shipments);
  const dailyBrief = await generateDailyBrief(products, shipments, financialImpacts);

  console.log("✅ Dashboard Insights Mode: AI insights compiled successfully");
  res.status(200).json({
    success: true,
    data: {
      insights,
      dailyBrief,
      lastUpdated: new Date().toISOString(),
    },
    message: "Dashboard insights retrieved successfully",
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
      "📊 Vercel API: Fetching dashboard data with split environment variables...",
    );

    const [allProducts, allShipments] = await Promise.all([
      fetchProducts(),
      fetchShipments(),
    ]);

    // This part of the code ensures we only use Callahan-Smith data by filtering client-side as well
    const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    
    console.log(`🔍 Data filtered for Callahan-Smith: ${products.length} products, ${shipments.length} shipments`);
    console.log(`📊 Sample brands in products:`, new Set(allProducts.map(p => p.brand_name)));
    console.log(`📊 Sample brands in shipments:`, new Set(allShipments.map(s => s.brand_name)));

    const insights = await generateInsights(products, shipments);
    
    // This part of the code calculates financial impacts for daily brief
    const financialImpacts = calculateFinancialImpacts(products, shipments);
    const dailyBrief = await generateDailyBrief(products, shipments, financialImpacts);

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
      insights: insights.map((insight, index) => ({
        id: `dashboard-insight-${index + 1}`,
        title: insight.title,
        description: insight.description,
        severity: insight.severity as "critical" | "warning" | "info",
        dollarImpact: insight.dollarImpact || 0, // This part of the code uses real financial impact from AI or calculations
        suggestedActions: insight.suggestedActions || [
          "Review shipment performance metrics",
          "Implement quality control checkpoints", 
          "Establish supplier performance monitoring"
        ],
        createdAt: new Date().toISOString(),
        source: "dashboard_agent" as const,
      })),
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
      dailyBrief, // This part of the code adds conversational AI daily brief
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ Vercel API: Dashboard data compiled successfully");
    res.status(200).json({
      success: true,
      data: dashboardData,
      message: "Dashboard data retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Vercel API Error:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
