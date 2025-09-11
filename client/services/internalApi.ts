/**
 * Secure Internal API Service
 *
 * All API calls go to internal server endpoints
 * NO external URLs or API keys exposed to client
 * Server handles all external API communication securely
 */

import { logger } from "@/lib/logger";
import type {
  DashboardData,
  DashboardKPIContext,
  OrdersKPIContext,
  InventoryKPIContext,
  ReplenishmentKPIContext,
  InboundKPIContext,
  SLAKPIContext,
  ProductData,
  ShipmentData,
  AIInsight,
  OrdersData,
  OrderSuggestion,
  InventoryData,
  InventoryItemSuggestion,
  ReplenishmentItemSuggestion,
  ReportTemplatesResponse,
  ReportData,
  ReportFilters,
  ChatRequest,
  ChatResponse,
  QuickAction,
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
  private readonly apiLogger = logger.createLogger({ component: "InternalApiService" });

  /**
   * Fetch complete dashboard data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      this.apiLogger.info("Fetching dashboard data from secure server");

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

      this.apiLogger.info("Dashboard data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Dashboard API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load dashboard data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch FAST dashboard data without AI insights for immediate page load
   * NO external API keys - server handles TinyBird calls only
   */
  async getDashboardDataFast(): Promise<DashboardData> {
    try {
      this.apiLogger.info("Fetching FAST dashboard data (no AI insights)");

      const response = await fetch(`${this.baseUrl}/api/dashboard-data?mode=fast`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<DashboardData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch fast dashboard data");
      }

      this.apiLogger.info("Fast dashboard data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Fast dashboard API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load fast dashboard data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch dashboard AI insights separately for progressive loading
   * NO external API keys - server handles OpenAI calls
   */
  async getDashboardInsights(): Promise<{ kpiContext: DashboardKPIContext; insights: AIInsight[]; dailyBrief: string | null }> {
    try {
      this.apiLogger.info("Fetching dashboard AI insights");

      const response = await fetch(`${this.baseUrl}/api/dashboard-data?mode=insights`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<{ kpiContext: DashboardKPIContext; insights: AIInsight[]; dailyBrief: string | null }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch dashboard insights");
      }

      this.apiLogger.info("Dashboard insights received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Dashboard insights API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load dashboard insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch products data only from secure server endpoint
   */
  async getProductsData(): Promise<ProductData[]> {
    try {
      this.apiLogger.info("Fetching products data from secure server");

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

      this.apiLogger.info("Products data received securely", {
        productsCount: result.data.length
      });
      return result.data;
    } catch (error) {
      this.apiLogger.error("Products API call failed", { error: error instanceof Error ? error.message : error });
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
      this.apiLogger.info("Fetching shipments data from secure server");

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

      this.apiLogger.info("Shipments data received securely", {
        shipmentsCount: result.data.length
      });
      return result.data;
    } catch (error) {
      this.apiLogger.error("Shipments API call failed", { error: error instanceof Error ? error.message : error });
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
      this.apiLogger.info("Requesting AI insights from secure server");

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

      this.apiLogger.info("AI insights received securely", {
        insightsCount: result.data?.length || 0
      });
      return result.data || [];
    } catch (error) {
      this.apiLogger.error("AI insights API call failed", { error: error instanceof Error ? error.message : error });
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
      this.apiLogger.error("Server status check failed", { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }



  /**
   * Fetch complete orders data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   * Uses shipments data transformed into orders structure
   */
  async getOrdersData(): Promise<OrdersData> {
    try {
      this.apiLogger.info("Fetching orders data from secure server");

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

      this.apiLogger.info("Orders data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Orders API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load orders data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch FAST orders data without AI insights for immediate page load
   * NO external API keys - server handles TinyBird calls only
   */
  async getOrdersDataFast(): Promise<OrdersData> {
    try {
      this.apiLogger.info("Fetching FAST orders data (no AI insights)");

      const response = await fetch(`${this.baseUrl}/api/orders-data?mode=fast`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<OrdersData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch fast orders data");
      }

      this.apiLogger.info("Fast orders data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Fast orders API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load fast orders data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch orders AI insights separately for progressive loading
   * NO external API keys - server handles OpenAI calls
   */
  async getOrdersInsights(): Promise<{ kpiContext: OrdersKPIContext; insights: AIInsight[] }> {
    try {
      this.apiLogger.info("Fetching orders AI insights");

      const response = await fetch(`${this.baseUrl}/api/orders-data?mode=insights`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<{ kpiContext: OrdersKPIContext; insights: AIInsight[] }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch orders insights");
      }

      this.apiLogger.info("Orders insights received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Orders insights API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load orders insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch complete inventory data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   */
  async getInventoryData(): Promise<InventoryData> {
    try {
      this.apiLogger.info("Fetching inventory data from secure server");

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

      this.apiLogger.info("Inventory data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Inventory API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load inventory data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch FAST inventory data without AI insights for immediate page load
   * NO external API keys - server handles TinyBird calls only
   */
  async getInventoryDataFast(): Promise<InventoryData> {
    try {
      this.apiLogger.info("Fetching FAST inventory data (no AI insights)");

      const response = await fetch(`${this.baseUrl}/api/inventory-data?mode=fast`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<InventoryData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch fast inventory data");
      }

      this.apiLogger.info("Fast inventory data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Fast inventory API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load fast inventory data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch inventory AI insights separately for progressive loading
   * NO external API keys - server handles OpenAI calls
   */
  async getInventoryInsights(): Promise<{ kpiContext: InventoryKPIContext; insights: AIInsight[] }> {
    try {
      this.apiLogger.info("Fetching inventory AI insights");

      const response = await fetch(`${this.baseUrl}/api/inventory-data?mode=insights`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<{ kpiContext: InventoryKPIContext; insights: AIInsight[] }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch inventory insights");
      }

      this.apiLogger.info("Inventory insights received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Inventory insights API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load inventory insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }







  /**
   * This part of the code fetches available report templates
   */
  async getReportTemplates(): Promise<ReportTemplatesResponse> {
    try {
      this.apiLogger.info("Fetching report templates from secure server");

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

      this.apiLogger.info("Report templates received securely from server");
      this.apiLogger.debug("Templates data structure", { data: result.data });
      return result.data;
    } catch (error) {
      this.apiLogger.error("Report templates API call failed", { error: error instanceof Error ? error.message : error });
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
      this.apiLogger.info("Generating report from secure server");

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

      this.apiLogger.info("Report generated securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Report generation API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to generate report: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * This part of the code sends chat messages to AI assistant with operational context
   */
  async sendChatMessage(request: ChatRequest, aiSettings?: {
    model: string;
    maxTokens: number;
    contextLevel: string;
  }): Promise<ChatResponse> {
    try {
      this.apiLogger.info("Sending chat message to secure server");

      // This part of the code prepares headers with optional AI settings
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // This part of the code adds AI settings to headers if provided
      if (aiSettings) {
        headers["x-ai-model"] = aiSettings.model;
        headers["x-max-tokens"] = aiSettings.maxTokens.toString();
        headers["x-context-level"] = aiSettings.contextLevel;
        this.apiLogger.info("Sending AI settings", {
          model: aiSettings.model,
          maxTokens: aiSettings.maxTokens
        });
      }

      const response = await fetch(`${this.baseUrl}/api/ai-chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<ChatResponse> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to send chat message");
      }

      this.apiLogger.info("Chat response received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Chat API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to send chat message: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * This part of the code gets available quick actions for AI assistant
   */
  async getQuickActions(): Promise<QuickAction[]> {
    try {
      this.apiLogger.info("Fetching quick actions from secure server");

      const response = await fetch(`${this.baseUrl}/api/ai-chat?quick-actions=true`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<QuickAction[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch quick actions");
      }

      this.apiLogger.info("Quick actions received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Quick actions API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to fetch quick actions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }



  /**
   * Fetch complete replenishment data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   */
  async getReplenishmentData(): Promise<any> {
    try {
      this.apiLogger.info("Fetching replenishment data from secure server");

      const response = await fetch(`${this.baseUrl}/api/replenishment-data`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<any> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch replenishment data");
      }

      this.apiLogger.info("Replenishment data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Replenishment API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load replenishment data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch FAST replenishment data without AI insights for immediate page load
   */
  async getReplenishmentDataFast(): Promise<any> {
    try {
      this.apiLogger.info("Fetching FAST replenishment data (no AI insights)");

      const response = await fetch(`${this.baseUrl}/api/replenishment-data?mode=fast`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<any> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch fast replenishment data");
      }

      this.apiLogger.info("Fast replenishment data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Fast replenishment API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load fast replenishment data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch replenishment AI insights separately for progressive loading
   */
  async getReplenishmentInsights(): Promise<{ kpiContext: ReplenishmentKPIContext; insights: AIInsight[] }> {
    try {
      this.apiLogger.info("Fetching replenishment AI insights");

      const response = await fetch(`${this.baseUrl}/api/replenishment-data?mode=insights`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<{ kpiContext: ReplenishmentKPIContext; insights: AIInsight[] }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch replenishment insights");
      }

      this.apiLogger.info("Replenishment insights received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Replenishment insights API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load replenishment insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch complete inbound operations data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   */
  async getInboundData(): Promise<any> {
    try {
      this.apiLogger.info("Fetching inbound operations data from secure server");

      const response = await fetch(`${this.baseUrl}/api/inbound-data`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<any> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch inbound operations data");
      }

      this.apiLogger.info("Inbound operations data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Inbound operations API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load inbound operations data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch FAST inbound operations data without AI insights for immediate page load
   */
  async getInboundDataFast(): Promise<any> {
    try {
      this.apiLogger.info("Fetching FAST inbound operations data (no AI insights)");

      const response = await fetch(`${this.baseUrl}/api/inbound-data?mode=fast`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<any> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch fast inbound operations data");
      }

      this.apiLogger.info("Fast inbound operations data received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Fast inbound operations API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load fast inbound operations data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch inbound operations AI insights separately for progressive loading
   */
  async getInboundInsights(): Promise<{ kpiContext: InboundKPIContext; insights: AIInsight[] }> {
    try {
      this.apiLogger.info("Fetching inbound operations AI insights");

      const response = await fetch(`${this.baseUrl}/api/inbound-data?mode=insights`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<{ kpiContext: InboundKPIContext; insights: AIInsight[] }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch inbound operations insights");
      }

      this.apiLogger.info("Inbound operations insights received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("Inbound operations insights API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load inbound operations insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }


  /**
   * Fetch complete SLA performance data from secure server endpoint
   * NO external API keys - server handles TinyBird + OpenAI calls
   */
  async getSLAData(): Promise<any> {
    try {
      this.apiLogger.info("Fetching SLA performance data from secure server");

      const response = await fetch(`${this.baseUrl}/api/sla-data`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      this.apiLogger.info("SLA performance data received securely from server");
      return result;
    } catch (error) {
      this.apiLogger.error("SLA performance API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load SLA performance data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch FAST SLA performance data without AI insights for immediate page load
   */
  async getSLADataFast(): Promise<any> {
    try {
      this.apiLogger.info("Fetching FAST SLA performance data (no AI insights)");

      const response = await fetch(`${this.baseUrl}/api/sla-data?mode=fast`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      this.apiLogger.info("Fast SLA performance data received securely from server");
      return result;
    } catch (error) {
      this.apiLogger.error("Fast SLA performance API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load fast SLA performance data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Fetch SLA performance AI insights separately for progressive loading
   */
  async getSLAInsights(): Promise<{ kpiContext: SLAKPIContext; insights: AIInsight[] }> {
    try {
      this.apiLogger.info("Fetching SLA performance AI insights");

      const response = await fetch(`${this.baseUrl}/api/sla-data?mode=insights`);

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<{ kpiContext: SLAKPIContext; insights: AIInsight[] }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch SLA performance insights");
      }

      this.apiLogger.info("SLA performance insights received securely from server");
      return result.data;
    } catch (error) {
      this.apiLogger.error("SLA performance insights API call failed", { error: error instanceof Error ? error.message : error });
      throw new Error(
        `Unable to load SLA performance insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate AI suggestion for specific order
   * NO external API keys - server handles OpenAI calls
   * 🎯 FAST: Fast AI model for speed and cost efficiency
   */
  async generateOrderSuggestion(orderData: any): Promise<OrderSuggestion> {
    try {
      this.apiLogger.info("Requesting AI suggestion for order", { orderId: orderData.order_id });

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

      this.apiLogger.info("Order suggestion received securely", { orderId: orderData.order_id });
      return result.data;
    } catch (error) {
      this.apiLogger.error("Order suggestion API call failed", { 
        error: error instanceof Error ? error.message : error,
        orderId: orderData.order_id 
      });
      throw new Error(
        `Unable to generate order suggestion: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate AI suggestion for specific inventory item
   * NO external API keys - server handles OpenAI calls
   * 🎯 FAST: Fast AI model for speed and cost efficiency
   */
  async generateInventoryItemSuggestion(itemData: any): Promise<InventoryItemSuggestion> {
    try {
      this.apiLogger.info("Requesting AI suggestion for inventory item", { sku: itemData.sku });

      const response = await fetch(`${this.baseUrl}/api/inventory-suggestion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemData }),
      });

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<InventoryItemSuggestion> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to generate inventory suggestion");
      }

      this.apiLogger.info("Inventory suggestion received securely", { sku: itemData.sku });
      return result.data;
    } catch (error) {
      this.apiLogger.error("Inventory suggestion API call failed", { 
        error: error instanceof Error ? error.message : error,
        sku: itemData.sku 
      });
      throw new Error(
        `Unable to generate inventory suggestion: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate AI suggestion for specific replenishment item
   * NO external API keys - server handles OpenAI calls
   * 🎯 FAST: Fast AI model for speed and cost efficiency
   */
  async generateReplenishmentItemSuggestion(itemData: any): Promise<ReplenishmentItemSuggestion> {
    try {
      this.apiLogger.info("Requesting AI suggestion for replenishment item", { sku: itemData.sku || itemData.product_sku });

      const response = await fetch(`${this.baseUrl}/api/replenishment-suggestion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemData }),
      });

      if (!response.ok) {
        throw new Error(
          `Internal API Error: ${response.status} ${response.statusText}`,
        );
      }

      const result: APIResponse<ReplenishmentItemSuggestion> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to generate replenishment suggestion");
      }

      this.apiLogger.info("Replenishment suggestion received securely", { sku: itemData.sku || itemData.product_sku });
      return result.data;
    } catch (error) {
      this.apiLogger.error("Replenishment suggestion API call failed", { 
        error: error instanceof Error ? error.message : error,
        sku: itemData.sku || itemData.product_sku 
      });
      throw new Error(
        `Unable to generate replenishment suggestion: ${error instanceof Error ? error.message : "Unknown error"}`,
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
