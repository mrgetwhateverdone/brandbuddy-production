import "./global.css";
import "@/lib/env"; // Client environment validation (secure - no API keys)

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { WorkflowToastListener } from "./components/WorkflowToast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "next-themes";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";

console.log("🚀 BrandBuddy: App.tsx loading...");

// This part of the code configures Clerk authentication
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_YW1hemluZy1kb3J5LTY1LmNsZXJrLmFjY291bnRzLmRldiQ";

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// This part of the code customizes Clerk appearance to match BrandBuddy theme
const clerkAppearance = {
  layout: {
    showOptionalFields: false,
  },
  elements: {
    // Override Clerk's loading states to match our gray-50 background
    loadingButtonSpinner: "text-gray-400",
    spinner: "text-gray-400",
    loadingButton: "bg-gray-50 border-gray-200",
    // Ensure cards match our theme
    card: "bg-gray-50 shadow-none border-0",
    rootBox: "bg-gray-50",
    main: "bg-gray-50",
    // Override any potential dark backgrounds during loading
    body: "bg-gray-50",
    // Style form elements consistently
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
    formFieldInput: "bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500",
  },
  variables: {
    colorBackground: "#f9fafb",     // gray-50 background to match Layout
    colorPrimary: "#9ca3af",        // gray-400 to prevent blue flash
    colorText: "#111827",           // gray-900 text
    colorTextSecondary: "#6b7280",  // gray-500 secondary text
    colorNeutral: "#f3f4f6",        // gray-100 neutral
    borderRadius: "0.5rem",         // rounded-lg
  }
};

// This part of the code implements route-based code splitting for better performance
import { lazy } from "react";
import { ProtectedPageWrapper, PublicPageWrapper } from "./components/routing/LazyPageWrapper";
import { AuthenticatedApp } from "./components/auth/AuthenticatedApp";

// Eagerly loaded pages (critical for first load)
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (loaded on-demand)
const Contact = lazy(() => import("./pages/Contact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Workflows = lazy(() => import("./pages/Workflows"));
const Orders = lazy(() => import("./pages/Orders"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Replenishment = lazy(() => import("./pages/Replenishment"));
const Inbound = lazy(() => import("./pages/Inbound"));
const Reports = lazy(() => import("./pages/Reports"));
const SLA = lazy(() => import("./pages/SLA"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Settings = lazy(() => import("./pages/Settings"));
import { SmartRouter } from "./components/SmartRouter";

// Configure TanStack Query for real-time data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // 5 minutes auto-refresh
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: 1000,
    },
  },
});

const App = () => {
  console.log("🎯 BrandBuddy: App component rendering...");

  return (
    <ErrorBoundary>
      <ClerkProvider 
        publishableKey={CLERK_PUBLISHABLE_KEY}
        appearance={clerkAppearance}
      >
        <AuthenticatedApp>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
            <SettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <WorkflowToastListener />
            <BrowserRouter>
                <SmartRouter />
              <Routes>
                  {/* Public Landing & Contact Pages */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/contact" element={
                    <PublicPageWrapper loadingMessage="Loading contact page...">
                      <Contact />
                    </PublicPageWrapper>
                  } />

                  {/* Protected Dashboard & App Pages */}
                  <Route 
                    path="/overview" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading BrandBuddy dashboard...">
                        <Dashboard />
                      </ProtectedPageWrapper>
                    } 
                  />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading BrandBuddy dashboard...">
                        <Dashboard />
                      </ProtectedPageWrapper>
                    } 
                  />
                  <Route 
                    path="/workflows" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading workflows...">
                        <Workflows />
                      </ProtectedPageWrapper>
                    } 
                  />

                  <Route 
                    path="/orders" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading orders...">
                        <Orders />
                      </ProtectedPageWrapper>
                    } 
                  />
                  <Route 
                    path="/inventory" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading inventory...">
                        <Inventory />
                      </ProtectedPageWrapper>
                    } 
                  />
                  <Route 
                    path="/replenishment" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading replenishment...">
                        <Replenishment />
                      </ProtectedPageWrapper>
                    } 
                  />
                  <Route 
                    path="/inbound" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading inbound operations...">
                        <Inbound />
                      </ProtectedPageWrapper>
                    } 
                  />

                <Route
                    path="/reports" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading reports...">
                        <Reports />
                      </ProtectedPageWrapper>
                    }
                  />
                  <Route 
                    path="/sla" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading SLA performance...">
                        <SLA />
                      </ProtectedPageWrapper>
                    } 
                  />
                  <Route 
                    path="/assistant" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading BrandBuddy Agent...">
                        <AIAssistant />
                      </ProtectedPageWrapper>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedPageWrapper loadingMessage="Loading settings...">
                        <Settings />
                      </ProtectedPageWrapper>
                    } 
                  />

                {/* 404 Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
            </SettingsProvider>
        </QueryClientProvider>
      </ThemeProvider>
        </AuthenticatedApp>
      </ClerkProvider>
    </ErrorBoundary>
  );
};

console.log("🔧 BrandBuddy: Setting up React root...");
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ No root element found!");
} else {
  console.log("✅ Root element found, creating React app...");
  createRoot(rootElement).render(<App />);
  console.log("🎉 BrandBuddy: React app initialized!");
}
