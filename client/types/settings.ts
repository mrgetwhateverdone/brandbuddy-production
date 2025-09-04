/**
 * This part of the code defines all settings interfaces for CargoCore
 * Covers agent configuration, AI settings, display preferences, and operational controls
 */

// Agent Configuration Settings
export interface AgentSettings {
  dashboard: {
    enabled: boolean;
    notificationThreshold: 'high' | 'medium_high' | 'all';
  };
  orders: {
    enabled: boolean;
    slaRiskThreshold: '6_hours' | '12_hours' | '24_hours';
  };
  analytics: {
    enabled: boolean;
    anomalySensitivity: 'high' | 'medium' | 'low';
  };
  inventory: {
    enabled: boolean;
    reorderStrategy: 'conservative' | 'balanced' | 'aggressive';
  };
}

// AI Configuration Settings
export interface AISettings {
  refreshStrategy: 'on_load' | 'every_page' | 'manual';
  model: 'gpt-3.5-turbo' | 'gpt-4'; // Internal model IDs - not user-facing
  maxTokens: number;
  responseLength: 'brief' | 'detailed' | 'adaptive';
  contextLevel: 'full' | 'limited' | 'basic';
}

// Cache Management Settings
export interface CacheSettings {
  enabled: boolean;
  duration: '1_hour' | '1_day' | '1_week' | 'manual';
  currentQueries: number;
  storageUsed: string;
}

// Page-Specific AI Controls
export interface PageSettings {
  dashboard: boolean;
  analytics: boolean;
  orders: boolean;
  inventory: boolean;
  replenishment: boolean;
  inbound: boolean;
  sla: boolean;
  warehouses: boolean;
  liveIntelligence: boolean;
}

// Dashboard & Display Settings
export interface DisplaySettings {
  defaultPage: 'dashboard' | 'orders' | 'inventory' | 'analytics' | 'warehouses' | 'cost_management';
  refreshInterval: '30s' | '1min' | '5min' | 'manual';
  timeZone: string;
  currencyFormat: 'usd_symbol' | 'usd_no_symbol' | 'eur' | 'gbp';
  numberFormat: 0 | 2 | 'auto';
}

// Operational Preferences
export interface OperationalSettings {
  defaultWarehouses: string[];
  defaultBrands: string[];
  dateFormat: 'mm_dd_yyyy' | 'dd_mm_yyyy' | 'iso';
  tablePageSize: 15 | 25 | 50 | 100;
}

// UI/UX Preferences
export interface UISettings {
  sidebarBehavior: 'expanded' | 'collapsed' | 'remember';
  modalBehavior: 'outside_click' | 'explicit_close';
  tableDensity: 'compact' | 'standard' | 'comfortable';
  animationSpeed: 'fast' | 'normal' | 'slow' | 'none';
}

// AI Assistant Quick Actions
export interface QuickActionSettings {
  topBrands: boolean;
  warehouses: boolean;
  dailyPriorities: boolean;
  atRiskOrders: boolean;
}

// Combined Settings Interface
export interface CargoSettings {
  agents: AgentSettings;
  ai: AISettings;
  cache: CacheSettings;
  pages: PageSettings;
  display: DisplaySettings;
  operational: OperationalSettings;
  ui: UISettings;
  quickActions: QuickActionSettings;
}

// Default Settings
export const DEFAULT_SETTINGS: CargoSettings = {
  agents: {
    dashboard: {
      enabled: true,
      notificationThreshold: 'high'
    },
    orders: {
      enabled: true,
      slaRiskThreshold: '6_hours'
    },
    analytics: {
      enabled: true,
      anomalySensitivity: 'high'
    },
    inventory: {
      enabled: true,
      reorderStrategy: 'conservative'
    }
  },
  ai: {
    refreshStrategy: 'on_load',
    model: 'gpt-3.5-turbo', // Internal model ID - not user-facing
    maxTokens: 150,
    responseLength: 'adaptive',
    contextLevel: 'full'
  },
  cache: {
    enabled: true,
    duration: '1_hour',
    currentQueries: 0,
    storageUsed: '0KB'
  },
  pages: {
    dashboard: true,
    analytics: true,
    orders: true,
    inventory: true,
    replenishment: true,
    inbound: true,
    sla: true,
    warehouses: true,
    liveIntelligence: true
  },
  display: {
    defaultPage: 'dashboard',
    refreshInterval: '1min',
    timeZone: 'America/New_York',
    currencyFormat: 'usd_symbol',
    numberFormat: 2
  },
  operational: {
    defaultWarehouses: [],
    defaultBrands: [],
    dateFormat: 'mm_dd_yyyy',
    tablePageSize: 25
  },
  ui: {
    sidebarBehavior: 'remember',
    modalBehavior: 'outside_click',
    tableDensity: 'standard',
    animationSpeed: 'normal'
  },
  quickActions: {
    topBrands: true,
    warehouses: true,
    dailyPriorities: true,
    atRiskOrders: true
  }
};

// Settings Action Types for Context
export type SettingsAction = 
  | { type: 'UPDATE_AGENT_SETTING'; agent: keyof AgentSettings; setting: string; value: any }
  | { type: 'UPDATE_AI_SETTING'; setting: keyof AISettings; value: any }
  | { type: 'UPDATE_CACHE_SETTING'; setting: keyof CacheSettings; value: any }
  | { type: 'UPDATE_PAGE_SETTING'; page: keyof PageSettings; value: boolean }
  | { type: 'UPDATE_DISPLAY_SETTING'; setting: keyof DisplaySettings; value: any }
  | { type: 'UPDATE_OPERATIONAL_SETTING'; setting: keyof OperationalSettings; value: any }
  | { type: 'UPDATE_UI_SETTING'; setting: keyof UISettings; value: any }
  | { type: 'UPDATE_QUICK_ACTION'; action: keyof QuickActionSettings; value: boolean }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RESET_TO_DEFAULTS' }
  | { type: 'LOAD_SETTINGS'; settings: CargoSettings };
