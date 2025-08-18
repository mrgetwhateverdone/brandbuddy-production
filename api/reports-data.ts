import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code provides reports data endpoint for Vercel serverless deployment
 * Uses proven patterns from working pages and avoids past implementation issues
 */

// TinyBird Product Details API Response - standardized interface matching working pages
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

// TinyBird Shipments API Response - standardized interface matching working pages
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

// Report template interfaces
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  estimatedReadTime: string;
  metrics: string[];
  available: boolean;
  icon: string;
}

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  brands?: string[];
  warehouses?: string[];
  template: string;
}

interface ReportBrandOption {
  brand_name: string;
  sku_count: number;
  total_value: number;
  total_quantity: number;
  avg_value_per_sku: number;
  portfolio_percentage: number;
  efficiency_score: number;
}

interface ReportWarehouseOption {
  warehouse_id: string;
  warehouse_name: string;
  total_shipments: number;
  completed_shipments: number;
  total_cost: number;
  total_quantity: number;
  efficiency_rate: number;
  avg_cost_per_shipment: number;
}

interface ReportData {
  template: ReportTemplate;
  filters: ReportFilters;
  data: {
    products: ProductData[];
    shipments: ShipmentData[];
    kpis: any;
    insights: any[];
  };
  availableBrands: ReportBrandOption[];
  availableWarehouses: ReportWarehouseOption[];
  generatedAt: string;
  reportPeriod: string;
}

/**
 * This part of the code fetches products data using the proven working pattern from inventory-data.ts
 */
async function fetchProducts(): Promise<ProductData[]> {
  const baseUrl = process.env.TINYBIRD_BASE_URL;
  const token = process.env.TINYBIRD_TOKEN;

  if (!baseUrl || !token) {
    console.error("❌ Vercel API: TINYBIRD_BASE_URL and TINYBIRD_TOKEN environment variables are required");
    return [];
  }

  try {
    console.log("🔒 Vercel API: Fetching products data from TinyBird...");
    
    const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TinyBird API Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const products = result.data || [];
    
    console.log(`✅ Vercel API: Fetched ${products.length} products from TinyBird`);
    return products;
  } catch (error) {
    console.error("❌ Vercel API: Failed to fetch products data:", error);
    return [];
  }
}

/**
 * This part of the code fetches shipments data using the proven working pattern from orders-data.ts
 */
async function fetchShipments(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    console.error("❌ Vercel API: WAREHOUSE_BASE_URL and WAREHOUSE_TOKEN environment variables are required");
    return [];
  }

  try {
    console.log("🔒 Vercel API: Fetching shipments data from TinyBird...");
    
    const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TinyBird API Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const shipments = result.data || [];
    
    console.log(`✅ Vercel API: Fetched ${shipments.length} shipments from TinyBird`);
    return shipments;
  } catch (error) {
    console.error("❌ Vercel API: Failed to fetch shipments data:", error);
    return [];
  }
}

/**
 * This part of the code applies date filters using safe date parsing to avoid crashes
 */
function filterDataByDateRange<T extends { created_date: string }>(
  data: T[], 
  startDate?: string, 
  endDate?: string
): T[] {
  if (!startDate || !endDate) {
    return data;
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return data.filter(item => {
      try {
        const itemDate = new Date(item.created_date);
        return itemDate >= start && itemDate <= end;
      } catch (error) {
        console.warn("⚠️ Vercel API: Invalid date in data item, skipping:", item.created_date);
        return false;
      }
    });
  } catch (error) {
    console.error("❌ Vercel API: Invalid date range provided:", { startDate, endDate });
    return data;
  }
}

/**
 * This part of the code applies brand and warehouse filters with null safety
 */
