// This part of the code creates a comprehensive overlay system for displaying AI insights with workflow integration
// It provides detailed analysis views and allows users to convert insights into actionable workflows

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, TrendingUp, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { useWorkflowCreation } from '../hooks/useWorkflows';
import { useDashboardData } from '../hooks/useDashboardData';
import { useInventoryData } from '../hooks/useInventoryData';
import { BrainIcon } from './ui/BrainIcon';

interface InsightOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  insight: {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    dollarImpact?: number;
    suggestedActions: string[];
    source: string;
    createdAt: string;
  };
  agentName?: string;
}

// This part of the code renders the main insight overlay with full-screen modal design
export function InsightOverlay({ isOpen, onClose, insight, agentName = "Dashboard Agent" }: InsightOverlayProps) {
  const { createWorkflow, creating } = useWorkflowCreation();
  const { data: dashboardData } = useDashboardData();
  const { data: inventoryData } = useInventoryData();
  const [processingActionId, setProcessingActionId] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // This part of the code handles click outside to close functionality
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

  // This part of the code determines the appropriate icon based on insight severity
  const getSeverityIcon = () => {
    switch (insight.severity) {
      case 'critical':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <TrendingUp className="h-6 w-6 text-blue-600" />;
    }
  };

  // This part of the code gets severity-based styling for containers and text
  const getSeverityStyles = () => {
    switch (insight.severity) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-700'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-700'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-700'
        };
    }
  };

  // This part of the code generates context information based on insight source
  const generateContextInfo = () => {
    // This part of the code shows inventory-specific context for inventory insights
    if (insight.source === 'inventory_agent' && inventoryData) {
      return [
        `${inventoryData.inventory?.length || 0} active SKUs currently in inventory`,
        `${inventoryData.kpis?.lowStockAlerts || 0} SKUs flagged as low stock requiring attention`,
        `$${(inventoryData.kpis?.totalInventoryValue || 0).toLocaleString()} total inventory value under management`,
        `${inventoryData.kpis?.inactiveSKUs || 0} inactive SKUs identified for potential discontinuation`,
        `${inventoryData.supplierAnalysis?.length || 0} suppliers being monitored for performance`
      ];
    }
    
    // This part of the code shows dashboard context for general insights  
    if (!dashboardData) return [];
    
    return [
      `${dashboardData.shipments?.length || 0} active shipments currently being tracked`,
      `${dashboardData.products?.filter(p => p.active).length || 0} active SKUs in inventory`,
      `${dashboardData.warehouseInventory?.length || 0} warehouse locations in network`,
      `${dashboardData.kpis?.totalOrdersToday || 0} orders processed today`
    ];
  };

  // This part of the code handles action button clicks for workflow creation (your exact pattern)
  const handleActionClick = async (action: string, index: number) => {
    setProcessingActionId(index); // ← Button shows "Creating Workflow..." spinner
    
    // This part of the code validates insight and action data before workflow creation (ChatGPT's defensive approach)
    if (!insight || !insight.title || !insight.id || !action) {
      console.error('Invalid insight or action data for workflow creation:', { insight, action });
      alert('Invalid data. Cannot create workflow.');
      setProcessingActionId(null);
      return;
    }

    console.log('Creating workflow from overlay:', {
      insight: { id: insight.id, title: insight.title, severity: insight.severity },
      action: action
    });
    
    try {
      // This part of the code creates workflow from the SPECIFIC action clicked (AI-ordered by priority)
      await createWorkflow({
        action: {
          label: action || 'Default Action',           
          type: 'create_workflow',            
          target: 'insight_management',        
          values: [action], // Use only the specific action clicked
          priority: (insight.severity === 'critical' ? 'critical' :
                    insight.severity === 'warning' ? 'high' : 'medium') as 'low' | 'medium' | 'high' | 'critical',
        },
        source: 'ai_insight',
        sourceId: insight.id || `fallback_${Date.now()}`,
        insightTitle: insight.title || 'Untitled Workflow',
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to create workflow:', error);
      // This part of the code shows user-friendly error without crashing the app
      alert('Failed to create workflow. Please try again.');
    } finally {
      setProcessingActionId(null); // ← Remove spinner
    }
  };

  const styles = getSeverityStyles();
  const contextInfo = generateContextInfo();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* This part of the code renders the header section with severity icon, title, and close button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getSeverityIcon()}
            <div>
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-900">{insight.title}</h2>
                {/* This part of the code adds a blue brain icon to indicate AI-generated content */}
                <BrainIcon className="h-6 w-6 ml-3 text-blue-600" />
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles.badge}`}>
                  AI Generated Insight
                </span>
                <span className="text-sm text-gray-500">
                  Generated by {agentName} • ID: {insight.id}
                </span>
              </div>
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

        {/* This part of the code shows success state when workflow is created */}
        {showSuccess && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-700 font-medium">✓ Workflow created successfully!</span>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* This part of the code displays the main insight summary with severity-based styling */}
          <div className={`border rounded-lg p-4 ${styles.container}`}>
            <div className="flex items-start justify-between mb-3">
              <h3 className={`font-semibold ${styles.text}`}>Insight Summary</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded ${styles.badge}`}>
                {insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${styles.text}`}>
              {insight.description}
            </p>
          </div>

          {/* This part of the code shows financial impact if available */}
          {insight.dollarImpact && insight.dollarImpact > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-700">Financial Impact</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${insight.dollarImpact.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">Estimated impact if addressed</p>
            </div>
          )}

          {/* This part of the code displays context information from real dashboard data */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Analysis Context</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Analysis Basis:</strong> Current operational data, performance metrics, and historical patterns
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {contextInfo.map((info, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                    {info}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* This part of the code renders AI-prioritized suggested actions (most important first) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Suggested Actions</h3>
            <p className="text-xs text-blue-700 mb-4">Ordered by priority (most important first)</p>
            <div className="space-y-3">
              {insight.suggestedActions.map((action, index) => {
                const priorityLabel = index === 0 ? 'HIGH PRIORITY' : 
                                    index === insight.suggestedActions.length - 1 ? 'SUPPORTING' : 
                                    'MEDIUM PRIORITY';
                const priorityColor = index === 0 ? 'text-red-600 bg-red-50 border-red-200' : 
                                     index === insight.suggestedActions.length - 1 ? 'text-gray-600 bg-gray-50 border-gray-200' : 
                                     'text-orange-600 bg-orange-50 border-orange-200';
                
                return (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action, index)}
                    disabled={creating || processingActionId !== null}
                    className="w-full text-left p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{action}</span>
                      </div>
                      {processingActionId === index ? (
                        <div className="flex items-center text-blue-600 ml-3">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-xs">Creating Workflow...</span>
                        </div>
                      ) : (
                        <span className="text-xs text-blue-600 font-medium ml-3">+ Add to Workflows</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* This part of the code provides additional insight metadata */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>Created: {new Date(insight.createdAt).toLocaleString()}</p>
            <p>Source: {insight.source.replace('_', ' ')} • Type: AI Analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
