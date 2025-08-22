/**
 * This part of the code provides centralized constants
 * Eliminates magic numbers and strings throughout the codebase
 */

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_COMPONENT_LINES = 200;
export const API_TIMEOUT = 30000;

export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
} as const;

export const SLA_STATUSES = {
  ON_TIME: 'on_time',
  AT_RISK: 'at_risk',
  BREACH: 'breach'
} as const;

export const ORDER_STATUSES = {
  COMPLETED: 'completed',
  SHIPPED: 'shipped',
  PROCESSING: 'processing',
  PENDING: 'pending',
  DELAYED: 'delayed',
  CANCELLED: 'cancelled'
} as const;

export const REFRESH_INTERVALS = {
  THIRTY_SECONDS: '30s',
  ONE_MINUTE: '1min',
  FIVE_MINUTES: '5min',
  MANUAL: 'manual'
} as const;

export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 95,
  GOOD: 85,
  NEEDS_IMPROVEMENT: 70
} as const;
