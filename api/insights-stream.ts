import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * This part of the code provides Server-Sent Events (SSE) streaming for real-time insights
 * Streams insight updates, cache events, and system notifications to connected clients
 * Enables real-time UI updates without polling
 */

interface StreamClient {
  id: string;
  response: VercelResponse;
  namespaces: string[];
  connectedAt: number;
}

// This part of the code maintains active SSE connections (in-memory for simplicity)
// In production, this could be moved to Redis or another shared store
const activeClients = new Map<string, StreamClient>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { namespaces = 'dashboard-insights,orders-insights' } = req.query;
    const clientNamespaces = (namespaces as string).split(',').map(n => n.trim());
    
    console.log('🔴 New SSE client connecting for namespaces:', clientNamespaces);

    // This part of the code sets up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // This part of the code generates unique client ID
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // This part of the code registers the client
    const client: StreamClient = {
      id: clientId,
      response: res,
      namespaces: clientNamespaces,
      connectedAt: Date.now(),
    };
    
    activeClients.set(clientId, client);
    console.log(`✅ SSE client registered: ${clientId} (${activeClients.size} total clients)`);

    // This part of the code sends initial connection message
    sendToClient(client, {
      type: 'connected',
      message: 'Real-time insights stream connected',
      namespaces: clientNamespaces,
      clientId,
    });

    // This part of the code sets up periodic heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (activeClients.has(clientId)) {
        sendToClient(client, {
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        });
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Every 30 seconds

    // This part of the code handles client disconnect
    req.on('close', () => {
      console.log(`🔴 SSE client disconnected: ${clientId}`);
      activeClients.delete(clientId);
      clearInterval(heartbeatInterval);
    });

    req.on('error', (error) => {
      console.error(`❌ SSE client error for ${clientId}:`, error);
      activeClients.delete(clientId);
      clearInterval(heartbeatInterval);
    });

    // This part of the code simulates periodic insight updates for demo
    // In production, this would be triggered by actual insight generation events
    const simulateUpdates = setInterval(() => {
      if (activeClients.has(clientId)) {
        // Simulate occasional insight updates (for demo purposes)
        if (Math.random() > 0.8) { // 20% chance every interval
          const randomNamespace = clientNamespaces[Math.floor(Math.random() * clientNamespaces.length)];
          
          broadcastToNamespace(randomNamespace, {
            type: 'insight-updated',
            namespace: randomNamespace,
            message: `New insights available for ${randomNamespace}`,
            timestamp: new Date().toISOString(),
            data: {
              insightCount: Math.floor(Math.random() * 5) + 1,
              priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            },
          });
        }
      } else {
        clearInterval(simulateUpdates);
      }
    }, 60000); // Every minute

  } catch (error) {
    console.error('❌ SSE stream error:', error);
    res.status(500).json({ error: 'Failed to establish SSE stream' });
  }
}

/**
 * This part of the code sends data to a specific client
 */
function sendToClient(client: StreamClient, data: any): void {
  try {
    const eventData = `data: ${JSON.stringify(data)}\n\n`;
    client.response.write(eventData);
  } catch (error) {
    console.error(`❌ Failed to send to client ${client.id}:`, error);
    activeClients.delete(client.id);
  }
}

/**
 * This part of the code broadcasts to all clients interested in a namespace
 */
function broadcastToNamespace(namespace: string, data: any): void {
  let sentCount = 0;
  
  for (const [clientId, client] of activeClients.entries()) {
    if (client.namespaces.includes(namespace)) {
      sendToClient(client, data);
      sentCount++;
    }
  }
  
  if (sentCount > 0) {
    console.log(`📡 Broadcasted ${data.type} to ${sentCount} clients for namespace: ${namespace}`);
  }
}

/**
 * This part of the code provides utility functions for triggering updates
 * These can be called from other parts of the application
 */

// Export function to trigger insight updates from other endpoints
export function notifyInsightUpdate(namespace: string, data?: any): void {
  broadcastToNamespace(namespace, {
    type: 'insight-updated',
    namespace,
    data,
    timestamp: new Date().toISOString(),
    message: `Insights updated for ${namespace}`,
  });
}

// Export function to notify cache invalidation
export function notifyCacheInvalidation(namespace: string): void {
  broadcastToNamespace(namespace, {
    type: 'cache-invalidated',
    namespace,
    timestamp: new Date().toISOString(),
    message: `Cache invalidated for ${namespace}`,
  });
}

// Export function to get connection stats
export function getConnectionStats(): { activeClients: number; namespaces: string[] } {
  const allNamespaces = new Set<string>();
  
  for (const client of activeClients.values()) {
    client.namespaces.forEach(ns => allNamespaces.add(ns));
  }
  
  return {
    activeClients: activeClients.size,
    namespaces: Array.from(allNamespaces),
  };
}

// Export function to broadcast system messages
export function broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
  const data = {
    type: 'system-message',
    level: type,
    message,
    timestamp: new Date().toISOString(),
  };
  
  for (const client of activeClients.values()) {
    sendToClient(client, data);
  }
  
  console.log(`📢 Broadcasted system message to ${activeClients.size} clients: ${message}`);
}
