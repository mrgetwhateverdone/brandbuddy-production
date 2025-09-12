/**
 * Unified KPI Intelligence Service
 * 
 * This part of the code provides consistent, high-quality business intelligence
 * for all KPI descriptions across the platform. Extracts proven patterns from
 * the successful Orders page implementation.
 */

export interface KPIDataPoint {
  value: number;
  context?: string;
  description?: string;
  percentage?: string;
}

export interface KPIContextResult {
  [kpiName: string]: KPIDataPoint;
}

export interface SupplierAnalysis {
  topAffectedSuppliers: string[];
  supplierIssueCount: { [supplier: string]: number };
  totalAffectedSuppliers: number;
}

export interface IssueClassification {
  quantityDiscrepancies: number;
  slaIssues: number;
  delayedItems: number;
  cancelledItems: number;
  qualityIssues: number;
  totalIssues: number;
}

export interface BusinessMetrics {
  totalRecords: number;
  activeRecords: number;
  todayRecords: number;
  historicalAverage: number;
  performanceRatio: number;
}

/**
 * This part of the code provides supplier analysis engine
 * Extracts top affected suppliers with issue breakdown - proven pattern from Orders page
 */
export class SupplierAnalysisEngine {
  
  static analyzeSupplierImpact(records: any[], issueFilter: (record: any) => boolean): SupplierAnalysis {
    // This part of the code filters records with issues (proven Orders page pattern)
    const affectedRecords = records.filter(issueFilter);
    
    // This part of the code extracts supplier data with null/undefined safety
    const suppliersWithIssues = affectedRecords
      .map(r => r.supplier || r.supplier_name)
      .filter(Boolean);
    
    // This part of the code counts issues per supplier for ranking
    const supplierIssueCount: { [supplier: string]: number } = {};
    suppliersWithIssues.forEach(supplier => {
      supplierIssueCount[supplier] = (supplierIssueCount[supplier] || 0) + 1;
    });
    
    // This part of the code gets top 3 most affected suppliers (Orders page pattern)
    const topAffectedSuppliers = [...new Set(suppliersWithIssues)]
      .sort((a, b) => (supplierIssueCount[b] || 0) - (supplierIssueCount[a] || 0))
      .slice(0, 3);
    
    return {
      topAffectedSuppliers,
      supplierIssueCount,
      totalAffectedSuppliers: new Set(suppliersWithIssues).size
    };
  }
}

/**
 * This part of the code provides issue classification engine  
 * Categorizes operational problems - enhanced pattern from Orders page
 */
export class IssueClassificationEngine {
  
  static classifyOperationalIssues(records: any[], issueFilters?: {
    quantityDiscrepancy?: (record: any) => boolean;
    slaIssue?: (record: any) => boolean; 
    delayed?: (record: any) => boolean;
    cancelled?: (record: any) => boolean;
    qualityIssue?: (record: any) => boolean;
  }): IssueClassification {
    
    // This part of the code uses default filters if none provided (Orders page patterns)
    const filters = {
      quantityDiscrepancy: issueFilters?.quantityDiscrepancy || 
        ((r: any) => r.expected_quantity !== r.received_quantity),
      slaIssue: issueFilters?.slaIssue || 
        ((r: any) => r.sla_status?.includes('at_risk') || r.sla_status?.includes('breach')),
      delayed: issueFilters?.delayed || 
        ((r: any) => r.status?.includes('delayed') || r.status?.includes('overdue')),
      cancelled: issueFilters?.cancelled || 
        ((r: any) => r.status === 'cancelled'),
      qualityIssue: issueFilters?.qualityIssue || 
        ((r: any) => r.quality_issues > 0)
    };
    
    return {
      quantityDiscrepancies: records.filter(filters.quantityDiscrepancy).length,
      slaIssues: records.filter(filters.slaIssue).length, 
      delayedItems: records.filter(filters.delayed).length,
      cancelledItems: records.filter(filters.cancelled).length,
      qualityIssues: records.filter(filters.qualityIssue).length,
      totalIssues: records.filter(r => 
        filters.quantityDiscrepancy(r) || filters.slaIssue(r) || 
        filters.delayed(r) || filters.cancelled(r) || filters.qualityIssue(r)
      ).length
    };
  }
  
