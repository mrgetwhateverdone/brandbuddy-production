// This part of the code provides simplified React hooks that use the WorkflowCreationService
// It provides a clean interface between React components and the workflow service layer

import { useState, useEffect, useCallback } from 'react';
import { workflowCreationService } from '../services/workflowCreationService';
import { CreatedWorkflow } from '../utils/workflowStorage';

// This part of the code manages all workflow state and provides automatic refresh on navigation and focus changes
export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<CreatedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  // This part of the code loads workflows from the service with error handling
  const loadWorkflows = useCallback(() => {
    try {
      const storedWorkflows = workflowCreationService.getWorkflows();
      setWorkflows(storedWorkflows);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // This part of the code sets up automatic refresh listeners for cross-tab updates and navigation changes
  useEffect(() => {
    loadWorkflows(); // Initial load

    // This part of the code listens for workflow creation events (your exact pattern)
    const handleWorkflowCreated = () => {
      loadWorkflows(); // ← THIS UPDATES THE WORKFLOWS LIST
    };

    // Listen for localStorage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cargocore_workflows') {
        loadWorkflows();
      }
    };

    // Listen for window focus to refresh when user navigates back
    const handleWindowFocus = () => {
      loadWorkflows();
    };

    // Listen for the custom workflow creation event
    window.addEventListener('workflowCreated', handleWorkflowCreated);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      // Clean up listeners when component unmounts
      window.removeEventListener('workflowCreated', handleWorkflowCreated);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadWorkflows]);

  // This part of the code updates workflow status using the service
  const updateWorkflowStatus = useCallback((workflowId: string, updates: Partial<CreatedWorkflow>) => {
    try {
      const success = workflowCreationService.updateWorkflow(workflowId, updates);
      if (success) {
        loadWorkflows(); // Refresh from service
      }
    } catch (error) {
      console.error('Failed to update workflow:', error);
    }
  }, [loadWorkflows]);

  // This part of the code removes a workflow using the service
  const removeWorkflow = useCallback((workflowId: string) => {
    try {
      const success = workflowCreationService.deleteWorkflow(workflowId);
      if (success) {
        loadWorkflows(); // Refresh from service
      }
    } catch (error) {
      console.error('Failed to remove workflow:', error);
    }
  }, [loadWorkflows]);

  // This part of the code calculates real-time statistics using the service
  const stats = workflowCreationService.getWorkflowStats();

  // This part of the code filters workflows by status for tab display
  const workflowsByStatus = {
    todo: workflows.filter(w => w.status === 'todo'),
    inProgress: workflows.filter(w => w.status === 'in_progress'),
    completed: workflows.filter(w => w.status === 'completed')
  };

  return {
    workflows,
    loading,
    stats,
    workflowsByStatus,
    updateWorkflowStatus,
    removeWorkflow,
    refreshWorkflows: loadWorkflows
  };
};

// This part of the code provides workflow creation with custom event dispatch system (ChatGPT's recommended scalable pattern)
interface CreateWorkflowInput {
  action: {
    label: string;
    type: 'create_workflow';
    target?: string;
    values?: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  source: string;
  sourceId: string;
  insightTitle: string;
}

export const useWorkflowCreation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkflow = useCallback(async ({ action, source, sourceId, insightTitle }: CreateWorkflowInput) => {
    setLoading(true);
    setError(null);

    // This part of the code adds defensive validation to prevent crashes (ChatGPT's recommendation)
    if (!action || !action.label || !action.type || !action.priority) {
      const errorMsg = `Invalid action object passed to createWorkflow: ${JSON.stringify(action)}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!source || !sourceId || !insightTitle) {
      const errorMsg = `Missing required parameters: source=${source}, sourceId=${sourceId}, insightTitle=${insightTitle}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // THIS IS THE KEY LINE - Creates the workflow using the service
      const workflow = workflowCreationService.createWorkflowFromAction(
        action,     // ← The button action data
        source,     // ← "ai_insight" 
        sourceId,   // ← insight.id
        insightTitle // ← insight.title
      );

      // Store success message and dispatch event safely
      const successMessage = `Workflow "${workflow.title}" has been created`;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('workflow_success_message', successMessage);
          
          // CRITICAL: Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('workflowCreated', { 
            detail: { 
              workflow, 
              message: successMessage,
              insightTitle: insightTitle || workflow.title 
            }
          }));
          
          console.log('✅ Workflow created successfully:', workflow.id);
        } catch (eventError) {
          console.error('Event dispatch error:', eventError);
          // Don't let event dispatch errors break workflow creation
        }
      }

      return workflow;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to create workflow:', err);
      throw new Error(`Unable to create workflow: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createWorkflow,
    creating: loading,
    error
  };
};
