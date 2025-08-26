import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * This part of the code provides skeleton loading UI for AI insights
 * Shows while OpenAI generates insights in background for better UX
 */

interface InsightSkeletonProps {
  count?: number;
  showActions?: boolean;
}

export const InsightSkeleton: React.FC<InsightSkeletonProps> = ({ 
  count = 3, 
  showActions = true 
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="bg-gray-50 border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                {/* This part of the code shows animated loading skeleton for insight title */}
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-5 w-48" />
                </div>
                
                {/* This part of the code shows animated loading skeleton for insight description */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              
              {/* This part of the code shows placeholder for close button */}
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* This part of the code shows placeholder for financial impact */}
            <div className="flex items-center space-x-2 mb-4">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
            
            {/* This part of the code shows placeholders for suggested actions */}
            {showActions && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-5/6 rounded-md" />
                  <Skeleton className="h-8 w-4/6 rounded-md" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * This part of the code provides compact skeleton for insight cards
 * Used in smaller spaces or when showing multiple insights
 */
export const InsightSkeletonCompact: React.FC<{ count?: number }> = ({ count = 2 }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="bg-gray-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* This part of the code shows compact insight title skeleton */}
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              
              {/* This part of the code shows compact insight description skeleton */}
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              
              {/* This part of the code shows compact actions skeleton */}
              <div className="flex space-x-2 pt-2">
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * This part of the code provides skeleton for insight loading state message
 * Shows friendly message while AI generates insights
 */
export const InsightLoadingMessage: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
      <div className="flex items-center justify-center space-x-3 mb-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <h3 className="text-lg font-medium text-blue-900">
          Generating AI Insights
        </h3>
      </div>
      <p className="text-blue-700 text-sm">
        Our AI agent is analyzing your operational data to provide strategic recommendations...
      </p>
      <div className="mt-4 flex justify-center space-x-1">
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default InsightSkeleton;
