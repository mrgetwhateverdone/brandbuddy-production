import { useSettings } from "@/contexts/SettingsContext";
import { useEffect } from "react";

/**
 * This part of the code creates a hook to integrate settings with app behavior
 * Applies user settings to control actual app functionality and formatting
 */
export function useSettingsIntegration() {
  const { settings } = useSettings();

  // This part of the code applies display settings to the app
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Store settings in localStorage for easy access throughout the app
      localStorage.setItem('user_timezone', settings.display.timeZone);
      localStorage.setItem('user_currency_format', settings.display.currencyFormat);
      localStorage.setItem('user_number_format', settings.display.numberFormat.toString());
      localStorage.setItem('user_date_format', settings.operational.dateFormat);
      localStorage.setItem('user_table_page_size', settings.operational.tablePageSize.toString());
      localStorage.setItem('user_default_page', settings.display.defaultPage);
    }
  }, [settings]);

  // This part of the code provides currency formatting based on user settings
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "N/A";
    }

    const format = settings.display.currencyFormat;
    const decimals = typeof settings.display.numberFormat === 'number' 
      ? settings.display.numberFormat 
      : 2;

    const formatted = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    let result = '';
    switch (format) {
      case 'usd_symbol':
        result = `$${formatted}`;
        break;
      case 'usd_no_symbol':
        result = formatted;
        break;
      case 'eur':
        result = `€${formatted}`;
        break;
      case 'gbp':
        result = `£${formatted}`;
        break;
      default:
        result = `$${formatted}`;
    }

    return amount < 0 ? `-${result}` : result;
  };

  // This part of the code provides date formatting based on user settings
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "N/A";
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return "N/A";
      
      const format = settings.operational.dateFormat;

      switch (format) {
        case 'mm_dd_yyyy':
          return dateObj.toLocaleDateString('en-US');
        case 'dd_mm_yyyy':
          return dateObj.toLocaleDateString('en-GB');
        case 'iso':
          return dateObj.toISOString().split('T')[0];
        default:
          return dateObj.toLocaleDateString('en-US');
      }
    } catch (error) {
      return "N/A";
    }
  };

  // This part of the code provides number formatting based on user settings
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num)) {
      return "N/A";
    }

    const format = settings.display.numberFormat;
    
    if (format === 'auto') {
      // Auto-format based on value
      return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: format,
      maximumFractionDigits: format
    });
  };

  // This part of the code provides percentage formatting
  const formatPercentage = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num)) {
      return "N/A";
    }
    
    const format = settings.display.numberFormat;
    const decimals = format === 'auto' ? 1 : (typeof format === 'number' ? format : 1);
    
    return `${num.toFixed(decimals)}%`;
  };

  // This part of the code provides AI settings for API calls
  const getAISettings = () => ({
    model: settings.ai.model,
    maxTokens: settings.ai.maxTokens,
    contextLevel: settings.ai.contextLevel,
    responseLength: settings.ai.responseLength,
    refreshStrategy: settings.ai.refreshStrategy
  });

  // This part of the code provides agent settings for filtering
  const getAgentSettings = () => settings.agents;

  // This part of the code provides page settings for conditional rendering
  const isPageAIEnabled = (page: keyof typeof settings.pages) => settings.pages[page];

  // This part of the code provides operational settings
  const getTablePageSize = () => settings.operational.tablePageSize;
  const getDefaultPage = () => settings.display.defaultPage;
  const getRefreshInterval = () => settings.display.refreshInterval;

  // This part of the code provides TanStack Query configuration based on user settings
  const getQueryConfig = () => {
    const refreshInterval = settings.display.refreshInterval;
    
    // Convert refresh interval setting to milliseconds
    const getRefetchInterval = (): number | false => {
      switch (refreshInterval) {
        case '30s': return 30 * 1000;
        case '1min': return 60 * 1000;
        case '5min': return 5 * 60 * 1000;
        case 'manual': return false; // Disable auto-refetch
        default: return 5 * 60 * 1000; // Default to 5 minutes
      }
    };

    // This part of the code sets stale time to half of refetch interval for optimal caching
    const getStaleTime = () => {
      if (refreshInterval === 'manual') return 30 * 60 * 1000; // 30 minutes for manual
      const refetchMs = getRefetchInterval();
      return typeof refetchMs === 'number' ? Math.floor(refetchMs / 2) : 2 * 60 * 1000;
    };

    return {
      staleTime: getStaleTime(),
      refetchInterval: getRefetchInterval(),
      refetchOnWindowFocus: refreshInterval !== 'manual', // Only refetch on focus if not manual
      refetchOnMount: false, // NEVER refetch on mount - use cached data
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    };
  };

  return {
    settings,
    formatCurrency,
    formatDate,
    formatNumber,
    formatPercentage,
    getAISettings,
    getAgentSettings,
    isPageAIEnabled,
    getTablePageSize,
    getDefaultPage,
    getRefreshInterval,
    getQueryConfig
  };
}
