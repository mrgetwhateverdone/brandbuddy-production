/**
 * This part of the code provides MSW handlers for API mocking
 * Enables testing without real API dependencies
 */

import { http, HttpResponse } from 'msw';
import { createMockDashboardData } from '@/test-utils';

const baseUrl = 'http://localhost:8080/api';

// This part of the code provides mock dashboard data
const mockDashboardData = createMockDashboardData();

// This part of the code provides mock orders data
const mockOrdersData = {
  orders: [
    {
      order_id: 'PO-12345',
      created_date: '2024-01-15',
      brand_name: 'Callahan-Smith',
      status: 'processing',
      sla_status: 'on_time',
      expected_quantity: 100,
      received_quantity: 0,
      supplier: 'Supplier A',
      expected_date: '2024-01-20'
    }
  ],
  kpis: {
    totalOrdersToday: 25,
    atRiskOrders: 3,
    openPOs: 12,
    unfulfillableSKUs: 1
  },
  insights: [],
  inboundIntelligence: {
    totalInbound: 15,
    expectedToday: 5,
    averageLeadTime: 7.2,
    delayedShipments: 2
  }
};

// This part of the code provides mock inventory data
const mockInventoryData = {
  inventory: [
    {
      sku: 'SKU-001',
      product_name: 'Test Product',
      brand_name: 'Callahan-Smith',
      on_hand: 150,
      committed: 50,
      available: 100,
      unit_cost: 25.50,
      total_value: 3825,
      supplier: 'Test Supplier',
      country_of_origin: 'USA',
      status: 'In Stock' as const,
      active: true,
      days_since_created: 30
    }
  ],
  kpis: {
    totalActiveSKUs: 1247,
    totalInventoryValue: 2500000,
    lowStockAlerts: 23,
    inactiveSKUs: 15,
    totalSKUs: 1262,
    avgDaysInventory: 45.2,
    fastMovingSKUs: 234,
    slowMovingSKUs: 89
  },
  insights: [],
  brandPerformance: [],
  supplierAnalysis: []
};

// This part of the code provides mock inbound data
const mockInboundData = {
  kpis: {
    todayArrivals: 8,
    thisWeekExpected: 42,
    averageLeadTime: 7.5,
    delayedShipments: 3,
    receivingAccuracy: 98.5,
    onTimeDeliveryRate: 94.2
  },
  todayArrivals: [],
  receivingPerformance: {
    accuracyRate: 98.5,
    perfectReceipts: 87,
    avgProcessingTime: 2.3,
    qualityIssues: 2
  },
  supplierDelivery: [],
  insights: []
};

// This part of the code defines MSW request handlers
export const handlers = [
  // Dashboard endpoints
  http.get(`${baseUrl}/dashboard-data`, () => {
    return HttpResponse.json({
      success: true,
      data: mockDashboardData,
      message: 'Dashboard data retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // Orders endpoints
  http.get(`${baseUrl}/orders-data`, () => {
    return HttpResponse.json({
      success: true,
      data: mockOrdersData,
      message: 'Orders data retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // Inventory endpoints
  http.get(`${baseUrl}/inventory-data`, () => {
    return HttpResponse.json({
      success: true,
      data: mockInventoryData,
      message: 'Inventory data retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // Inbound endpoints
  http.get(`${baseUrl}/inbound-data`, () => {
    return HttpResponse.json({
      success: true,
      data: mockInboundData,
      message: 'Inbound data retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  }),

  // Error simulation handlers
  http.get(`${baseUrl}/dashboard-data-error`, () => {
    return HttpResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: 'Database connection failed'
      },
      { status: 500 }
    );
  }),

  // Network error simulation
  http.get(`${baseUrl}/network-error`, () => {
    return HttpResponse.error();
  }),

  // Slow response simulation
  http.get(`${baseUrl}/slow-response`, async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return HttpResponse.json({
      success: true,
      data: mockDashboardData,
      message: 'Slow response completed',
      timestamp: new Date().toISOString(),
    });
  }),
];

// This part of the code provides error handlers for testing error scenarios
export const errorHandlers = [
  http.get(`${baseUrl}/dashboard-data`, () => {
    return HttpResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard data',
        error: 'Server error'
      },
      { status: 500 }
    );
  }),
];

export { mockDashboardData, mockOrdersData, mockInventoryData, mockInboundData };
