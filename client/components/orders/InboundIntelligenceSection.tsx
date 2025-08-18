import { useState, useMemo } from "react";
import { Package, AlertTriangle, Clock, TrendingDown, Globe, Search, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import type { InboundShipmentIntelligence, OrderData } from "@/types/api";

interface InboundIntelligenceSectionProps {
  inboundIntelligence: InboundShipmentIntelligence;
  isLoading?: boolean;
  onViewAll?: () => void;
}

type SortField = 'product_sku' | 'supplier' | 'ship_from_country' | 'expected_date' | 'status' | 'value' | 'expected_quantity';
type SortDirection = 'asc' | 'desc' | 'default';

export function InboundIntelligenceSection({ inboundIntelligence, isLoading, onViewAll }: InboundIntelligenceSectionProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'delayed' | 'all'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('expected_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default to most recent first

  // This part of the code defines the intelligence overview cards
  const intelligenceCards = [
    {
      title: "Total Inbound",
      value: inboundIntelligence.totalInbound,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Active shipments",
    },
    {
      title: "Delayed Shipments",
      value: `${inboundIntelligence.delayedShipments.count} (${(inboundIntelligence.delayedShipments.percentage || 0).toFixed(1)}%)`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Behind schedule",
    },
    {
      title: "Avg Delay Days",
      value: (inboundIntelligence.avgDelayDays || 0).toFixed(1),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Average delay period",
    },
    {
      title: "Value at Risk",
      value: `$${Math.round(inboundIntelligence.valueAtRisk / 1000)}K`,
      icon: TrendingDown,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Potential impact",
    },
  ];

  // This part of the code filters data based on the active tab and search term
  const getFilteredData = () => {
    let data: OrderData[] = [];
    
    switch (activeTab) {
      case 'overview':
        data = inboundIntelligence.recentShipments || [];
        break;
      case 'delayed':
        data = inboundIntelligence.delayedShipmentsList || [];
        break;
      case 'all':
        data = [...(inboundIntelligence.recentShipments || []), ...(inboundIntelligence.delayedShipmentsList || [])];
        break;
    }

    if (searchTerm) {
      data = data.filter(item =>
        item.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ship_from_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return data;
  };

  // This part of the code handles column sorting with 3-state cycle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through states: desc -> asc -> default
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('default');
        setSortField('expected_date'); // Reset to default sort
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc'); // Always start with most recent/highest first
    }
  };

  // This part of the code gets the appropriate sort icon for column headers
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    
    switch (sortDirection) {
      case 'desc':
        return <ChevronDown className="h-4 w-4" />;
      case 'asc':
        return <ChevronUp className="h-4 w-4" />;
      default:
        return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
  };

  // This part of the code sorts the filtered data based on current sort settings
  const sortedData = useMemo(() => {
    const filtered = getFilteredData();
    
    let sorted = filtered;
    if (sortDirection !== 'default') {
      sorted = [...filtered].sort((a, b) => {
        let valueA: any;
        let valueB: any;

        switch (sortField) {
          case 'expected_date':
            valueA = new Date(a.expected_date || 0).getTime();
            valueB = new Date(b.expected_date || 0).getTime();
            break;
          case 'product_sku':
            valueA = (a.product_sku || '').toLowerCase();
            valueB = (b.product_sku || '').toLowerCase();
            break;
          case 'supplier':
            valueA = (a.supplier || '').toLowerCase();
            valueB = (b.supplier || '').toLowerCase();
            break;
          case 'ship_from_country':
            valueA = (a.ship_from_country || '').toLowerCase();
            valueB = (b.ship_from_country || '').toLowerCase();
            break;
          case 'status':
            valueA = a.status.toLowerCase();
            valueB = b.status.toLowerCase();
            break;
          case 'value':
            valueA = (a.unit_cost || 0) * a.expected_quantity;
            valueB = (b.unit_cost || 0) * b.expected_quantity;
            break;
          case 'expected_quantity':
            valueA = a.expected_quantity;
            valueB = b.expected_quantity;
            break;
          default:
            return 0;
        }

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // This part of the code limits to 10 items for main page display
    return sorted.slice(0, 10);
  }, [activeTab, searchTerm, inboundIntelligence, sortField, sortDirection]);

  // This part of the code gets all sorted data for the View All functionality
  const allSortedData = useMemo(() => {
    const filtered = getFilteredData();
    
    if (sortDirection === 'default') {
      return filtered; // Return original order
    }

    return [...filtered].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'expected_date':
          valueA = new Date(a.expected_date || 0).getTime();
          valueB = new Date(b.expected_date || 0).getTime();
          break;
        case 'product_sku':
          valueA = (a.product_sku || '').toLowerCase();
          valueB = (b.product_sku || '').toLowerCase();
          break;
        case 'supplier':
          valueA = (a.supplier || '').toLowerCase();
          valueB = (b.supplier || '').toLowerCase();
          break;
        case 'ship_from_country':
          valueA = (a.ship_from_country || '').toLowerCase();
          valueB = (b.ship_from_country || '').toLowerCase();
          break;
        case 'status':
          valueA = a.status.toLowerCase();
          valueB = b.status.toLowerCase();
          break;
        case 'value':
          valueA = (a.unit_cost || 0) * a.expected_quantity;
          valueB = (b.unit_cost || 0) * b.expected_quantity;
          break;
        case 'expected_quantity':
          valueA = a.expected_quantity;
          valueB = b.expected_quantity;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activeTab, searchTerm, inboundIntelligence, sortField, sortDirection]);

  // This part of the code formats currency values
  const formatCurrency = (value: number | null) => {
    if (!value) return '$0';
    return `$${value.toLocaleString()}`;
  };

  // This part of the code formats dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Inbound Shipments Intelligence
        </h2>
        
        {/* Intelligence Overview Cards Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mr-3" />
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Data Table Loading */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Inbound Shipments Intelligence
      </h2>

      {/* This part of the code displays the intelligence overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {intelligenceCards.map((card, index) => {
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

      {/* This part of the code displays geopolitical risk warning if applicable */}
      {inboundIntelligence.geopoliticalRisks && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Globe className="h-5 w-5 text-amber-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">
                Geopolitical Risk Alert
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {inboundIntelligence.geopoliticalRisks.affectedShipments} shipments from risk-prone regions: {' '}
                {inboundIntelligence.geopoliticalRisks.riskCountries.join(', ')}. 
                Average delay increase: +{inboundIntelligence.geopoliticalRisks.avgDelayIncrease} days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* This part of the code displays the data table with tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview ({inboundIntelligence.recentShipments?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('delayed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'delayed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Delayed ({inboundIntelligence.delayedShipments.count})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Shipments
            </button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search PO numbers, suppliers, origins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {sortedData.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Information not in dataset.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort('product_sku')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Product SKU</span>
                      {getSortIcon('product_sku')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('supplier')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Supplier</span>
                      {getSortIcon('supplier')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('ship_from_country')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Origin</span>
                      {getSortIcon('ship_from_country')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('expected_date')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Expected Date</span>
                      {getSortIcon('expected_date')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('value')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Value</span>
                      {getSortIcon('value')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('expected_quantity')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Items</span>
                      {getSortIcon('expected_quantity')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((item, index) => (
                  <tr key={`${item.order_id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product_sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.supplier || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 text-gray-400 mr-2" />
                        {item.ship_from_country || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.expected_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency((item.unit_cost || 0) * item.expected_quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.expected_quantity} / {item.received_quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* This part of the code displays the bubble View All button at the bottom */}
        {onViewAll && allSortedData.length > 10 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
            <button
              onClick={onViewAll}
              className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 text-sm font-medium rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors border border-blue-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              View All Shipments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
