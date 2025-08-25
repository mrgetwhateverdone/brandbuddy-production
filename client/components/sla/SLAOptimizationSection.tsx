import { Lightbulb, Clock, Zap, Settings, Users, Truck, Package, FileText, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SLAOptimizationRecommendation } from "@/hooks/useSLAData";

interface SLAOptimizationSectionProps {
  recommendations: SLAOptimizationRecommendation[];
  isLoading?: boolean;
}

/**
 * This part of the code displays actionable SLA optimization recommendations
 * Shows prioritized suggestions with impact estimates and implementation guidance
 */
export function SLAOptimizationSection({ recommendations, isLoading }: SLAOptimizationSectionProps) {
  // This part of the code determines the icon for each recommendation type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'supplier':
        return <Users className="h-5 w-5" />;
      case 'route':
        return <Truck className="h-5 w-5" />;
      case 'inventory':
        return <Package className="h-5 w-5" />;
      case 'contract':
        return <FileText className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  // This part of the code determines priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low Priority</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>;
    }
  };

  // This part of the code determines difficulty badge styling
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">Easy</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Medium</Badge>;
      case 'complex':
        return <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-50">Complex</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // This part of the code determines type color styling
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'supplier':
        return 'text-blue-600 bg-blue-50';
      case 'route':
        return 'text-green-600 bg-green-50';
      case 'inventory':
        return 'text-purple-600 bg-purple-50';
      case 'contract':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          SLA Optimization Engine
        </h2>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This part of the code calculates summary statistics
  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
  const easyImplementationCount = recommendations.filter(r => r.difficulty === 'easy').length;
  const quickWinsCount = recommendations.filter(r => r.priority === 'high' && r.difficulty === 'easy').length;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        SLA Optimization Engine
      </h2>

      {/* This part of the code displays optimization summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-red-600">High Priority</div>
              <div className="text-2xl font-bold text-red-900">{highPriorityCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-green-600">Easy Wins</div>
              <div className="text-2xl font-bold text-green-900">{easyImplementationCount}</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-blue-600">Quick Wins</div>
              <div className="text-2xl font-bold text-blue-900">{quickWinsCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* This part of the code displays the recommendations list */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">
            Actionable Recommendations
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Prioritized optimization opportunities with ROI estimates
          </p>
        </div>
        
        <div className="p-6">
          {recommendations && recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => (
                <div key={index} className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  recommendation.priority === 'high' ? 'border-red-200 bg-red-50' :
                  recommendation.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-green-200 bg-green-50'
                }`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(recommendation.type)}`}>
                        {getTypeIcon(recommendation.type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {recommendation.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {getPriorityBadge(recommendation.priority)}
                          {getDifficultyBadge(recommendation.difficulty)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {recommendation.timeline}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {recommendation.type} optimization
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">
                      {recommendation.description}
                    </p>
                  </div>

                  {/* Impact and Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-2">
                        <Zap className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-xs font-medium text-gray-600">ESTIMATED IMPACT</span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">
                        {recommendation.estimatedImpact}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-2">
                        <ArrowRight className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-xs font-medium text-gray-600">ACTION REQUIRED</span>
                      </div>
                      <p className="text-sm text-gray-900">
                        {recommendation.actionRequired}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No optimization recommendations available</p>
              <p className="text-sm text-gray-400 mt-1">
                Your SLA performance is already optimized!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* This part of the code displays implementation guidance */}
      {recommendations.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-2">Implementation Strategy</h4>
              <p className="text-sm text-blue-800">
                Start with <strong>{quickWinsCount} quick wins</strong> to build momentum, then tackle{" "}
                <strong>{highPriorityCount} high-priority items</strong> for maximum impact.{" "}
                Focus on <strong>{easyImplementationCount} easy implementations</strong> first to establish early success and stakeholder buy-in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
