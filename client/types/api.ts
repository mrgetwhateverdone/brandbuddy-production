// TinyBird Product Details API Response - product_details_mv schema
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

// TinyBird Shipments API Response - inbound_shipments_details_mv schema
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

// TinyBird API Response Wrapper
export interface TinyBirdResponse<T> {
  meta: Array<{
    name: string;
    type: string;
  }>;
  data: T[];
}

// Dashboard KPIs
export interface DashboardKPIs {
  totalOrdersToday: number | null;
  atRiskOrders: number | null;
  openPOs: number | null;
  unfulfillableSKUs: number;
}

// Quick Overview Metrics
export interface QuickOverviewMetrics {
  topIssues: number;
  whatsWorking: number;
  dollarImpact: number;
  completedWorkflows: number;
}

// Warehouse Inventory
export interface WarehouseInventory {
  warehouseId: string;
  totalInventory: number;
  productCount: number;
  averageCost: number;
}

// AI Insights
export interface AIInsight {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  dollarImpact: number;
  suggestedActions: string[];
  createdAt: string;
  source: "dashboard_agent" | "warehouse_agent" | "inventory_agent" | "cost_agent" | "analytics_agent" | "orders_agent" | "reports_agent" | "replenishment_agent";
}

// Anomaly Detection
export interface Anomaly {
  id: string;
  type:
    | "high_unfulfillable_skus"
    | "low_order_volume"
    | "sla_performance"
    | "inventory_imbalance";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  icon: string;
  createdAt: string;
}

