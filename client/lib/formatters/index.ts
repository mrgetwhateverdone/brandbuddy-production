/**
 * This part of the code provides centralized formatting utilities
 * Eliminates code duplication across 164+ instances in components
 */

export const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return "N/A";
  const safeValue = Math.abs(value);
  
  if (safeValue >= 1000000) return `$${(safeValue / 1000000).toFixed(1)}M`;
  if (safeValue >= 1000) return `$${(safeValue / 1000).toFixed(1)}K`;
  return `$${safeValue.toLocaleString()}`;
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value == null) return "N/A";
  // This part of the code formats numbers to show whole numbers when no meaningful decimals
  return value % 1 === 0 ? value.toString() : value.toFixed(2);
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (value == null) return "N/A";
  return `${Math.round(value)}%`;
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return "Invalid Date";
  }
};

export const formatLeadTime = (days: number | null | undefined): string => {
  if (days == null) return "N/A";
  return `${Math.round(days)} days`;
};

// This part of the code provides safe KPI value formatting
export const formatKPIValue = (value: number | null | undefined): string => {
  if (value == null) return "N/A";
  return value % 1 === 0 ? value.toString() : value.toFixed(2);
};
