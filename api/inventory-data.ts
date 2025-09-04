import type { VercelRequest, VercelResponse } from "@vercel/node";

// Phase 2: World-Class Inventory Dashboard with Rich Data
interface ProductData {
  product_id: string;
  company_url: string;
  brand_name: string;
  product_name: string;
  product_sku: string | null;
  unit_quantity: number;
  unit_cost: number | null;
  active: boolean;
  supplier_name: string;
  country_of_origin: string | null;
  created_date: string;
  updated_date: string | null;
}

async function fetchProducts(): Promise<ProductData[]> {
  const baseUrl = process.env.TINYBIRD_BASE_URL;
  const token = process.env.TINYBIRD_TOKEN;

  if (!baseUrl || !token) {
    console.log("⚠️ Data service config missing, using fallback");
    return [];
  }

  // This part of the code matches the working dashboard API URL pattern
  const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
  
  try {
    console.log("🔒 Fetching from data service:", url.replace(token, "[TOKEN]"));
    const response = await fetch(url);
    if (!response.ok) {
      console.log("⚠️ Data service API failed:", response.status, response.statusText);
      return [];
    }
    const result = await response.json();
    console.log("✅ Data service response:", result.data?.length || 0, "products");
    return result.data || [];
  } catch (error) {
    console.log("⚠️ Data service fetch failed:", error);
    return [];
  }
}

function calculateEnhancedKPIs(products: ProductData[]) {
  // Data is already filtered for Callahan-Smith brand
  const callahanSmithProducts = products;
  
  // Basic counts
  const totalSKUs = callahanSmithProducts.length;
  const activeSKUs = callahanSmithProducts.filter(p => p.active).length;
  const inactiveSKUs = callahanSmithProducts.filter(p => !p.active).length;
  const lowStockCount = callahanSmithProducts.filter(p => p.unit_quantity > 0 && p.unit_quantity < 10).length;
  
  // Value calculations
  const totalInventoryValue = callahanSmithProducts.reduce((sum, p) => {
    const cost = p.unit_cost || 0;
    return sum + (p.unit_quantity * cost);
  }, 0);
  
  // Legacy KPIs for compatibility
  const inStockCount = callahanSmithProducts.filter(p => p.unit_quantity > 0).length;
  const unfulfillableCount = callahanSmithProducts.filter(p => p.unit_quantity === 0).length;
  const overstockedCount = callahanSmithProducts.filter(p => p.unit_quantity > 100).length;
  
  return {
    // Enhanced KPIs
    totalActiveSKUs: activeSKUs,
    totalInventoryValue: Math.round(totalInventoryValue),
    lowStockAlerts: lowStockCount,
    inactiveSKUs: inactiveSKUs,
    
    // Legacy KPIs for compatibility
    totalSKUs,
    inStockCount,
    unfulfillableCount,
    overstockedCount,
    avgDaysOnHand: null // Will calculate separately if needed
  };
}

