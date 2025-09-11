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

/**
 * This part of the code generates AI-powered KPI context for Inventory with accurate percentages and insights
 * Uses the same products data source as KPI calculations to ensure consistency
 */
async function generateInventoryKPIContext(
  kpis: any, 
  products: ProductData[]
): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 Inventory KPI Context Agent API Key Check:', !!apiKey, 'Length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('❌ No AI service key - using calculated fallbacks for Inventory KPI context');
    return generateInventoryKPIFallbackContext(kpis, products);
  }

  try {
    // This part of the code analyzes the SAME products data used for KPI calculations to ensure accuracy
    const totalProducts = products.length;
    const activeSKUs = products.filter(p => p.active).length;
    const inactiveSKUs = products.filter(p => !p.active).length;
    const lowStockItems = products.filter(p => p.active && p.unit_quantity > 0 && p.unit_quantity < 10);
    const outOfStockItems = products.filter(p => p.active && p.unit_quantity === 0);
    const overstockedItems = products.filter(p => p.active && p.unit_quantity > 100);
    
    // This part of the code calculates inventory value distribution and supplier analysis
    const totalValue = products.reduce((sum, p) => sum + ((p.unit_cost || 0) * (p.unit_quantity || 0)), 0);
    const avgValuePerSKU = totalValue / Math.max(activeSKUs, 1);
    const topValueSKUs = products.filter(p => p.active && ((p.unit_cost || 0) * (p.unit_quantity || 0)) > avgValuePerSKU * 2).length;
    
    // This part of the code extracts supplier and reorder data for contextual explanations  
    const suppliersMap = new Map();
    lowStockItems.forEach(p => {
      const supplier = p.supplier_name || 'Unknown';
      const reorderValue = (p.unit_cost || 0) * Math.max(30 - (p.unit_quantity || 0), 0);
      suppliersMap.set(supplier, (suppliersMap.get(supplier) || 0) + reorderValue);
    });
    const topReorderSuppliers = Array.from(suppliersMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([supplier, _]) => supplier);

    const prompt = `You are a Chief Inventory Officer analyzing inventory KPIs. Provide meaningful percentage context and business explanations:

INVENTORY OPERATIONAL DATA:
===========================
Total Products in Catalog: ${totalProducts}
Active SKUs: ${activeSKUs} 
Inactive SKUs: ${inactiveSKUs}
Low Stock Items (< 10 units): ${lowStockItems.length}
Out of Stock Items: ${outOfStockItems.length}
Overstocked Items (> 100 units): ${overstockedItems.length}

CURRENT KPI VALUES:
- Total Active SKUs: ${kpis.totalActiveSKUs}
- Total Inventory Value: $${kpis.totalInventoryValue?.toLocaleString() || 0}
- Low Stock Alerts: ${kpis.lowStockAlerts}
- Inactive SKUs: ${kpis.inactiveSKUs}

FINANCIAL ANALYSIS:
- Total Portfolio Value: $${totalValue.toLocaleString()}
- Average Value per SKU: $${avgValuePerSKU.toLocaleString()}
- High-Value SKUs (>2x avg): ${topValueSKUs}
- Top Reorder Suppliers: ${topReorderSuppliers.join(", ")}

Calculate accurate percentages using proper denominators and provide inventory management context for each KPI.

REQUIRED JSON OUTPUT:
{
  "totalActiveSKUs": {
    "percentage": "[activation_rate]%", 
    "context": "[catalog_health_assessment]",
    "description": "Products available for sale ([percentage] activation rate)"
  },
  "totalInventoryValue": {
    "percentage": "[concentration_analysis]%",
    "context": "[value_distribution_insights]", 
    "description": "Total portfolio investment ($[avg_per_sku] avg per SKU)"
  },
  "lowStockAlerts": {
    "percentage": "[accurate_percentage]%",
    "context": "[reorder_priority_analysis]",
    "description": "SKUs requiring replenishment ([percentage] of active SKUs)"
  },
  "inactiveSKUs": {
    "percentage": "[cleanup_percentage]%",
    "context": "[liquidation_opportunity_analysis]",
    "description": "Products requiring review ([percentage] catalog cleanup needed)"
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
        max_tokens: 1500, // Increased for detailed insights and recommendations
        temperature: 0.2, // Increased for more detailed and varied responses
      }),
      signal: AbortSignal.timeout(25000), // 25 second timeout to prevent Vercel function timeouts
    });

    if (response.ok) {
      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || '';
      console.log('🤖 Inventory KPI Context Agent Raw Response:', aiContent.substring(0, 300) + '...');
      
      try {
        const parsed = JSON.parse(aiContent);
        console.log('✅ Inventory KPI Context Agent: AI context parsed successfully');
        return parsed;
      } catch (parseError) {
        console.error('❌ Inventory KPI Context JSON Parse Error:', parseError);
        console.log('❌ Inventory KPI Context: JSON parse failed, using fallback');
        return generateInventoryKPIFallbackContext(kpis, products);
      }
    } else {
      console.error('❌ Inventory KPI Context OpenAI API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error("❌ Inventory KPI Context AI analysis failed:", error);
  }

  // This part of the code provides fallback when AI fails - ensures KPI context always available
  console.log('❌ Inventory KPI Context: AI service failed, using calculated fallback');
  return generateInventoryKPIFallbackContext(kpis, products);
}

/**
 * This part of the code provides calculated Inventory KPI context when AI is unavailable
 * Uses the same data relationships as the AI to ensure consistent percentages
 */
function generateInventoryKPIFallbackContext(kpis: any, products: ProductData[]) {
  const totalProducts = products.length;
  const activeSKUs = products.filter(p => p.active).length;
  const totalValue = products.reduce((sum, p) => sum + ((p.unit_cost || 0) * (p.unit_quantity || 0)), 0);
  const avgValuePerSKU = totalValue / Math.max(activeSKUs, 1);
  
  // This part of the code calculates reorder value for context
  const lowStockItems = products.filter(p => p.active && p.unit_quantity > 0 && p.unit_quantity < 10);
  const reorderValue = lowStockItems.reduce((sum, p) => {
    const suggestedOrder = Math.max(30 - (p.unit_quantity || 0), 0);
    return sum + (suggestedOrder * (p.unit_cost || 0));
  }, 0);
  
  return {
    totalActiveSKUs: {
      percentage: totalProducts > 0 ? `${((kpis.totalActiveSKUs / totalProducts) * 100).toFixed(1)}%` : null,
      context: `${kpis.totalActiveSKUs} active from ${totalProducts} total catalog`,
      description: totalProducts > 0 ?
        `Products available for sale (${((kpis.totalActiveSKUs / totalProducts) * 100).toFixed(1)}% activation rate)` :
        "Products available for sale"
    },
    totalInventoryValue: {
      percentage: avgValuePerSKU > 0 ? `$${Math.round(avgValuePerSKU).toLocaleString()}` : null,
      context: `$${Math.round(totalValue).toLocaleString()} total portfolio across ${activeSKUs} active SKUs`,
      description: avgValuePerSKU > 0 ?
        `Total portfolio investment ($${Math.round(avgValuePerSKU).toLocaleString()} avg per SKU)` :
        "Total portfolio investment"
    },
    lowStockAlerts: {
      percentage: activeSKUs > 0 ? `${((kpis.lowStockAlerts / activeSKUs) * 100).toFixed(1)}%` : null,
      context: `${kpis.lowStockAlerts} items need reorder - $${Math.round(reorderValue).toLocaleString()} reorder value`,
      description: activeSKUs > 0 ?
        `SKUs requiring replenishment (${((kpis.lowStockAlerts / activeSKUs) * 100).toFixed(1)}% of active SKUs)` :
        "SKUs requiring replenishment"
    },
    inactiveSKUs: {
      percentage: totalProducts > 0 ? `${((kpis.inactiveSKUs / totalProducts) * 100).toFixed(1)}%` : null,
      context: `${kpis.inactiveSKUs} inactive items from ${totalProducts} total catalog`,
      description: totalProducts > 0 ?
        `Products requiring review (${((kpis.inactiveSKUs / totalProducts) * 100).toFixed(1)}% catalog cleanup needed)` :
        "Products requiring review"
    }
  };
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
    // This part of the code extracts specific data for actionable AI recommendations (mirrors Dashboard/Orders pattern)
    const criticalLowStockItems = products
      .filter(p => p.active && p.unit_quantity > 0 && p.unit_quantity < 10)
      .sort((a, b) => (b.unit_cost || 0) * b.unit_quantity - (a.unit_cost || 0) * a.unit_quantity)
      .slice(0, 5)
      .map(p => ({
        sku: p.product_sku || p.product_id,
        name: p.product_name || 'Unknown Product',
        supplier: p.supplier_name || 'Unknown Supplier',
        currentStock: p.unit_quantity,
        unitCost: p.unit_cost || 0,
        reorderPoint: Math.max(10, Math.ceil(p.unit_quantity * 0.5)), // Calculated reorder point
        potentialLoss: Math.round((p.unit_cost || 0) * Math.min(p.unit_quantity * 4, 50)) // Lost sales potential
      }));

    const overstockedItems = products
      .filter(p => p.active && p.unit_quantity > 100)
      .sort((a, b) => (b.unit_cost || 0) * b.unit_quantity - (a.unit_cost || 0) * a.unit_quantity)
      .slice(0, 4)
      .map(p => ({
        sku: p.product_sku || p.product_id,
        name: p.product_name || 'Unknown Product',
        supplier: p.supplier_name || 'Unknown Supplier',
        currentStock: p.unit_quantity,
        excessStock: Math.max(0, p.unit_quantity - 20), // Using standard reorder threshold
        carryingCost: Math.round((p.unit_cost || 0) * Math.max(0, p.unit_quantity - 20) * 0.25) // 25% annual carrying cost
      }));

    const inactiveHighValueItems = products
      .filter(p => !p.active && p.unit_cost)
      .sort((a, b) => (b.unit_cost || 0) * b.unit_quantity - (a.unit_cost || 0) * a.unit_quantity)
      .slice(0, 3)
      .map(p => ({
        sku: p.product_sku || p.product_id,
        name: p.product_name || 'Unknown Product',
        supplier: p.supplier_name || 'Unknown Supplier',
        tiedUpValue: Math.round((p.unit_cost || 0) * p.unit_quantity),
        lastMovement: 'Q2 2025' // Placeholder for last movement
      }));

    const outOfStockHighPriorityItems = products
      .filter(p => p.active && p.unit_quantity === 0 && p.unit_cost)
      .sort((a, b) => (b.unit_cost || 0) - (a.unit_cost || 0))
      .slice(0, 3)
      .map(p => ({
        sku: p.product_sku || p.product_id,
        name: p.product_name || 'Unknown Product',
        supplier: p.supplier_name || 'Unknown Supplier',
        unitCost: p.unit_cost || 0,
        opportunityCost: Math.round((p.unit_cost || 0) * 30) // 30 days lost sales
      }));

    // This part of the code identifies supplier concentration risks from inventory data
    const supplierConcentrationRisks = Object.entries(
      products.reduce((acc, p) => {
        const supplier = p.supplier_name || 'Unknown';
        if (!acc[supplier]) acc[supplier] = { skus: 0, value: 0 };
        acc[supplier].skus++;
        acc[supplier].value += (p.unit_quantity * (p.unit_cost || 0));
        return acc;
      }, {} as Record<string, { skus: number; value: number }>)
    ).sort(([,a], [,b]) => b.skus - a.skus).slice(0, 3);

    console.log('🔍 Inventory AI Enhancement - Data Analysis Complete:', {
      criticalLowStock: {
        count: criticalLowStockItems.length,
        topSKUs: criticalLowStockItems.slice(0, 3).map(i => i.sku),
        totalPotentialLoss: criticalLowStockItems.reduce((sum, i) => sum + i.potentialLoss, 0)
      },
      overstocked: {
        count: overstockedItems.length, 
        excessUnits: overstockedItems.reduce((sum, i) => sum + i.excessStock, 0),
        totalCarryingCost: overstockedItems.reduce((sum, i) => sum + i.carryingCost, 0)
      },
      inactiveHighValue: {
        count: inactiveHighValueItems.length,
        tiedUpCapital: inactiveHighValueItems.reduce((sum, i) => sum + i.tiedUpValue, 0)
      },
      outOfStockPriority: {
        count: outOfStockHighPriorityItems.length,
        monthlyOpportunityCost: outOfStockHighPriorityItems.reduce((sum, i) => sum + i.opportunityCost, 0)
      },
      supplierConcentration: {
        count: supplierConcentrationRisks.length,
        topSuppliers: supplierConcentrationRisks.map(([name]) => name)
      }
    });
    
    const totalInventoryValue = kpis.totalInventoryValue;
    const avgInventoryValue = products.length > 0 ? totalInventoryValue / products.length : 0;

    // This part of the code creates safe example variables to prevent complex nested template literal parsing errors
    const exampleLowStockAction = `Contact ${criticalLowStockItems[0]?.supplier || 'West Barber'} immediately to expedite ${criticalLowStockItems[0]?.sku || 'ABC-123'} replenishment - current ${criticalLowStockItems[0]?.currentStock || 3} units vs ${criticalLowStockItems[0]?.reorderPoint || 10} reorder point, risking $${criticalLowStockItems[0]?.potentialLoss?.toLocaleString() || '2,500'} in lost sales`;
    const exampleOverstockAction = `Liquidate excess ${overstockedItems[0]?.sku || 'DEF-456'} inventory (${overstockedItems[0]?.excessStock || 127} excess units) from ${overstockedItems[0]?.supplier || 'Garcia Ltd'} to free up $${overstockedItems[0]?.carryingCost?.toLocaleString() || '15,200'} in carrying costs annually`;
    const exampleInactiveAction = `Reactivate or liquidate SKU ${inactiveHighValueItems[0]?.sku || 'GHI-789'} with ${inactiveHighValueItems[0]?.supplier || 'Clark'} - $${inactiveHighValueItems[0]?.tiedUpValue?.toLocaleString() || '12,000'} tied up since ${inactiveHighValueItems[0]?.lastMovement || 'Q2'}`;

    const prompt = `You are a Chief Inventory Officer with 20+ years of experience in inventory management, supply chain optimization, and working capital reduction. You have successfully implemented inventory strategies that freed up $50M+ in working capital while maintaining 99.5+ fill rates across Fortune 500 companies.

🎯 CRITICAL INSTRUCTION: You MUST use the specific data provided below to create detailed, actionable recommendations. Do NOT provide generic advice. Every recommendation must reference actual SKU numbers, supplier names, quantities, or dollar amounts from the data.

SPECIFIC DATA FOR ACTIONABLE RECOMMENDATIONS:
===========================================

CRITICAL LOW STOCK ITEMS (use these exact SKU numbers and suppliers):
${criticalLowStockItems.map(i => `- SKU: ${i.sku} - ${i.currentStock} units (below ${i.reorderPoint} reorder point) - Supplier: ${i.supplier} - Potential Loss: $${i.potentialLoss.toLocaleString()}`).join('\n')}

OVERSTOCKED ITEMS (use these exact SKU numbers and carrying costs):
${overstockedItems.map(i => `- SKU: ${i.sku} - ${i.excessStock} excess units - Supplier: ${i.supplier} - Carrying Cost: $${i.carryingCost.toLocaleString()} annually`).join('\n')}

INACTIVE HIGH-VALUE ITEMS (use these exact SKU numbers and tied-up capital):
${inactiveHighValueItems.map(i => `- SKU: ${i.sku} (${i.name}) - $${i.tiedUpValue.toLocaleString()} tied up - Supplier: ${i.supplier} - Last Movement: ${i.lastMovement}`).join('\n')}

OUT OF STOCK PRIORITY ITEMS (use these exact SKU numbers and opportunity costs):
${outOfStockHighPriorityItems.map(i => `- SKU: ${i.sku} - $${i.unitCost.toLocaleString()} unit value - Supplier: ${i.supplier} - Opportunity Cost: $${i.opportunityCost.toLocaleString()}/month`).join('\n')}

SUPPLIER CONCENTRATION RISKS (use these exact supplier names and values):
${supplierConcentrationRisks.map(([supplier, data]) => `- ${supplier}: ${data.skus} SKUs, $${Math.round(data.value).toLocaleString()} total inventory value`).join('\n')}

INVENTORY PERFORMANCE CONTEXT:
- ${products.length} total products across ${kpis.totalActiveSKUs} active SKUs
- $${kpis.totalInventoryValue?.toLocaleString() || 0} total inventory investment
- ${criticalLowStockItems.length} items below reorder point risking stockouts
- ${overstockedItems.length} items with excess stock tying up capital
- ${inactiveHighValueItems.length} inactive items requiring liquidation decisions
- ${outOfStockHighPriorityItems.length} high-priority stockouts impacting revenue

📋 STEP-BY-STEP INSTRUCTIONS:
1. Analyze the specific inventory data provided above
2. Identify 3-5 critical inventory management issues
3. For EACH insight, create 3-5 specific recommendations that reference the actual data
4. Include exact SKU numbers, supplier names, quantities, and dollar amounts
5. Focus on actionable next steps with specific contacts and financial impacts

🎯 MANDATORY OUTPUT FORMAT:
[
  {
    "type": "warning",
    "title": "[Issue Title Based on Specific Inventory Data]",
    "description": "Analysis referencing specific SKUs, suppliers, quantities, and dollar amounts from the data above. Include financial impact and root cause.",
    "severity": "critical|warning|info",
    "dollarImpact": [actual_number_from_data],
    "suggestedActions": [
      "[Action 1: Reference specific SKU number, supplier from data]",
      "[Action 2: Include actual dollar amounts and quantities]", 
      "[Action 3: Name specific suppliers or warehouses to contact]",
      "[Action 4: Use real data points, not generic terms]",
      "[Action 5: Provide concrete next steps with timelines]"
    ]
  }
]

✅ EXAMPLES OF SPECIFIC RECOMMENDATIONS (reference these patterns):
"${exampleLowStockAction}"
"${exampleOverstockAction}"
"${exampleInactiveAction}"

❌ AVOID GENERIC RECOMMENDATIONS LIKE:
- "Implement automated reorder triggers" (no specific SKUs)
- "Create supplier scorecards" (no specific suppliers)  
- "Set up inventory optimization software" (no specific data points)

🚨 CRITICAL SUCCESS CRITERIA:
- Each suggestedAction MUST include specific data from above sections
- Use actual SKU numbers, supplier names, quantities, dollar amounts
- Provide concrete next steps with specific parties to contact
- Include implementation timelines and expected ROI
- Reference exact data points, not general concepts

Generate exactly 3-5 insights with 3-5 specific actions each.`;

    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    console.log('🤖 Inventory Agent: Calling AI service for executive-level inventory insights...', {
      model: process.env.AI_MODEL_FAST || "gpt-3.5-turbo",
      maxTokens: 1500,
      temperature: 0.2,
      dataPoints: {
        criticalLowStock: criticalLowStockItems.length,
        overstocked: overstockedItems.length,
        inactiveHighValue: inactiveHighValueItems.length,
        outOfStockPriority: outOfStockHighPriorityItems.length,
        supplierRisks: supplierConcentrationRisks.length
      }
    });
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_FAST || "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500, // Increased for detailed insights and recommendations
        temperature: 0.2, // Increased for more detailed and varied responses
      }),
      signal: AbortSignal.timeout(25000), // 25 second timeout to prevent Vercel function timeouts
    });

    if (response.ok) {
    const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log('🤖 Inventory Agent Raw AI Response:', content.substring(0, 500) + '...');
        try {
          const parsed = JSON.parse(content);
          console.log('✅ Inventory Agent Parsed Insights:', parsed.length, 'insights with actions:', parsed.map(p => p.suggestedActions?.length || 0));
          
          // This part of the code validates and enhances insights before returning
          const validatedInsights = parsed.filter(insight => 
            insight.title && 
            insight.description && 
            insight.suggestedActions && 
            Array.isArray(insight.suggestedActions) &&
            insight.suggestedActions.length > 0
          );
          
          console.log('✅ Inventory Agent Validated Insights:', validatedInsights.length, 'valid insights ready for display');
          return validatedInsights;
    } catch (parseError) {
          console.error('❌ Inventory Agent JSON Parse Error:', parseError);
          console.error('❌ Raw content that failed:', content?.substring(0, 500));
          console.log('❌ Inventory: JSON parse failed, returning empty insights (NO FALLBACK)');
          return [];
        }
      }
    } else {
      console.error('❌ Inventory OpenAI API Error:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Inventory Agent OpenAI analysis failed:', error);
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('❌ Inventory Agent: Request timed out after 25 seconds - AI service overloaded');
    }
  }

  // Return empty insights when AI fails - NO FALLBACK like dashboard pattern
  console.log('❌ Inventory Agent: AI service failed, returning empty insights (NO FALLBACK)');
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

  // ⚡ FAST MODE: Empty KPI context - AI enhancement loads separately  
  const kpiContext = {};

  const inventoryData = {
    kpis,
    kpiContext, // ⚡ Empty in fast mode - AI context loads separately
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
  console.log("🤖 Inventory AI Enhancement Mode: Loading AI insights + KPI context...");
  
  const allProducts = await fetchProducts();
  const products = allProducts.filter(p => p.brand_name === 'Callahan-Smith');
  console.log(`🔍 AI Enhancement Mode - Data filtered for Callahan-Smith: ${allProducts.length} total → ${products.length} Callahan-Smith products`);
  
  const kpis = calculateEnhancedKPIs(products);
  const supplierAnalysis = calculateSupplierAnalysis(products);
  
  // This part of the code generates AI enhancements (insights + KPI context) in parallel
  const [insights, kpiContext] = await Promise.all([
    generateInventoryInsights(products, kpis, supplierAnalysis),
    generateInventoryKPIContext(kpis, products)
  ]);

  console.log("✅ Inventory AI Enhancement Mode: KPI context + insights compiled successfully");
  res.status(200).json({
    success: true,
    data: {
      kpiContext, // 🤖 AI-powered KPI context for enhanced cards
      insights: insights.map((insight, index) => ({
        id: `inventory-insight-${index + 1}`,
        title: insight.title,
        description: insight.description,
        severity: (insight.severity === 'high' || insight.severity === 'critical') ? 'critical' as const :
                 (insight.severity === 'medium' || insight.severity === 'warning') ? 'warning' as const :
                 'info' as const,
        dollarImpact: insight.dollarImpact || 0,
        suggestedActions: insight.suggestedActions || [],
        createdAt: new Date().toISOString(),
        source: 'inventory_agent' as const
      })),
      lastUpdated: new Date().toISOString(),
    },
    message: "Inventory AI enhancements retrieved successfully",
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

    // This part of the code generates AI-powered KPI context for the default handler as well
    const kpiContext = await generateInventoryKPIContext(kpis, products);

    // Generate AI-powered insights using VP of Inventory Management expertise
    const insights = await generateInventoryInsights(products, kpis, supplierAnalysis);

    const inventoryData = {
      kpis,
      kpiContext, // 🆕 ADD AI-powered KPI context with accurate percentages and business insights
      insights: insights.map((insight, index) => ({
        id: `inventory-insight-${index + 1}`,
        title: insight.title,
        description: insight.description,
        severity: (insight.severity === 'high' || insight.severity === 'critical') ? 'critical' as const :
                 (insight.severity === 'medium' || insight.severity === 'warning') ? 'warning' as const :
                 'info' as const,
        dollarImpact: insight.dollarImpact || 0,
        suggestedActions: insight.suggestedActions || [],
        createdAt: new Date().toISOString(),
        source: 'inventory_agent' as const
      })),
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