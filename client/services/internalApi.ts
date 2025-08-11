/**
 * Secure Internal API Service
 *
 * All API calls go to internal server endpoints
 * NO external URLs or API keys exposed to client
 * Server handles all external API communication securely
 */

import type {
  DashboardData,
  ProductData,
  ShipmentData,
  AIInsight,
  AnalyticsData,
  OrdersData,
  OrderSuggestion,
  InventoryData,
  CostData,
  EconomicData,
} from "@/types/api";

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

class InternalApiService {
  private readonly baseUrl = ""; // Relative URLs to same domain

  /**
   * Fetch complete dashboard data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      console.log("🔒 Client: Fetching dashboard data from secure server...");

      const response = await fetch(`${this.baseUrl}/api/dashboard-data`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<DashboardData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch dashboard data");
      }

      console.log("✅ Client: Dashboard data received securely from server");
      return result.data;
    } catch (error) {
      console.error("❌ Client: Internal API call failed:", error);
      throw new Error(
        `Unable to load dashboard data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch products data only from secure server endpoint
   */
  async getProductsData(): Promise<ProductData[]> {
    try {
      console.log("🔒 Client: Fetching products data from secure server...");

      const response = await fetch(`${this.baseUrl}/api/products`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<ProductData[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch products data");
      }

      console.log(
        "✅ Client: Products data received securely:",
        result.data.length,
        "records",
      );
      return result.data;
    } catch (error) {
      console.error("❌ Client: Products API call failed:", error);
      throw new Error(
        `Unable to load products data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch shipments data only from secure server endpoint
   */
  async getShipmentsData(): Promise<ShipmentData[]> {
    try {
      console.log("🔒 Client: Fetching shipments data from secure server...");

      const response = await fetch(`${this.baseUrl}/api/shipments`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<ShipmentData[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch shipments data");
      }

      console.log(
        "✅ Client: Shipments data received securely:",
        result.data.length,
        "records",
      );
      return result.data;
    } catch (error) {
      console.error("❌ Client: Shipments API call failed:", error);
      throw new Error(
        `Unable to load shipments data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate AI insights from secure server endpoint
   */
  async generateInsights(analysisData: any): Promise<AIInsight[]> {
    try {
      console.log("🔒 Client: Requesting AI insights from secure server...");

      const response = await fetch(`${this.baseUrl}/api/insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysisData }),
      });

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<AIInsight[]> = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to generate AI insights");
      }

      console.log(
        "✅ Client: AI insights received securely:",
        result.data?.length || 0,
        "insights",
      );
      return result.data || [];
    } catch (error) {
      console.error("❌ Client: AI insights API call failed:", error);
      throw new Error(
        `Unable to generate AI insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check server status and connection
   */
  async getServerStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`);

      if (!response.ok) {
        throw new Error(`Server status check failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("❌ Client: Server status check failed:", error);
      throw error;
    }
  }

  /**
   * Fetch complete analytics data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   */
  async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      console.log("🔒 Client: Fetching analytics data from secure server...");

      const response = await fetch(`${this.baseUrl}/api/analytics-data`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<AnalyticsData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch analytics data");
      }

      console.log("✅ Client: Analytics data received securely from server");
      return result.data;
    } catch (error) {
      console.error("❌ Client: Analytics API call failed:", error);
      throw new Error(
        `Unable to load analytics data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch complete orders data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   * Uses shipments data transformed into orders structure
   */
  async getOrdersData(): Promise<OrdersData> {
    try {
      console.log("🔒 Client: Fetching orders data from secure server...");

      const response = await fetch(`${this.baseUrl}/api/orders-data`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<OrdersData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch orders data");
      }

      console.log("✅ Client: Orders data received securely from server");
      return result.data;
    } catch (error) {
      console.error("❌ Client: Orders API call failed:", error);
      throw new Error(
        `Unable to load orders data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch complete inventory data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   */
  async getInventoryData(): Promise<InventoryData> {
    try {
      console.log("🔒 Client: Fetching inventory data from secure server...");

      const response = await fetch(`${this.baseUrl}/api/inventory-data`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<InventoryData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch inventory data");
      }

      console.log("✅ Client: Inventory data received securely from server");
      return result.data;
    } catch (error) {
      console.error("❌ Client: Inventory API call failed:", error);
      throw new Error(
        `Unable to load inventory data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate AI suggestion for a specific order
   * NO external API keys - server handles OpenAI calls
   */
  async generateOrderSuggestion(orderData: any): Promise<OrderSuggestion> {
    try {
      console.log("🔒 Client: Requesting AI order suggestion from secure server...");

      const response = await fetch(`${this.baseUrl}/api/order-suggestion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderData }),
      });

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<OrderSuggestion> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to generate order suggestion");
      }

      console.log("✅ Client: Order suggestion received securely from server");
      return result.data;
    } catch (error) {
      console.error("❌ Client: Order suggestion API call failed:", error);
      throw new Error(
        `Unable to generate order suggestion: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * This part of the code fetches cost management data with warehouse metrics
   */
  async getCostData(): Promise<CostData> {
    try {
      console.log("🔒 Client: Fetching cost data from secure server...");

      const response = await fetch(`${this.baseUrl}/api/cost-data`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<CostData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch cost data");
      }

      console.log("✅ Client: Cost data received securely from server");
      return result.data;
    } catch (error) {
      console.error("❌ Client: Cost API call failed:", error);
      throw new Error(
        `Unable to load cost data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }



  /**
   * This part of the code fetches available report templates
   */
  async getReportTemplates(): Promise<ReportTemplatesResponse> {
    try {
      console.log("🔒 Client: Fetching report templates from secure server...");

      const response = await fetch(`${this.baseUrl}/api/reports-data`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<ReportTemplatesResponse> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch report templates");
      }

      console.log("✅ Client: Report templates received securely from server");
      return result.data;
    } catch (error) {
      console.error("❌ Client: Report templates API call failed:", error);
      throw new Error(
        `Unable to load report templates: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * This part of the code generates a report with specified filters
   */
  async generateReport(filters: ReportFilters): Promise<ReportData> {
    try {
      console.log("🔒 Client: Generating report from secure server...");

      const queryParams = new URLSearchParams({
        template: filters.template,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.brands && filters.brands.length > 0 && { brands: filters.brands.join(',') }),
        ...(filters.warehouses && filters.warehouses.length > 0 && { warehouses: filters.warehouses.join(',') }),
      });

      const response = await fetch(`${this.baseUrl}/api/reports-data?${queryParams}`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<ReportData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to generate report");
      }

      console.log("✅ Client: Report generated securely from server");
      return result.data;
    } catch (error) {
      console.error("❌ Client: Report generation API call failed:", error);
      throw new Error(
        `Unable to generate report: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Health check - verify server is responding
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ping`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const internalApi = new InternalApiService();

/**
 * Error handling utility for API responses
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

/**
 * Connection status utility
 */
export async function checkConnectionStatus(): Promise<{
  isConnected: boolean;
  serverStatus?: any;
  error?: string;
}> {
  try {
    const serverStatus = await internalApi.getServerStatus();
    return {
      isConnected: true,
      serverStatus,
    };
  } catch (error) {
    return {
      isConnected: false,
      error: handleApiError(error),
    };
  }
}