function calculateBrandPerformance(products: ProductData[]) {
  // Data is already filtered for Callahan-Smith brand
  const callahanSmithProducts = products;
  const brandMap = new Map<string, {skuCount: number, totalValue: number, totalQuantity: number}>();
  
  callahanSmithProducts.forEach(p => {
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
  
  return Array.from(brandMap.entries())
    .map(([brand, data]) => ({
      brand_name: brand,
      sku_count: data.skuCount,
      total_value: Math.round(data.totalValue),
      total_quantity: data.totalQuantity,
      avg_value_per_sku: Math.round(data.totalValue / data.skuCount),
      portfolio_percentage: totalPortfolioValue > 0 ? Math.round((data.totalValue / totalPortfolioValue) * 100) : 0,
      efficiency_score: Math.round((data.totalValue / data.skuCount) * (data.totalQuantity / data.skuCount))
    }))
    .sort((a, b) => b.total_value - a.total_value); // All brands, sorted by value
}

function calculateSupplierAnalysis(products: ProductData[]) {
  // Data is already filtered for Callahan-Smith brand
  const callahanSmithProducts = products;
  const supplierMap = new Map<string, {skuCount: number, totalValue: number, countries: Set<string>}>();
  
  callahanSmithProducts.forEach(p => {
    const cost = p.unit_cost || 0;
    const value = p.unit_quantity * cost;
    
    if (supplierMap.has(p.supplier_name)) {
      const existing = supplierMap.get(p.supplier_name)!;
      existing.skuCount += 1;
      existing.totalValue += value;
      if (p.country_of_origin) existing.countries.add(p.country_of_origin);
    } else {
      supplierMap.set(p.supplier_name, {
        skuCount: 1,
        totalValue: value,
        countries: new Set(p.country_of_origin ? [p.country_of_origin] : [])
      });
    }
  });
  
  return Array.from(supplierMap.entries())
    .map(([supplier, data]) => ({
      supplier_name: supplier,
      sku_count: data.skuCount,
      total_value: Math.round(data.totalValue),
      countries: Array.from(data.countries),
      concentration_risk: Math.round((data.totalValue / callahanSmithProducts.reduce((sum, p) => sum + (p.unit_quantity * (p.unit_cost || 0)), 0)) * 100)
    }))
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 15);
}

function transformToEnhancedInventoryItems(products: ProductData[]) {
  // Data is already filtered for Callahan-Smith brand
  return products
    .map(p => {
      const cost = p.unit_cost || 0;
      const totalValue = p.unit_quantity * cost;
      const daysSinceCreated = Math.floor((Date.now() - new Date(p.created_date).getTime()) / (1000 * 60 * 60 * 24));
      
      // Enhanced status logic
      let status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstocked' | 'Inactive';
      if (!p.active) {
        status = 'Inactive';
      } else if (p.unit_quantity === 0) {
        status = 'Out of Stock';
      } else if (p.unit_quantity < 10) {
        status = 'Low Stock';
      } else if (p.unit_quantity > 100) {
        status = 'Overstocked';
      } else {
        status = 'In Stock';
      }
      
      return {
        sku: p.product_sku || p.product_id,
        product_name: p.product_name,
        brand_name: p.brand_name,
        on_hand: p.unit_quantity,
        committed: Math.floor(p.unit_quantity * 0.1), // Simple 10% committed
        available: Math.max(0, p.unit_quantity - Math.floor(p.unit_quantity * 0.1)),
        unit_cost: cost,
        total_value: Math.round(totalValue),
        supplier: p.supplier_name,
        country_of_origin: p.country_of_origin || 'Unknown',
        status,
        active: p.active,
        days_since_created: daysSinceCreated,
        warehouse_id: null,
        last_updated: p.updated_date
      };
    })
    .sort((a, b) => b.total_value - a.total_value); // Sort by value descending
}

// Note: Removed generateInventoryDataDrivenInsights function - no longer using fallback templates
// When OpenAI fails, return empty insights array to show "Backend Disconnected" message

// This part of the code generates AI insights for inventory management using OpenAI
async function generateInventoryInsights(
  products: ProductData[],
  kpis: any,
  supplierAnalysis: any[]
): Promise<any[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 AI service key check: hasApiKey:', !!apiKey, 'length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('❌ No AI service key found - returning empty insights');
    return [];
  }

  try {
    // This part of the code prepares comprehensive data for AI analysis
    const lowStockItems = products.filter(p => p.active && p.unit_quantity > 0 && p.unit_quantity < 10);
    const outOfStockItems = products.filter(p => p.active && p.unit_quantity === 0);
    const overstockedItems = products.filter(p => p.active && p.unit_quantity > 100);
    const inactiveItems = products.filter(p => !p.active);
    const highRiskSuppliers = supplierAnalysis.filter(s => s.concentration_risk > 30);
    
    const totalInventoryValue = kpis.totalInventoryValue;
    const avgInventoryValue = products.length > 0 ? totalInventoryValue / products.length : 0;

    const prompt = `You are a VP of Inventory Management with 20+ years of experience in demand planning, inventory optimization, and warehouse operations. You have expertise in implementing JIT systems, ABC analysis, and advanced forecasting models that have saved companies millions in carrying costs.

Analyze this specific inventory data to generate actionable workflow recommendations. Use the real SKUs, suppliers, and dollar amounts provided to create concrete, data-driven insights and suggested actions.

INVENTORY INTELLIGENCE DASHBOARD:
=================================

CRITICAL METRICS:
- Total SKUs: ${kpis.totalSKUs} (${kpis.totalActiveSKUs} active, ${kpis.inactiveSKUs} inactive)
- Total Inventory Value: $${kpis.totalInventoryValue.toLocaleString()}
- Low Stock Alerts: ${kpis.lowStockAlerts} critical items
- Out of Stock: ${outOfStockItems.length} SKUs unavailable
- Overstocked Items: ${overstockedItems.length} SKUs (>100 units)

SUPPLIER RISK ANALYSIS:
- Total Suppliers: ${supplierAnalysis.length} partners
- High Concentration Risk: ${highRiskSuppliers.length} suppliers (>30% portfolio share)
- Top Supplier Concentration: ${supplierAnalysis.length > 0 ? supplierAnalysis[0].concentration_risk : 0}%
- Average Value per SKU: $${Math.round(avgInventoryValue).toLocaleString()}

INVENTORY HEALTH BREAKDOWN:
- In Stock: ${products.filter(p => p.active && p.unit_quantity >= 10 && p.unit_quantity <= 100).length} SKUs optimal range
- Low Stock (<10 units): ${lowStockItems.length} SKUs requiring attention
- Out of Stock: ${outOfStockItems.length} SKUs causing stockouts
- Overstocked (>100 units): ${overstockedItems.length} SKUs tying up capital
- Inactive Portfolio: ${inactiveItems.length} SKUs (${Math.round((inactiveItems.length / products.length) * 100)}% of total)

Based on your proven track record of reducing inventory carrying costs by 25-35% and implementing successful JIT systems, provide strategic insights focused on inventory optimization opportunities including ABC analysis, demand forecasting improvements, and supplier diversification strategies.

Format as JSON array with 3-5 strategic insights:
[
  {
    "id": "inventory-insight-1",
    "title": "Strategic inventory insight based on proven methodologies",
    "description": "Expert analysis referencing inventory data with specific numbers and actionable recommendations drawing from your 20+ years of experience in inventory optimization",
    "severity": "critical|warning|info",
    "dollarImpact": calculated_financial_impact,
    "suggestedActions": ["Use specific SKU numbers, supplier names, and dollar amounts from the data above", "Reference actual quantities and inventory values", "Include specific suppliers and SKU codes in recommendations"],
    "createdAt": "${new Date().toISOString()}",
    "source": "inventory_agent"
  }
]

SPECIFIC DATA TO REFERENCE:
- Low Stock SKUs: ${lowStockItems.slice(0, 10).map(p => `${p.sku} (${p.unit_quantity} units, ${p.supplier || 'N/A'})`).join(', ')}
- Out of Stock SKUs: ${outOfStockItems.slice(0, 10).map(p => `${p.sku} (${p.supplier || 'N/A'})`).join(', ')}
- Overstocked SKUs: ${overstockedItems.slice(0, 10).map(p => `${p.sku} (${p.unit_quantity} units, $${(p.unit_cost * p.unit_quantity).toLocaleString()})`).join(', ')}
- High Risk Suppliers: ${highRiskSuppliers.map(s => `${s.supplier_name} (${s.sku_count} SKUs, $${s.total_value.toLocaleString()})`).join(', ')}

Use these specific SKUs, suppliers, and dollar amounts in your recommendations. Focus on immediate inventory optimization priorities and actionable workflow recommendations.`;

    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    console.log('🤖 Inventory Agent: Calling AI service for comprehensive inventory insights...');
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_ADVANCED || "gpt-4",
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
      console.log('✅ Inventory insights parsed successfully:', insights.length);
      
      // This part of the code ensures proper structure for client consumption
      return insights.map((insight: any, index: number) => ({
        id: insight.id || `inventory-insight-${index}`,
        title: insight.title || `Inventory Alert ${index + 1}`,
        description: insight.description || insight.content || 'Analysis pending',
        severity: insight.severity || 'warning',
        dollarImpact: insight.dollarImpact || Math.round(kpis.totalInventoryValue * 0.1),
        suggestedActions: insight.suggestedActions || [],
        createdAt: insight.createdAt || new Date().toISOString(),
        source: insight.source || "inventory_agent",
      }));
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.log('❌ Inventory: JSON parse failed - returning empty insights');
      return [];
    }

  } catch (error) {
    console.error("❌ Inventory AI analysis failed:", error);
    return [];
  }
  
  // This should never be reached, but return empty array as fallback
  return [];
}

