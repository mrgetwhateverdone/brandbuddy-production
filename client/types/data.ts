/**
 * Proper Type Definitions for Data Structures
 * This part of the code eliminates any types with proper interfaces
 * Provides type safety across the entire application
 */

// Base interfaces for filterable data
export interface BrandFilterableData {
  brand_name?: string;
  created_date?: string;
}

export interface ProductData extends BrandFilterableData {
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

export interface ShipmentData extends BrandFilterableData {
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
}

// This part of the code defines proper interfaces for metrics that were using any[]
export interface ReceivingMetrics {
  date: string;
  efficiency: number;
  totalReceived: number;
  averageTime: number;
  issuesCount: number;
  warehouseId?: string;
}

export interface SupplierPerformance {
  supplier: string;
  deliveryScore: number;
  qualityScore: number;
  reliabilityScore: number;
  totalShipments: number;
  onTimeDeliveries: number;
  averageLeadTime?: number;
  totalValue?: number;
}

// This part of the code defines insight data structure
export interface InsightData {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  source: string;
  dollarImpact?: number;
  suggestedActions?: string[];
  createdAt: string;
  category?: 'performance' | 'financial' | 'operational';
}

// This part of the code defines KPI structures
export interface InboundKPIs {
  todayArrivals: number;
  thisWeekExpected: number;
  averageLeadTime: number;
  receivingEfficiency: number;
}

export interface ReplenishmentKPIs {
  criticalSKUs: number;
  replenishmentValue: number;
  supplierAlerts: number;
  stockoutRisk: number;
}

// This part of the code defines structured data interfaces that replace any usage
export interface InboundData {
  kpis: InboundKPIs;
  insights: InsightData[];
  receivingMetrics: ReceivingMetrics[];  // Was: any[]
  supplierPerformance: SupplierPerformance[];  // Was: any[]
  lastUpdated: string;
}

export interface ReplenishmentData {
  kpis: ReplenishmentKPIs;
  insights: InsightData[];
  lastUpdated: string;
}

// This part of the code defines filter interfaces for type-safe filtering
export interface FilterOptions {
  brands?: string[];
  warehouses?: string[];
  startDate?: string;
  endDate?: string;
}

export interface FilteredData {
  filteredProducts: ProductData[];
  filteredShipments: ShipmentData[];
}

// This part of the code defines warehouse performance data
export interface WarehousePerformance {
  warehouseId: string;
  name: string;
  efficiency: number;
  totalVolume: number;
  costPerUnit: number;
  performanceScore: number;
}

// This part of the code defines brand performance metrics
export interface BrandPerformance {
  brand_name: string;
  total_skus: number;
  total_value: number;
  avg_value_per_sku: number;
  performance_score: number;
  growth_rate?: number;
}

// This part of the code defines inventory item structure
export interface InventoryItem {
  id: string;
  brand_name: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_cost: number | null;
  total_value: number;
  supplier: string;
  warehouse_id: string | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_updated?: string | null;
}
