import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { internalApi } from "@/services/internalApi";
import type { ChatMessage, ChatResponse } from "@/types/api";
import { Send, MessageCircle, Zap, BarChart3, Package, AlertTriangle } from "lucide-react";
import { useSettingsIntegration } from "@/hooks/useSettingsIntegration";

/**
 * This part of the code defines the AI Assistant page with real-time chat functionality
 * Integrates with CargoCore operational data for contextual intelligence
 */
export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { getAISettings } = useSettingsIntegration();

  /**
   * This part of the code defines quick action buttons for immediate operational insights
   * Each action triggers specific prompts that leverage real app data
   */
  const quickActions = [
    {
      id: "top-brands",
      label: "Name my top brands",
      prompt: "Based on my current operational data, name my top 5 brands by total activity (SKUs + shipments). Include specific metrics for each brand and their operational performance.",
      icon: <BarChart3 className="h-4 w-4" />,
      color: "bg-blue-500"
    },
    {
      id: "warehouse-status", 
      label: "List my warehouses",
      prompt: "List all my active warehouses with their current SLA performance, shipment volume, and operational status. Rank them by performance and identify any that need attention.",
      icon: <Package className="h-4 w-4" />,
      color: "bg-green-500"
    },
    {
      id: "daily-priorities",
      label: "What should I act on today?",
      prompt: "Analyze my current operations and identify the top 3-5 most critical issues I should address today. Focus on at-risk shipments, processing problems, and financial impact.",
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "bg-amber-500"
    },
    {
      id: "at-risk-orders",
      label: "Show at-risk orders",
      prompt: "Identify all shipments and orders that are currently at-risk. Include quantity discrepancies, cancelled orders, and delayed shipments with their potential financial impact.",
      icon: <Zap className="h-4 w-4" />,
      color: "bg-red-500"
    }
  ];

  /**
   * This part of the code handles sending messages to the AI assistant
   * Includes real operational context for intelligent responses
   */
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const newUserMessage: ChatMessage = {
      role: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };

    // This part of the code adds user message and shows loading state
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      // This part of the code gets user's AI settings and sends chat request
      const aiSettings = getAISettings();
      const response: ChatResponse = await internalApi.sendChatMessage({
        message: messageText.trim(),
        conversation: messages,
        includeContext: true
      }, aiSettings);

      // This part of the code adds AI response to conversation
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: response.timestamp
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * This part of the code handles quick action button clicks
   * Sends predefined prompts with real operational context
   */
  const handleQuickAction = (action: typeof quickActions[0]) => {
    sendMessage(action.prompt);
  };

  /**
   * This part of the code handles keyboard shortcuts for better UX
   * Enter to send, Shift+Enter for new line
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  /**
   * This part of the code auto-scrolls to newest messages
   * Ensures user always sees the latest conversation
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * This part of the code auto-focuses input when not loading
   * Improves user experience for continuous conversation
   */
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto h-full">

        {/* This part of the code creates the main chat layout with fixed height */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-[calc(100vh-180px)] min-h-[600px]">
          
          {/* This part of the code creates the chat conversation area with fixed dimensions */}
          <div className="lg:col-span-3 h-full">
            <Card className="bg-white shadow-sm rounded-lg overflow-hidden h-full flex flex-col">
              <CardHeader className="border-b border-gray-200 pb-4 flex-shrink-0">
                <CardTitle className="text-lg font-semibold text-gray-900">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                
                {/* This part of the code creates the scrollable message area with fixed height */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <div className="space-y-3">
                        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-gray-700 font-medium">Hello, I am your Brand Buddy Agent</p>
                          <p className="text-sm text-gray-500">
                            Ask me anything about your operations, or use the quick actions
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg break-words ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-50 text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed word-wrap break-words">
                            {message.content}
                          </p>
                          {message.timestamp && (
                            <p className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* This part of the code shows loading indicator when AI is responding */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex items-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-gray-600">BrandBuddy AI is thinking...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* This part of the code shows error messages if they occur */}
                {error && (
                  <div className="p-4 border-t border-gray-200">
                    <ErrorDisplay 
                      message={error} 
                      onRetry={() => setError(null)}
                    />
                  </div>
                )}

                {/* This part of the code creates the message input area - always visible */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg flex-shrink-0">
                  <div className="flex space-x-3">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Ask me about your operations, inventory, costs, or any business insights..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      className="flex-1 min-h-[50px] max-h-32 resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-black rounded-lg"
                      rows={2}
                    />
                    <Button
                      onClick={() => sendMessage(inputMessage)}
                      disabled={!inputMessage.trim() || isLoading}
                      className="px-4 py-2 h-auto bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift + Enter for new line
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* This part of the code creates the quick actions sidebar with fixed height */}
          <div className="lg:col-span-1 h-full">
            <Card className="bg-white shadow-sm rounded-lg overflow-hidden h-full flex flex-col">
              <CardHeader className="border-b border-gray-200 pb-4 flex-shrink-0">
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                <p className="text-sm text-gray-600">
                  Get instant insights about your operations
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="w-full h-auto p-3 hover:bg-gray-50 border-gray-200 bg-white min-h-[60px]"
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                  >
                    <div className="flex items-start gap-3 w-full text-left">
                      <div className={`p-1.5 rounded ${action.color} text-white flex-shrink-0`}>
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium leading-relaxed text-gray-900 flex-1 whitespace-normal">
                        {action.label}
                      </span>
                    </div>
                  </Button>
                ))}
                
                {/* This part of the code shows operational context indicator */}
                <div className="mt-auto p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <div className="p-1 bg-blue-500 rounded text-white">
                      <BarChart3 className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-900">Real-Time Context</p>
                      <p className="text-xs text-blue-700 mt-1">
                        AI has access to your live products, shipments, warehouse performance, and brand analytics
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}