import type { VercelRequest, VercelResponse } from "@vercel/node";
import { insightCache } from "./cache/insight-cache";

/**
 * This part of the code provides cache management and monitoring endpoint
 * Allows cache inspection, invalidation, and performance monitoring
 * Essential for debugging and optimizing cache performance
 */

interface CacheManagementResponse {
  success: boolean;
  data?: any;
  message: string;
  timestamp: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { action, namespace } = req.query;
    const method = req.method;
    
    // This part of the code handles different cache management operations
    switch (method) {
      case "GET":
        return handleGetCacheInfo(req, res, action as string);
      
      case "POST":
        return handleCacheActions(req, res, action as string, namespace as string);
      
      case "DELETE":
        return handleCacheInvalidation(req, res, namespace as string);
      
      default:
        return res.status(405).json({
          success: false,
          message: "Method not allowed",
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("❌ Cache management error:", error);
    res.status(500).json({
      success: false,
      message: "Cache management operation failed",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * This part of the code handles GET requests for cache information
 * Provides cache statistics, health, and monitoring data
 */
async function handleGetCacheInfo(
  req: VercelRequest, 
  res: VercelResponse, 
  action: string
): Promise<void> {
  const response: CacheManagementResponse = {
    success: true,
    message: "",
    timestamp: new Date().toISOString(),
  };

  switch (action) {
    case "stats":
      // This part of the code returns cache statistics
      const stats = insightCache.getStats();
      response.data = {
        stats,
        performance: {
          hitRate: `${stats.hitRate}%`,
          efficiency: stats.hitRate > 50 ? "Excellent" : stats.hitRate > 30 ? "Good" : "Needs Improvement",
          totalRequests: stats.hits + stats.misses,
          cacheSize: stats.size,
        },
      };
      response.message = `Cache statistics retrieved - Hit rate: ${stats.hitRate}%`;
      break;

    case "health":
      // This part of the code returns cache health information
      const health = insightCache.getHealth();
      response.data = {
        healthy: health.healthy,
        issues: health.issues,
        status: health.healthy ? "Healthy" : "Issues Detected",
        recommendations: generateHealthRecommendations(health.issues),
      };
      response.message = `Cache health: ${health.healthy ? "Healthy" : "Issues detected"}`;
      break;

    case "performance":
      // This part of the code returns detailed performance metrics
      const perfStats = insightCache.getStats();
      response.data = {
        metrics: {
          hitRate: perfStats.hitRate,
          cacheEfficiency: calculateCacheEfficiency(perfStats),
          memoryUsage: perfStats.size,
          costSavings: calculateCostSavings(perfStats),
        },
        insights: generatePerformanceInsights(perfStats),
      };
      response.message = "Cache performance metrics retrieved";
      break;

    default:
      // This part of the code returns general cache information
      response.data = {
        overview: {
          cacheSize: insightCache.getStats().size,
          hitRate: `${insightCache.getStats().hitRate}%`,
          healthy: insightCache.getHealth().healthy,
        },
        availableActions: [
          "GET ?action=stats - Cache statistics",
          "GET ?action=health - Cache health check", 
          "GET ?action=performance - Performance metrics",
          "POST ?action=cleanup - Clean expired entries",
          "POST ?action=reset-stats - Reset statistics",
          "DELETE ?namespace=X - Invalidate namespace",
          "DELETE (no params) - Clear entire cache",
        ],
      };
      response.message = "Cache management endpoint - Use ?action= parameter for specific operations";
      break;
  }

  res.status(200).json(response);
}

/**
 * This part of the code handles POST requests for cache actions
 * Performs cache operations like cleanup, reset, etc.
 */
async function handleCacheActions(
  req: VercelRequest,
  res: VercelResponse,
  action: string,
  namespace: string
): Promise<void> {
  const response: CacheManagementResponse = {
    success: true,
    message: "",
    timestamp: new Date().toISOString(),
  };

  switch (action) {
    case "cleanup":
      // This part of the code performs cache cleanup of expired entries
      const beforeSize = insightCache.getStats().size;
      // Trigger cleanup by getting stats (cleanup is automatic)
      insightCache.getStats();
      const afterSize = insightCache.getStats().size;
      const cleanedEntries = beforeSize - afterSize;
      
      response.data = {
        beforeSize,
        afterSize,
        cleanedEntries,
        spaceSaved: cleanedEntries > 0 ? `${cleanedEntries} entries` : "No expired entries found",
      };
      response.message = `Cache cleanup completed - Removed ${cleanedEntries} expired entries`;
      break;

    case "reset-stats":
      // This part of the code resets cache statistics
      const oldStats = insightCache.getStats();
      insightCache.resetStats();
      
      response.data = {
        previousStats: oldStats,
        newStats: insightCache.getStats(),
        resetAt: new Date().toISOString(),
      };
      response.message = "Cache statistics reset successfully";
      break;

    case "invalidate":
      // This part of the code invalidates specific namespace
      if (!namespace) {
        return res.status(400).json({
          success: false,
          message: "Namespace parameter required for invalidation",
          timestamp: new Date().toISOString(),
        });
      }
      
      insightCache.invalidate(namespace);
      response.data = {
        invalidatedNamespace: namespace,
        remainingSize: insightCache.getStats().size,
      };
      response.message = `Cache invalidated for namespace: ${namespace}`;
      break;

    default:
      return res.status(400).json({
        success: false,
        message: `Unknown action: ${action}. Available: cleanup, reset-stats, invalidate`,
        timestamp: new Date().toISOString(),
      });
  }

  res.status(200).json(response);
}

/**
 * This part of the code handles DELETE requests for cache invalidation
 * Clears cache entries by namespace or entire cache
 */
async function handleCacheInvalidation(
  req: VercelRequest,
  res: VercelResponse,
  namespace: string
): Promise<void> {
  const response: CacheManagementResponse = {
    success: true,
    message: "",
    timestamp: new Date().toISOString(),
  };

  if (namespace) {
    // This part of the code invalidates specific namespace
    const beforeSize = insightCache.getStats().size;
    insightCache.invalidate(namespace);
    const afterSize = insightCache.getStats().size;
    const removedEntries = beforeSize - afterSize;
    
    response.data = {
      namespace,
      removedEntries,
      remainingSize: afterSize,
    };
    response.message = `Invalidated ${removedEntries} entries for namespace: ${namespace}`;
  } else {
    // This part of the code clears entire cache
    const beforeSize = insightCache.getStats().size;
    insightCache.clear();
    
    response.data = {
      clearedEntries: beforeSize,
      remainingSize: 0,
      operation: "Full cache clear",
    };
    response.message = `Cleared entire cache - Removed ${beforeSize} entries`;
  }

  res.status(200).json(response);
}

/**
 * This part of the code generates health recommendations based on issues
 */
function generateHealthRecommendations(issues: string[]): string[] {
  const recommendations: string[] = [];
  
  issues.forEach(issue => {
    if (issue.includes("Cache size large")) {
      recommendations.push("Consider implementing cache size limits or more aggressive cleanup");
    }
    if (issue.includes("Low hit rate")) {
      recommendations.push("Consider increasing TTL values or improving cache key generation");
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push("Cache is performing optimally - no recommendations");
  }
  
  return recommendations;
}

/**
 * This part of the code calculates cache efficiency metrics
 */
function calculateCacheEfficiency(stats: any): string {
  if (stats.hitRate >= 70) return "Excellent";
  if (stats.hitRate >= 50) return "Good";  
  if (stats.hitRate >= 30) return "Fair";
  return "Poor";
}

/**
 * This part of the code estimates cost savings from caching
 */
function calculateCostSavings(stats: any): any {
  // Rough estimate: each cache hit saves ~$0.002 (OpenAI API cost)
  const avgCostPerCall = 0.002;
  const estimatedSavings = stats.hits * avgCostPerCall;
  
  return {
    cacheHits: stats.hits,
    estimatedDollars: `$${estimatedSavings.toFixed(3)}`,
    apiCallsAvoided: stats.hits,
    note: "Estimated based on typical OpenAI API costs",
  };
}

/**
 * This part of the code generates performance insights
 */
function generatePerformanceInsights(stats: any): string[] {
  const insights: string[] = [];
  
  if (stats.hitRate > 60) {
    insights.push("Excellent cache performance - reducing API costs significantly");
  } else if (stats.hitRate > 30) {
    insights.push("Good cache performance - consider optimizing TTL for better hit rates");
  } else {
    insights.push("Cache hit rate could be improved - review caching strategy");
  }
  
  if (stats.size > 50) {
    insights.push("Large cache size - ensure cleanup is working properly");
  }
  
  if (stats.hits > 100) {
    insights.push("High cache usage - caching is providing significant value");
  }
  
  return insights;
}
