/**
 * This part of the code tests error display components
 * Ensures proper error handling and recovery UI
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import { ErrorDisplay, EnhancedErrorDisplay } from '../error-display';
import { AppError } from '@/lib/errors/AppError';

describe('ErrorDisplay', () => {
  it('renders with default message when no message provided', () => {
    render(<ErrorDisplay />);
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load data/)).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Custom error message';
    render(<ErrorDisplay message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = vi.fn();
    render(<ErrorDisplay onRetry={mockRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const mockRetry = vi.fn();
    render(<ErrorDisplay onRetry={mockRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button when showRetry is false', () => {
    const mockRetry = vi.fn();
    render(<ErrorDisplay onRetry={mockRetry} showRetry={false} />);
    
    const retryButton = screen.queryByRole('button', { name: /retry/i });
    expect(retryButton).not.toBeInTheDocument();
  });
});

describe('EnhancedErrorDisplay', () => {
  const createTestError = (severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    return new AppError('Test error message', 'TEST_ERROR', severity, { context: 'test' });
  };

  it('displays error message and code correctly', () => {
    const error = createTestError();
    render(<EnhancedErrorDisplay error={error} />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('TEST ERROR Error')).toBeInTheDocument();
  });

  it('applies correct styling based on error severity', () => {
    const criticalError = createTestError('critical');
    const { rerender } = render(<EnhancedErrorDisplay error={criticalError} />);
    
    // Check for critical error styling
    expect(screen.getByText('TEST ERROR Error')).toHaveClass('text-red-900');
    
    // Test medium severity
    const mediumError = createTestError('medium');
    rerender(<EnhancedErrorDisplay error={mediumError} />);
    expect(screen.getByText('TEST ERROR Error')).toHaveClass('text-yellow-900');
  });

  it('shows different button text for critical vs non-critical errors', () => {
    const criticalError = createTestError('critical');
    const mockRetry = vi.fn();
    
    const { rerender } = render(
      <EnhancedErrorDisplay error={criticalError} onRetry={mockRetry} />
    );
    
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    
    // Test non-critical error
    const mediumError = createTestError('medium');
    rerender(<EnhancedErrorDisplay error={mediumError} onRetry={mockRetry} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows technical details when showDetails is true', () => {
    const error = createTestError();
    render(<EnhancedErrorDisplay error={error} showDetails={true} />);
    
    expect(screen.getByText('Technical Details')).toBeInTheDocument();
  });

  it('hides technical details by default', () => {
    const error = createTestError();
    render(<EnhancedErrorDisplay error={error} />);
    
    expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const error = createTestError();
    const mockRetry = vi.fn();
    
    render(<EnhancedErrorDisplay error={error} onRetry={mockRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);
    
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