  static generateIssueDescription(issues: IssueClassification): string {
    // This part of the code creates business-friendly issue descriptions
    const issueTypes = [];
    
    if (issues.quantityDiscrepancies > 0) {
      issueTypes.push("quantity discrepancies");
    }
    if (issues.slaIssues > 0) {
      issueTypes.push("SLA breaches");
    }
    if (issues.delayedItems > 0) {
      issueTypes.push("delivery delays");
    }
    if (issues.cancelledItems > 0) {
      issueTypes.push("cancellations");  
    }
    
    if (issueTypes.length === 0) return "";
    if (issueTypes.length === 1) return issueTypes[0];
    if (issueTypes.length === 2) return `${issueTypes[0]} and ${issueTypes[1]}`;
    return `${issueTypes.slice(0, -1).join(", ")} and ${issueTypes.slice(-1)}`;
  }
}

/**
 * This part of the code provides percentage calculator with smart business context
 * Uses proper denominators and meaningful percentages - Orders page pattern
 */
export class PercentageCalculator {
  
  static calculateSmartPercentage(numerator: number, denominator: number, 
    context: 'orders' | 'shipments' | 'products' | 'catalog' | 'items' = 'items'): string {
    
    if (denominator === 0) return "0%";
    
    const percentage = ((numerator / denominator) * 100).toFixed(1);
    const contextMap = {
      orders: "of total orders",
      shipments: "of shipments", 
      products: "of products",
      catalog: "of catalog",
      items: "of items"
    };
    
    return `${percentage}% ${contextMap[context]}`;
  }
  
  static shouldShowPercentage(numerator: number, denominator: number): boolean {
    // This part of the code determines when percentages add business value
    if (denominator === 0) return false;
    if (numerator === 0) return false;
    if (denominator < 10) return false; // Don't show percentages for small datasets
    return true;
  }
}

/**
 * This part of the code provides business metrics calculator
 * Calculates operational performance metrics - Orders page pattern
 */
export class BusinessMetricsCalculator {
  
  static calculateOperationalMetrics(records: any[], dateField: string = 'created_date'): BusinessMetrics {
    const today = new Date().toISOString().split("T")[0];
    const todayRecords = records.filter(r => {
      const recordDate = r[dateField]?.split("T")[0];
      return recordDate === today;
    }).length;
    
    // This part of the code estimates historical average (Orders page pattern)
    const historicalAverage = Math.round(records.length / Math.max(30, 1));
    
    return {
      totalRecords: records.length,
      activeRecords: records.filter(r => r.active !== false && r.status !== 'cancelled').length,
      todayRecords,
      historicalAverage,
      performanceRatio: todayRecords / Math.max(historicalAverage, 1)
    };
  }
}

/**
 * This part of the code provides unified prompt engineering templates
 * Consistent, proven prompts based on successful Orders page implementation
 */
export class PromptEngineeringTemplates {
  
  static generateOperationalKPIPrompt(config: {
    executiveRole: string;
    domainFocus: string; 
    totalRecords: number;
    kpiValues: { [key: string]: number };
    supplierAnalysis: SupplierAnalysis;
    issueClassification: IssueClassification;
    businessMetrics: BusinessMetrics;
    customBreakdown?: string;
  }): string {
    
    const { 
      executiveRole, domainFocus, totalRecords, kpiValues, 
      supplierAnalysis, issueClassification, businessMetrics, customBreakdown 
    } = config;
    
    return `You are a ${executiveRole} analyzing ${domainFocus} KPIs. Provide meaningful percentage context and business explanations:

OPERATIONAL DATA:
================
Total Records in System: ${totalRecords}
Active Records: ${businessMetrics.activeRecords}
Today's Activity: ${businessMetrics.todayRecords}
Historical Daily Average: ${businessMetrics.historicalAverage}

CURRENT KPI VALUES:
${Object.entries(kpiValues).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

DETAILED BREAKDOWN:
- Quantity Discrepancies: ${issueClassification.quantityDiscrepancies} records
- SLA Issues: ${issueClassification.slaIssues} records
- Delayed Items: ${issueClassification.delayedItems} records
- Cancelled Items: ${issueClassification.cancelledItems} records
- Top Affected Suppliers: ${supplierAnalysis.topAffectedSuppliers.join(", ")}
- Total Affected Suppliers: ${supplierAnalysis.totalAffectedSuppliers}
${customBreakdown ? `- ${customBreakdown}` : ''}

Calculate accurate percentages using proper denominators and provide ${domainFocus}-focused business context for each KPI.

REQUIRED JSON OUTPUT:
{
  ${Object.keys(kpiValues).map(kpiName => `"${kpiName}": {
    "percentage": "[accurate_percentage_if_meaningful]%",
    "context": "[supplier_and_issue_breakdown_context]",
    "description": "[business_friendly_description_with_percentage]"
  }`).join(',\n  ')}
}`;
  }
}

