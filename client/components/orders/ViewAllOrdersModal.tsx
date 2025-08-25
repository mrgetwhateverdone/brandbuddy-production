import { useState, useMemo } from "react";
import { X, ChevronUp, ChevronDown, ArrowUpDown, Search, Eye } from "lucide-react";
import type { OrderData } from "@/types/api";

interface ViewAllOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderData[];
  totalCount: number;
  onViewOrder?: (order: OrderData) => void;
}

type SortField = 'order_id' | 'created_date' | 'brand_name' | 'status' | 'sla_status' | 'supplier' | 'expected_date' | 'expected_quantity';
type SortDirection = 'asc' | 'desc' | 'default';

export function ViewAllOrdersModal({ isOpen, onClose, orders, totalCount, onViewOrder }: ViewAllOrdersModalProps) {
  const [sortField, setSortField] = useState<SortField>('created_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default to most recent first
  const [searchTerm, setSearchTerm] = useState('');

  // This part of the code handles column sorting with 3-state cycle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through states: desc -> asc -> default
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('default');
        setSortField('created_date'); // Reset to default sort
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

  // This part of the code filters orders based on search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    
    return orders.filter(order =>
      order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sla_status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.supplier && order.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [orders, searchTerm]);

  // This part of the code sorts the filtered orders based on current sort settings
  const sortedOrders = useMemo(() => {
    if (sortDirection === 'default') {
      return [...filteredOrders]; // Return original order
    }

    return [...filteredOrders].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'created_date':
          valueA = new Date(a.created_date).getTime();
          valueB = new Date(b.created_date).getTime();
          break;
        case 'order_id':
          valueA = a.order_id.toLowerCase();
          valueB = b.order_id.toLowerCase();
          break;
        case 'brand_name':
          valueA = a.brand_name.toLowerCase();
          valueB = b.brand_name.toLowerCase();
          break;
        case 'status':
          valueA = a.status.toLowerCase();
          valueB = b.status.toLowerCase();
          break;
        case 'sla_status':
          valueA = a.sla_status.toLowerCase();
          valueB = b.sla_status.toLowerCase();
          break;
        case 'supplier':
          valueA = (a.supplier || '').toLowerCase();
          valueB = (b.supplier || '').toLowerCase();
          break;
        case 'expected_date':
          valueA = new Date(a.expected_date || 0).getTime();
          valueB = new Date(b.expected_date || 0).getTime();
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
  }, [filteredOrders, sortField, sortDirection]);

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

  // This part of the code formats dates for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

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

  if (!isOpen) return null;

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
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Orders</h2>
              <p className="text-sm text-gray-500 mt-1">
                Showing {sortedOrders.length} of {totalCount} total orders
                {searchTerm && ` (filtered from ${orders.length})`}
              </p>
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
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order ID, brand, status, supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black placeholder-black"
                />
              </div>
            </div>

            {sortedOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Information not in dataset.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th 
                        onClick={() => handleSort('order_id')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Order ID</span>
                          {getSortIcon('order_id')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('created_date')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {getSortIcon('created_date')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('brand_name')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Brand</span>
                          {getSortIcon('brand_name')}
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
                        onClick={() => handleSort('sla_status')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>SLA</span>
                          {getSortIcon('sla_status')}
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
                        onClick={() => handleSort('expected_date')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Expected</span>
                          {getSortIcon('expected_date')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('expected_quantity')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Quantity</span>
                          {getSortIcon('expected_quantity')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedOrders.map((order, index) => (
                      <tr key={`${order.order_id}-${index}`} className="hover:bg-gray-50">
                        {/* Order ID */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.order_id}
                          </div>
                        </td>
                        
                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(order.created_date)}
                          </div>
                        </td>
                        
                        {/* Brand */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {order.brand_name}
                          </div>
                        </td>
                        
                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        
                        {/* SLA Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSLAColor(order.sla_status)}`}>
                            {order.sla_status.replace('_', ' ')}
                          </span>
                        </td>
                        
                        {/* Supplier */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.supplier || 'N/A'}
                          </div>
                        </td>
                        
                        {/* Expected Date */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.expected_date ? formatDate(order.expected_date) : 'N/A'}
                          </div>
                        </td>
                        
                        {/* Quantity */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.received_quantity} / {order.expected_quantity}
                          </div>
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {onViewOrder && (
                            <button
                              onClick={() => onViewOrder(order)}
                              className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mx-auto"
                              title="View order details and AI analysis"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
