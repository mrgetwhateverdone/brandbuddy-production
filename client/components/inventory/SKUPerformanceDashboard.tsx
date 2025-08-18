import { useMemo } from "react";
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Package, Star, AlertTriangle } from "lucide-react";
import type { InventoryItem } from "@/types/api";

interface SKUPerformanceDashboardProps {
  inventory: InventoryItem[];
  isLoading?: boolean;
}

interface SKUPerformanceMetrics {
  sku: string;
  product_name: string;
  totalValue: number;
  quantity: number;
  unitCost: number;
  velocity: 'fast' | 'medium' | 'slow';
  revenueContribution: number;
  profitMargin: number;
  abcCategory: 'A' | 'B' | 'C';
  daysInInventory: number;
  status: string;
}

export function SKUPerformanceDashboard({ inventory, isLoading }: SKUPerformanceDashboardProps) {
  // This part of the code calculates comprehensive SKU performance metrics
  const skuAnalytics = useMemo(() => {
    if (!inventory || inventory.length === 0) {
      return {
        topPerformers: [],
        bottomPerformers: [],
        velocityBreakdown: { fast: 0, medium: 0, slow: 0 },
        totalPortfolioValue: 0,
        avgMargin: 0,
        abcBreakdown: { A: 0, B: 0, C: 0 }
      };
    }

    // This part of the code calculates performance metrics for each SKU
    const skuMetrics: SKUPerformanceMetrics[] = inventory.map(item => {
      const totalValue = item.total_value || 0;
      const quantity = item.on_hand || 0;
      const unitCost = item.unit_cost || 0;
      
      // Estimated selling price (assuming 40% markup for margin calculation)
      const estimatedSellingPrice = unitCost * 1.4;
      const profitMargin = unitCost > 0 ? ((estimatedSellingPrice - unitCost) / estimatedSellingPrice) * 100 : 0;
      
      // Velocity classification based on value and movement potential
      let velocity: 'fast' | 'medium' | 'slow' = 'slow';
      if (totalValue > 1000 && quantity > 20) velocity = 'fast';
      else if (totalValue > 500 || quantity > 10) velocity = 'medium';
      
      // Days in inventory estimation
      const daysInInventory = item.days_since_created || 0;
      
      return {
        sku: item.sku,
        product_name: item.product_name,
        totalValue,
        quantity,
        unitCost,
        velocity,
        revenueContribution: 0, // Will calculate below
        profitMargin,
        abcCategory: 'C' as 'A' | 'B' | 'C', // Will calculate below
        daysInInventory,
        status: item.status
      };
    });

    // This part of the code calculates total portfolio value for contribution percentages
    const totalPortfolioValue = skuMetrics.reduce((sum, sku) => sum + sku.totalValue, 0);
    
    // This part of the code assigns revenue contribution percentages
    skuMetrics.forEach(sku => {
      sku.revenueContribution = totalPortfolioValue > 0 ? (sku.totalValue / totalPortfolioValue) * 100 : 0;
    });

    // This part of the code implements ABC analysis (Pareto principle)
    const sortedByValue = [...skuMetrics].sort((a, b) => b.totalValue - a.totalValue);
    let cumulativeValue = 0;
    sortedByValue.forEach(sku => {
      cumulativeValue += sku.totalValue;
      const cumulativePercentage = (cumulativeValue / totalPortfolioValue) * 100;
      
      if (cumulativePercentage <= 80) sku.abcCategory = 'A';
      else if (cumulativePercentage <= 95) sku.abcCategory = 'B';
      else sku.abcCategory = 'C';
    });

    // This part of the code identifies top and bottom performers
    const topPerformers = sortedByValue.slice(0, 5);
    const bottomPerformers = [...skuMetrics]
      .filter(sku => sku.totalValue > 0)
      .sort((a, b) => a.totalValue - b.totalValue)
      .slice(0, 5);

    // This part of the code calculates velocity breakdown
    const velocityBreakdown = skuMetrics.reduce(
      (acc, sku) => {
        acc[sku.velocity]++;
        return acc;
      },
      { fast: 0, medium: 0, slow: 0 }
    );

    // This part of the code calculates ABC breakdown
    const abcBreakdown = skuMetrics.reduce(
      (acc, sku) => {
        acc[sku.abcCategory]++;
        return acc;
      },
      { A: 0, B: 0, C: 0 }
    );

    // This part of the code calculates average margin
    const avgMargin = skuMetrics.length > 0 
      ? skuMetrics.reduce((sum, sku) => sum + sku.profitMargin, 0) / skuMetrics.length 
      : 0;

    return {
      topPerformers,
      bottomPerformers,
      velocityBreakdown,
      totalPortfolioValue,
      avgMargin,
      abcBreakdown,
      allSKUs: skuMetrics
    };
  }, [inventory]);

  // This part of the code formats currency values for display
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${Math.round(value).toLocaleString()}`;
  };

  // This part of the code defines SKU performance KPI cards
  const performanceKPIs = [
    {
      title: "Portfolio Value",
      value: formatCurrency(skuAnalytics.totalPortfolioValue),
      description: "Total inventory value",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Fast Movers",
      value: skuAnalytics.velocityBreakdown.fast.toString(),
      description: `${inventory.length > 0 ? ((skuAnalytics.velocityBreakdown.fast / inventory.length) * 100).toFixed(0) : 0}% of SKUs`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "A-Category SKUs",
      value: skuAnalytics.abcBreakdown.A.toString(),
      description: "Top 80% value contributors",
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Avg Profit Margin",
      value: `${skuAnalytics.avgMargin.toFixed(1)}%`,
      description: "Estimated portfolio margin",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          SKU Performance Intelligence
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mr-3" />
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        SKU Performance Intelligence
      </h2>

      {/* This part of the code displays the SKU performance KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {performanceKPIs.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${card.bgColor} mr-3`}>
                  <IconComponent className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    {card.title}
                  </div>
                  <div className={`text-lg font-bold ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-xs text-gray-500">
                    {card.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This part of the code displays top performing SKUs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Top Revenue Contributors
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Highest value SKUs driving portfolio performance
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {skuAnalytics.topPerformers.map((sku, index) => (
                <div key={sku.sku} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sku.sku}</div>
                      <div className="text-xs text-gray-500">{sku.product_name.slice(0, 30)}...</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(sku.totalValue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {sku.revenueContribution.toFixed(1)}% of portfolio
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* This part of the code displays velocity and ABC analysis */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              Portfolio Analysis
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Velocity classification and ABC categorization
            </p>
          </div>
          
          <div className="p-6">
            {/* Velocity Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">SKU Velocity</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-gray-600">Fast Movers</span>
                  </div>
                  <span className="text-sm font-medium">{skuAnalytics.velocityBreakdown.fast}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-sm text-gray-600">Medium Movers</span>
                  </div>
                  <span className="text-sm font-medium">{skuAnalytics.velocityBreakdown.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-gray-600">Slow Movers</span>
                  </div>
                  <span className="text-sm font-medium">{skuAnalytics.velocityBreakdown.slow}</span>
                </div>
              </div>
            </div>

            {/* ABC Analysis */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">ABC Classification</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-purple-600 mr-2" />
                    <span className="text-sm text-gray-600">A-Category (Top 80%)</span>
                  </div>
                  <span className="text-sm font-medium">{skuAnalytics.abcBreakdown.A}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">B-Category (80-95%)</span>
                  </div>
                  <span className="text-sm font-medium">{skuAnalytics.abcBreakdown.B}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-600">C-Category (95-100%)</span>
                  </div>
                  <span className="text-sm font-medium">{skuAnalytics.abcBreakdown.C}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