function applyFilters(
  products: ProductData[], 
  shipments: ShipmentData[], 
  filters: ReportFilters
): { products: ProductData[]; shipments: ShipmentData[] } {
  let filteredProducts = [...products];
  let filteredShipments = [...shipments];

  // This part of the code applies date range filtering
  if (filters.startDate && filters.endDate) {
    filteredProducts = filterDataByDateRange(filteredProducts, filters.startDate, filters.endDate);
    filteredShipments = filterDataByDateRange(filteredShipments, filters.startDate, filters.endDate);
  }

  // This part of the code applies brand filtering with null safety
  if (filters.brands && filters.brands.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      p.brand_name && filters.brands!.includes(p.brand_name)
    );
    filteredShipments = filteredShipments.filter(s => 
      s.brand_name && filters.brands!.includes(s.brand_name)
    );
  }

  // This part of the code applies warehouse filtering with null safety
  if (filters.warehouses && filters.warehouses.length > 0) {
    filteredShipments = filteredShipments.filter(s => 
      s.warehouse_id && filters.warehouses!.includes(s.warehouse_id)
    );
  }

  return { products: filteredProducts, shipments: filteredShipments };
}

/**
 * This part of the code calculates KPIs using defensive programming patterns from working pages
 */
function calculateReportKPIs(products: ProductData[], shipments: ShipmentData[], template: string) {
  // This part of the code uses defensive programming to prevent crashes
  const totalProducts = products?.length || 0;
  const totalShipments = shipments?.length || 0;
  
  const activeProducts = products.filter(p => p.active === true).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.unit_cost || 0) * (p.unit_quantity || 0)), 0);
  
  const completedShipments = shipments.filter(s => s.status === 'completed' || s.status === 'receiving').length;
  const delayedShipments = shipments.filter(s => {
    if (!s.expected_arrival_date || !s.arrival_date) return false;
    try {
      return new Date(s.arrival_date) > new Date(s.expected_arrival_date);
    } catch (error) {
      return false;
    }
  }).length;
  
  const slaCompliance = totalShipments > 0 ? Math.round(((totalShipments - delayedShipments) / totalShipments) * 100) : null;
  
  return {
    totalProducts,
    totalShipments,
    activeProducts,
    totalInventoryValue: Math.round(totalInventoryValue),
    completedShipments,
    delayedShipments,
    slaCompliance,
    fulfillmentRate: totalShipments > 0 ? Math.round((completedShipments / totalShipments) * 100) : null
  };
}

/**
 * This part of the code generates AI insights using the pattern from working pages
 */
