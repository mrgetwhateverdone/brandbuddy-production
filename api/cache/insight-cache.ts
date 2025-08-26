/**
 * This part of the code provides intelligent caching for AI insights
 * Avoids expensive OpenAI calls by caching insights for 15-30 minutes
 * Reduces costs and improves performance dramatically
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  hash: string; // Data fingerprint for cache invalidation
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class InsightCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 20 * 60 * 1000; // 20 minutes default
  private stats = { hits: 0, misses: 0 };
  
  /**
   * This part of the code generates a cache key from input data
   * Uses data fingerprint to detect when insights should be regenerated
   */
  private generateCacheKey(namespace: string, data: any): string {
    // Create a simple hash of the data to detect changes
    const dataString = JSON.stringify({
      productCount: data.products?.length || 0,
      shipmentCount: data.shipments?.length || 0,
      lastUpdated: data.lastUpdated,
      // Add key metrics that would affect insights
      atRiskOrders: data.kpis?.atRiskOrders || 0,
      unfulfillableSKUs: data.kpis?.unfulfillableSKUs || 0,
    });
    
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `${namespace}:${Math.abs(hash)}`;
  }
  
  /**
   * This part of the code generates a data fingerprint for cache validation
   * Detects when underlying data has changed significantly
   */
  private generateDataHash(data: any): string {
    const fingerprint = {
      products: data.products?.length || 0,
      shipments: data.shipments?.length || 0,
      atRiskOrders: data.kpis?.atRiskOrders || 0,
      unfulfillableSKUs: data.kpis?.unfulfillableSKUs || 0,
      timestamp: Math.floor(Date.now() / (5 * 60 * 1000)), // 5-minute buckets
    };
    
    return JSON.stringify(fingerprint);
  }
  
  /**
   * This part of the code retrieves cached insights if available and valid
   * Returns null if cache miss or data has changed
   */
  get(namespace: string, data: any): any | null {
    const key = this.generateCacheKey(namespace, data);
    const entry = this.cache.get(key);
    const currentHash = this.generateDataHash(data);
    
    if (!entry) {
      this.stats.misses++;
      console.log(`🔍 Cache MISS for ${namespace} - No cached data`);
      return null;
    }
    
    // Check if cache has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`⏰ Cache MISS for ${namespace} - Expired at ${new Date(entry.expiresAt).toLocaleTimeString()}`);
      return null;
    }
    
    // Check if underlying data has changed significantly
    if (entry.hash !== currentHash) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`🔄 Cache MISS for ${namespace} - Data changed`);
      return null;
    }
    
    this.stats.hits++;
    const ageMinutes = Math.round((Date.now() - entry.timestamp) / (60 * 1000));
    console.log(`✅ Cache HIT for ${namespace} - Age: ${ageMinutes}m, Expires: ${Math.round((entry.expiresAt - Date.now()) / (60 * 1000))}m`);
    
    return entry.data;
  }
  
  /**
   * This part of the code stores insights in cache with expiration
   * TTL varies based on insight type and volatility
   */
  set(namespace: string, data: any, insights: any, customTTL?: number): void {
    const key = this.generateCacheKey(namespace, data);
    const hash = this.generateDataHash(data);
    const ttl = customTTL || this.getTTLForNamespace(namespace);
    
    const entry: CacheEntry = {
      data: insights,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      hash,
    };
    
    this.cache.set(key, entry);
    const ttlMinutes = Math.round(ttl / (60 * 1000));
    console.log(`💾 Cache SET for ${namespace} - TTL: ${ttlMinutes}m, Expires: ${new Date(entry.expiresAt).toLocaleTimeString()}`);
    
    // This part of the code cleans up expired entries periodically
    this.cleanupExpired();
  }
  
  /**
   * This part of the code determines optimal TTL based on insight type
   * More volatile insights get shorter cache times
   */
  private getTTLForNamespace(namespace: string): number {
    const ttlMap = {
      'dashboard-insights': 20 * 60 * 1000,    // 20 minutes - frequently changing
      'orders-insights': 15 * 60 * 1000,       // 15 minutes - very volatile
      'inventory-insights': 30 * 60 * 1000,    // 30 minutes - more stable
      'sla-insights': 25 * 60 * 1000,          // 25 minutes - moderate changes
      'replenishment-insights': 30 * 60 * 1000, // 30 minutes - stable
      'inbound-insights': 20 * 60 * 1000,      // 20 minutes - moderate
      'warehouses-insights': 30 * 60 * 1000,   // 30 minutes - stable
      'reports-insights': 60 * 60 * 1000,      // 60 minutes - very stable
    };
    
    return ttlMap[namespace] || this.defaultTTL;
  }
  
  /**
   * This part of the code removes expired cache entries
   * Keeps memory usage under control
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cache cleanup: Removed ${removedCount} expired entries`);
    }
  }
  
  /**
   * This part of the code forces cache invalidation for a namespace
   * Useful when data updates require fresh insights
   */
  invalidate(namespace: string): void {
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(namespace + ':')) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    console.log(`🔄 Cache invalidated for ${namespace}: Removed ${removedCount} entries`);
  }
  
  /**
   * This part of the code provides cache statistics for monitoring
   * Helps optimize cache hit rates and TTL settings
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
  
  /**
   * This part of the code resets cache statistics
   * Useful for monitoring over specific time periods
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
    console.log('📊 Cache statistics reset');
  }
  
  /**
   * This part of the code clears entire cache
   * Emergency cache flush capability
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache cleared: Removed ${size} entries`);
  }
  
  /**
   * This part of the code provides cache health information
   * For monitoring and debugging
   */
  getHealth(): { healthy: boolean; issues: string[] } {
    const stats = this.getStats();
    const issues: string[] = [];
    
    if (stats.size > 100) {
      issues.push('Cache size large - consider cleanup');
    }
    
    if (stats.hitRate < 30 && stats.hits + stats.misses > 10) {
      issues.push('Low hit rate - consider longer TTL');
    }
    
    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}

// Export singleton instance
export const insightCache = new InsightCache();

// Export types for TypeScript
export type { CacheStats };
