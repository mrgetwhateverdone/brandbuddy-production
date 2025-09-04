import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ArrowUpDown, Search } from "lucide-react";
import type { InventoryItem } from "@/types/api";

interface InventoryTableSectionProps {
  inventory: InventoryItem[];
  totalCount: number;
  hasMore: boolean;
  isLoading?: boolean;
  onViewAll?: () => void;
}

type SortField = 'sku' | 'product_name' | 'brand_name' | 'on_hand' | 'available' | 'status' | 'unit_cost' | 'total_value' | 'supplier';
type SortDirection = 'asc' | 'desc' | 'default';

export function InventoryTableSection({ 
  inventory, 
  totalCount, 
  hasMore, 
  isLoading, 
  onViewAll
}: InventoryTableSectionProps) {
  const [sortField, setSortField] = useState<SortField>('sku');
  const [sortDirection, setSortDirection] = useState<SortDirection>('default');
  const [searchTerm, setSearchTerm] = useState('');

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

  // This part of the code formats currency values for display
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  // This part of the code handles 3-state sorting: desc -> asc -> default
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('default');
        setSortField('sku'); // Reset to default field
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // This part of the code determines which sort icon to display
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortDirection === 'desc') {
      return <ChevronDown className="h-4 w-4 text-blue-600" />;
    } else if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  // This part of the code filters inventory based on search term
  const filteredInventory = useMemo(() => {
    if (!searchTerm.trim()) return inventory;
    
    const searchLower = searchTerm.toLowerCase();
    return inventory.filter(item =>
      item.sku.toLowerCase().includes(searchLower) ||
      item.product_name.toLowerCase().includes(searchLower) ||
      item.brand_name.toLowerCase().includes(searchLower) ||
      item.status.toLowerCase().includes(searchLower) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchLower))
    );
  }, [inventory, searchTerm]);

  // This part of the code sorts the filtered inventory data based on current sort settings
  const sortedInventory = useMemo(() => {
    if (sortDirection === 'default') {
      return filteredInventory;
    }

    return [...filteredInventory].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null/undefined values
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // This part of the code handles different data types for sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [filteredInventory, sortField, sortDirection]);

  // This part of the code formats dates for display
  // This part of the code handles date formatting (removed unused formatDate function)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Inventory</h3>
              <p className="text-sm text-gray-500">Loading inventory data...</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Inventory</h3>
            <p className="text-sm text-gray-500">
              {searchTerm.trim() ? (
                <>Showing {sortedInventory.length} of {filteredInventory.length} filtered SKUs (from {totalCount} total)</>
              ) : (
                <>Showing {sortedInventory.length} of {totalCount} SKUs</>
              )}
            </p>
          </div>
        </div>

        {/* This part of the code displays the search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by SKU, product name, brand, status, or supplier..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('sku')}
              >
                <div className="flex items-center space-x-1">
                  <span>SKU</span>
                  {getSortIcon('sku')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('product_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Product Name</span>
                  {getSortIcon('product_name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('brand_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Brand</span>
                  {getSortIcon('brand_name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('on_hand')}
              >
                <div className="flex items-center space-x-1">
                  <span>On Hand</span>
                  {getSortIcon('on_hand')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('unit_cost')}
              >
                <div className="flex items-center space-x-1">
                  <span>Unit Cost</span>
                  {getSortIcon('unit_cost')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('total_value')}
              >
                <div className="flex items-center space-x-1">
                  <span>Total Value</span>
                  {getSortIcon('total_value')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('supplier')}
              >
                <div className="flex items-center space-x-1">
                  <span>Supplier</span>
                  {getSortIcon('supplier')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedInventory.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <p className="text-gray-500">Information not in dataset.</p>
                </td>
              </tr>
            ) : (
              sortedInventory.map((item, index) => (
                <tr key={`${item.sku}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.brand_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.on_hand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(item.unit_cost || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(item.total_value || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.supplier || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(hasMore || searchTerm.trim()) && onViewAll && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
          <button
            onClick={onViewAll}
            className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 text-sm font-medium rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors border border-blue-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {searchTerm.trim() ? 'View All Filtered Results' : 'View All Inventory'}
          </button>
        </div>
      )}
    </div>
  );
}
