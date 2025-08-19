import React from "react";
import { DollarSign, TrendingDown, AlertTriangle, Target } from "lucide-react";
import type { ProductData } from "@/types/api";

interface ReplenishmentKPIs {
  criticalSKUs: number;
  replenishmentValue: number;
  supplierAlerts: number;
  reorderRecommendations: number;
}

interface FinancialImpactSectionProps {
  products: ProductData[];
  kpis: ReplenishmentKPIs;
  isLoading?: boolean;
}

export function FinancialImpactSection({ products, kpis, isLoading }: FinancialImpactSectionProps) {
  // This part of the code calculates comprehensive financial impact metrics using real data
  const calculateFinancialMetrics = () => {
    console.log('💰 Financial Impact Calculator - Processing real data:', {
      totalProducts: products.length,
      replenishmentValue: kpis.replenishmentValue,
      criticalSKUs: kpis.criticalSKUs
    });

    const activeProducts = products.filter(p => p.active);
    const criticalProducts = activeProducts.filter(p => p.unit_quantity < 10);
    const outOfStockProducts = activeProducts.filter(p => p.unit_quantity === 0);
    
    // Stockout risk calculation (potential lost sales)
    const avgDailySales = 2.5; // Estimated daily sales per SKU
    const avgMarkup = 2.2; // 120% markup estimate
    const stockoutRisk = outOfStockProducts.reduce((total, product) => {
      const unitCost = product.unit_cost || 0;
      const retailPrice = unitCost * avgMarkup;
      const lostSalesPerDay = avgDailySales * retailPrice;
      return total + (lostSalesPerDay * 7); // 1 week of lost sales
    }, 0);
    
    // Rush order premium (20% premium for expedited delivery)
    const rushOrderPremium = criticalProducts.reduce((total, product) => {
      const reorderAmount = Math.max(20, 10); // At least 20 units
      const unitCost = product.unit_cost || 0;
      const premiumCost = unitCost * reorderAmount * 0.20; // 20% premium
      return total + premiumCost;
    }, 0);
    
    // Carrying cost optimization (excess inventory costs)
    const excessProducts = activeProducts.filter(p => p.unit_quantity > 100);
    const carryingCostReduction = excessProducts.reduce((total, product) => {
      const excessUnits = Math.max(0, product.unit_quantity - 50); // Optimal level: 50 units
      const unitCost = product.unit_cost || 0;
      const annualCarryingRate = 0.25; // 25% annual carrying cost
      const weeklySavings = (unitCost * excessUnits * annualCarryingRate) / 52;
      return total + weeklySavings;
    }, 0);
    
    // Total financial exposure
    const totalExposure = stockoutRisk + rushOrderPremium;
    const optimizationOpportunity = carryingCostReduction * 52; // Annualized savings
    
    console.log('💰 Financial calculations completed:', {
      stockoutRisk: Math.round(stockoutRisk),
      rushOrderPremium: Math.round(rushOrderPremium),
      carryingCostReduction: Math.round(carryingCostReduction),
      totalExposure: Math.round(totalExposure)
    });
    
    return {
      stockoutRisk: Math.round(stockoutRisk),
      rushOrderPremium: Math.round(rushOrderPremium),
      carryingCosts: Math.round(carryingCostReduction * 4), // Monthly estimate
      totalExposure: Math.round(totalExposure),
      optimizationOpportunity: Math.round(optimizationOpportunity),
      outOfStockCount: outOfStockProducts.length,
      criticalCount: criticalProducts.length,
      excessCount: excessProducts.length,
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Financial Impact Calculator</h3>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const financials = calculateFinancialMetrics();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* This part of the code displays the section header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Financial Impact Calculator</h3>
        <p className="text-sm text-gray-600">
          Comprehensive breakdown of the <strong>${kpis.replenishmentValue.toLocaleString()}</strong> replenishment value with risk analysis
        </p>
      </div>
      
      {/* This part of the code displays financial impact metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-600 mb-1 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Stockout Risk
          </div>
          <div className="text-xl font-bold text-red-900">${financials.stockoutRisk.toLocaleString()}</div>
          <div className="text-xs text-red-600">{financials.outOfStockCount} SKUs at risk</div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-600 mb-1 flex items-center">
            <TrendingDown className="h-3 w-3 mr-1" />
            Rush Order Premium
          </div>
          <div className="text-xl font-bold text-orange-900">${financials.rushOrderPremium.toLocaleString()}</div>
          <div className="text-xs text-orange-600">{financials.criticalCount} urgent orders</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600 mb-1">Carrying Costs</div>
          <div className="text-xl font-bold text-blue-900">${financials.carryingCosts.toLocaleString()}</div>
          <div className="text-xs text-blue-600">Monthly excess costs</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-600 mb-1">Total Exposure</div>
          <div className="text-xl font-bold text-purple-900">${financials.totalExposure.toLocaleString()}</div>
          <div className="text-xs text-purple-600">Combined risk value</div>
        </div>
      </div>

      {/* This part of the code displays financial optimization recommendations */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
          <Target className="h-4 w-4 mr-2 text-green-600" />
          Financial Optimization Recommendations
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Immediate Actions (This Week)</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• Place urgent orders for {financials.outOfStockCount} out-of-stock SKUs</li>
              <li>• Expedite {financials.criticalCount} critical replenishments</li>
              <li>• Avoid ${financials.stockoutRisk.toLocaleString()} in potential lost sales</li>
              <li>• Review ${financials.excessCount} overstocked items for returns</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Optimization Opportunities</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• Save ${Math.round(financials.optimizationOpportunity / 1000)}K annually by optimizing inventory levels</li>
              <li>• Reduce rush order costs by improving demand forecasting</li>
              <li>• Negotiate better terms with underperforming suppliers</li>
              <li>• Implement automated reorder points for top SKUs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* This part of the code displays cost breakdown visualization */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h5 className="font-medium text-gray-800 mb-3">Cost Breakdown by Category</h5>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Stockout Risk (Lost Sales)</span>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${(financials.stockoutRisk / financials.totalExposure) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-20 text-right">
                ${financials.stockoutRisk.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rush Order Premiums</span>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${(financials.rushOrderPremium / financials.totalExposure) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-20 text-right">
                ${financials.rushOrderPremium.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Optimization Savings (Annual)</span>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>
              <span className="text-sm font-medium text-green-600 w-20 text-right">
                +${financials.optimizationOpportunity.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* This part of the code displays methodology and assumptions */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Methodology:</strong> Stockout risk based on 7-day sales loss (2.5 units/day, 120% markup). 
          Rush premiums at 20% expedite cost. Carrying costs at 25% annual rate. Calculations use real product costs and quantities.
        </p>
      </div>
    </div>
  );
}