/**
 * This part of the code provides the main KPI Intelligence Service
 * Orchestrates all engines to generate consistent, high-quality KPI context
 */
export class KPIIntelligenceService {
  
  static async generateUnifiedKPIContext(config: {
    records: any[];
    kpiValues: { [key: string]: number };
    executiveRole: string;
    domainFocus: string;
    issueFilter?: (record: any) => boolean;
    customPromptData?: string;
    apiKey: string;
    openaiUrl?: string;
  }): Promise<KPIContextResult> {
    
    const { 
      records, kpiValues, executiveRole, domainFocus, 
      issueFilter, customPromptData, apiKey, openaiUrl 
    } = config;
    
    console.log(`🧠 KPI Intelligence: Analyzing ${records.length} records for ${domainFocus}`);
    
    // This part of the code analyzes operational data using proven engines
    const defaultIssueFilter = issueFilter || ((r: any) => 
      r.status?.includes('delayed') || 
      r.status === 'cancelled' ||
      r.expected_quantity !== r.received_quantity ||
      r.sla_status?.includes('at_risk')
    );
    
    const supplierAnalysis = SupplierAnalysisEngine.analyzeSupplierImpact(records, defaultIssueFilter);
    const issueClassification = IssueClassificationEngine.classifyOperationalIssues(records);
    const businessMetrics = BusinessMetricsCalculator.calculateOperationalMetrics(records);
    
    // This part of the code generates the unified AI prompt
    const prompt = PromptEngineeringTemplates.generateOperationalKPIPrompt({
      executiveRole,
      domainFocus,
      totalRecords: records.length,
      kpiValues,
      supplierAnalysis,
      issueClassification, 
      businessMetrics,
      customBreakdown: customPromptData
    });
    
    try {
      // This part of the code calls OpenAI with proven timeout and error handling
      const response = await fetch(openaiUrl || "https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL_FAST || "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(25000),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
          try {
            const kpiContext = JSON.parse(content);
            console.log(`✅ KPI Intelligence: Generated context for ${Object.keys(kpiContext).length} KPIs`);
            return kpiContext;
          } catch (parseError) {
            console.warn("⚠️ KPI Intelligence: JSON parse failed, using fallback");
          }
        }
      }
    } catch (error) {
      console.error("❌ KPI Intelligence: API call failed:", error);
    }
    
    // This part of the code provides intelligent fallback context
    return KPIIntelligenceService.generateFallbackContext(
      kpiValues, supplierAnalysis, issueClassification, businessMetrics, domainFocus
    );
  }
  
  private static generateFallbackContext(
    kpiValues: { [key: string]: number },
    supplierAnalysis: SupplierAnalysis, 
    issueClassification: IssueClassification,
    businessMetrics: BusinessMetrics,
    domainFocus: string
  ): KPIContextResult {
    
    // This part of the code creates intelligent fallback descriptions with supplier context
    const context: KPIContextResult = {};
    const issueDescription = IssueClassificationEngine.generateIssueDescription(issueClassification);
    
    Object.entries(kpiValues).forEach(([kpiName, value]) => {
      let description = `${domainFocus} metric: ${value}`;
      let contextInfo = "";
      
      if (kpiName.toLowerCase().includes('risk') && supplierAnalysis.topAffectedSuppliers.length > 0) {
        const percentage = PercentageCalculator.calculateSmartPercentage(
          value, businessMetrics.totalRecords, 'items'
        );
        description = `Items with issues (${percentage})`;
        contextInfo = `Mainly affected by ${issueDescription} from suppliers ${supplierAnalysis.topAffectedSuppliers.join(", ")}`;
      }
      
      context[kpiName] = {
        value,
        description,
        context: contextInfo,
        percentage: PercentageCalculator.shouldShowPercentage(value, businessMetrics.totalRecords) 
          ? PercentageCalculator.calculateSmartPercentage(value, businessMetrics.totalRecords, 'items')
          : undefined
      };
    });
    
    console.log(`📊 KPI Intelligence: Generated fallback context with supplier analysis`);
    return context;
  }
}

export default KPIIntelligenceService;
