import React from "react";
import { Badge } from "@/components/ui/badge";
import type { ShipmentData } from "@/types/api";

interface ReceivingPerformanceSectionProps {
  shipments: ShipmentData[];
  isLoading?: boolean;
}

export function ReceivingPerformanceSection({ shipments, isLoading }: ReceivingPerformanceSectionProps) {
  
  // This part of the code calculates receiving performance metrics from shipment data
  const calculateReceivingMetrics = () => {
    if (shipments.length === 0) {
      return {
        totalShipments: 0,
        accurateShipments: 0,
        accuracyRate: 0,
        overShipments: 0,
        underShipments: 0,
        perfectShipments: 0,
        averageProcessingTime: 0,
        qualityIssues: 0
      };
    }

    const totalShipments = shipments.length;
    const accurateShipments = shipments.filter(s => 
      s.expected_quantity === s.received_quantity
    ).length;
    
    const overShipments = shipments.filter(s => 
      s.received_quantity > s.expected_quantity
    ).length;
    
    const underShipments = shipments.filter(s => 
      s.received_quantity < s.expected_quantity
    ).length;
    
    const perfectShipments = shipments.filter(s => 
      s.expected_quantity === s.received_quantity && 
      !s.notes?.toLowerCase().includes('damage') &&
      !s.notes?.toLowerCase().includes('issue') &&
      !s.notes?.toLowerCase().includes('problem')
    ).length;

    const qualityIssues = shipments.filter(s => 
      s.notes && (
        s.notes.toLowerCase().includes('damage') ||
        s.notes.toLowerCase().includes('issue') ||
        s.notes.toLowerCase().includes('problem') ||
        s.notes.toLowerCase().includes('defect')
      )
    ).length;

    // This part of the code calculates average processing time from arrival to receipt
    const shipmentsWithDates = shipments.filter(s => 
      s.arrival_date && s.created_date
    );
    
    let totalProcessingTime = 0;
    let validProcessingTimes = 0;
    
    shipmentsWithDates.forEach(s => {
      const arrivalDate = new Date(s.arrival_date);
      const receiptDate = new Date(s.created_date); // Using created_date as proxy for receipt processing
      const processingHours = (receiptDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60);
      
      if (processingHours >= 0 && processingHours <= 72) { // Sanity check: 0-72 hours
        totalProcessingTime += processingHours;
        validProcessingTimes++;
      }
    });
    
    const averageProcessingTime = validProcessingTimes > 0 
      ? Math.round(totalProcessingTime / validProcessingTimes * 10) / 10 
      : 0;

    const accuracyRate = totalShipments > 0 
      ? Math.round((accurateShipments / totalShipments) * 100) 
      : 100;

    return {
      totalShipments,
      accurateShipments,
      accuracyRate,
      overShipments,
      underShipments,
      perfectShipments,
      averageProcessingTime,
      qualityIssues
    };
  };

  const metrics = calculateReceivingMetrics();

  // This part of the code gets quality issues for display
  const getQualityIssues = () => {
    return shipments.filter(s => 
      s.notes && (
        s.notes.toLowerCase().includes('damage') ||
        s.notes.toLowerCase().includes('issue') ||
        s.notes.toLowerCase().includes('problem') ||
        s.notes.toLowerCase().includes('defect')
      )
    ).slice(0, 5); // Show top 5 recent issues
  };

  // This part of the code determines performance status colors
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 95) return "text-green-600";
    if (percentage >= 85) return "text-orange-600";
    return "text-red-600";
  };

  const getPerformanceBadgeColor = (percentage: number) => {
    if (percentage >= 95) return "bg-green-100 text-green-800";
    if (percentage >= 85) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Receiving Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const qualityIssues = getQualityIssues();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Receiving Performance</h3>
      
      {/* This part of the code displays key receiving performance metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Accuracy Rate</div>
          <div className={`text-2xl font-semibold mb-1 ${getPerformanceColor(metrics.accuracyRate)}`}>
            {metrics.accuracyRate}%
          </div>
          <div className="text-xs text-gray-500">
            {metrics.accurateShipments} of {metrics.totalShipments} exact match
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Perfect Receipts</div>
          <div className="text-2xl font-semibold mb-1 text-blue-600">
            {metrics.perfectShipments}
          </div>
          <div className="text-xs text-gray-500">
            No quantity or quality issues
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Processing Time</div>
          <div className="text-2xl font-semibold mb-1 text-gray-600">
            {metrics.averageProcessingTime}h
          </div>
          <div className="text-xs text-gray-500">
            Average arrival to receipt
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500 mb-1">Quality Issues</div>
          <div className={`text-2xl font-semibold mb-1 ${metrics.qualityIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {metrics.qualityIssues}
          </div>
          <div className="text-xs text-gray-500">
            Damage/defect reports
          </div>
        </div>
      </div>

      {/* This part of the code displays detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quantity Variance Analysis */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Quantity Variance Analysis</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Exact Match</span>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {metrics.accurateShipments}
                </span>
                <Badge className="bg-green-100 text-green-800">
                  {metrics.accuracyRate}%
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Over Shipped</span>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {metrics.overShipments}
                </span>
                <Badge className="bg-blue-100 text-blue-800">
                  +{metrics.totalShipments > 0 ? Math.round((metrics.overShipments / metrics.totalShipments) * 100) : 0}%
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Under Shipped</span>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900 mr-2">
                  {metrics.underShipments}
                </span>
                <Badge className="bg-orange-100 text-orange-800">
                  -{metrics.totalShipments > 0 ? Math.round((metrics.underShipments / metrics.totalShipments) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Quality Issues */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Recent Quality Issues</h4>
          {qualityIssues.length === 0 ? (
            <div className="text-sm text-gray-500 italic">
              No quality issues reported recently
            </div>
          ) : (
            <div className="space-y-2">
              {qualityIssues.map((shipment, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {shipment.shipment_id}
                    </div>
                    <div className="text-xs text-gray-600">
                      {shipment.supplier || 'Unknown Supplier'}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      {shipment.notes?.substring(0, 60)}...
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-800 flex-shrink-0">
                    Issue
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* This part of the code displays performance summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Overall Receiving Performance</h4>
            <p className="text-sm text-gray-600 mt-1">
              Based on {metrics.totalShipments} shipments with accuracy and quality metrics
            </p>
          </div>
          <Badge className={getPerformanceBadgeColor(metrics.accuracyRate)}>
            {metrics.accuracyRate >= 95 ? 'Excellent' : 
             metrics.accuracyRate >= 85 ? 'Good' : 'Needs Improvement'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
