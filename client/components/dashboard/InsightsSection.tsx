import { TriangleAlert, Info, Target, DollarSign, Plus } from "lucide-react";
import { useState } from "react";
import type { AIInsight } from "@/types/api";
import { InsightOverlay } from "../InsightOverlay";
import { useWorkflowCreation } from "../../hooks/useWorkflows";
import { BrainIcon } from "../ui/BrainIcon";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";
import { FormattedCurrency } from "../ui/formatted-value";

interface InsightsSectionProps {
  insights: AIInsight[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  loadingMessage?: string;
}

export function InsightsSection({ 
  insights, 
  isLoading, 
  title = "Insights",
  subtitle,
  loadingMessage = "Analyzing data..."
}: InsightsSectionProps) {
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const { createWorkflow, creating } = useWorkflowCreation();
  const { isPageAIEnabled, formatCurrency, getAgentSettings } = useSettingsIntegration();

  // This part of the code checks if AI insights should be shown on dashboard
  if (!isPageAIEnabled('dashboard')) {
    return null;
  }

  // This part of the code filters insights based on agent settings
  const agentSettings = getAgentSettings();
  const filteredInsights = insights.filter(insight => {
    // Only show insights if the corresponding agent is enabled
    if (insight.source === 'dashboard_agent' && !agentSettings.dashboard.enabled) {
      return false;
    }
    if (insight.source === 'orders_agent' && !agentSettings.orders.enabled) {
      return false;
    }
    if (insight.source === 'analytics_agent' && !agentSettings.analytics.enabled) {
      return false;
    }
    if (insight.source === 'inventory_agent' && !agentSettings.inventory.enabled) {
      return false;
    }
    return true;
  });

  // This part of the code handles quick workflow creation from the + button without opening overlay (your exact pattern)
  const handleQuickAdd = async (e: React.MouseEvent, insight: AIInsight) => {
    e.stopPropagation(); // Prevent card click
    
    // This part of the code validates insight data before attempting workflow creation (ChatGPT's defensive approach)
    if (!insight || !insight.title || !insight.id) {
      console.error('Invalid insight data for workflow creation:', insight);
      alert('Invalid insight data. Cannot create workflow.');
      return;
    }

    console.log('Creating workflow from insight:', {
      id: insight.id,
      title: insight.title,
      severity: insight.severity,
      suggestedActions: insight.suggestedActions
    });

    try {
      // This part of the code creates workflow from the FIRST (most important) suggested action only
      const primaryAction = insight.suggestedActions && insight.suggestedActions.length > 0 
        ? insight.suggestedActions[0] 
        : insight.title || 'Review insight';
      
      await createWorkflow({
        action: {
          label: primaryAction,
          type: 'create_workflow',
          target: 'insight_management',
          values: insight.suggestedActions || [],
          priority: (insight.severity === 'critical' ? 'critical' :
                    insight.severity === 'warning' ? 'high' : 'medium') as 'low' | 'medium' | 'high' | 'critical',
        },
        source: 'ai_insight',
        sourceId: insight.id || `fallback_${Date.now()}`,
        insightTitle: insight.title || 'Untitled Workflow',
      });
      
    } catch (error) {
      console.error('Failed to create workflow:', error);
      // This part of the code shows user-friendly error without crashing the app
      alert('Failed to create workflow. Please try again.');
    }
  };

  // This part of the code opens the detailed overlay when the card is clicked
  const handleCardClick = (insight: AIInsight) => {
    setSelectedInsight(insight);
  };

  const getInsightIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <TriangleAlert className="h-5 w-5" />;
      case "warning":
        return <TriangleAlert className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getInsightStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Insights</h2>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">
          {subtitle || `${filteredInsights.length} insights from Dashboard Agent`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInsights?.map((insight) => (
          <div
            key={insight.id}
            onClick={() => handleCardClick(insight)}
            className={`w-full border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] relative ${getInsightStyles(insight.severity)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                {getInsightIcon(insight.severity)}
                <h3 className="ml-2 font-semibold text-sm">{insight.title}</h3>
                {/* This part of the code adds a blue brain icon to indicate AI-generated content */}
                <BrainIcon className="h-5 w-5 ml-2 text-blue-600" />
              </div>
              {/* This part of the code adds the small + button for quick workflow creation */}
              <button
                onClick={(e) => handleQuickAdd(e, insight)}
                disabled={creating}
                className="p-1 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors disabled:opacity-50"
                title="Quick add to workflows"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm mb-3 leading-relaxed">
              {insight.description}
            </p>

            {insight.dollarImpact > 0 && (
              <div className="flex items-center text-sm font-medium mb-3">
                <DollarSign className="h-4 w-4 mr-1" />
                <FormattedCurrency value={insight.dollarImpact} /> impact
              </div>
            )}

            <button className="flex items-center text-sm font-medium hover:underline">
              <Target className="h-4 w-4 mr-1" />
              Track
            </button>
          </div>
        ))}
      </div>

      {filteredInsights.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Check OpenAI Connection
          </p>
        </div>
      )}

      {/* This part of the code renders the insight overlay when an insight is selected */}
      {selectedInsight && (
        <InsightOverlay
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          insight={selectedInsight}
          agentName="AI Agent"
        />
      )}
    </div>
  );
}
