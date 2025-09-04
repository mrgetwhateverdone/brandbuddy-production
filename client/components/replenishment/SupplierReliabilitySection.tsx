import React from "react";
import { Star, TrendingUp, AlertTriangle, CheckCircle, Brain } from "lucide-react";
import type { ProductData } from "@/types/api";
import type { ShipmentData } from "@/types/data";

interface SupplierReliabilitySectionProps {
  products: ProductData[];
  shipments: ShipmentData[];
  isLoading?: boolean;
  onAnalyzeSupplier?: (supplier: any) => void;
}

export function SupplierReliabilitySection({ 
  products, 
  shipments, 
  isLoading,
  onAnalyzeSupplier
}: SupplierReliabilitySectionProps) {
  // This part of the code calculates supplier reliability metrics using real data
  const calculateSupplierMetrics = () => {
    const supplierMap = new Map();
    
    // Process products to get supplier inventory data
    products.forEach(product => {
      if (!product.supplier_name || !product.active) return;
      
      const supplier = supplierMap.get(product.supplier_name) || {
        name: product.supplier_name,
        totalSKUs: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        avgUnitCost: 0,
      };
      
      supplier.totalSKUs++;
      supplier.totalValue += (product.unit_cost || 0) * product.unit_quantity;
      if (product.unit_quantity === 0) supplier.outOfStockCount++;
      if (product.unit_quantity < 10 && product.unit_quantity > 0) supplier.lowStockCount++;
      
      supplierMap.set(product.supplier_name, supplier);
    });
    
    // Calculate reliability scores and risk levels
    const suppliers = Array.from(supplierMap.values()).map(supplier => {
      const stockoutRate = supplier.outOfStockCount / supplier.totalSKUs;
      const lowStockRate = supplier.lowStockCount / supplier.totalSKUs;
      
      // Reliability score: 100% - (stockout penalty + low stock penalty)
      const reliabilityScore = Math.max(0, 100 - (stockoutRate * 50) - (lowStockRate * 20));
      
      // Risk categorization
      let riskLevel = "Low";
      let riskColor = "text-green-600";
      if (reliabilityScore < 70) {
        riskLevel = "High";
        riskColor = "text-red-600";
      } else if (reliabilityScore < 85) {
        riskLevel = "Medium";
        riskColor = "text-orange-600";
      }
      
      return {
        ...supplier,
        reliabilityScore: Math.round(reliabilityScore),
        riskLevel,
        riskColor,
        avgValue: supplier.totalValue / supplier.totalSKUs,
      };
    }).sort((a, b) => b.reliabilityScore - a.reliabilityScore);
    
    return suppliers;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏭 Supplier Reliability Scorecard</h3>
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

  const suppliers = calculateSupplierMetrics();
  const totalSuppliers = suppliers.length;
  const avgReliability = suppliers.reduce((sum, s) => sum + s.reliabilityScore, 0) / totalSuppliers;
  const topPerformer = suppliers[0];
  const highRiskCount = suppliers.filter(s => s.riskLevel === "High").length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* This part of the code displays the section header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-6">🏭 Supplier Reliability Scorecard</h3>
      
      {/* This part of the code displays summary KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600 mb-1">Total Suppliers</div>
          <div className="text-2xl font-bold text-blue-900">{totalSuppliers}</div>
          <div className="text-xs text-blue-600">Active partnerships</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-600 mb-1">Avg Reliability</div>
          <div className="text-2xl font-bold text-green-900">{Math.round(avgReliability)}%</div>
          <div className="text-xs text-green-600">Portfolio performance</div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm font-medium text-yellow-600 mb-1 flex items-center">
            <Star className="h-3 w-3 mr-1" />
            Top Performer
          </div>
          <div className="text-lg font-bold text-yellow-900">{topPerformer?.reliabilityScore || 0}%</div>
          <div className="text-xs text-yellow-600 truncate">{topPerformer?.name || "N/A"}</div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-600 mb-1">High Risk</div>
          <div className="text-2xl font-bold text-red-900">{highRiskCount}</div>
          <div className="text-xs text-red-600">Suppliers needing attention</div>
        </div>
      </div>

      {/* This part of the code displays the detailed supplier performance table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">Supplier</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">Reliability</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">Total SKUs</th>
              <th className="text-right py-3 px-2 font-medium text-gray-700">Total Value</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">Risk Level</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">Issues</th>
              {onAnalyzeSupplier && (
                <th className="text-center py-3 px-2 font-medium text-gray-700">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier, index) => (
              <tr key={supplier.name} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div className="flex items-center">
                    {index === 0 && <Star className="h-4 w-4 text-yellow-500 mr-2" />}
                    <span className="font-medium text-gray-900">{supplier.name}</span>
                  </div>
                </td>
                <td className="text-center py-3 px-2">
                  <div className="flex items-center justify-center">
                    <div className={`text-lg font-bold ${
                      supplier.reliabilityScore >= 85 ? 'text-green-600' :
                      supplier.reliabilityScore >= 70 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {supplier.reliabilityScore}%
                    </div>
                  </div>
                </td>
                <td className="text-center py-3 px-2 text-gray-700">{supplier.totalSKUs}</td>
                <td className="text-right py-3 px-2 text-gray-700">
                  ${(supplier.totalValue).toLocaleString()}
                </td>
                <td className="text-center py-3 px-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    supplier.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                    supplier.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {supplier.riskLevel}
                  </span>
                </td>
                <td className="text-center py-3 px-2 text-gray-600">
                  {supplier.outOfStockCount + supplier.lowStockCount} SKUs
                </td>
                {onAnalyzeSupplier && (
                  <td className="text-center py-3 px-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyzeSupplier(supplier);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                      title="Get AI analysis for this supplier"
                    >
                      <Brain className="h-3.5 w-3.5 mr-1" />
                      Analyze Supplier
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* This part of the code displays methodology explanation */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Methodology:</strong> Reliability scores based on stock availability (50% penalty for stockouts, 20% penalty for low stock). 
          Risk levels: High (&lt;70%), Medium (70-84%), Low (≥85%).
        </p>
      </div>
    </div>
  );
}
