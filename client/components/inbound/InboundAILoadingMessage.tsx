import React from 'react';

interface InboundAILoadingMessageProps {
  className?: string;
}

// This part of the code creates a rich, contextual AI loading experience for the Inbound page
// Uses Chief Operations Officer persona with detailed receiving operations analysis
export const InboundAILoadingMessage: React.FC<InboundAILoadingMessageProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`bg-indigo-50 border border-indigo-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mt-1 mr-4 flex-shrink-0"></div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-indigo-800 mb-2">
            🤖 Chief Operations Officer AI Analyzing
          </h4>
          <p className="text-sm text-indigo-700 mb-3">
            Our AI Operations Director is analyzing inbound shipment flows, receiving capacity, 
            dock utilization, supplier delivery performance, and processing efficiency to optimize 
            receiving operations and minimize operational bottlenecks...
          </p>
          <div className="space-y-2 text-xs text-indigo-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></div>
              <span>Analyzing receiving capacity vs. daily arrival volumes</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <span>Evaluating supplier delivery performance and SLA compliance</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.4s'}}></div>
              <span>Calculating processing efficiency and accuracy rates</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.6s'}}></div>
              <span>Generating specific workflow optimizations and resource allocation</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-indigo-500 font-medium">
            ✨ Maximizing receiving operations efficiency for BrandBuddy
          </div>
        </div>
      </div>
    </div>
  );
};
