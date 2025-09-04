import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getDashboardData,
  getProductsData,
  getShipmentsData,
  generateInsights,
  getAnalyticsData,
} from "./routes/dashboard";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Validate server-side environment variables (split format for Vercel compatibility)
  const requiredEnvVars = [
    "TINYBIRD_BASE_URL",
    "TINYBIRD_TOKEN",
    "WAREHOUSE_BASE_URL",
    "WAREHOUSE_TOKEN",
    "OPENAI_API_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    console.error(
      "❌ Missing required server environment variables:",
      missingEnvVars,
    );
    console.error(
      "🔧 Please check your .env file and ensure these variables are set (without VITE_ prefix)",
    );
  } else {
    console.log("✅ All server environment variables validated successfully");
  }

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // 🔒 SECURE CargoCore Dashboard API Routes
  // All API keys and URLs are server-side only - not exposed to client

  // Complete dashboard data (recommended - single request)
  app.get("/api/dashboard-data", getDashboardData);

  // Complete analytics data (analytics dashboard)
  app.get("/api/analytics-data", getAnalyticsData);

  // Individual data endpoints (for specific page needs)
  app.get("/api/products", getProductsData);
  app.get("/api/shipments", getShipmentsData);

  // AI insights generation
  app.post("/api/insights", generateInsights);

  // Server environment status endpoint (for debugging)
  app.get("/api/status", (_req, res) => {
    res.json({
      server: "CargoCore API Server",
      status: "running",
      timestamp: new Date().toISOString(),
      environment: {
        hasApiKeys: !!(
          process.env.TINYBIRD_BASE_URL &&
          process.env.TINYBIRD_TOKEN &&
          process.env.WAREHOUSE_BASE_URL &&
          process.env.WAREHOUSE_TOKEN &&
          process.env.OPENAI_API_KEY
        ),
        nodeEnv: process.env.NODE_ENV || "development",
      },
    });
  });

  return app;
}
