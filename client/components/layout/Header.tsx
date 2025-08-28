import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  useRefreshDashboard,
  useConnectionStatus,
} from "@/hooks/useDashboardData";
import { Menu, RefreshCw, Bell, User, Wifi, WifiOff, LogOut, ChevronDown } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

const routeTitles: Record<string, string> = {
  "/overview": "Overview", 
  "/dashboard": "Overview",
  "/workflows": "Workflows",
  "/orders": "Orders",
  "/inventory": "Inventory",
  "/replenishment": "Replenishment",
  "/inbound": "Inbound",
  "/sla": "SLA Performance",
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
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const { user } = useUser();
  const { signOut } = useClerk();

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

  // This part of the code handles user logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // This part of the code closes dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

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
              : "bg-red-600 hover:bg-red-700 text-white",
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

        {/* User Dropdown */}
        <div className="relative user-dropdown">
          <button 
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white">
              {user?.firstName ? user.firstName[0].toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {/* User Info */}
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900">
                  {user?.fullName || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.primaryEmailAddress?.emailAddress || 'No email'}
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
