import React from 'react';

interface OrdersAILoadingMessageProps {
  className?: string;
}

// This part of the code creates a rich, contextual AI loading experience for the Orders page
// Uses Chief Fulfillment Officer persona with detailed order fulfillment analysis
export const OrdersAILoadingMessage: React.FC<OrdersAILoadingMessageProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mt-1 mr-4 flex-shrink-0"></div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-green-800 mb-2">
            🤖 Chief Fulfillment Officer AI Analyzing
          </h4>
          <p className="text-sm text-green-700 mb-3">
            Our AI Fulfillment Director is performing deep analysis of order patterns, delivery performance, 
            supplier reliability, and fulfillment bottlenecks to optimize your order management strategy 
            and enhance customer satisfaction...
          </p>
          <div className="space-y-2 text-xs text-green-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span>Identifying at-risk orders and delivery delays</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <span>Analyzing supplier performance and fulfillment capacity</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.4s'}}></div>
              <span>Calculating customer impact and revenue protection strategies</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.6s'}}></div>
              <span>Generating specific order escalation and resolution workflows</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
