import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  useRefreshDashboard,
  useConnectionStatus,
} from "@/hooks/useDashboardData";
import { Menu, RefreshCw, Bell, User, Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/workflows": "Workflows",
  "/analytics": "Analytics",
  "/orders": "Orders",
  "/inventory": "Inventory",
  "/warehouses": "Warehouses",
  "/cost-management": "Cost Management",
  "/intelligence": "Economic Intelligence",
  "/reports": "Generate Report",
  "/assistant": "AI Assistant",
  "/settings": "Settings",
};

export function Header({
  onMenuClick,
  sidebarCollapsed,
  onSidebarToggle,
}: HeaderProps) {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { refreshAll } = useRefreshDashboard();
  const { isConnected, isLoading, hasError, lastUpdated } =
    useConnectionStatus();

  // Live clock update
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
      // Add a small delay for UX feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error("Refresh failed:", error);
      setIsRefreshing(false);
    }
  };

  const pageTitle = routeTitles[location.pathname] || "Dashboard";

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="mr-4 md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page Title */}
      <h1 className="text-xl font-semibold text-gray-800 mr-auto">
        {pageTitle}
      </h1>

      {/* Right Side Controls */}
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="hidden lg:flex items-center text-xs text-gray-500">
          {isConnected ? (
            <Wifi className="h-3 w-3 mr-1 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 mr-1 text-red-500" />
          )}
          <span>
            {isLoading
              ? "Connecting..."
              : hasError
                ? "Disconnected"
                : lastUpdated
                  ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
                  : "Connected"}
          </span>
        </div>

        {/* Live Clock */}
        <div className="hidden sm:block text-sm text-gray-500">
          {currentTime.toLocaleTimeString()}
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-md transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            hasError
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white",
          )}
          title={hasError ? "Retry connection" : "Refresh data"}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4 mr-2",
              (isRefreshing || isLoading) && "animate-spin",
            )}
          />
          <span className="hidden sm:inline">
            {isRefreshing ? "Refreshing..." : hasError ? "Retry" : "Refresh"}
          </span>
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          {/* Show notification if there are connection issues */}
          {hasError && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* User Avatar */}
        <button className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
