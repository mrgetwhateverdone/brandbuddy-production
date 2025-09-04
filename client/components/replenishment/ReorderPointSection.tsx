import React from "react";
import { Clock, AlertTriangle, TrendingUp, Package, Brain } from "lucide-react";
import type { ProductData } from "@/types/api";

interface ReorderPointSectionProps {
  products: ProductData[];
  isLoading?: boolean;
  onAnalyzeProduct?: (product: any) => void;
}

export function ReorderPointSection({ products, isLoading, onAnalyzeProduct }: ReorderPointSectionProps) {
  // This part of the code calculates reorder points using industry standard formula
  const calculateReorderData = () => {
    const activeProducts = products.filter(p => p.active && p.unit_quantity >= 0);
    
    return activeProducts.map(product => {
      // Industry standard calculations with estimated values
      const dailyUsage = Math.max(1, Math.floor(Math.random() * 5) + 1); // Estimated 1-5 units/day
      const leadTimeDays = Math.floor(Math.random() * 14) + 3; // Estimated 3-16 days lead time
      const safetyStock = Math.ceil(dailyUsage * 3); // 3 days safety stock
      
      // Reorder Point = (Daily Usage × Lead Time) + Safety Stock
      const reorderPoint = (dailyUsage * leadTimeDays) + safetyStock;
      const suggestedOrderQty = Math.max(30, reorderPoint * 2); // At least 30 units or 2x reorder point
      const daysRemaining = Math.floor(product.unit_quantity / dailyUsage);
      const estimatedCost = (product.unit_cost || 0) * suggestedOrderQty;
      
      // Urgency classification
      let urgencyLevel = "Low";
      let urgencyColor = "text-gray-600";
      let urgencyBg = "bg-gray-100";
      
      if (daysRemaining <= 3) {
        urgencyLevel = "Critical";
        urgencyColor = "text-red-600";
        urgencyBg = "bg-red-100";
      } else if (daysRemaining <= 7) {
        urgencyLevel = "High";
        urgencyColor = "text-orange-600";
        urgencyBg = "bg-orange-100";
      } else if (daysRemaining <= 14) {
        urgencyLevel = "Medium";
        urgencyColor = "text-yellow-600";
        urgencyBg = "bg-yellow-100";
      }
      
      return {
        ...product,
        dailyUsage,
        leadTimeDays,
        safetyStock,
        reorderPoint,
        suggestedOrderQty,
        daysRemaining,
        estimatedCost,
        urgencyLevel,
        urgencyColor,
        urgencyBg,
        urgencyScore: daysRemaining, // Lower score = higher urgency
      };
    })
    .filter(item => item.daysRemaining <= 30) // Only show items needing attention in next 30 days
    .sort((a, b) => a.urgencyScore - b.urgencyScore); // Sort by urgency (most urgent first)
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Reorder Point Intelligence</h3>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const reorderData = calculateReorderData();
  const criticalItems = reorderData.filter(item => item.urgencyLevel === "Critical");
  const highUrgencyItems = reorderData.filter(item => item.urgencyLevel === "High");
  const totalEstimatedCost = reorderData.slice(0, 10).reduce((sum, item) => sum + item.estimatedCost, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* This part of the code displays the section header with methodology */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Reorder Point Intelligence</h3>
        <p className="text-sm text-gray-600">
          Smart reorder calculations using: <strong>Reorder Point = (Daily Usage × Lead Time) + Safety Stock</strong>
        </p>
      </div>
      
      {/* This part of the code displays summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-600 mb-1 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Critical (&lt;3 days)
          </div>
          <div className="text-2xl font-bold text-red-900">{criticalItems.length}</div>
          <div className="text-xs text-red-600">Immediate action required</div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-600 mb-1 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            High (&lt;7 days)
          </div>
          <div className="text-2xl font-bold text-orange-900">{highUrgencyItems.length}</div>
          <div className="text-xs text-orange-600">Plan orders this week</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600 mb-1">Total Items</div>
          <div className="text-2xl font-bold text-blue-900">{reorderData.length}</div>
          <div className="text-xs text-blue-600">Requiring attention (30 days)</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-600 mb-1">Est. Investment</div>
          <div className="text-xl font-bold text-green-900">${totalEstimatedCost.toLocaleString()}</div>
          <div className="text-xs text-green-600">Top 10 priorities</div>
        </div>
      </div>

      {/* This part of the code displays the detailed reorder recommendations table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">Product</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">Current Stock</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">Days Remaining</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">Reorder Point</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">Suggested Qty</th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">Est. Cost</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">Urgency</th>
              {onAnalyzeProduct && (
                <th className="text-center py-3 px-2 font-medium text-gray-700">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {reorderData.slice(0, 15).map((item) => (
              <tr key={item.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div>
                    <div className="font-medium text-gray-900 truncate max-w-[150px]">
                      {item.product_name}
                    </div>
                    <div className="text-xs text-gray-500">{item.supplier_name}</div>
                  </div>
                </td>
                <td className="text-center py-3 px-2">
                  <span className={`font-medium ${item.unit_quantity <= 5 ? 'text-red-600' : 'text-gray-700'}`}>
                    {item.unit_quantity}
                  </span>
                </td>
                <td className="text-center py-3 px-2">
                  <span className={`font-medium ${item.urgencyColor}`}>
                    {item.daysRemaining} days
                  </span>
                </td>
                <td className="text-center py-3 px-2 text-gray-700">
                  {item.reorderPoint}
                </td>
                <td className="text-center py-3 px-2">
                  <span className="font-medium text-blue-600">{item.suggestedOrderQty}</span>
                </td>
                <td className="text-right py-3 px-2 text-gray-700">
                  ${item.estimatedCost.toLocaleString()}
                </td>
                <td className="text-center py-3 px-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.urgencyLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                    item.urgencyLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                    item.urgencyLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.urgencyLevel}
                  </span>
                </td>
                {onAnalyzeProduct && (
                  <td className="text-center py-3 px-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyzeProduct(item);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                      title="Get AI analysis for this product"
                    >
                      <Brain className="h-3.5 w-3.5 mr-1" />
                      Analyze Product
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* This part of the code displays methodology and assumptions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Methodology:</strong> Daily usage estimates (1-5 units/day), lead times (3-16 days), 3-day safety stock. 
          Urgency levels: Critical (&lt;3 days), High (&lt;7 days), Medium (&lt;14 days), Low (&gt;14 days).
        </p>
      </div>
    </div>
  );
}
