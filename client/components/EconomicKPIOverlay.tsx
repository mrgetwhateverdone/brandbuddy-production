import React, { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface EconomicKPIOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  kpi: {
    id: string;
    title: string;
    value: string | number;
    description: string;
    status: 'critical' | 'warning' | 'good';
    detailedAnalysis: string;
    keyMetrics: Array<{
      label: string;
      value: string | number;
      description: string;
    }>;
    recommendations: string[];
  } | null;
}

/**
 * This part of the code creates a simple overlay for displaying Economic KPI details
 * Shows detailed analysis without workflow features, matching user requirements
 */
export function EconomicKPIOverlay({ isOpen, onClose, kpi }: EconomicKPIOverlayProps) {
  // This part of the code handles escape key and prevents body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // This part of the code determines the status icon based on KPI performance
  const getStatusIcon = () => {
    if (!kpi) return null;
    
    switch (kpi.status) {
      case 'critical':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
  };

  // This part of the code gets status-based styling for the overlay
  const getStatusStyles = () => {
    if (!kpi) return { container: 'bg-gray-50 border-gray-200', text: 'text-gray-700' };
    
    switch (kpi.status) {
      case 'critical':
        return { container: 'bg-red-50 border-red-200', text: 'text-red-700' };
      case 'warning':
        return { container: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' };
      default:
        return { container: 'bg-green-50 border-green-200', text: 'text-green-700' };
    }
  };

  if (!isOpen || !kpi) return null;

  const styles = getStatusStyles();

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{kpi.title}</h2>
              <p className="text-sm text-gray-500">{kpi.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Value */}
          <div className={`rounded-lg border p-4 mb-6 ${styles.container}`}>
            <div className="text-center">
              <div className={`text-3xl font-bold ${styles.text}`}>
                {kpi.value}
              </div>
              <p className="text-sm text-gray-600 mt-1">Current Performance</p>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis</h3>
            <p className="text-gray-700 leading-relaxed">{kpi.detailedAnalysis}</p>
          </div>

          {/* Key Metrics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Metrics</h3>
            <div className="space-y-3">
              {kpi.keyMetrics.map((metric, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{metric.label}</span>
                    <span className="text-lg font-semibold text-gray-900">{metric.value}</span>
                  </div>
                  <p className="text-sm text-gray-600">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
            <div className="space-y-2">
              {kpi.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