// This part of the code handles fast mode for quick inventory data loading without AI insights
async function handleFastMode(req: VercelRequest, res: VercelResponse) {
  console.log("⚡ Inventory Fast Mode: Loading data without AI insights...");
  
  const allProducts = await fetchProducts();
  const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
  console.log(`🔍 Fast Mode - Data filtered for Callahan-Smith: ${allProducts.length} total → ${products.length} Callahan-Smith products`);
  
  if (products.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalActiveSKUs: 0,
          totalInventoryValue: 0,
          lowStockAlerts: 0,
          inactiveSKUs: 0,
          totalSKUs: 0,
          inStockCount: 0,
          unfulfillableCount: 0,
          overstockedCount: 0,
          avgDaysOnHand: null
        },
        insights: [], // Empty for fast mode
        inventory: [],
        brandPerformance: [],
        supplierAnalysis: [],
        lastUpdated: new Date().toISOString(),
      },
      message: "No inventory data available",
      timestamp: new Date().toISOString(),
    });
  }

  const kpis = calculateEnhancedKPIs(products);
  const brandPerformance = calculateBrandPerformance(products);
  const supplierAnalysis = calculateSupplierAnalysis(products);
  const inventory = transformToEnhancedInventoryItems(products);

  const inventoryData = {
    kpis,
    insights: [], // Empty for fast mode
    inventory: inventory.slice(0, 500),
    brandPerformance,
    supplierAnalysis,
    lastUpdated: new Date().toISOString(),
  };

  console.log("✅ Inventory Fast Mode: Data compiled successfully");
  res.status(200).json({
    success: true,
    data: inventoryData,
    message: "Inventory fast data retrieved successfully",
    timestamp: new Date().toISOString(),
  });
}

