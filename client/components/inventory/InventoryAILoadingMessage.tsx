import React from 'react';

interface InventoryAILoadingMessageProps {
  className?: string;
}

// This part of the code creates a rich, contextual AI loading experience for the Inventory page
// Uses VP of Inventory Management persona with detailed inventory optimization analysis
export const InventoryAILoadingMessage: React.FC<InventoryAILoadingMessageProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`bg-purple-50 border border-purple-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mt-1 mr-4 flex-shrink-0"></div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-purple-800 mb-2">
            🤖 VP of Inventory Management AI Analyzing
          </h4>
          <p className="text-sm text-purple-700 mb-3">
            Our AI Inventory Director is conducting comprehensive portfolio analysis, evaluating stock levels, 
            turnover rates, supplier performance, carrying costs, and market demand patterns to optimize 
            your inventory investment and maximize profitability...
          </p>
          <div className="space-y-2 text-xs text-purple-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
              <span>Analyzing inventory concentration and distribution patterns</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <span>Identifying excess stock and liquidation opportunities</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.4s'}}></div>
              <span>Calculating carrying costs and working capital optimization</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.6s'}}></div>
              <span>Generating specific SKU-level reorder and liquidation strategies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
