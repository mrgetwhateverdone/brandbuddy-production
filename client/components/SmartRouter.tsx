import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";

/**
 * This part of the code handles intelligent routing based on user settings
 * Redirects to user's preferred default page when accessing root path
 */
export function SmartRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getDefaultPage } = useSettingsIntegration();

  useEffect(() => {
    // This part of the code handles smart routing for authenticated users
    const isDemo = localStorage.getItem('isDemo');
    
    if (location.pathname === "/dashboard" && isDemo) {
      // User is accessing dashboard and is authenticated - check for default page preference
      const defaultPage = getDefaultPage();
      
      // This part of the code maps setting values to actual routes
      const pageRoutes: Record<string, string> = {
        'dashboard': '/dashboard',
        'orders': '/orders',
        'inventory': '/inventory',
        'analytics': '/analytics',
        'cost_management': '/cost-management'
      };

      const targetRoute = pageRoutes[defaultPage];
      
      // Only redirect if user prefers a different page than dashboard
      if (targetRoute && targetRoute !== "/dashboard" && defaultPage !== 'dashboard') {
        console.log(`🎯 Smart Router: Redirecting authenticated user to preferred page: ${targetRoute}`);
        navigate(targetRoute, { replace: true });
      }
    }
  }, [location.pathname, navigate, getDefaultPage]);

  return null; // This component doesn't render anything
}
