import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ReplenishmentKPIs, ReplenishmentKPIContext, ReplenishmentData, ShipmentData } from "../client/types/api";

// Vercel-compatible types (inline to avoid shared import issues)
interface TinyBirdResponse<T> {
  meta: { name: string; type: string };
  data: T[];
}

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

// ShipmentData interface is now imported from client/types/api.ts

// ReplenishmentKPIs, ReplenishmentKPIContext, and ReplenishmentData interfaces are now imported from client/types/api.ts

// This part of the code fetches product data from TinyBird for replenishment analysis
async function fetchProducts(): Promise<ProductData[]> {
  const TINYBIRD_BASE_URL = process.env.TINYBIRD_BASE_URL;
  const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN;

  if (!TINYBIRD_BASE_URL || !TINYBIRD_TOKEN) {
    console.warn("⚠️ Vercel API: TinyBird credentials not available");
    return [];
  }

  try {
    // This part of the code uses the same proven URL pattern as working inventory API
    const url = `${TINYBIRD_BASE_URL}?token=${TINYBIRD_TOKEN}&limit=1000&brand_name=Callahan-Smith`;
    console.log("🔒 Fetching products from data service:", url.replace(TINYBIRD_TOKEN, "[TOKEN]"));
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log("⚠️ Data service API failed:", response.status, response.statusText);
      throw new Error(`TinyBird API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Data service response:", result.data?.length || 0, "products");
    return result.data || [];
  } catch (error) {
    console.log("⚠️ Data service fetch failed:", error);
    return [];
  }
}

// This part of the code fetches shipment data from TinyBird for supplier performance analysis
async function fetchShipments(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    console.log("⚠️ Warehouse credentials not available");
    return [];
  }

  try {
    // This part of the code uses the same proven URL pattern as working orders API
    const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
    console.log("🔒 Fetching shipments from data service:", url.replace(token, "[TOKEN]"));
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log("⚠️ Data service API failed:", response.status, response.statusText);
      throw new Error(`TinyBird API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Data service response:", result.data?.length || 0, "shipments");
    return result.data || [];
  } catch (error) {
    console.log("⚠️ Data service fetch failed:", error);
    return [];
  }
}

// This part of the code calculates replenishment KPIs from inventory and shipment data
function calculateReplenishmentKPIs(products: ProductData[], shipments: ShipmentData[]): ReplenishmentKPIs {
  console.log('📊 Calculating replenishment KPIs for Callahan-Smith data:', {
    totalProducts: products.length,
    totalShipments: shipments.length,
    activeProducts: products.filter(p => p.active).length
  });
  
  // This part of the code identifies critical SKUs with low inventory levels (changed to <10 for more inclusive)
  const criticalSKUs = products.filter(p => 
    p.active && p.unit_quantity >= 0 && p.unit_quantity < 10
  ).length;

  // This part of the code calculates total value of items needing replenishment
  const lowStockItems = products.filter(p => 
    p.active && p.unit_quantity >= 0 && p.unit_quantity < 20
  );
  const replenishmentValue = lowStockItems.reduce((sum, p) => {
    const cost = p.unit_cost || 0;
    const suggestedOrder = Math.max(30 - p.unit_quantity, 0); // Suggest reorder to 30 units
    return sum + (suggestedOrder * cost);
  }, 0);

  // This part of the code identifies suppliers with recent shipment activity (extended to 60 days)
  const recentShipments = shipments.filter(s => {
    if (!s.created_date) return false;
    const shipmentDate = new Date(s.created_date);
    const daysAgo = (Date.now() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 60;
  });
  
  // Basic supplier alert calculation based on shipment status
  const supplierWithIssues = new Set();
  recentShipments.forEach(shipment => {
    if (shipment.status && (
      shipment.status.toLowerCase().includes('delay') || 
      shipment.status.toLowerCase().includes('exception') ||
      shipment.status.toLowerCase().includes('pending') ||
      shipment.status.toLowerCase().includes('problem')
    )) {
      if (shipment.supplier) supplierWithIssues.add(shipment.supplier);
    }
  });
  const supplierAlerts = supplierWithIssues.size;

  // This part of the code counts reorder recommendations
  const outOfStockItems = products.filter(p => p.active && p.unit_quantity === 0);
  const reorderRecommendations = Math.max(criticalSKUs, outOfStockItems.length, 1); // At least 1

  const kpiResults = {
    criticalSKUs,
    replenishmentValue: Math.round(replenishmentValue),
    supplierAlerts,
    reorderRecommendations
  };

  console.log('📊 KPI Results calculated:', kpiResults);
  return kpiResults;
}

// This part of the code generates data-driven replenishment insights when OpenAI is not available
function generateReplenishmentDataDrivenInsights(
  products: ProductData[],
  shipments: ShipmentData[],
  kpis: ReplenishmentKPIs
): any[] {
  const insights: any[] = [];
  
  // Calculate critical metrics
  const criticalItems = products.filter(p => p.active && p.unit_quantity >= 0 && p.unit_quantity < 10);
  const outOfStockItems = products.filter(p => p.active && p.unit_quantity === 0);
  const lowStockItems = products.filter(p => p.active && p.unit_quantity > 0 && p.unit_quantity < 20);
  
  // Critical Stock Replenishment
  if (criticalItems.length > 0) {
    const urgentValue = criticalItems.reduce((sum, p) => {
      const reorderAmount = Math.max(30 - p.unit_quantity, 0);
      return sum + (reorderAmount * (p.unit_cost || 0));
    }, 0);
    insights.push({
      type: "replenishment_urgent",
      title: "Critical Stock Replenishment Required",
      description: `${criticalItems.length} SKUs below critical threshold (<10 units) requiring immediate replenishment worth $${Math.round(urgentValue).toLocaleString()}.`,
      severity: criticalItems.length > 15 ? "critical" : "warning",
      dollarImpact: Math.round(urgentValue),
      suggestedActions: [
        "Generate emergency purchase orders for critical SKUs",
        "Implement expedited supplier delivery agreements",
        "Set up automated reorder triggers at 10-unit threshold",
        "Review safety stock levels for frequent stockouts"
      ],
      createdAt: new Date().toISOString(),
      source: "replenishment_agent"
    });
  }
  
  // Stockout Prevention
  if (outOfStockItems.length > 0) {
    const lostSalesRisk = outOfStockItems.length * 500; // Conservative estimate
    insights.push({
      id: "replenishment-insight-2",
      title: "Stockout Prevention Priority",
      description: `${outOfStockItems.length} active SKUs are completely out of stock, creating immediate revenue risk and customer satisfaction impact.`,
      severity: "critical",
      dollarImpact: lostSalesRisk,
      suggestedActions: [
        "Expedite supplier orders for out-of-stock items",
        "Implement stock substitution recommendations",
        "Review demand forecasting accuracy",
        "Set up backorder customer communication"
      ],
      createdAt: new Date().toISOString(),
      source: "replenishment_agent"
    });
  }
  
  // Supplier Performance Issues
  const recentShipments = shipments.filter(s => {
    if (!s.created_date) return false;
    const shipmentDate = new Date(s.created_date);
    const daysAgo = (Date.now() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });
  const issueShipments = recentShipments.filter(s => s.expected_quantity !== s.received_quantity);
  
  if (issueShipments.length > 0) {
    const impactValue = issueShipments.reduce((sum, s) => {
      const diff = Math.abs(s.expected_quantity - s.received_quantity);
      return sum + (diff * (s.unit_cost || 0));
    }, 0);
    insights.push({
      id: "replenishment-insight-3",
      title: "Supplier Delivery Performance Issues",
      description: `${issueShipments.length} recent shipments had quantity discrepancies worth $${Math.round(impactValue).toLocaleString()}, affecting replenishment accuracy.`,
      severity: issueShipments.length > 10 ? "warning" : "info",
      dollarImpact: Math.round(impactValue),
      suggestedActions: [
        "Review supplier quality agreements",
        "Implement pre-shipment verification process",
        "Negotiate performance penalties for discrepancies",
        "Diversify supplier base for critical SKUs"
      ],
      createdAt: new Date().toISOString(),
      source: "replenishment_agent"
    });
  }
  
  // Overall Replenishment Health
  const totalValue = kpis.replenishmentValue;
  insights.push({
    id: "replenishment-insight-4",
    title: "Replenishment Portfolio Summary",
    description: `Portfolio requires $${totalValue.toLocaleString()} in replenishment orders across ${kpis.reorderRecommendations} SKUs to maintain optimal stock levels.`,
    severity: "info",
    dollarImpact: totalValue,
    suggestedActions: [
      "Schedule weekly replenishment planning sessions",
      "Implement vendor-managed inventory for key suppliers",
      "Review seasonal demand patterns for planning",
      "Optimize order quantities using EOQ calculations"
    ],
    createdAt: new Date().toISOString(),
    source: "replenishment_agent"
  });
  
  return insights.slice(0, 4); // Limit to top 4 insights
}

/**
 * This part of the code generates AI-powered KPI context for Replenishment with accurate percentages and insights
 * Uses the same products and shipments data source as KPI calculations to ensure consistency
 */
async function generateReplenishmentKPIContext(
  kpis: ReplenishmentKPIs, 
  products: ProductData[],
  shipments: ShipmentData[]
): Promise<ReplenishmentKPIContext> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 Replenishment KPI Context Agent API Key Check:', !!apiKey, 'Length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('❌ No AI service key - using calculated fallbacks for Replenishment KPI context');
    return generateReplenishmentKPIFallbackContext(kpis, products, shipments);
  }

  try {
    // This part of the code analyzes the SAME products and shipments data used for KPI calculations to ensure accuracy
    const totalActiveProducts = products.filter(p => p.active).length;
    const lowStockItems = products.filter(p => p.active && p.unit_quantity < 20);
    const outOfStockItems = products.filter(p => p.active && p.unit_quantity === 0);
    const criticalItems = products.filter(p => p.active && p.unit_quantity < 10);
    
    // This part of the code analyzes recent shipments for supplier performance context
    const recentShipments = shipments.filter(s => {
      if (!s.created_date) return false;
      const daysAgo = (Date.now() - new Date(s.created_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });
    
    const totalSuppliers = new Set(shipments.map(s => s.supplier).filter(Boolean)).size;
    const supplierWithIssues = new Set();
    recentShipments.forEach(shipment => {
      if (shipment.status && (
        shipment.status.toLowerCase().includes('delay') || 
        shipment.status.toLowerCase().includes('exception') ||
        shipment.status.toLowerCase().includes('pending') ||
        shipment.status.toLowerCase().includes('problem')
      )) {
        if (shipment.supplier) supplierWithIssues.add(shipment.supplier);
      }
    });
    
    // This part of the code calculates financial context for replenishment value
    const totalValue = products.reduce((sum, p) => sum + ((p.unit_cost || 0) * (p.unit_quantity || 0)), 0);
    const reorderValue = lowStockItems.reduce((sum, p) => {
      const suggestedOrder = Math.max(30 - (p.unit_quantity || 0), 0);
      return sum + (suggestedOrder * (p.unit_cost || 0));
    }, 0);

    const prompt = `You are a Chief Procurement Officer analyzing replenishment KPIs. Provide meaningful percentage context and procurement-focused business explanations:

REPLENISHMENT OPERATIONAL DATA:
===============================
Total Active Products: ${totalActiveProducts}
Low Stock Items (<20 units): ${lowStockItems.length}  
Critical Items (<10 units): ${criticalItems.length}
Out of Stock Items: ${outOfStockItems.length}
Recent Shipments (30 days): ${recentShipments.length}
Total Suppliers: ${totalSuppliers}
Suppliers with Issues: ${supplierWithIssues.size}

CURRENT KPI VALUES:
- Critical SKUs: ${kpis.criticalSKUs}
- Replenishment Value: $${kpis.replenishmentValue.toLocaleString()}
- Supplier Alerts: ${kpis.supplierAlerts}
- Reorder Recommendations: ${kpis.reorderRecommendations}

FINANCIAL ANALYSIS:
- Total Portfolio Value: $${totalValue.toLocaleString()}
- Required Reorder Investment: $${reorderValue.toLocaleString()}
- Average Cost per Critical Item: $${criticalItems.length > 0 ? (reorderValue / criticalItems.length).toLocaleString() : 0}

Calculate accurate percentages using proper denominators and provide procurement-focused business context for each KPI.

REQUIRED JSON OUTPUT:
{
  "criticalSKUs": {
    "percentage": "[percentage_of_active_portfolio]%", 
    "context": "[inventory_urgency_context]",
    "description": "Products requiring urgent replenishment ([percentage]% of active portfolio)"
  },
  "replenishmentValue": {
    "percentage": "[percentage_of_total_value]%",
    "context": "[capital_efficiency_context]", 
    "description": "Capital needed for optimal inventory levels"
  },
  "supplierAlerts": {
    "percentage": "[supplier_risk_percentage]%",
    "context": "[supply_chain_reliability_context]", 
    "description": "Suppliers with delivery or quality issues"
  },
  "reorderRecommendations": {
    "percentage": "[execution_coverage_percentage]%",
    "context": "[procurement_workload_context]",
    "description": "Purchase orders requiring immediate action"
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
      console.log('🤖 Replenishment KPI Context Agent Raw Response:', aiContent.substring(0, 300) + '...');
      
      try {
        const parsed = JSON.parse(aiContent);
        console.log('✅ Replenishment KPI Context Agent: AI context parsed successfully');
        return parsed;
      } catch (parseError) {
        console.error('❌ Replenishment KPI Context JSON Parse Error:', parseError);
        console.log('❌ Replenishment KPI Context: JSON parse failed, using fallback');
        return generateReplenishmentKPIFallbackContext(kpis, products, shipments);
      }
    } else {
      console.error('❌ Replenishment KPI Context OpenAI API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error("❌ Replenishment KPI Context AI analysis failed:", error);
  }

  // This part of the code provides fallback when AI fails - ensures KPI context always available
  console.log('❌ Replenishment KPI Context: AI service failed, using calculated fallback');
  return generateReplenishmentKPIFallbackContext(kpis, products, shipments);
}

/**
 * This part of the code provides calculated Replenishment KPI context when AI is unavailable
 * Uses the same data relationships as the AI to ensure consistent percentages
 */
function generateReplenishmentKPIFallbackContext(
  kpis: ReplenishmentKPIs, 
  products: ProductData[], 
  shipments: ShipmentData[]
): ReplenishmentKPIContext {
  const totalActiveProducts = products.filter(p => p.active).length;
  const totalSuppliers = new Set(shipments.map(s => s.supplier).filter(Boolean)).size;
  const totalValue = products.reduce((sum, p) => sum + ((p.unit_cost || 0) * (p.unit_quantity || 0)), 0);
  
  // This part of the code calculates reorder value for context
  const lowStockItems = products.filter(p => p.active && p.unit_quantity < 20);
  const reorderValue = lowStockItems.reduce((sum, p) => {
    const suggestedOrder = Math.max(30 - (p.unit_quantity || 0), 0);
    return sum + (suggestedOrder * (p.unit_cost || 0));
  }, 0);
  
  return {
    criticalSKUs: {
      percentage: totalActiveProducts > 0 ? `${((kpis.criticalSKUs / totalActiveProducts) * 100).toFixed(1)}%` : null,
      context: `${kpis.criticalSKUs} urgent items from ${totalActiveProducts} active products`,
      description: totalActiveProducts > 0 ? 
        `Products requiring urgent replenishment (${((kpis.criticalSKUs / totalActiveProducts) * 100).toFixed(1)}% of active portfolio)` :
        "Products requiring urgent replenishment"
    },
    replenishmentValue: {
      percentage: totalValue > 0 ? `${((kpis.replenishmentValue / totalValue) * 100).toFixed(1)}%` : null,
      context: `$${kpis.replenishmentValue.toLocaleString()} investment needed from $${totalValue.toLocaleString()} portfolio`,
      description: totalValue > 0 ?
        `Capital needed for optimal inventory levels (${((kpis.replenishmentValue / totalValue) * 100).toFixed(1)}% of portfolio value)` :
        "Capital needed for optimal inventory levels"
    },
    supplierAlerts: {
      percentage: totalSuppliers > 0 ? `${((kpis.supplierAlerts / totalSuppliers) * 100).toFixed(1)}%` : null,
      context: `${kpis.supplierAlerts} problematic suppliers from ${totalSuppliers} total`,
      description: totalSuppliers > 0 ?
        `Suppliers with delivery or quality issues (${((kpis.supplierAlerts / totalSuppliers) * 100).toFixed(1)}% of supplier base)` :
        "Suppliers with delivery or quality issues"
    },
    reorderRecommendations: {
      percentage: kpis.criticalSKUs > 0 ? `${((kpis.reorderRecommendations / kpis.criticalSKUs) * 100).toFixed(0)}%` : null,
      context: `${kpis.reorderRecommendations} purchase orders from ${kpis.criticalSKUs} critical items`,
      description: kpis.criticalSKUs > 0 ?
        `Purchase orders requiring immediate action (${((kpis.reorderRecommendations / kpis.criticalSKUs) * 100).toFixed(0)}% coverage of critical items)` :
        "Purchase orders requiring immediate action"
    }
  };
}

// This part of the code generates AI insights for replenishment management using OpenAI
async function generateReplenishmentInsights(
  products: ProductData[],
  shipments: ShipmentData[],
  kpis: ReplenishmentKPIs
): Promise<any[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 AI service key check: hasApiKey:', !!apiKey, 'length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('❌ No AI service key found - using data-driven insights');
    return generateReplenishmentDataDrivenInsights(products, shipments, kpis);
  }

  try {
    // This part of the code extracts specific data for actionable AI recommendations (mirroring Dashboard/Orders/Inventory pattern)
    const criticalReplenishmentItems = products
      .filter(p => p.active && p.unit_quantity > 0 && p.unit_quantity <= 10)
      .sort((a, b) => (a.unit_quantity || 0) - (b.unit_quantity || 0))
      .slice(0, 8)
      .map(p => ({
        sku: p.product_sku,
        name: p.product_name,
        supplier: p.supplier_name,
        currentStock: p.unit_quantity,
        unitCost: p.unit_cost || 0,
        totalValue: Math.round((p.unit_cost || 0) * p.unit_quantity),
        daysOfStock: p.unit_quantity <= 5 ? 'CRITICAL' : 'LOW'
      }));

    const stockoutRisks = products
      .filter(p => p.active && p.unit_quantity === 0)
      .sort((a, b) => (b.unit_cost || 0) - (a.unit_cost || 0))
      .slice(0, 6)
      .map(p => ({
        sku: p.product_sku,
        name: p.product_name,
        supplier: p.supplier_name,
        unitCost: p.unit_cost || 0,
        lostSalesRisk: Math.round((p.unit_cost || 0) * 30), // Estimated 30-day lost sales
        urgency: 'IMMEDIATE'
      }));

    const reorderOpportunities = products
      .filter(p => p.active && p.unit_quantity > 0 && p.unit_quantity <= 15)
      .sort((a, b) => (b.unit_cost || 0) * b.unit_quantity - (a.unit_cost || 0) * a.unit_quantity)
      .slice(0, 10)
      .map(p => ({
        sku: p.product_sku,
        name: p.product_name,
        supplier: p.supplier_name,
        currentStock: p.unit_quantity,
        suggestedReorder: Math.max(30, p.unit_quantity * 3), // Suggest 3x current or minimum 30
        unitCost: p.unit_cost || 0,
        reorderValue: Math.round((p.unit_cost || 0) * Math.max(30, p.unit_quantity * 3)),
        priority: p.unit_quantity <= 5 ? 'HIGH' : p.unit_quantity <= 10 ? 'MEDIUM' : 'LOW'
      }));

    const supplierPerformanceIssues = Object.entries(
      shipments.reduce((acc, s) => {
        if (s.expected_quantity !== s.received_quantity) {
          const supplier = s.supplier || 'Unknown';
          if (!acc[supplier]) acc[supplier] = { discrepancies: 0, totalImpact: 0, shipments: 0 };
          acc[supplier].discrepancies++;
          acc[supplier].totalImpact += Math.abs(s.expected_quantity - s.received_quantity) * (s.unit_cost || 0);
          acc[supplier].shipments++;
        }
        return acc;
      }, {} as Record<string, { discrepancies: number; totalImpact: number; shipments: number }>)
    )
    .filter(([, data]) => data.discrepancies > 0)
    .sort(([, a], [, b]) => b.totalImpact - a.totalImpact)
    .slice(0, 5)
    .map(([supplier, data]) => ({
      supplier,
      discrepancies: data.discrepancies,
      totalImpact: Math.round(data.totalImpact),
      reliabilityScore: Math.round(((data.shipments - data.discrepancies) / data.shipments) * 100)
    }));

    console.log('🔍 Replenishment AI Enhancement - Critical Items:', criticalReplenishmentItems.length);
    console.log('🔍 Replenishment AI Enhancement - Stockout Risks:', stockoutRisks.length);
    console.log('🔍 Replenishment AI Enhancement - Reorder Opportunities:', reorderOpportunities.length);
    console.log('🔍 Replenishment AI Enhancement - Supplier Performance Issues:', supplierPerformanceIssues.length);

    // This part of the code prepares comprehensive data for AI analysis
    const criticalItems = products.filter(p => 
      p.active && p.unit_quantity > 0 && p.unit_quantity < 10
    );
    const outOfStockItems = products.filter(p => p.active && p.unit_quantity === 0);
    const lowStockItems = products.filter(p => 
      p.active && p.unit_quantity > 0 && p.unit_quantity < 20
    );
    const supplierIssues = shipments.filter(s => 
      s.expected_quantity !== s.received_quantity
    );

    // This part of the code analyzes supplier performance for insights
    const suppliers = Array.from(new Set(products.map(p => p.product_supplier || p.supplier_name).filter(Boolean)));
    const recentShipments = shipments.filter(s => {
      if (!s.created_date) return false;
      const shipmentDate = new Date(s.created_date);
      const daysAgo = (Date.now() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });

    // This part of the code creates example actions for the AI prompt using real supplier names from data
    const exampleReplenishmentAction = criticalReplenishmentItems.length > 0 && supplierPerformanceIssues.length > 0 
      ? `Emergency reorder workflow for ${criticalReplenishmentItems[0].sku} from ${criticalReplenishmentItems[0].supplier}: current ${criticalReplenishmentItems[0].currentStock} units critical, order 30 units by Friday to prevent $${criticalReplenishmentItems[0].totalValue * 5} stockout loss`
      : "Emergency reorder workflow for SKU-ABC123 from Johnson Industries: current 3 units critical, order 30 units by Friday to prevent $2,400 stockout loss";
    
    const exampleSupplierAction = supplierPerformanceIssues.length > 0
      ? `Review supplier performance with ${supplierPerformanceIssues[0].supplier}: ${supplierPerformanceIssues[0].discrepancies} delivery discrepancies causing $${supplierPerformanceIssues[0].totalImpact.toLocaleString()} impact - schedule performance review by Wednesday`
      : "Review supplier performance with Thompson Industries: 5 delivery discrepancies causing $8,400 impact - schedule performance review by Wednesday";
    
    const exampleReorderAction = reorderOpportunities.length > 0
      ? `Implement reorder triggers for ${reorderOpportunities[0].sku} from ${reorderOpportunities[0].supplier}: ${reorderOpportunities[0].currentStock} units remaining, set reorder point at 15 units with ${reorderOpportunities[0].suggestedReorder} unit orders`
      : "Implement reorder triggers for SKU-XYZ789 from Global Supply Co: 8 units remaining, set reorder point at 15 units with 45 unit orders";

    const prompt = `You are a Supply Chain Planning Director with 21+ years of experience in demand planning, supplier management, and inventory replenishment strategies. You have implemented vendor-managed inventory programs and advanced replenishment systems that reduced stockouts by 80% while minimizing excess inventory.

🎯 CRITICAL INSTRUCTION: You MUST use the specific data provided below to create detailed, actionable recommendations. Do NOT provide generic advice. Every recommendation must reference actual SKU numbers, supplier names, quantities, or dollar amounts from the data.

SPECIFIC DATA FOR ACTIONABLE RECOMMENDATIONS:
===========================================

CRITICAL REPLENISHMENT ITEMS (use these exact SKU numbers, suppliers, and quantities):
${criticalReplenishmentItems.map(item => `- SKU: ${item.sku} (${item.name}) - Supplier: ${item.supplier} - Stock: ${item.currentStock} units (${item.daysOfStock}) - Value: $${item.totalValue.toLocaleString()} - Unit Cost: $${item.unitCost.toFixed(2)}`).join('\n')}

STOCKOUT RISKS (use these exact SKU numbers and lost sales calculations):
${stockoutRisks.map(item => `- SKU: ${item.sku} (${item.name}) - Supplier: ${item.supplier} - OUT OF STOCK - Lost Sales Risk: $${item.lostSalesRisk.toLocaleString()}/month - Unit Cost: $${item.unitCost.toFixed(2)}`).join('\n')}

REORDER OPPORTUNITIES (use these exact SKU numbers and reorder calculations):
${reorderOpportunities.map(item => `- SKU: ${item.sku} (${item.name}) - Supplier: ${item.supplier} - Current: ${item.currentStock} units - Suggested Reorder: ${item.suggestedReorder} units ($${item.reorderValue.toLocaleString()}) - Priority: ${item.priority}`).join('\n')}

SUPPLIER PERFORMANCE ISSUES (use these exact supplier names and impact amounts):
${supplierPerformanceIssues.map(supplier => `- ${supplier.supplier}: ${supplier.discrepancies} delivery discrepancies, $${supplier.totalImpact.toLocaleString()} total impact, ${supplier.reliabilityScore}% reliability score`).join('\n')}

REPLENISHMENT CONTEXT:
- ${products.filter(p => p.active).length} active products across ${suppliers.length} suppliers
- ${kpis.criticalSKUs} products at critical stock levels (≤10 units)
- $${kpis.replenishmentValue.toLocaleString()} total replenishment value at risk
- ${supplierIssues.length} quantity discrepancies in recent shipments

📋 STEP-BY-STEP INSTRUCTIONS:
1. Analyze the specific replenishment data provided above
2. Identify 3-5 critical replenishment issues using the exact data
3. For EACH insight, create 3-5 specific recommendations that reference actual SKUs, suppliers, quantities, and costs
4. Include exact SKU numbers, supplier names, stock levels, and dollar amounts
5. Focus on actionable next steps with specific contacts and timelines

🎯 MANDATORY OUTPUT FORMAT:
[
  {
    "type": "warning",
    "title": "[Issue Title Based on Specific Replenishment Data]",
    "description": "Analysis referencing specific SKUs, suppliers, quantities, and dollar amounts from the data above. Include financial impact and root cause.",
    "severity": "critical|warning|info",
    "dollarImpact": [actual_number_from_data],
    "suggestedActions": [
      "[Action 1: Reference specific SKU number, supplier, or quantity from data]",
      "[Action 2: Include actual dollar amounts and stock levels]", 
      "[Action 3: Name specific suppliers to contact with deadlines]",
      "[Action 4: Use real data points, not generic terms]",
      "[Action 5: Provide concrete next steps with timelines]"
    ]
  }
]

WORKFLOW RECOMMENDATION REQUIREMENTS:
- Reference specific SKUs from the data above with exact quantities and suppliers
- Include concrete WHO to contact and WHAT to do TODAY with deadlines
- Specify exact reorder amounts, target stock levels, and financial impacts
- Provide detailed step-by-step workflow actions that operations can execute immediately
- Use real supplier names and SKU numbers from the data provided above

EXAMPLE HIGH-QUALITY SUGGESTED ACTIONS:
- "${exampleReplenishmentAction}"
- "${exampleSupplierAction}"
- "${exampleReorderAction}"

❌ AVOID GENERIC RECOMMENDATIONS LIKE:
- "Implement vendor-managed inventory for key suppliers" (no specific suppliers)
- "Create seasonal replenishment calendars" (no specific SKUs)
- "Set up automated purchase order generation" (no specific products)

🚨 CRITICAL SUCCESS CRITERIA:
- Each suggestedAction MUST include specific data from above sections
- Use actual SKU numbers, supplier names, stock levels, dollar amounts
- Provide concrete next steps with specific parties to contact
- Include implementation timelines and expected ROI
- Reference exact data points, not general concepts

Generate exactly 3-5 insights with 3-5 specific actions each.`;

    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    console.log('🤖 Replenishment Agent: Calling AI service for comprehensive dashboard insights...');
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_FAST || "gpt-3.5-turbo", // This part of the code switches to fast AI model for consistent performance
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';
    console.log('🤖 Raw AI response:', aiContent);

    // This part of the code uses JSON parsing like working dashboard API
    try {
      const insights = JSON.parse(aiContent);
      console.log('✅ Replenishment insights parsed successfully:', insights.length);
      
      // This part of the code ensures proper structure for client consumption
      return insights.map((insight: any, index: number) => ({
        id: insight.id || `replenishment-insight-${index}`,
        title: insight.title || `Replenishment Alert ${index + 1}`,
        description: insight.description || insight.content || 'Analysis pending',
        severity: insight.severity || 'warning',
        dollarImpact: insight.dollarImpact || Math.round(kpis.replenishmentValue * 0.2),
        suggestedActions: insight.suggestedActions || ["Review reorder points", "Contact supplier", "Analyze demand patterns"],
        createdAt: insight.createdAt || new Date().toISOString(),
        source: insight.source || "replenishment_agent",
      }));
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      return [];
    }

  } catch (error) {
    console.error("❌ Replenishment AI analysis failed:", error);
  }
  
  // This part of the code returns empty insights when AI fails - no fallback data
  return [];
}

// This part of the code handles fast mode for quick replenishment data loading without AI insights
async function handleFastMode(req: VercelRequest, res: VercelResponse) {
  console.log("⚡ Replenishment Fast Mode: Loading data without AI insights...");
  
  const [allProducts, allShipments] = await Promise.all([
    fetchProducts(),
    fetchShipments()
  ]);

  const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
  const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
  console.log(`🔍 Fast Mode - Data filtered for Callahan-Smith: ${products.length} products, ${shipments.length} shipments`);

  if (products.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          criticalSKUs: 0,
          replenishmentValue: 0,
          supplierAlerts: 0,
          reorderRecommendations: 0
        },
        insights: [], // Empty for fast mode
        products: [],
        shipments: [],
        criticalItems: [],
        supplierPerformance: [],
        reorderSuggestions: [],
        lastUpdated: new Date().toISOString(),
      },
      message: "No replenishment data available",
      timestamp: new Date().toISOString(),
    });
  }

  const kpis = calculateReplenishmentKPIs(products, shipments);

  // ⚡ FAST MODE: Empty KPI context - AI enhancement loads separately
  const kpiContext = {};

  const replenishmentData = {
    kpis,
    kpiContext, // ⚡ Empty in fast mode - AI context loads separately
    insights: [], // Empty for fast mode
    products,
    shipments,
    criticalItems: [],
    supplierPerformance: [],
    reorderSuggestions: [],
    lastUpdated: new Date().toISOString(),
  };

  console.log("✅ Replenishment Fast Mode: Data compiled successfully");
  res.status(200).json({
    success: true,
    data: replenishmentData,
    message: "Replenishment fast data retrieved successfully",
    timestamp: new Date().toISOString(),
  });
}

// This part of the code handles insights mode for AI-generated replenishment insights only
async function handleInsightsMode(req: VercelRequest, res: VercelResponse) {
  console.log("🤖 Replenishment AI Enhancement Mode: Loading AI insights + KPI context...");
  
  const [allProducts, allShipments] = await Promise.all([
    fetchProducts(),
    fetchShipments()
  ]);

  const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
  const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
  console.log(`🔍 AI Enhancement Mode - Data filtered for Callahan-Smith: ${products.length} products, ${shipments.length} shipments`);

  const kpis = calculateReplenishmentKPIs(products, shipments);
  
  // This part of the code generates AI enhancements (insights + KPI context) in parallel
  const [rawInsights, kpiContext] = await Promise.all([
    generateReplenishmentInsights(products, shipments, kpis),
    generateReplenishmentKPIContext(kpis, products, shipments)
  ]);

  // This part of the code maps insights to proper AIInsight format with all required properties (double mapping pattern)
  console.log('✅ Replenishment Insights Mode - Raw insights from AI:', rawInsights.length, 'insights');
  if (rawInsights.length > 0) {
    console.log('🔍 Sample insight:', JSON.stringify(rawInsights[0], null, 2));
  }
  
  const insights = rawInsights.map((insight, index) => ({
    id: `replenishment-insight-${index + 1}`,
    title: insight.title,
    description: insight.description,
    severity: (insight.severity === 'high' || insight.severity === 'critical') ? 'critical' as const :
             (insight.severity === 'medium' || insight.severity === 'warning') ? 'warning' as const :
             'info' as const,
    dollarImpact: insight.dollarImpact || 0,
    suggestedActions: insight.suggestedActions || [],
    createdAt: new Date().toISOString(),
    source: "replenishment_agent" as const,
  }));

  console.log('✅ Replenishment Insights Mode - Mapped insights:', insights.length, 'insights');
  if (insights.length > 0) {
    console.log('🔍 Sample mapped insight:', JSON.stringify(insights[0], null, 2));
  }

  console.log("✅ Replenishment AI Enhancement Mode: KPI context + insights compiled successfully");
  res.status(200).json({
    success: true,
    data: {
      kpiContext, // 🤖 AI-powered KPI context for enhanced cards
      insights,
      lastUpdated: new Date().toISOString(),
    },
    message: "Replenishment AI enhancements retrieved successfully",
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
    console.log("🚨 Building world-class replenishment intelligence for Callahan-Smith...");

    // This part of the code fetches real data for replenishment analysis
    const [allProducts, allShipments] = await Promise.all([
      fetchProducts(),
      fetchShipments()
    ]);

    // This part of the code ensures only Callahan-Smith data is processed
    const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    
    console.log(`🔍 Replenishment data filtered for Callahan-Smith: ${products.length} products, ${shipments.length} shipments`);

    if (products.length === 0) {
      // This part of the code returns empty state when no data is available
      return res.status(200).json({
        success: true,
        data: {
          kpis: {
            criticalSKUs: 0,
            replenishmentValue: 0,
            supplierAlerts: 0,
            reorderRecommendations: 0
          },
          insights: [],
          products: [],
          shipments: [],
          criticalItems: [],
          supplierPerformance: [],
          reorderSuggestions: [],
          lastUpdated: new Date().toISOString(),
        },
        message: "No replenishment data available",
        timestamp: new Date().toISOString(),
      });
    }

    // This part of the code calculates replenishment intelligence
    const kpis = calculateReplenishmentKPIs(products, shipments);
    const insights = await generateReplenishmentInsights(products, shipments, kpis);

    // This part of the code generates AI-powered KPI context for the default handler as well
    const kpiContext = await generateReplenishmentKPIContext(kpis, products, shipments);

    const replenishmentData: ReplenishmentData = {
      kpis,
      kpiContext, // 🆕 ADD AI-powered KPI context with accurate percentages and business insights
      insights: insights.map((insight, index) => ({
        id: `replenishment-insight-${index + 1}`,
        title: insight.title,
        description: insight.description,
        severity: (insight.severity === 'high' || insight.severity === 'critical') ? 'critical' as const :
                 (insight.severity === 'medium' || insight.severity === 'warning') ? 'warning' as const :
                 'info' as const,
        dollarImpact: insight.dollarImpact || 0,
        suggestedActions: insight.suggestedActions || [],
        createdAt: new Date().toISOString(),
        source: "replenishment_agent" as const,
      })),
      products, // Raw product data for client-side calculations
      shipments, // Raw shipment data for client-side calculations
      criticalItems: [], // Will be populated in future iterations
      supplierPerformance: [], // Will be populated in future iterations  
      reorderSuggestions: [], // Will be populated in future iterations
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ World-class replenishment intelligence generated:", {
      criticalSKUs: kpis.criticalSKUs,
      replenishmentValue: kpis.replenishmentValue,
      supplierAlerts: kpis.supplierAlerts,
      insights: insights.length
    });

    res.status(200).json({
      success: true,
      data: replenishmentData,
      message: "Replenishment data retrieved successfully",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Replenishment API error:", error);
    res.status(500).json({
      error: "Failed to fetch replenishment data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
