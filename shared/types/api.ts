/**
 * Shared API Type Definitions
 * This part of the code centralizes all data interfaces used across server routes and Vercel functions
 * Eliminates type duplication and ensures consistency between different deployment architectures
 */

// This part of the code defines the TinyBird API response wrapper
export interface TinyBirdResponse<T> {
  meta: {
    name: string;
    type: string;
  };
  data: T[];
}

// This part of the code defines the product data structure from TinyBird API
export interface ProductData {
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

// This part of the code defines the shipment data structure from TinyBird API
export interface ShipmentData {
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
  expected_quantity: number;
  received_quantity: number;
  product_name?: string;
  product_sku: string | null;
  supplier_name?: string;
  tracking_number: string[];
  notes: string;
  // Additional properties for compatibility with existing functions
  sku?: string | null;
  unit_cost?: number | null;
  external_id?: string | null;
  receipt_id?: string;
  arrival_date?: string;
  receipt_inventory_item_id?: string;
  receipt_quantity?: number;
}

// This part of the code defines API fetch configuration options
export interface FetchConfig {
  limit?: number;
  brandFilter?: string;
  endpoint: string;
}

// This part of the code defines environment variable validation structure
export interface ApiEnvironmentConfig {
  TINYBIRD_BASE_URL: string;
  TINYBIRD_TOKEN: string;
  WAREHOUSE_BASE_URL: string;
  WAREHOUSE_TOKEN: string;
  OPENAI_API_KEY?: string;
}

// This part of the code provides environment validation utilities
export function validateApiEnvironment(): ApiEnvironmentConfig {
  const requiredVars = {
    TINYBIRD_BASE_URL: process.env.TINYBIRD_BASE_URL,
    TINYBIRD_TOKEN: process.env.TINYBIRD_TOKEN,
    WAREHOUSE_BASE_URL: process.env.WAREHOUSE_BASE_URL,
    WAREHOUSE_TOKEN: process.env.WAREHOUSE_TOKEN,
  };

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    ...requiredVars as Required<typeof requiredVars>,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
}
