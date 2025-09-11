import React from 'react';

interface ReplenishmentAILoadingMessageProps {
  className?: string;
}

// This part of the code creates a rich, contextual AI loading experience for the Replenishment page
// Uses Chief Procurement Officer persona with detailed procurement strategy analysis
export const ReplenishmentAILoadingMessage: React.FC<ReplenishmentAILoadingMessageProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mt-1 mr-4 flex-shrink-0"></div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-orange-800 mb-2">
            🤖 Chief Procurement Officer AI Analyzing
          </h4>
          <p className="text-sm text-orange-700 mb-3">
            Our AI Procurement Director is evaluating reorder priorities, supplier relationships, 
            lead times, and procurement costs to optimize purchasing decisions and ensure optimal 
            inventory levels while minimizing working capital investment...
          </p>
          <div className="space-y-2 text-xs text-orange-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
              <span>Prioritizing critical reorders based on demand and lead times</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <span>Evaluating supplier performance and delivery reliability</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.4s'}}></div>
              <span>Calculating optimal order quantities and cash flow impact</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.6s'}}></div>
              <span>Generating specific procurement strategies and supplier negotiations</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-orange-500 font-medium">
            ✨ Optimizing procurement excellence and working capital for BrandBuddy
          </div>
        </div>
      </div>
    </div>
  );
};
