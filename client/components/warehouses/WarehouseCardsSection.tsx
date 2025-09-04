import { useState } from "react";
import type { WarehouseData } from "@/types/api";
import { WarehouseModal } from "./WarehouseModal";

interface WarehouseCardsSectionProps {
  warehouses: WarehouseData[];
  isLoading?: boolean;
}

/**
 * This part of the code creates individual warehouse performance cards
 * Displays key metrics with color-coded status indicators and hover effects
 */
export function WarehouseCardsSection({ warehouses, isLoading }: WarehouseCardsSectionProps) {
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // This part of the code determines which warehouses to show by default
  const criticalWarehouses = warehouses.filter(w => w.status === "Needs Attention");
  const topPerformers = warehouses
    .filter(w => w.status === "Excellent")
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 6 - criticalWarehouses.length); // Fill remaining slots with top performers
  
  const defaultWarehouses = [...criticalWarehouses, ...topPerformers];

  // This part of the code handles modal search and filtering
  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = warehouse.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.warehouseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || warehouse.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // This part of the code creates filter options with counts
  const statusCounts = warehouses.reduce((acc, warehouse) => {
    acc[warehouse.status] = (acc[warehouse.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filters = [
    {
      label: "All Warehouses",
      value: "all",
      count: warehouses.length,
      active: statusFilter === "all",
      onClick: () => setStatusFilter("all")
    },
    {
      label: "Excellent",
      value: "Excellent",
      count: statusCounts["Excellent"] || 0,
      active: statusFilter === "Excellent",
      onClick: () => setStatusFilter("Excellent")
    },
    {
      label: "Good",
      value: "Good", 
      count: statusCounts["Good"] || 0,
      active: statusFilter === "Good",
      onClick: () => setStatusFilter("Good")
    },
    {
      label: "Needs Attention",
      value: "Needs Attention",
      count: statusCounts["Needs Attention"] || 0,
      active: statusFilter === "Needs Attention",
      onClick: () => setStatusFilter("Needs Attention")
    }
  ];

  // This part of the code handles loading state with skeleton cards
  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Warehouses
        </h2>
        <div className="text-sm text-gray-500 mb-4">
          Loading warehouse data...
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // This part of the code handles empty state
  if (warehouses.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Warehouses
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500">
            No warehouses found for the specified company and brand
          </p>
        </div>
      </div>
    );
  }

  // This part of the code determines status border colors
  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "Excellent":
        return "border-green-200 hover:border-green-300";
      case "Good":
        return "border-blue-200 hover:border-blue-300";
      case "Needs Attention":
        return "border-red-200 hover:border-red-300";
      default:
        return "border-gray-200 hover:border-gray-300";
    }
  };

  // This part of the code determines status badge colors
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Excellent":
        return "bg-green-100 text-green-800";
      case "Good":
        return "bg-blue-100 text-blue-800";
      case "Needs Attention":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // This part of the code creates a warehouse card component
  const renderWarehouseCard = (warehouse: WarehouseData) => (
    <div
      key={warehouse.warehouseId}
      className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${getStatusBorderColor(warehouse.status)}`}
    >
      {/* Card Header - Warehouse name, ID, and status */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {warehouse.warehouseName}
            </h3>
            <p className="text-xs text-gray-500">
              {warehouse.warehouseId}
            </p>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(warehouse.status)}`}>
            {warehouse.status}
          </span>
        </div>
      </div>

      {/* Metrics Section - 5 key performance metrics */}
      <div className="space-y-3">
        {/* SLA Performance */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">SLA Performance</span>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-900">
              {warehouse.slaPerformance.toFixed(1)}%
            </span>
            <div 
              className={`w-2 h-2 rounded-full ml-2 ${
                warehouse.slaPerformance >= 95 ? 'bg-green-500' : 
                warehouse.slaPerformance >= 85 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            ></div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Active Orders</span>
          <span className="text-sm font-semibold text-gray-900">
            {warehouse.activeOrders.toLocaleString()}
          </span>
        </div>

        {/* Average Fulfillment Time */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Avg Fulfillment</span>
          <span className="text-sm font-semibold text-gray-900">
            {warehouse.avgFulfillmentTime.toFixed(1)}h
          </span>
        </div>

        {/* Total SKUs */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Total SKUs</span>
          <span className="text-sm font-semibold text-gray-900">
            {warehouse.totalSKUs.toLocaleString()}
          </span>
        </div>

        {/* Throughput */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Throughput</span>
          <span className="text-sm font-semibold text-gray-900">
            {warehouse.throughput.toLocaleString()}
          </span>
        </div>
      </div>

      {/* This part of the code shows location information if available */}
      {warehouse.location && (warehouse.location.city || warehouse.location.state || warehouse.location.country) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-500">
            <span>📍</span>
            <span className="ml-1 truncate">
              {[warehouse.location.city, warehouse.location.state, warehouse.location.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* This part of the code shows performance score as a visual indicator */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Performance Score</span>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-900 mr-2">
              {warehouse.performanceScore}/100
            </span>
            <div className="w-16 h-2 bg-gray-200 rounded-full">
              <div 
                className={`h-2 rounded-full ${
                  warehouse.performanceScore >= 80 ? 'bg-green-500' : 
                  warehouse.performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(warehouse.performanceScore, 0)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      {/* Section Header with View All Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Warehouses
        </h2>
        {warehouses.length > defaultWarehouses.length && (
          <button
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 text-sm font-medium rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors border border-blue-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            View All Warehouses ({warehouses.length})
          </button>
        )}
      </div>

      {/* Priority Information Banner */}
      {criticalWarehouses.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <span className="font-medium">⚠️ {criticalWarehouses.length} warehouse{criticalWarehouses.length > 1 ? 's' : ''} need{criticalWarehouses.length === 1 ? 's' : ''} attention</span>
            {topPerformers.length > 0 && (
              <span> • Showing top {topPerformers.length} performer{topPerformers.length > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
      )}
      
      {/* Default Warehouse Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {defaultWarehouses.map(renderWarehouseCard)}
      </div>

      {/* Modal for All Warehouses */}
      <WarehouseModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        title={`All Warehouses (${warehouses.length})`}
        searchPlaceholder="Search warehouses by name, ID, or supplier..."
        onSearch={setSearchTerm}
        filters={filters}
        showExport={true}
        onExport={() => {
          // This part of the code handles warehouse data export
          const csvData = warehouses.map(w => ({
            Name: w.warehouseName,
            ID: w.warehouseId,
            Status: w.status,
            SLA: w.slaPerformance,
            ActiveOrders: w.activeOrders,
            AvgFulfillment: w.avgFulfillmentTime,
            SKUs: w.totalSKUs,
            Throughput: w.throughput,
            Score: w.performanceScore
          }));
          
          const csv = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).join(','))
          ].join('\n');
          
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'warehouses.csv';
          a.click();
        }}
      >
        {/* Modal Content */}
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            Showing {filteredWarehouses.length} of {warehouses.length} warehouses
          </div>
          
          {/* Warehouses Grid in Modal */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWarehouses.map(renderWarehouseCard)}
          </div>
          
          {filteredWarehouses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No warehouses match your current filters.</p>
            </div>
          )}
        </div>
      </WarehouseModal>
    </div>
  );
}
