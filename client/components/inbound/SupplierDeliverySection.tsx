import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ShipmentData } from "@/types/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getRiskLevelColor, getPerformanceColor } from "@/lib/colors";

interface SupplierDeliverySectionProps {
  shipments: ShipmentData[];
  isLoading?: boolean;
}

interface SupplierPerformance {
  supplier: string;
  totalShipments: number;
  onTimeShipments: number;
  onTimeRate: number;
  avgLeadTime: number;
  quantityAccuracy: number;
  qualityIssues: number;
  totalValue: number;
  lastDelivery: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export function SupplierDeliverySection({ shipments, isLoading }: SupplierDeliverySectionProps) {
  const [sortField, setSortField] = useState<string>('onTimeRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // This part of the code calculates supplier delivery performance from shipment data
  const calculateSupplierPerformance = (): SupplierPerformance[] => {
    const supplierMap = new Map<string, ShipmentData[]>();

    // Group shipments by supplier
    shipments.forEach(shipment => {
      const supplier = shipment.supplier || 'Unknown Supplier';
      if (!supplierMap.has(supplier)) {
        supplierMap.set(supplier, []);
      }
      supplierMap.get(supplier)!.push(shipment);
    });

    // Calculate performance metrics for each supplier
    const supplierPerformance: SupplierPerformance[] = [];

    supplierMap.forEach((supplierShipments, supplier) => {
      const totalShipments = supplierShipments.length;
      
      // This part of the code calculates on-time delivery performance
      const onTimeShipments = supplierShipments.filter(s => {
        if (!s.expected_arrival_date || !s.arrival_date) return false;
        const expectedDate = new Date(s.expected_arrival_date);
        const arrivalDate = new Date(s.arrival_date);
        return arrivalDate <= expectedDate;
      }).length;

      const onTimeRate = totalShipments > 0 ? Math.round((onTimeShipments / totalShipments) * 100) : 0;

      // This part of the code calculates average lead time
      const shipmentsWithDates = supplierShipments.filter(s => 
        s.created_date && s.arrival_date
      );
      
      let totalLeadTime = 0;
      let validLeadTimes = 0;
      
      shipmentsWithDates.forEach(s => {
        const createdDate = new Date(s.created_date);
        const arrivalDate = new Date(s.arrival_date);
        const leadTimeDays = (arrivalDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (leadTimeDays >= 0 && leadTimeDays <= 365) { // Sanity check
          totalLeadTime += leadTimeDays;
          validLeadTimes++;
        }
      });
      
      const avgLeadTime = validLeadTimes > 0 ? Math.round(totalLeadTime / validLeadTimes * 10) / 10 : 0;

      // This part of the code calculates quantity accuracy
      const accurateShipments = supplierShipments.filter(s => 
        s.expected_quantity === s.received_quantity
      ).length;
      const quantityAccuracy = totalShipments > 0 ? Math.round((accurateShipments / totalShipments) * 100) : 100;

      // This part of the code calculates quality issues
      const qualityIssues = supplierShipments.filter(s => 
        s.notes && (
          s.notes.toLowerCase().includes('damage') ||
          s.notes.toLowerCase().includes('issue') ||
          s.notes.toLowerCase().includes('problem') ||
          s.notes.toLowerCase().includes('defect')
        )
      ).length;

      // This part of the code calculates total shipment value
      const totalValue = supplierShipments.reduce((sum, s) => {
        return sum + (s.expected_quantity * (s.unit_cost || 0));
      }, 0);

      // This part of the code finds last delivery date
      const sortedShipments = supplierShipments
        .filter(s => s.arrival_date)
        .sort((a, b) => new Date(b.arrival_date).getTime() - new Date(a.arrival_date).getTime());
      const lastDelivery = sortedShipments.length > 0 ? sortedShipments[0].arrival_date : '';

      // This part of the code determines risk level based on performance
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      if (onTimeRate < 80 || quantityAccuracy < 90 || qualityIssues > 2) {
        riskLevel = 'High';
      } else if (onTimeRate < 90 || quantityAccuracy < 95 || qualityIssues > 0) {
        riskLevel = 'Medium';
      }

      supplierPerformance.push({
        supplier,
        totalShipments,
        onTimeShipments,
        onTimeRate,
        avgLeadTime,
        quantityAccuracy,
        qualityIssues,
        totalValue,
        lastDelivery,
        riskLevel
      });
    });

    return supplierPerformance;
  };

  // This part of the code handles table sorting functionality
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // This part of the code sorts suppliers based on current sort criteria
  const sortedSuppliers = calculateSupplierPerformance().sort((a, b) => {
    let aVal: any = (a as any)[sortField];
    let bVal: any = (b as any)[sortField];
    
    // This part of the code handles special sorting for date fields
    if (sortField === 'lastDelivery') {
      const dateA = aVal ? new Date(aVal).getTime() : 0;
      const dateB = bVal ? new Date(bVal).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    // This part of the code handles special sorting for risk level (High > Medium > Low)
    if (sortField === 'riskLevel') {
      const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const riskA = riskOrder[aVal as keyof typeof riskOrder] || 0;
      const riskB = riskOrder[bVal as keyof typeof riskOrder] || 0;
      return sortDirection === 'asc' ? riskA - riskB : riskB - riskA;
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Note: Utility functions moved to shared libraries for consistency

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Delivery Performance</h3>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      {/* This part of the code displays the section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Supplier Delivery Performance</h3>
        <p className="text-sm text-gray-500">
          {sortedSuppliers.length} active supplier{sortedSuppliers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* This part of the code displays summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-700 mb-1">Total Suppliers</div>
          <div className="text-2xl font-semibold text-blue-900">
            {sortedSuppliers.length}
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-700 mb-1">Avg On-Time Rate</div>
          <div className="text-2xl font-semibold text-green-900">
            {sortedSuppliers.length > 0 
              ? Math.round(sortedSuppliers.reduce((sum, s) => sum + s.onTimeRate, 0) / sortedSuppliers.length)
              : 0}%
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-orange-700 mb-1">High Risk</div>
          <div className="text-2xl font-semibold text-orange-900">
            {sortedSuppliers.filter(s => s.riskLevel === 'High').length}
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-purple-700 mb-1">Total Value</div>
          <div className="text-xl font-semibold text-purple-900">
            {formatCurrency(sortedSuppliers.reduce((sum, s) => sum + s.totalValue, 0))}
          </div>
        </div>
      </div>

      {sortedSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No supplier delivery data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  onClick={() => handleSort('totalShipments')}
                >
                  <div className="flex items-center">
                    Shipments
                    {sortField === 'totalShipments' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('onTimeRate')}
                >
                  <div className="flex items-center">
                    On-Time Rate
                    {sortField === 'onTimeRate' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avgLeadTime')}
                >
                  <div className="flex items-center">
                    Avg Lead Time
                    {sortField === 'avgLeadTime' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantityAccuracy')}
                >
                  <div className="flex items-center">
                    Quantity Accuracy
                    {sortField === 'quantityAccuracy' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Issues
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalValue')}
                >
                  <div className="flex items-center">
                    Total Value
                    {sortField === 'totalValue' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastDelivery')}
                >
                  <div className="flex items-center">
                    Last Delivery
                    {sortField === 'lastDelivery' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('riskLevel')}
                >
                  <div className="flex items-center">
                    Risk Level
                    {sortField === 'riskLevel' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSuppliers.map((supplier, index) => (
                <tr key={`${supplier.supplier}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {supplier.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.totalShipments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getPerformanceColor(supplier.onTimeRate)}`}>
                      {supplier.onTimeRate}%
                    </span>
                    <div className="text-xs text-gray-500">
                      {supplier.onTimeShipments} of {supplier.totalShipments}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.avgLeadTime} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getPerformanceColor(supplier.quantityAccuracy)}`}>
                      {supplier.quantityAccuracy}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.qualityIssues > 0 ? (
                      <span className="text-red-600 font-medium">{supplier.qualityIssues}</span>
                    ) : (
                      <span className="text-green-600">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(supplier.totalValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(supplier.lastDelivery)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getRiskLevelColor(supplier.riskLevel)}>
                      {supplier.riskLevel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