// Smart Margin Risk Analysis
export interface MarginRiskAlert {
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

// Shipment Cost Variance Detection
export interface CostVarianceAnomaly {
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

// Dashboard Data (combined)
// AI-powered KPI Context
export interface KPIContextItem {
  percentage?: string | null;
  context: string;
  description: string;
}

export interface KPIContext {
  atRiskOrders: KPIContextItem;
  openPOs: KPIContextItem;
  totalOrdersToday: KPIContextItem;
  unfulfillableSKUs: KPIContextItem;
}

export interface DashboardData {
  products: ProductData[];
  shipments: ShipmentData[];
  kpis: DashboardKPIs;
  kpiContext?: KPIContext; // This part of the code adds AI-powered KPI context with meaningful percentages
  quickOverview: QuickOverviewMetrics;
  warehouseInventory: WarehouseInventory[];
  insights: AIInsight[];
  anomalies: Anomaly[];
  marginRisks: MarginRiskAlert[]; // This part of the code adds smart margin risk analysis data
  costVariances: CostVarianceAnomaly[]; // This part of the code adds cost variance detection data
  lastUpdated: string;
}

// Analytics KPIs
export interface AnalyticsKPIs {
  orderVolumeGrowth: number | null;  // percentage with +/- indicator
  returnRate: number | null;         // percentage 
  fulfillmentEfficiency: number | null; // percentage
  inventoryHealthScore: number | null;   // percentage
}

// Performance Metrics
export interface PerformanceMetrics {
  orderVolumeTrend: {
    growthRate: number;
    totalOrdersAnalyzed: number;
  };
  fulfillmentPerformance: {
    efficiencyRate: number;
    onTimeOrders: number;
  };
}

// Data Insights Dashboard
export interface DataInsightsDashboard {
  totalDataPoints: number;
  activeWarehouses: {
    count: number;
    avgSLA: number;
  };
  uniqueBrands: number;
  inventoryHealth: {
    percentage: number;
    skusInStock: number;
  };
}

// Operational Breakdown
export interface OperationalBreakdown {
  orderAnalysis: {
    totalOrders: number;
    onTimeOrders: number;
    delayedOrders: number;
    onTimeRate: number;
  };
  inventoryAnalysis: {
    totalSKUs: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    avgInventoryLevel: number;
  };
}

// Brand Performance
export interface BrandPerformance {
  totalBrands: number;
  topBrand: {
    name: string;
    skuCount: number;
  };
  brandRankings: Array<{
    rank: number;
    brandName: string;
    skuCount: number;
    inventoryPercentage: number;
    performanceLevel: string;
  }>;
}

// Analytics Data (combined)
export interface AnalyticsData {
  kpis: AnalyticsKPIs;
  insights: AIInsight[]; // Reuse existing type but from "analytics_agent"
  performanceMetrics: PerformanceMetrics;
  dataInsights: DataInsightsDashboard;
  operationalBreakdown: OperationalBreakdown;
  brandPerformance: BrandPerformance;
  lastUpdated: string;
}

// Orders Data (derived from Shipment data structure)
export interface OrderData {
  order_id: string; // maps to purchase_order_number or shipment_id
  created_date: string;
  brand_name: string;
  status: string;
  sla_status: string;
  expected_date: string | null;
  arrival_date: string;
  supplier: string | null;
  warehouse_id: string | null;
  product_sku: string | null;
  expected_quantity: number;
  received_quantity: number;
  unit_cost: number | null;
  ship_from_country: string | null;
  notes: string;
  // Original shipment fields for reference
  shipment_id: string;
  inventory_item_id: string;
}

// Orders KPIs
export interface OrdersKPIs {
  ordersToday: number;
  atRiskOrders: number;
  openPOs: number;
  unfulfillableSKUs: number;
}

// Inbound Shipment Intelligence
export interface InboundShipmentIntelligence {
  totalInbound: number;
  delayedShipments: {
    count: number;
    percentage: number;
  };
  avgDelayDays: number;
  valueAtRisk: number;
  geopoliticalRisks?: {
    riskCountries: string[];
    affectedShipments: number;
    avgDelayIncrease: number;
  };
  recentShipments: OrderData[];
  delayedShipmentsList: OrderData[];
}

// Orders Data (combined)
// Orders AI-powered KPI Context
export interface OrdersKPIContext {
  ordersToday: KPIContextItem;
  atRiskOrders: KPIContextItem;
  openPOs: KPIContextItem;
  unfulfillableSKUs: KPIContextItem;
}

export interface OrdersData {
  orders: OrderData[];
  kpis: OrdersKPIs;
  kpiContext?: OrdersKPIContext; // This part of the code adds AI-powered KPI context for Orders with meaningful percentages
  insights: AIInsight[]; // Reuse existing type but from "orders_agent"
  inboundIntelligence: InboundShipmentIntelligence;
  lastUpdated: string;
}

// AI Order Suggestion
export interface OrderSuggestion {
  orderId: string;
  suggestion: string;
  priority: "low" | "medium" | "high";
  actionable: boolean;
  estimatedImpact?: string;
}

export interface InventoryItemSuggestion {
  sku: string;
  suggestion: string;
  priority: "low" | "medium" | "high";
  actionable: boolean;
  estimatedImpact?: string;
}

export interface ReplenishmentItemSuggestion {
  sku: string;
  suggestion: string;
  priority: "low" | "medium" | "high";
  actionable: boolean;
  estimatedImpact?: string;
}

// Warehouse Performance Data
export interface WarehouseData {
  warehouseId: string;
  warehouseName: string;
  supplierName: string; // Original supplier identifier for data traceability
  slaPerformance: number; // percentage
  activeOrders: number;
  avgFulfillmentTime: number; // hours
  totalSKUs: number;
  throughput: number; // monthly throughput volume
  status: "Excellent" | "Good" | "Needs Attention";
  performanceScore: number; // 0-100 score for ranking
  location?: {
    city: string | null;
    state: string | null;
    country: string | null;
  };
}

// Warehouse KPIs
export interface WarehouseKPIs {
  avgSLAPercentage: number | null;
  totalActiveOrders: number | null;
  avgFulfillmentTime: number | null; // hours
  totalInboundThroughput: number | null;
}

// Warehouse Performance Rankings
export interface WarehousePerformanceRanking {
  rank: number;
  warehouseId: string;
  warehouseName: string;
  slaPerformance: number;
  activeOrders: number;
  avgFulfillmentTime: number;
  status: "Excellent" | "Good" | "Needs Attention";
}

// Smart Budget Allocation
export interface BudgetAllocation {
  warehouseId: string;
  warehouseName: string;
  currentBudget: number;
  recommendedBudget: number;
  changeAmount: number;
  changePercentage: number;
  expectedROI: number;
  justification: string;
  riskLevel: "Low" | "Medium" | "High";
  performanceScore: number;
}

// User Behavior Analysis (simulated)
export interface UserBehaviorAnalysis {
  warehouseId: string;
  warehouseName: string;
  viewFrequency: number;
  timeSpent: number; // minutes
  engagementScore: number;
  commonActions: string[];
  nextBestAction: string;
  personalizedTips: string[];
}

// Performance Optimization Opportunity
export interface OptimizationOpportunity {
  area: string;
  priority: "High" | "Medium" | "Low";
  currentValue: number;
  targetValue: number;
  investment: number;
  potentialSavings: number;
  timeline: string; // e.g., "3-6 months"
}

// Warehouse Optimization Engine
export interface WarehouseOptimization {
  warehouseId: string;
  warehouseName: string;
  roiPercentage: number;
  riskLevel: "Low" | "Medium" | "High";
  performanceMetrics: {
    slaPerformance: number;
    throughput: number;
    efficiency: number;
    capacityUsage: number;
  };
  opportunities: OptimizationOpportunity[];
  totalInvestment: number;
  potentialSavings: number;
  timeline: string;
}

// Warehouses Data (combined)
export interface WarehousesData {
  warehouses: WarehouseData[];
  kpis: WarehouseKPIs;
  insights: AIInsight[]; // Reuse existing type but from "warehouse_agent"
  performanceRankings: WarehousePerformanceRanking[];
  budgetAllocations: BudgetAllocation[];
  userBehavior: UserBehaviorAnalysis[];
  optimizations: WarehouseOptimization[];
  lastUpdated: string;
}

// Enhanced Inventory Data Types (World-Class Dashboard)
export interface InventoryItem {
  sku: string;
  product_name: string;
  brand_name: string;
  on_hand: number;
  committed: number;
  available: number; // calculated: on_hand - committed
  unit_cost: number;
  total_value: number;
  supplier: string;
  country_of_origin: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstocked' | 'Inactive';
  active: boolean;
  days_since_created: number;
  warehouse_id?: string | null;
  last_updated?: string | null;
}

export interface InventoryKPIs {
  // Enhanced KPIs
  totalActiveSKUs: number;
  totalInventoryValue: number;
  lowStockAlerts: number;
  inactiveSKUs: number;
  
