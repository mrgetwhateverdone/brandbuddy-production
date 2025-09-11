import React from 'react';

interface DashboardAILoadingMessageProps {
  className?: string;
}

// This part of the code creates a rich, contextual AI loading experience for the Dashboard
// Uses Senior Operations Director persona with detailed analysis breakdown
export const DashboardAILoadingMessage: React.FC<DashboardAILoadingMessageProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mt-1 mr-4 flex-shrink-0"></div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-blue-800 mb-2">
            🤖 Senior Operations Director AI Analyzing
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            Our AI Operations Director is conducting a comprehensive analysis of your supply chain operations, 
            examining shipment patterns, inventory levels, supplier performance, and financial impacts to provide 
            strategic insights and actionable recommendations...
          </p>
          <div className="space-y-2 text-xs text-blue-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              <span>Analyzing operational bottlenecks and performance gaps</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <span>Calculating financial impact estimates and revenue opportunities</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.4s'}}></div>
              <span>Generating executive-level actionable recommendations</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.6s'}}></div>
              <span>Benchmarking performance against industry standards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
