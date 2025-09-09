import { useState, useEffect } from "react";
import { X, Loader2, Brain, AlertCircle } from "lucide-react";
import type { InventoryItem } from "@/types/api";
import { useInventoryItemSuggestionSilent } from "@/hooks/useInventoryData";

interface InventoryItemAIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

export function InventoryItemAIExplanationModal({ isOpen, onClose, item }: InventoryItemAIExplanationModalProps) {
  const [explanation, setExplanation] = useState<string>("");
  const inventoryItemSuggestionMutation = useInventoryItemSuggestionSilent();

  // This part of the code cleans up markdown formatting from AI responses
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove ** bold formatting
      .replace(/\*(.*?)\*/g, '$1')     // Remove * italic formatting  
      .replace(/\n{3,}/g, '\n\n');    // Normalize multiple line breaks
  };

  // This part of the code calculates turn factor based on inventory velocity
  const calculateTurnFactor = (item: InventoryItem): number => {
    const onHand = item.on_hand || 0;
    const available = item.available || 0;
    // Estimate monthly usage based on available vs on_hand ratio and days since created
    const daysSinceCreated = item.days_since_created || 1;
    const avgDailyMovement = Math.max(0.1, (onHand - available) / Math.max(daysSinceCreated, 1));
    const estimatedMonthlyUsage = avgDailyMovement * 30;
    if (onHand === 0) return 0;
    return parseFloat((estimatedMonthlyUsage / onHand).toFixed(2));
  };

  // This part of the code generates AI explanation when modal opens with an inventory item
  useEffect(() => {
    if (isOpen && item) {
      setExplanation("");
      // Reset mutation state and generate AI explanation for the inventory item
      inventoryItemSuggestionMutation.reset();
      inventoryItemSuggestionMutation.mutate(item);
    }
  }, [isOpen, item?.sku]); // Only depend on isOpen and SKU to prevent excessive calls

  // This part of the code handles the mutation result
  useEffect(() => {
    if (inventoryItemSuggestionMutation.isSuccess && inventoryItemSuggestionMutation.data) {
      setExplanation(inventoryItemSuggestionMutation.data.suggestion);
    } else if (inventoryItemSuggestionMutation.isError) {
      setExplanation("Unable to generate AI explanation at this time. Please try again later.");
    }
  }, [inventoryItemSuggestionMutation.isSuccess, inventoryItemSuggestionMutation.isError, inventoryItemSuggestionMutation.data]);

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


  // This part of the code determines the color for inventory status badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      case 'Overstocked':
        return 'bg-purple-100 text-purple-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !item) return null;

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
        <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Inventory Analysis</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Intelligent insights for SKU {item.sku}
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
          <div className="flex-1 overflow-y-auto p-6">
            {/* Inventory Item Details Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Item Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">SKU:</span>
                    <p className="text-sm text-gray-900 mt-1">{item.sku}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Product Name:</span>
                    <p className="text-sm text-gray-900 mt-1">{item.product_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Brand:</span>
                    <p className="text-sm text-gray-900 mt-1">{item.brand_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Supplier:</span>
                    <p className="text-sm text-gray-900 mt-1">{item.supplier || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Active:</span>
                    <p className="text-sm text-gray-900 mt-1">{item.active ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">On Hand:</span>
                    <p className="text-sm text-gray-900 mt-1">{item.on_hand.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Committed:</span>
                    <p className="text-sm text-gray-900 mt-1">{item.committed.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Available:</span>
                    <p className="text-sm text-gray-900 mt-1 font-medium">{item.available.toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Unit Cost:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      ${item.unit_cost.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Total Value:</span>
                    <p className="text-sm text-gray-900 mt-1 font-semibold">
                      ${item.total_value.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Turn Factor:</span>
                    <div className="mt-1 flex items-center space-x-2">
                      <p className="text-sm text-gray-900 font-medium">{calculateTurnFactor(item)}</p>
                      <span className="text-xs text-gray-500">(times/month)</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Velocity Rating:</span>
                    <div className="mt-1">
                      {calculateTurnFactor(item) >= 2.0 ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">High</span>
                      ) : calculateTurnFactor(item) >= 1.0 ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Medium</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Low</span>
                      )}
                    </div>
                  </div>
                </div>
                {item.country_of_origin && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Country of Origin:</span>
                    <p className="text-sm text-gray-900 mt-1">{item.country_of_origin}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Days Since Created:</span>
                  <p className="text-sm text-gray-900 mt-1">{item.days_since_created} days</p>
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">AI Analysis & Recommendations</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                {inventoryItemSuggestionMutation.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-3" />
                      <p className="text-green-800 font-medium">Analyzing inventory data...</p>
                      <p className="text-green-600 text-sm mt-1">Generating intelligent insights</p>
                    </div>
                  </div>
                ) : inventoryItemSuggestionMutation.isError ? (
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
                      <Brain className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">AI Insight</span>
                    </div>
                    <div className="text-green-900 leading-relaxed whitespace-pre-line">
                      {cleanMarkdown(explanation)}
                    </div>
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
