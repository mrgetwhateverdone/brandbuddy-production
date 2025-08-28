import { Langfuse } from "langfuse";

// This part of the code initializes Langfuse client with environment configuration
export const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

// This part of the code creates standardized trace metadata for insights
export function createInsightTraceMetadata(domain: string, dataPoints: any) {
  return {
    domain,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    dataPoints: {
      analysisDataSize: dataPoints.analysisDataSize || 0,
      requestId: dataPoints.requestId || null,
      userAgent: dataPoints.userAgent || null
    }
  };
}

// This part of the code creates standardized generation metadata
export function createGenerationMetadata(insightType: string, promptLength: number) {
  return {
    insightType,
    promptLength,
    timestamp: new Date().toISOString()
  };
}
