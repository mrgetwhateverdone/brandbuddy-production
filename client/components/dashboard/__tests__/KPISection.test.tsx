/**
 * This part of the code tests the critical KPI display functionality
 * Ensures KPIs render correctly with proper null handling
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { KPISection } from '../KPISection';
import type { DashboardKPIs } from '@/types/api';

// This part of the code provides mock data for testing
const mockKPIs: DashboardKPIs = {
  totalOrdersToday: 147,
  atRiskOrders: 12,
  openPOs: 35,
  unfulfillableSKUs: 0,
};

const mockKPIsWithNulls: DashboardKPIs = {
  totalOrdersToday: null,
  atRiskOrders: null,
  openPOs: null,
  unfulfillableSKUs: null,
};

// Mock the settings hook
vi.mock('@/hooks/useSettingsIntegration', () => ({
  useSettingsIntegration: () => ({
    formatNumber: (value: number | null) => value?.toString() || 'N/A'
  })
}));

describe('KPISection', () => {
  it('renders all KPI cards with correct titles', () => {
    render(<KPISection kpis={mockKPIs} />);
    
    expect(screen.getByText('Total Orders Today')).toBeInTheDocument();
    expect(screen.getByText('At-Risk Orders')).toBeInTheDocument();
    expect(screen.getByText('Open POs')).toBeInTheDocument();
    expect(screen.getByText('Unfulfillable SKUs')).toBeInTheDocument();
  });

  it('displays KPI values correctly when data is available', () => {
    render(<KPISection kpis={mockKPIs} />);
    
    expect(screen.getByText('147')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles null values gracefully without crashing', () => {
    render(<KPISection kpis={mockKPIsWithNulls} />);
    
    // Should display N/A for null values instead of crashing
    const naElements = screen.getAllByText('N/A');
    expect(naElements).toHaveLength(4);
  });

  it('displays correct descriptions for each KPI', () => {
    render(<KPISection kpis={mockKPIs} />);
    
    expect(screen.getByText('New orders received today')).toBeInTheDocument();
    expect(screen.getByText('Orders with delays or issues')).toBeInTheDocument();
    expect(screen.getByText('Active purchase orders')).toBeInTheDocument();
    expect(screen.getByText('SKUs with fulfillment issues')).toBeInTheDocument();
  });

  it('applies correct color classes based on values', () => {
    render(<KPISection kpis={mockKPIs} />);
    
    // Check that at-risk orders have red color when > 0
    const atRiskElement = screen.getByText('12');
    expect(atRiskElement).toHaveClass('text-red-600');
    
    // Check that unfulfillable SKUs have gray color when = 0
    const unfulfillableElement = screen.getByText('0');
    expect(unfulfillableElement).toHaveClass('text-gray-600');
  });

  it('displays loading state correctly', () => {
    render(<KPISection kpis={mockKPIs} isLoading={true} />);
    
    // Should show loading skeletons
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('handles decimal values correctly (shows whole numbers when appropriate)', () => {
    const kpisWithDecimals: DashboardKPIs = {
      totalOrdersToday: 147.0,
      atRiskOrders: 12.5,
      openPOs: 35.0,
      unfulfillableSKUs: 0.0,
    };
    
    render(<KPISection kpis={kpisWithDecimals} />);
    
    // Should show whole numbers without decimals for .0 values
    expect(screen.getByText('147')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    
    // Should show decimal for actual decimal value
    expect(screen.getByText('12.5')).toBeInTheDocument();
  });
});