// This part of the code handles insights mode for AI-generated inventory insights only
async function handleInsightsMode(req: VercelRequest, res: VercelResponse) {
  console.log("🤖 Inventory Insights Mode: Loading AI insights only...");
  
  const allProducts = await fetchProducts();
  const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
  console.log(`🔍 Insights Mode - Data filtered for Callahan-Smith: ${allProducts.length} total → ${products.length} Callahan-Smith products`);
  
  const kpis = calculateEnhancedKPIs(products);
  const supplierAnalysis = calculateSupplierAnalysis(products);
  const insights = await generateInventoryInsights(products, kpis, supplierAnalysis);

  console.log("✅ Inventory Insights Mode: AI insights compiled successfully");
  res.status(200).json({
    success: true,
    data: {
      insights,
      lastUpdated: new Date().toISOString(),
    },
    message: "Inventory insights retrieved successfully",
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
    console.log("🔒 Phase 2: Building world-class inventory dashboard...");

    // Fetch real data and calculate enhanced analytics
    const allProducts = await fetchProducts();
    
    // This part of the code ensures only Callahan-Smith products are processed
    const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
    console.log(`🔍 Data filtered for Callahan-Smith: ${allProducts.length} total → ${products.length} Callahan-Smith products`);
    
    if (products.length === 0) {
      // No data available - return clean empty state
      return res.status(200).json({
        success: true,
        data: {
          kpis: {
            totalActiveSKUs: 0,
            totalInventoryValue: 0,
            lowStockAlerts: 0,
            inactiveSKUs: 0,
            totalSKUs: 0,
            inStockCount: 0,
            unfulfillableCount: 0,
            overstockedCount: 0,
            avgDaysOnHand: null
          },
          insights: [],
          inventory: [],
          brandPerformance: [],
          supplierAnalysis: [],
          lastUpdated: new Date().toISOString(),
        },
        message: "No inventory data available",
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate enhanced analytics
    const kpis = calculateEnhancedKPIs(products);
    const brandPerformance = calculateBrandPerformance(products);
    const supplierAnalysis = calculateSupplierAnalysis(products);
    const inventory = transformToEnhancedInventoryItems(products);

    // Generate AI-powered insights using VP of Inventory Management expertise
    const insights = await generateInventoryInsights(products, kpis, supplierAnalysis);

    const inventoryData = {
      kpis,
      insights,
      inventory: inventory.slice(0, 500), // Limit for performance
      brandPerformance,
      supplierAnalysis,
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ World-class inventory dashboard generated:", {
      totalSKUs: kpis.totalSKUs,
      totalValue: kpis.totalInventoryValue,
      brands: brandPerformance.length,
      suppliers: supplierAnalysis.length,
      insights: insights.length
    });
    
    res.status(200).json({
      success: true,
      data: inventoryData,
      message: "Inventory data retrieved successfully",
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("❌ Simple inventory API error:", error);
    res.status(500).json({
      error: "Failed to fetch inventory data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}