  // Legacy KPIs for compatibility
  totalSKUs: number;
  inStockCount: number;
  unfulfillableCount: number;
  overstockedCount: number;
  avgDaysOnHand: number | null;
}

export interface BrandPerformance {
  brand_name: string;
  sku_count: number;
  total_value: number;
  total_quantity: number;
  avg_value_per_sku: number;
  portfolio_percentage: number;
  efficiency_score: number;
}

export interface SupplierAnalysis {
  supplier_name: string;
  sku_count: number;
  total_value: number;
  countries: string[];
  concentration_risk: number; // percentage
}

// Inventory AI-powered KPI Context
export interface InventoryKPIContext {
  totalActiveSKUs: KPIContextItem;
  totalInventoryValue: KPIContextItem;
  lowStockAlerts: KPIContextItem;
  inactiveSKUs: KPIContextItem;
}

// Replenishment KPIs Interface
export interface ReplenishmentKPIs {
  criticalSKUs: number;
  replenishmentValue: number;
  supplierAlerts: number;
  reorderRecommendations: number;
}

// Replenishment AI-powered KPI Context
export interface ReplenishmentKPIContext {
  criticalSKUs: KPIContextItem;
  replenishmentValue: KPIContextItem;
  supplierAlerts: KPIContextItem;
  reorderRecommendations: KPIContextItem;
}

export interface InventoryData {
  kpis: InventoryKPIs;
  kpiContext?: InventoryKPIContext; // This part of the code adds AI-powered KPI context for Inventory with meaningful percentages
  insights: AIInsight[]; // Reuse existing type but from "inventory_agent"
  inventory: InventoryItem[];
  brandPerformance: BrandPerformance[];
  supplierAnalysis: SupplierAnalysis[];
  lastUpdated: string;
}

// Replenishment Data Interface
export interface ReplenishmentData {
  kpis: ReplenishmentKPIs;
  kpiContext?: ReplenishmentKPIContext; // This part of the code adds AI-powered KPI context for Replenishment with meaningful percentages
  insights: AIInsight[]; // Reuse existing type but from "replenishment_agent"
  products: ProductData[];
  shipments: ShipmentData[];
  criticalItems: any[];
  supplierPerformance: any[];
  reorderSuggestions: any[];
  lastUpdated: string;
}

// Cost Management Interfaces (Enhanced for Phase 2A)
export interface CostKPIs {
  // Enhanced Real Cost Metrics
  totalMonthlyCosts: number;
  costEfficiencyRate: number;
  topPerformingWarehouses: number;
  totalCostCenters: number;
  
  // Legacy metrics for compatibility
  totalWarehouses: number;
  avgSLAPerformance: number;
  monthlyThroughput: number;
  activeCostCenters: number;
}

export interface CostCenter {
  warehouse_id: string;
  warehouse_name: string;
  monthly_throughput: number;
  sla_performance: number;
  status: 'Active' | 'Inactive';
  total_shipments: number;
  on_time_shipments: number;
  
