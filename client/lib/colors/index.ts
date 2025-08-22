/**
 * This part of the code provides centralized color and styling utilities
 * Standardizes status colors across all components
 */

export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('completed') || statusLower.includes('delivered')) 
    return 'bg-green-100 text-green-800';
  if (statusLower.includes('shipped') || statusLower.includes('transit')) 
    return 'bg-blue-100 text-blue-800';
  if (statusLower.includes('processing') || statusLower.includes('pending')) 
    return 'bg-yellow-100 text-yellow-800';
  if (statusLower.includes('delayed') || statusLower.includes('at_risk')) 
    return 'bg-red-100 text-red-800';
  if (statusLower.includes('cancelled')) 
    return 'bg-gray-100 text-gray-800';
  
  return 'bg-gray-100 text-gray-800';
};

export const getSLAColor = (slaStatus: string): string => {
  const slaLower = slaStatus.toLowerCase();
  
  if (slaLower.includes('on_time') || slaLower.includes('on time')) 
    return 'bg-green-100 text-green-800';
  if (slaLower.includes('at_risk') || slaLower.includes('at risk')) 
    return 'bg-yellow-100 text-yellow-800';
  if (slaLower.includes('breach') || slaLower.includes('late')) 
    return 'bg-red-100 text-red-800';
  
  return 'bg-gray-100 text-gray-800';
};

export const getRiskLevelColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'Low': return 'bg-green-100 text-green-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800';
    case 'High': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getPerformanceColor = (percentage: number): string => {
  if (percentage >= 95) return 'text-green-600';
  if (percentage >= 85) return 'text-orange-600';
  return 'text-red-600';
};
