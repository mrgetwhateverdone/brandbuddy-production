import React from 'react';

interface SLAAILoadingMessageProps {
  className?: string;
}

// This part of the code creates a rich, contextual AI loading experience for the SLA Performance page
// Uses Chief Supply Chain Officer persona with detailed service level analysis
export const SLAAILoadingMessage: React.FC<SLAAILoadingMessageProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mt-1 mr-4 flex-shrink-0"></div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-red-800 mb-2">
            🤖 Chief Supply Chain Officer AI Analyzing
          </h4>
          <p className="text-sm text-red-700 mb-3">
            Our AI Supply Chain Director is evaluating service level agreements, delivery performance, 
            compliance rates, supplier accountability, and customer impact to ensure contractual 
            commitments are met and optimize supply chain reliability...
          </p>
          <div className="space-y-2 text-xs text-red-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></div>
              <span>Measuring SLA compliance vs. 95% performance targets</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <span>Identifying at-risk shipments and potential service failures</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.4s'}}></div>
              <span>Calculating financial impact of service level breaches</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.6s'}}></div>
              <span>Generating supplier accountability and performance improvement strategies</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-red-500 font-medium">
            ✨ Ensuring service excellence and customer satisfaction for BrandBuddy
          </div>
        </div>
      </div>
    </div>
  );
};