  // Enhanced cost metrics
  monthly_costs: number;
  cost_per_shipment: number;
  cost_efficiency: number;
  utilization_rate: number;
  cost_breakdown: {
    receiving: number;
    storage: number;
    processing: number;
    overhead: number;
  };
}

export interface SupplierPerformance {
  supplier_name: string;
  total_cost: number;
  avg_cost_per_unit: number;
  sla_performance: number;
  shipment_count: number;
  cost_variance: number; // percentage above/below average
  efficiency_score: number;
  status: 'Efficient' | 'Needs Attention' | 'High Cost';
}

export interface HistoricalCostTrend {
  month: string;
  total_cost: number;
  shipment_count: number;
  avg_cost_per_shipment: number;
  cost_change_percentage: number;
}

export interface CostData {
  kpis: CostKPIs;
  insights: AIInsight[]; // Reuse existing type but from "cost_agent"
  costCenters: CostCenter[];
  supplierPerformance: SupplierPerformance[];
  historicalTrends: HistoricalCostTrend[];
  lastUpdated: string;
}



// Reports Types
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  estimatedReadTime: string;
  metrics: string[];
  available: boolean;
  icon: string;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  brands?: string[];
  warehouses?: string[];
  template: string;
}

export interface ReportKPIs {
  totalProducts: number;
  totalShipments: number;
  activeProducts: number;
  totalInventoryValue: number;
  completedShipments: number;
  delayedShipments: number;
  slaCompliance: number | null;
  fulfillmentRate: number | null;
}

export interface ReportData {
  template: ReportTemplate;
  filters: ReportFilters;
  data: {
    products: any[];
    shipments: any[];
    kpis: ReportKPIs;
    insights: AIInsight[];
  };
  availableBrands: ReportBrandOption[];
  availableWarehouses: ReportWarehouseOption[];
  generatedAt: string;
  reportPeriod: string;
}

export interface ReportBrandOption {
  brand_name: string;
  sku_count: number;
  total_value: number;
  total_quantity: number;
  avg_value_per_sku: number;
  portfolio_percentage: number;
  efficiency_score: number;
}

export interface ReportWarehouseOption {
  warehouse_id: string;
  warehouse_name: string;
  total_shipments: number;
  completed_shipments: number;
  total_cost: number;
  total_quantity: number;
  efficiency_rate: number;
  avg_cost_per_shipment: number;
}

export interface ReportTemplatesResponse {
  templates: ReportTemplate[];
  availableBrands: ReportBrandOption[];
  availableWarehouses: ReportWarehouseOption[];
}

// AI Chat Types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversation?: ChatMessage[];
  includeContext?: boolean;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  timestamp: string;
  context?: {
    dataTimestamp: string;
    sourcesUsed: string[];
  };
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
}

// Economic Intelligence Types
export interface EconomicKPIs {
  supplierPerformance: number;
  shippingCostImpact: number;
  transportationCosts: number;
  supplyChainHealth: number;
  logisticsCostEfficiency: number;
  supplierDelayRate: number;
}

export interface EconomicInsight {
  id: string;
  title: string;
  description: string;
  dollarImpact: number;
  severity: "critical" | "warning" | "info";
  type: string;
}

export interface BusinessImpactAnalysis {
  executiveSummary: string;
  keyRisks: string[];
  opportunityAreas: string[];
}

export interface FinancialImpacts {
  quantityDiscrepancyImpact: number;
  cancelledShipmentsImpact: number;
  brandConcentrationRisk: number;
  totalFinancialRisk: number;
  top3BrandPercentage: number;
}

export interface EconomicKPIDetail {
  id: string;
  title: string;
  value: string | number;
  description: string;
  status: 'critical' | 'warning' | 'good';
  detailedAnalysis: string;
  keyMetrics: Array<{
    label: string;
    value: string | number;
    description: string;
  }>;
  recommendations: string[];
}

export interface EconomicIntelligenceData {
  kpis: EconomicKPIs;
  insights: EconomicInsight[];
  businessImpact: BusinessImpactAnalysis;
  financialImpacts: FinancialImpacts;
  kpiDetails?: {
    supplierPerformance: EconomicKPIDetail;
    shippingCostImpact: EconomicKPIDetail;
    supplyChainHealth: EconomicKPIDetail;
    transportationCosts: EconomicKPIDetail;
    logisticsCostEfficiency: EconomicKPIDetail;
    supplierDelayRate: EconomicKPIDetail;
  };
  lastUpdated: string;
}

// API Error Types
export interface APIError {
  message: string;
  status?: number;
  endpoint?: string;
}
