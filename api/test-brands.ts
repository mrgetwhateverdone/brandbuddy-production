import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code creates a test endpoint to verify available brands in TinyBird data
 * Used to confirm Callahan-Smith brand exists before deployment
 */

interface ProductData {
  product_id: string;
  company_url: string;
  brand_id: string | null;
  brand_name: string;
  brand_domain: string | null;
  created_date: string;
  product_name: string;
  product_sku: string | null;
  unit_cost: number | null;
  active: boolean;
}

interface ShipmentData {
  company_url: string;
  shipment_id: string;
  brand_id: string | null;
  brand_name: string;
  brand_domain: string | null;
  created_date: string;
  status: string;
  supplier: string | null;
  unit_cost: number | null;
}

/**
 * This part of the code fetches all products to analyze available brands
 */
async function fetchAllProducts(): Promise<ProductData[]> {
  const baseUrl = process.env.TINYBIRD_BASE_URL;
  const token = process.env.TINYBIRD_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("TINYBIRD_BASE_URL and TINYBIRD_TOKEN environment variables are required");
  }

  // This part of the code fetches from product_details_mv API without brand filter to see all available brands
  const url = `${baseUrl}?token=${token}&limit=500`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * This part of the code fetches all shipments to analyze available brands
 */
async function fetchAllShipments(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("WAREHOUSE_BASE_URL and WAREHOUSE_TOKEN environment variables are required");
  }

  // This part of the code fetches from inbound_shipments_details_mv API without brand filter to see all available brands
  const url = `${baseUrl}?token=${token}&limit=500`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * This part of the code tests for Callahan-Smith brand specifically
 */
async function testCallahanSmithBrand(): Promise<{products: ProductData[], shipments: ShipmentData[]}> {
  const baseUrl = process.env.TINYBIRD_BASE_URL;
  const token = process.env.TINYBIRD_TOKEN;
  const warehouseBaseUrl = process.env.WAREHOUSE_BASE_URL;
  const warehouseToken = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token || !warehouseBaseUrl || !warehouseToken) {
    throw new Error("Required environment variables are missing");
  }

  // This part of the code specifically tests Callahan-Smith filtering
  const [productsResponse, shipmentsResponse] = await Promise.all([
    fetch(`${baseUrl}?token=${token}&limit=100&brand_name=Callahan-Smith`),
    fetch(`${warehouseBaseUrl}?token=${warehouseToken}&limit=100&brand_name=Callahan-Smith`)
  ]);

  if (!productsResponse.ok || !shipmentsResponse.ok) {
    throw new Error("Failed to fetch Callahan-Smith specific data");
  }

  const productsResult = await productsResponse.json();
  const shipmentsResult = await shipmentsResponse.json();

  return {
    products: productsResult.data || [],
    shipments: shipmentsResult.data || []
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 Testing brand availability in TinyBird data...");

    // This part of the code runs all brand analysis tests
    const [allProducts, allShipments, callahanSmithData] = await Promise.all([
      fetchAllProducts(),
      fetchAllShipments(),
      testCallahanSmithBrand()
    ]);

    // This part of the code analyzes unique brands in the datasets
    const productBrands = new Set(allProducts.map(p => p.brand_name));
    const shipmentBrands = new Set(allShipments.map(s => s.brand_name));
    const allBrands = new Set([...productBrands, ...shipmentBrands]);

    // This part of the code checks if Callahan-Smith exists
    const callahanSmithExists = {
      inProducts: productBrands.has("Callahan-Smith"),
      inShipments: shipmentBrands.has("Callahan-Smith"),
      productsCount: callahanSmithData.products.length,
      shipmentsCount: callahanSmithData.shipments.length
    };

    // This part of the code calculates brand statistics
    const brandStats = Array.from(allBrands).map(brandName => {
      const productCount = allProducts.filter(p => p.brand_name === brandName).length;
      const shipmentCount = allShipments.filter(s => s.brand_name === brandName).length;
      const hasActiveProducts = allProducts.some(p => p.brand_name === brandName && p.active);
      const avgUnitCost = allProducts
        .filter(p => p.brand_name === brandName && p.unit_cost)
        .reduce((sum, p, _, arr) => sum + (p.unit_cost || 0) / arr.length, 0);

      return {
        brandName,
        productCount,
        shipmentCount,
        hasActiveProducts,
        avgUnitCost: Math.round(avgUnitCost || 0),
        totalRecords: productCount + shipmentCount
      };
    }).sort((a, b) => b.totalRecords - a.totalRecords);

    const testResults = {
      callahanSmithExists,
      availableBrands: brandStats,
      totalBrands: allBrands.size,
      totalProducts: allProducts.length,
      totalShipments: allShipments.length,
      topBrands: brandStats.slice(0, 10),
      callahanSmithSampleData: {
        sampleProducts: callahanSmithData.products.slice(0, 3),
        sampleShipments: callahanSmithData.shipments.slice(0, 3)
      },
      recommendation: callahanSmithExists.productsCount > 0 && callahanSmithExists.shipmentsCount > 0 
        ? "✅ Callahan-Smith brand found with data in both APIs - proceed with current filtering"
        : `❌ Callahan-Smith brand not found - recommend using: ${brandStats[0]?.brandName || 'No brands available'}`,
      timestamp: new Date().toISOString()
    };

    console.log("✅ Brand analysis completed");
    res.status(200).json({
      success: true,
      data: testResults,
      message: "Brand analysis completed successfully"
    });

  } catch (error) {
    console.error("❌ Brand test failed:", error);
    res.status(500).json({
      error: "Failed to test brand availability",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
