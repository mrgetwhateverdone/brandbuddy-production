/**
 * Shared Data Fetching Service
 * This part of the code eliminates code duplication across server routes
 * Provides centralized, consistent data fetching for products and shipments
 */

import { logger } from '../../shared/services/logger';
import type { 
  TinyBirdResponse, 
  FetchConfig, 
  ProductData, 
  ShipmentData
} from '../../shared/types/api';
import { validateApiEnvironment } from '../../shared/types/api';

// Re-export types for backward compatibility
export type { ProductData, ShipmentData, TinyBirdResponse, FetchConfig };

export class DataFetchingService {
  private logger = logger.createLogger({ component: 'DataFetchingService' });

  /**
   * This part of the code fetches products from TinyBird API with flexible configuration
   */
  async fetchProducts(config: FetchConfig): Promise<{ data: ProductData[] }> {
    const baseUrl = process.env.TINYBIRD_BASE_URL;
    const token = process.env.TINYBIRD_TOKEN;
    
    if (!baseUrl || !token) {
      throw new Error("TINYBIRD_BASE_URL and TINYBIRD_TOKEN environment variables must be configured");
    }
    
    // This part of the code builds URL with flexible parameters
    const params = new URLSearchParams({
      token,
      limit: String(config.limit || 100),
      ...(config.brandFilter && { brand_name: config.brandFilter })
    });
    
    const url = `${baseUrl}?${params}`;
    
    const timer = this.logger.startTimer("Products fetch", { 
      endpoint: config.endpoint,
      limit: config.limit,
      brandFilter: config.brandFilter 
    });

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TinyBird Products API Error: ${response.status} ${response.statusText}`);
      }
      
      const result: TinyBirdResponse<ProductData> = await response.json();
      
      timer.end({ 
        success: true,
        recordCount: result.data.length 
      });
      
      return { data: result.data };
    } catch (error) {
      this.logger.error("Products fetch failed", { 
        endpoint: config.endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * This part of the code fetches shipments from warehouse API with flexible configuration
   */
  async fetchShipments(config: FetchConfig): Promise<{ data: ShipmentData[] }> {
    const baseUrl = process.env.WAREHOUSE_BASE_URL;
    const token = process.env.WAREHOUSE_TOKEN;
    
    if (!baseUrl || !token) {
      throw new Error("WAREHOUSE_BASE_URL and WAREHOUSE_TOKEN environment variables must be configured");
    }
    
    const params = new URLSearchParams({
      token,
      limit: String(config.limit || 150),
      ...(config.brandFilter && { brand_name: config.brandFilter })
    });
    
    const url = `${baseUrl}?${params}`;
    
    const timer = this.logger.startTimer("Shipments fetch", { 
      endpoint: config.endpoint,
      limit: config.limit,
      brandFilter: config.brandFilter 
    });

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TinyBird Shipments API Error: ${response.status} ${response.statusText}`);
      }
      
      const result: TinyBirdResponse<ShipmentData> = await response.json();
      
      timer.end({ 
        success: true,
        recordCount: result.data.length 
      });
      
      return { data: result.data };
    } catch (error) {
      this.logger.error("Shipments fetch failed", { 
        endpoint: config.endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * This part of the code provides a combined fetch method for common use cases
   * Eliminates duplicate Promise.all patterns across routes
   */
  async fetchProductsAndShipments(endpoint: string, options?: {
    productLimit?: number;
    shipmentLimit?: number;
    brandFilter?: string;
  }): Promise<{ products: ProductData[]; shipments: ShipmentData[] }> {
    
    const config = {
      endpoint,
      brandFilter: options?.brandFilter || 'Callahan-Smith', // Temporary until brand config system
    };

    this.logger.info("Starting combined data fetch", { 
      endpoint,
      productLimit: options?.productLimit,
      shipmentLimit: options?.shipmentLimit,
      brandFilter: config.brandFilter
    });

    const timer = this.logger.startTimer("Combined data fetch", { endpoint });

    try {
      const [productsResult, shipmentsResult] = await Promise.all([
        this.fetchProducts({ ...config, limit: options?.productLimit }),
        this.fetchShipments({ ...config, limit: options?.shipmentLimit }),
      ]);

      timer.end({
        success: true,
        productCount: productsResult.data.length,
        shipmentCount: shipmentsResult.data.length
      });

      return {
        products: productsResult.data,
        shipments: shipmentsResult.data,
      };
    } catch (error) {
      this.logger.error("Combined data fetch failed", { 
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

// This part of the code exports singleton instance for consistent data fetching across routes
export const dataFetchingService = new DataFetchingService();
