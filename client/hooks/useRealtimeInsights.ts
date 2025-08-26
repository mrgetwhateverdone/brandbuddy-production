import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * This part of the code provides real-time insight streaming capabilities
 * Uses Server-Sent Events (SSE) for real-time updates when insights are generated
 * Automatically updates React Query cache with new insights
 */

interface RealtimeInsight {
  type: 'insight-updated' | 'cache-invalidated' | 'error';
  namespace: string;
  data?: any;
  timestamp: string;
  message?: string;
}

interface UseRealtimeInsightsOptions {
  enabled?: boolean;
  namespaces?: string[]; // Which insight types to listen for
  onUpdate?: (insight: RealtimeInsight) => void;
  reconnectDelay?: number;
}

export const useRealtimeInsights = (options: UseRealtimeInsightsOptions = {}) => {
  const {
    enabled = true,
    namespaces = ['dashboard-insights', 'orders-insights'],
    onUpdate,
    reconnectDelay = 5000,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<RealtimeInsight | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * This part of the code establishes SSE connection for real-time updates
   */
  const connect = () => {
    if (!enabled || eventSourceRef.current) return;

    try {
      setConnectionStatus('connecting');
      console.log('🔴 Connecting to real-time insights stream...');

      // This part of the code creates SSE connection to our streaming endpoint
      const params = new URLSearchParams({
        namespaces: namespaces.join(','),
      });
      
      eventSourceRef.current = new EventSource(`/api/insights-stream?${params}`);

      eventSourceRef.current.onopen = () => {
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        console.log('✅ Real-time insights stream connected');
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const insight: RealtimeInsight = JSON.parse(event.data);
          console.log('📡 Real-time insight received:', insight.type, insight.namespace);
          
          setLastUpdate(insight);
          
          // This part of the code updates React Query cache automatically
          handleInsightUpdate(insight);
          
          // Call user callback
          onUpdate?.(insight);
          
        } catch (error) {
          console.error('❌ Failed to parse real-time insight:', error);
        }
      };

      eventSourceRef.current.onerror = () => {
        console.log('❌ Real-time insights stream error');
        setConnectionStatus('error');
        
        // This part of the code handles automatic reconnection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        if (enabled && reconnectAttempts < 5) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };

    } catch (error) {
      console.error('❌ Failed to connect to real-time insights:', error);
      setConnectionStatus('error');
    }
  };

  /**
   * This part of the code handles different types of insight updates
   */
  const handleInsightUpdate = (insight: RealtimeInsight) => {
    switch (insight.type) {
      case 'insight-updated':
        // This part of the code invalidates and refetches specific insights
        if (insight.namespace === 'dashboard-insights') {
          queryClient.invalidateQueries({ queryKey: ['dashboard-insights'] });
        } else if (insight.namespace === 'orders-insights') {
          queryClient.invalidateQueries({ queryKey: ['orders-insights'] });
        }
        console.log(`🔄 Cache invalidated for ${insight.namespace}`);
        break;

      case 'cache-invalidated':
        // This part of the code handles cache invalidation events
        queryClient.invalidateQueries({ queryKey: [insight.namespace] });
        console.log(`💾 Cache cleared for ${insight.namespace}`);
        break;

      case 'error':
        console.error('❌ Real-time insight error:', insight.message);
        break;
    }
  };

  /**
   * This part of the code disconnects from the real-time stream
   */
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    console.log('🔴 Real-time insights stream disconnected');
  };

  /**
   * This part of the code manages connection lifecycle
   */
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, namespaces.join(',')]);

  /**
   * This part of the code provides manual reconnection capability
   */
  const reconnect = () => {
    disconnect();
    setReconnectAttempts(0);
    if (enabled) {
      setTimeout(connect, 1000);
    }
  };

  return {
    connectionStatus,
    lastUpdate,
    reconnectAttempts,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    hasError: connectionStatus === 'error',
    reconnect,
    disconnect,
  };
};

/**
 * This part of the code provides a simplified hook for dashboard real-time updates
 */
export const useDashboardRealtimeInsights = () => {
  return useRealtimeInsights({
    namespaces: ['dashboard-insights', 'daily-brief'],
    onUpdate: (insight) => {
      console.log('📊 Dashboard insight updated:', insight.type);
    },
  });
};

/**
 * This part of the code provides real-time updates for orders page
 */
export const useOrdersRealtimeInsights = () => {
  return useRealtimeInsights({
    namespaces: ['orders-insights'],
    onUpdate: (insight) => {
      console.log('📦 Orders insight updated:', insight.type);
    },
  });
};

export default useRealtimeInsights;
