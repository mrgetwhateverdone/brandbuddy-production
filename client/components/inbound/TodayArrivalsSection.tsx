import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ShipmentData } from "@/types/api";

interface TodayArrivalsSectionProps {
  shipments: ShipmentData[];
  isLoading?: boolean;
}

export function TodayArrivalsSection({ shipments, isLoading }: TodayArrivalsSectionProps) {
  const [sortField, setSortField] = useState<string>('expected_arrival_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // This part of the code filters shipments arriving today or expected today
  const today = new Date().toISOString().split('T')[0];
  const todayArrivals = shipments.filter(s => {
    const arrivalDate = s.arrival_date?.split('T')[0];
    const expectedDate = s.expected_arrival_date?.split('T')[0];
    return arrivalDate === today || expectedDate === today;
  });

  // This part of the code handles table sorting functionality
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // This part of the code sorts the shipments based on current sort criteria
  const sortedShipments = [...todayArrivals].sort((a, b) => {
    let aVal: any = (a as any)[sortField];
    let bVal: any = (b as any)[sortField];
    
    if (sortField === 'expected_quantity' || sortField === 'received_quantity') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // This part of the code determines shipment status based on timing and quantities
  const getShipmentStatus = (shipment: ShipmentData) => {
    const today = new Date().toISOString().split('T')[0];
    const arrivalDate = shipment.arrival_date?.split('T')[0];
    const expectedDate = shipment.expected_arrival_date?.split('T')[0];
    
    if (arrivalDate === today) {
      if (shipment.expected_quantity === shipment.received_quantity) {
        return { label: 'Received', color: 'bg-green-100 text-green-800' };
      } else if (shipment.received_quantity > 0) {
        return { label: 'Partial', color: 'bg-yellow-100 text-yellow-800' };
      } else {
        return { label: 'Arrived', color: 'bg-blue-100 text-blue-800' };
      }
    } else if (expectedDate === today) {
      return { label: 'Expected', color: 'bg-gray-100 text-gray-800' };
    }
    
    return { label: 'In Transit', color: 'bg-gray-100 text-gray-800' };
  };

  // This part of the code formats time display from ISO string
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '—';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Today's Arrivals</h3>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      {/* This part of the code displays the section header with arrival count */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Today's Arrivals</h3>
        <p className="text-sm text-gray-500">
          {todayArrivals.length} shipment{todayArrivals.length !== 1 ? 's' : ''} for receiving
        </p>
      </div>

      {todayArrivals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No shipments arriving today</p>
          <p className="text-sm text-gray-400 mt-1">Check back tomorrow or view this week's schedule</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('shipment_id')}
                >
                  <div className="flex items-center">
                    Shipment ID
                    {sortField === 'shipment_id' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('supplier')}
                >
                  <div className="flex items-center">
                    Supplier
                    {sortField === 'supplier' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sku')}
                >
                  <div className="flex items-center">
                    SKU
                    {sortField === 'sku' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('expected_quantity')}
                >
                  <div className="flex items-center">
                    Expected Qty
                    {sortField === 'expected_quantity' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedShipments.map((shipment, index) => {
                const status = getShipmentStatus(shipment);
                return (
                  <tr key={`${shipment.shipment_id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {shipment.shipment_id || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.supplier || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.sku || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.expected_quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shipment.received_quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(shipment.expected_arrival_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.ship_from_city && shipment.ship_from_country 
                        ? `${shipment.ship_from_city}, ${shipment.ship_from_country}`
                        : shipment.ship_from_country || '—'
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* This part of the code displays action buttons for receiving operations */}
      {todayArrivals.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Track receiving progress throughout the day
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Print Receiving Schedule
            </Button>
            <Button variant="outline" size="sm">
              Export Arrivals
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