async function generateReportInsights(
  products: ProductData[], 
  shipments: ShipmentData[], 
  kpis: any, 
  template: string
): Promise<any[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiApiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";

  if (!openaiApiKey) {
    return [{
      id: "report-insight-1",
      title: "Report Analysis Requires Configuration",
      description: "OpenAI API key required for AI-powered report insights and recommendations.",
      severity: "info" as const,
      dollarImpact: 0,
      suggestedActions: ["Configure OpenAI API key for enhanced report analysis"],
      timestamp: new Date().toISOString(),
      source: "reports_agent" as const,
    }];
  }

  try {
    const topBrand = products.length > 0 ? products[0]?.brand_name || 'Unknown' : 'N/A';
    const avgCost = products.length > 0 ? 
      products.reduce((sum, p) => sum + (p.unit_cost || 0), 0) / products.length : 0;

    let templateSpecificPrompt = "";
    switch (template) {
      case "inventory-health":
        templateSpecificPrompt = `Analyze inventory health based on ${kpis.totalProducts} products, $${kpis.totalInventoryValue} total value, and ${kpis.activeProducts} active SKUs. Top brand: ${topBrand}. Provide specific inventory optimization recommendations.`;
        break;
      case "fulfillment-performance":
        templateSpecificPrompt = `Analyze fulfillment performance based on ${kpis.totalShipments} shipments, ${kpis.slaCompliance}% SLA compliance, and ${kpis.delayedShipments} delayed deliveries. Provide operational efficiency recommendations.`;
        break;
      case "supplier-analysis":
        templateSpecificPrompt = `Analyze supplier performance based on shipment data showing ${kpis.fulfillmentRate}% fulfillment rate and delivery patterns. Provide supplier relationship optimization strategies.`;
        break;
      default:
        templateSpecificPrompt = `Analyze operational performance based on ${kpis.totalProducts} products and ${kpis.totalShipments} shipments. Provide strategic business recommendations.`;
    }

    const insightPrompt = `
    As a Report Analytics Agent, analyze the following REAL business data and provide 2-3 strategic insights:
    
    ${templateSpecificPrompt}
    
    Key Metrics:
    - Products: ${kpis.totalProducts} (${kpis.activeProducts} active)
    - Inventory Value: $${kpis.totalInventoryValue}
    - Shipments: ${kpis.totalShipments} (${kpis.completedShipments} completed)
    - SLA Performance: ${kpis.slaCompliance}%
    - Average Unit Cost: $${avgCost.toFixed(2)}
    
    Format as JSON array:
    [
      {
        "title": "string",
        "description": "string (explain what the data shows and why it matters)", 
        "severity": "high|medium|low",
        "dollarImpact": number,
        "suggestedActions": ["specific action 1", "specific action 2", "specific action 3"]
      }
    ]
    `;

    const response = await fetch(openaiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system", 
            content: "You are a Report Analytics Agent providing strategic business insights based on real operational data. Focus on actionable recommendations with realistic financial impacts."
          },
          {
            role: "user",
            content: insightPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const result = await response.json();
    const aiContent = result.choices?.[0]?.message?.content || "";
    
    try {
      const parsed = JSON.parse(aiContent);
      return parsed.map((insight: any, index: number) => ({
        id: `report-insight-${index + 1}`,
        type: "report_analysis",
        title: insight.title || "Report Analysis",
        description: insight.description || "",
        severity: insight.severity || "medium",
        dollarImpact: insight.dollarImpact || 0,
        source: "reports_agent" as const,
        suggestedActions: insight.suggestedActions || [],
        timestamp: new Date().toISOString(),
      }));
    } catch (parseError) {
      console.error("❌ Failed to parse AI insights response:", parseError);
      return [];
    }

  } catch (error) {
    console.error("❌ Vercel API: Failed to generate report insights:", error);
    return [];
  }
}

/**
 * This part of the code calculates brand performance using proven logic from inventory-data.ts
 */
function calculateAvailableBrands(products: ProductData[]) {
  console.log("🔧 Brand calc: Starting with", products.length, "products");
  const brandMap = new Map<string, {skuCount: number, totalValue: number, totalQuantity: number}>();
  
  products.forEach(p => {
    const cost = p.unit_cost || 0;
    const value = p.unit_quantity * cost;
    
    if (brandMap.has(p.brand_name)) {
      const existing = brandMap.get(p.brand_name)!;
      existing.skuCount += 1;
      existing.totalValue += value;
      existing.totalQuantity += p.unit_quantity;
    } else {
      brandMap.set(p.brand_name, {
        skuCount: 1,
        totalValue: value,
        totalQuantity: p.unit_quantity
      });
    }
  });
  
  const totalPortfolioValue = Array.from(brandMap.values()).reduce((sum, data) => sum + data.totalValue, 0);
  
  const result = Array.from(brandMap.entries())
    .map(([brand, data]) => ({
      brand_name: brand,
      sku_count: data.skuCount,
      total_value: Math.round(data.totalValue),
      total_quantity: data.totalQuantity,
      avg_value_per_sku: Math.round(data.totalValue / data.skuCount),
      portfolio_percentage: totalPortfolioValue > 0 ? Math.round((data.totalValue / totalPortfolioValue) * 100) : 0,
      efficiency_score: Math.round((data.totalValue / data.skuCount) * (data.totalQuantity / data.skuCount))
    }))
    .sort((a, b) => b.total_value - a.total_value);
  
  console.log("🔧 Brand calc: Finished with", result.length, "brands");
  return result;
}

/**
 * This part of the code calculates warehouse performance using proven logic from cost-data.ts
 */
function calculateAvailableWarehouses(shipments: ShipmentData[]) {
  const warehouseMap = new Map<string, {
    totalShipments: number;
    completedShipments: number;
    totalCost: number;
    totalQuantity: number;
  }>();

  shipments.forEach(shipment => {
    if (!shipment.warehouse_id) return;
    
    const warehouseId = shipment.warehouse_id;
    const cost = (shipment.unit_cost || 0) * (shipment.expected_quantity || 0);
    
    if (!warehouseMap.has(warehouseId)) {
      warehouseMap.set(warehouseId, {
        totalShipments: 0,
        completedShipments: 0,
        totalCost: 0,
        totalQuantity: 0
      });
    }
    
    const data = warehouseMap.get(warehouseId)!;
    data.totalShipments++;
    data.totalCost += cost;
    data.totalQuantity += shipment.expected_quantity || 0;
    
    if (shipment.status === 'completed' || shipment.status === 'receiving') {
      data.completedShipments++;
    }
  });

  return Array.from(warehouseMap.entries())
    .map(([warehouseId, data]) => ({
      warehouse_id: warehouseId,
      warehouse_name: warehouseId, // Use ID as name for now
      total_shipments: data.totalShipments,
      completed_shipments: data.completedShipments,
      total_cost: Math.round(data.totalCost),
      total_quantity: data.totalQuantity,
      efficiency_rate: data.totalShipments > 0 ? Math.round((data.completedShipments / data.totalShipments) * 100) : 0,
      avg_cost_per_shipment: data.totalShipments > 0 ? Math.round(data.totalCost / data.totalShipments) : 0
    }))
    .sort((a, b) => b.total_cost - a.total_cost);
}

/**
 * This part of the code defines available report templates
 */
function getReportTemplates(): ReportTemplate[] {
  return [
    {
      id: "inventory-health",
      name: "Inventory Health",
      description: "Stock levels, brands, suppliers",
      estimatedReadTime: "3 min read",
      metrics: ["Inventory", "Insights"],
      available: true,
      icon: "📦"
    },
    {
      id: "fulfillment-performance", 
      name: "Fulfillment Performance",
      description: "SLA compliance, delivery metrics",
      estimatedReadTime: "4 min read",
      metrics: ["Orders", "SLA", "Insights"],
      available: true,
      icon: "🚚"
    },
    {
      id: "supplier-analysis",
      name: "Supplier Analysis", 
      description: "Delivery performance, cost trends",
      estimatedReadTime: "3 min read",
      metrics: ["Suppliers", "SLA", "Insights"],
      available: true,
      icon: "🏭"
    },
    {
      id: "warehouse-efficiency",
      name: "Warehouse Efficiency",
      description: "Throughput, cost per shipment", 
      estimatedReadTime: "4 min read",
      metrics: ["Warehouses", "Costs", "Insights"],
      available: true,
      icon: "🏢"
    },
    {
      id: "brand-performance",
      name: "Brand Performance",
      description: "Inventory investment, supplier relationships",
      estimatedReadTime: "3 min read", 
      metrics: ["Brands", "Inventory", "Insights"],
      available: true,
      icon: "🏷️"
    },
    {
      id: "returns-analysis",
      name: "Returns Analysis",
      description: "Feature coming soon - Advanced returns processing analytics",
      estimatedReadTime: "3 min read",
      metrics: ["Returns", "Insights"],
      available: false,
      icon: "↩️"
    },
    {
      id: "employee-productivity",
      name: "Employee Productivity",
      description: "Feature coming soon - Workforce performance tracking",
      estimatedReadTime: "4 min read",
      metrics: ["Labor", "Productivity", "Insights"],
      available: false,
      icon: "👥"
    },
    {
      id: "labor-forecast",
      name: "Labor Forecast",
      description: "Feature coming soon - Workforce planning and optimization",
      estimatedReadTime: "5 min read", 
      metrics: ["Labor", "Forecasting", "Insights"],
      available: false,
      icon: "📊"
    }
  ];
}

/**
 * Main API handler using proven patterns from working pages
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // This part of the code handles CORS and method validation like working pages
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    console.log("🔒 Vercel API: Reports endpoint called");

    // This part of the code extracts query parameters with validation
    const { template, startDate, endDate, brands, warehouses } = req.query;

    // If no template specified, return available templates with filter options
    if (!template) {
      console.log("🎯 REPORTS API: Fetching templates and filter options...");
      const templates = getReportTemplates();
      console.log("🎯 REPORTS API: Templates ready, fetching data...");
      
      // This part of the code fetches data to get available brands and warehouses
      const [products, shipments] = await Promise.all([
        fetchProducts(),
        fetchShipments(),
      ]);
      
      console.log("🔍 REPORTS API DEBUG: Fetched products count:", products.length);
      console.log("🔍 REPORTS API DEBUG: Fetched shipments count:", shipments.length);
      console.log("🔍 REPORTS API DEBUG: Sample product brands:", products.slice(0, 3).map(p => p.brand_name));
      console.log("🔍 REPORTS API DEBUG: Sample shipment warehouses:", shipments.slice(0, 3).map(s => s.warehouse_id));
      
      console.log("🎯 REPORTS API: Starting brand calculation...");
      const availableBrands = calculateAvailableBrands(products);
      console.log("🎯 REPORTS API: Starting warehouse calculation...");
      const availableWarehouses = calculateAvailableWarehouses(shipments);
      
      console.log("🔍 REPORTS API FINAL: Calculated brands:", availableBrands.length, availableBrands.slice(0, 3).map(b => `${b.brand_name} ($${b.total_value})`));
      console.log("🔍 REPORTS API FINAL: Calculated warehouses:", availableWarehouses.length, availableWarehouses.slice(0, 3).map(w => `${w.warehouse_id} ($${w.total_cost})`));
      
      return res.status(200).json({
        success: true,
        data: { templates, availableBrands, availableWarehouses },
        message: "Available report templates and filter options",
        timestamp: new Date().toISOString(),
      });
    }

    // This part of the code validates template exists
    const templates = getReportTemplates();
    const selectedTemplate = templates.find(t => t.id === template);
    
    if (!selectedTemplate) {
      return res.status(400).json({
        success: false,
        error: "Invalid template specified",
        timestamp: new Date().toISOString(),
      });
    }

    if (!selectedTemplate.available) {
      return res.status(400).json({
        success: false,
        error: "Template not yet available",
        message: selectedTemplate.description,
        timestamp: new Date().toISOString(),
      });
    }

    // This part of the code fetches data using proven working patterns
    const [products, shipments] = await Promise.all([
      fetchProducts(),
      fetchShipments(),
    ]);

    // This part of the code applies filters safely
    const filters: ReportFilters = {
      template: template as string,
      startDate: startDate as string || undefined,
      endDate: endDate as string || undefined,
      brands: brands ? (brands as string).split(',') : undefined,
      warehouses: warehouses ? (warehouses as string).split(',') : undefined,
    };

    const { products: filteredProducts, shipments: filteredShipments } = applyFilters(products, shipments, filters);

    // This part of the code calculates KPIs with defensive programming
    const kpis = calculateReportKPIs(filteredProducts, filteredShipments, template as string);

    // This part of the code generates AI insights
    const insights = await generateReportInsights(filteredProducts, filteredShipments, kpis, template as string);

    // This part of the code assembles report data
    const reportPeriod = filters.startDate && filters.endDate 
      ? `${filters.startDate} to ${filters.endDate}`
      : "All available data";

    const availableBrands = calculateAvailableBrands(products);
    const availableWarehouses = calculateAvailableWarehouses(shipments);

    const reportData: ReportData = {
      template: selectedTemplate,
      filters,
      data: {
        products: filteredProducts,
        shipments: filteredShipments,
        kpis,
        insights,
      },
      availableBrands,
      availableWarehouses,
      generatedAt: new Date().toISOString(),
      reportPeriod,
    };

    console.log("✅ Vercel API: Report data generated successfully");

    return res.status(200).json({
      success: true,
      data: reportData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Vercel API: Reports endpoint error:", error);
    
    return res.status(500).json({
      success: false,
      error: "Failed to generate report data",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
