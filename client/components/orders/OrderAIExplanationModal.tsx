import { useState, useEffect } from "react";
import { X, Loader2, Brain, AlertCircle } from "lucide-react";
import type { OrderData } from "@/types/api";
import { useOrderSuggestionSilent } from "@/hooks/useOrdersData";

interface OrderAIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderData | null;
}

export function OrderAIExplanationModal({ isOpen, onClose, order }: OrderAIExplanationModalProps) {
  const [explanation, setExplanation] = useState<string>("");
  const orderSuggestionMutation = useOrderSuggestionSilent();

  // This part of the code generates AI explanation when modal opens with an order
  useEffect(() => {
    if (isOpen && order) {
      setExplanation("");
      // Reset mutation state and generate AI explanation for the order
      orderSuggestionMutation.reset();
      orderSuggestionMutation.mutate(order);
    }
  }, [isOpen, order?.order_id]); // Only depend on isOpen and order ID to prevent excessive calls

  // This part of the code handles the mutation result
  useEffect(() => {
    if (orderSuggestionMutation.isSuccess && orderSuggestionMutation.data) {
      setExplanation(orderSuggestionMutation.data.suggestion);
    } else if (orderSuggestionMutation.isError) {
      setExplanation("Unable to generate AI explanation at this time. Please try again later.");
    }
  }, [orderSuggestionMutation.isSuccess, orderSuggestionMutation.isError, orderSuggestionMutation.data]);

  // This part of the code handles backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // This part of the code handles escape key press to close modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // This part of the code formats dates for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // This part of the code determines the color for order status badges
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('delivered')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('shipped') || statusLower.includes('transit')) return 'bg-blue-100 text-blue-800';
    if (statusLower.includes('processing') || statusLower.includes('pending')) return 'bg-yellow-100 text-yellow-800';
    if (statusLower.includes('delayed') || statusLower.includes('at_risk')) return 'bg-red-100 text-red-800';
    if (statusLower.includes('cancelled')) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  // This part of the code determines the color for SLA status badges
  const getSLAColor = (slaStatus: string) => {
    const slaLower = slaStatus.toLowerCase();
    if (slaLower.includes('on_time') || slaLower.includes('on time')) return 'bg-green-100 text-green-800';
    if (slaLower.includes('at_risk') || slaLower.includes('at risk')) return 'bg-yellow-100 text-yellow-800';
    if (slaLower.includes('breach') || slaLower.includes('late')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!isOpen || !order) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* This part of the code creates the dark backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* This part of the code creates the modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Order Analysis</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Intelligent insights for Order {order.order_id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Order Details Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Order ID:</span>
                    <p className="text-sm text-gray-900 mt-1">{order.order_id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date:</span>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(order.created_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Brand:</span>
                    <p className="text-sm text-gray-900 mt-1">{order.brand_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Supplier:</span>
                    <p className="text-sm text-gray-900 mt-1">{order.supplier || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">SLA Status:</span>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSLAColor(order.sla_status)}`}>
                        {order.sla_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                {order.expected_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Expected Date:</span>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(order.expected_date)}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Expected Quantity:</span>
                    <p className="text-sm text-gray-900 mt-1">{order.expected_quantity}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Received Quantity:</span>
                    <p className="text-sm text-gray-900 mt-1">{order.received_quantity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">AI Analysis & Recommendations</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {orderSuggestionMutation.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                      <p className="text-blue-800 font-medium">Analyzing order data...</p>
                      <p className="text-blue-600 text-sm mt-1">Generating intelligent insights</p>
                    </div>
                  </div>
                ) : orderSuggestionMutation.isError ? (
                  <div className="flex items-center space-x-3 text-amber-800">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Analysis Currently Unavailable</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Unable to generate AI explanation at this time. Please try again later.
                      </p>
                    </div>
                  </div>
                ) : explanation ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">AI Insight</span>
                    </div>
                    <p className="text-blue-900 leading-relaxed">
                      {explanation}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Brain className="h-5 w-5" />
                    <p>Preparing analysis...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
