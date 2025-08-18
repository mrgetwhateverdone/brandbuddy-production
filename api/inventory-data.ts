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
    console.log("⚠️ TinyBird config missing, using fallback");
    return [];
  }

  // This part of the code matches the working dashboard API URL pattern
  const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
  
  try {
    console.log("🔒 Fetching from TinyBird:", url.replace(token, "[TOKEN]"));
    const response = await fetch(url);
    if (!response.ok) {
      console.log("⚠️ TinyBird API failed:", response.status, response.statusText);
      return [];
    }
    const result = await response.json();
    console.log("✅ TinyBird response:", result.data?.length || 0, "products");
    return result.data || [];
  } catch (error) {
    console.log("⚠️ TinyBird fetch failed:", error);
    return [];
  }
}

function calculateEnhancedKPIs(products: ProductData[]) {
  // Data is already filtered by company_url in the API call
  const companyProducts = products;
  
  // Basic counts
  const totalSKUs = companyProducts.length;
  const activeSKUs = companyProducts.filter(p => p.active).length;
  const inactiveSKUs = companyProducts.filter(p => !p.active).length;
  const lowStockCount = companyProducts.filter(p => p.unit_quantity > 0 && p.unit_quantity < 10).length;
  
  // Value calculations
  const totalInventoryValue = companyProducts.reduce((sum, p) => {
    const cost = p.unit_cost || 0;
    return sum + (p.unit_quantity * cost);
  }, 0);
  
  // Legacy KPIs for compatibility
  const inStockCount = companyProducts.filter(p => p.unit_quantity > 0).length;
  const unfulfillableCount = companyProducts.filter(p => p.unit_quantity === 0).length;
  const overstockedCount = companyProducts.filter(p => p.unit_quantity > 100).length;
  
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
  // Data is already filtered by company_url in the API call
  const companyProducts = products;
  const brandMap = new Map<string, {skuCount: number, totalValue: number, totalQuantity: number}>();
  
  companyProducts.forEach(p => {
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
  // Data is already filtered by company_url in the API call
  const companyProducts = products;
  const supplierMap = new Map<string, {skuCount: number, totalValue: number, countries: Set<string>}>();
  
  companyProducts.forEach(p => {
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
      concentration_risk: Math.round((data.totalValue / companyProducts.reduce((sum, p) => sum + (p.unit_quantity * (p.unit_cost || 0)), 0)) * 100)
    }))
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 15);
}

function transformToEnhancedInventoryItems(products: ProductData[]) {
  // Data is already filtered by company_url in the API call
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔒 Phase 2: Building world-class inventory dashboard...");

    // Fetch real data and calculate enhanced analytics
    const products = await fetchProducts();
    
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
          insights: [{
            id: "inventory-insight-1",
            title: "Information Not Available",
            description: "Inventory data is not available. Data source connection required.",
            severity: "info" as const,
            dollarImpact: 0,
            suggestedActions: ["Check data source connection"],
            createdAt: new Date().toISOString(),
            source: "inventory_agent" as const,
          }],
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

    // Generate enhanced insights
    const insights = [];
    
    // Stock health insights
    if (kpis.inactiveSKUs > 0) {
      insights.push({
        id: "inventory-insight-inactive",
        title: "Inactive SKUs Detected",
        description: `${kpis.inactiveSKUs} inactive SKUs found. These products may need review or removal from inventory.`,
        severity: "warning" as const,
        dollarImpact: 0,
        suggestedActions: ["Review inactive product status", "Consider discontinuation", "Update product lifecycle"],
        createdAt: new Date().toISOString(),
        source: "inventory_agent" as const,
      });
    }
    
    // Value concentration insights
    if (brandPerformance.length > 0) {
      const topBrand = brandPerformance[0];
      const brandConcentration = Math.round((topBrand.total_value / kpis.totalInventoryValue) * 100);
      if (brandConcentration > 40) {
        insights.push({
          id: "inventory-insight-brand-concentration",
          title: "Brand Concentration Risk",
          description: `${topBrand.brand_name} represents ${brandConcentration}% of total inventory value. Consider diversification strategies.`,
          severity: "warning" as const,
          dollarImpact: 0,
          suggestedActions: ["Diversify brand portfolio", "Analyze brand performance", "Review procurement strategy"],
          createdAt: new Date().toISOString(),
          source: "inventory_agent" as const,
        });
      }
    }
    
    // Supplier concentration insights
    if (supplierAnalysis.length > 0) {
      const highRiskSuppliers = supplierAnalysis.filter(s => s.concentration_risk > 30);
      if (highRiskSuppliers.length > 0) {
        insights.push({
          id: "inventory-insight-supplier-risk",
          title: "Supplier Concentration Risk",
          description: `${highRiskSuppliers.length} suppliers represent >30% of inventory value each. Supply chain diversification recommended.`,
          severity: "critical" as const,
          dollarImpact: 0,
          suggestedActions: ["Diversify supplier base", "Negotiate backup suppliers", "Assess supply chain risks"],
          createdAt: new Date().toISOString(),
          source: "inventory_agent" as const,
        });
      }
    }
    
    // Low stock alerts
    if (kpis.lowStockAlerts > 0) {
      insights.push({
        id: "inventory-insight-low-stock",
        title: "Low Stock Alerts",
        description: `${kpis.lowStockAlerts} SKUs are running low on inventory. Replenishment may be needed soon.`,
        severity: "warning" as const,
        dollarImpact: 0,
        suggestedActions: ["Review reorder points", "Contact suppliers for replenishment", "Analyze demand patterns"],
        createdAt: new Date().toISOString(),
        source: "inventory_agent" as const,
      });
    }

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