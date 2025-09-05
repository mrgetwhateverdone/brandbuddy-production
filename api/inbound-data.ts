import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ShipmentData } from "../shared/types/api";
// This part of the code imports only necessary types for inbound operations

/**
 * This part of the code provides inbound operations data endpoint for Vercel serverless deployment
 * Focuses on receiving operations, arrival planning, and supplier delivery performance
 */

interface InboundKPIs {
  todayArrivals: number;
  thisWeekExpected: number;
  averageLeadTime: number;
  delayedShipments: number;
  receivingAccuracy: number;
  onTimeDeliveryRate: number;
}

interface InboundData {
  kpis: InboundKPIs;
  insights: any[];
  shipments: ShipmentData[];
  todayArrivals: ShipmentData[];
  receivingMetrics: any[];
  supplierPerformance: any[];
  lastUpdated: string;
}

/**
 * This part of the code fetches shipments data from TinyBird API for inbound operations
 * Uses the same proven pattern as Orders API
 */
async function fetchShipments(): Promise<ShipmentData[]> {
  const baseUrl = process.env.WAREHOUSE_BASE_URL;
  const token = process.env.WAREHOUSE_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "WAREHOUSE_BASE_URL and WAREHOUSE_TOKEN environment variables are required",
    );
  }

  // This part of the code fetches from inbound_shipments_details_mv API with Callahan-Smith brand filter
  const url = `${baseUrl}?token=${token}&limit=1000&brand_name=Callahan-Smith`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * This part of the code calculates inbound-specific KPIs from shipment data
 * Focuses on arrival planning, receiving efficiency, and delivery performance
 */
function calculateInboundKPIs(shipments: ShipmentData[]): InboundKPIs {
  console.log('📊 Calculating inbound operations KPIs for Callahan-Smith data:', {
    totalShipments: shipments.length,
    withArrivalDates: shipments.filter(s => s.arrival_date).length,
    withExpectedDates: shipments.filter(s => s.expected_arrival_date).length
  });

  const today = new Date().toISOString().split('T')[0];
  
  // This part of the code identifies shipments arriving today for receiving planning
  const todayArrivals = shipments.filter(s => {
    const arrivalDate = s.arrival_date?.split('T')[0];
    const expectedDate = s.expected_arrival_date?.split('T')[0];
    return arrivalDate === today || expectedDate === today;
  }).length;

  // This part of the code calculates this week's expected arrivals for capacity planning
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const thisWeekExpected = shipments.filter(s => {
    if (!s.expected_arrival_date) return false;
    const expectedDate = new Date(s.expected_arrival_date);
    return expectedDate >= weekStart && expectedDate <= weekEnd;
  }).length;

  // This part of the code calculates average lead time for delivery planning
  const shipmentsWithDates = shipments.filter(s => 
    s.created_date && s.arrival_date
  );
  
  let totalLeadTime = 0;
  let validLeadTimes = 0;
  
  shipmentsWithDates.forEach(s => {
    const createdDate = new Date(s.created_date);
    const arrivalDate = new Date(s.arrival_date || new Date());
    const leadTimeDays = (arrivalDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (leadTimeDays >= 0 && leadTimeDays <= 365) { // Sanity check
      totalLeadTime += leadTimeDays;
      validLeadTimes++;
    }
  });
  
  const averageLeadTime = validLeadTimes > 0 ? Math.round(totalLeadTime / validLeadTimes * 10) / 10 : 0;

  // This part of the code identifies delayed shipments requiring attention
  const delayedShipments = shipments.filter(s => {
    if (!s.expected_arrival_date || !s.arrival_date) return false;
    const expectedDate = new Date(s.expected_arrival_date);
    const arrivalDate = new Date(s.arrival_date);
    return arrivalDate > expectedDate;
  }).length;

  // This part of the code calculates receiving accuracy for quality metrics
  const shipmentsWithQuantities = shipments.filter(s => 
    s.expected_quantity > 0 && s.received_quantity >= 0
  );
  
  const accurateShipments = shipmentsWithQuantities.filter(s => 
    s.expected_quantity === s.received_quantity
  ).length;
  
  const receivingAccuracy = shipmentsWithQuantities.length > 0 
    ? Math.round((accurateShipments / shipmentsWithQuantities.length) * 100) 
    : 100;

  // This part of the code calculates on-time delivery rate for supplier performance
  const shipmentsWithExpectedDates = shipments.filter(s => 
    s.expected_arrival_date && s.arrival_date
  );
  
  const onTimeShipments = shipmentsWithExpectedDates.filter(s => {
    const expectedDate = new Date(s.expected_arrival_date!);
    const arrivalDate = new Date(s.arrival_date || new Date());
    return arrivalDate <= expectedDate;
  }).length;
  
  const onTimeDeliveryRate = shipmentsWithExpectedDates.length > 0
    ? Math.round((onTimeShipments / shipmentsWithExpectedDates.length) * 100)
    : 100;

  const kpiResults = {
    todayArrivals,
    thisWeekExpected,
    averageLeadTime,
    delayedShipments,
    receivingAccuracy,
    onTimeDeliveryRate
  };

  console.log('📊 Inbound KPI Results calculated:', kpiResults);
  return kpiResults;
}

/**
 * This part of the code generates AI insights for inbound operations using OpenAI
 * Focuses on receiving efficiency, arrival optimization, and supplier delivery performance
 * NO FALLBACK - Returns empty array if AI fails to ensure "Backend Disconnected" message
 */
async function generateInboundInsights(
  shipments: ShipmentData[],
  kpis: InboundKPIs
): Promise<any[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 AI service key check: hasApiKey:', !!apiKey, 'length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('❌ No AI service key found - returning empty insights (NO FALLBACK)');
    return [];
  }

  try {
    // This part of the code prepares comprehensive data for AI analysis
    const todayArrivals = shipments.filter(s => {
      const today = new Date().toISOString().split('T')[0];
      const arrivalDate = s.arrival_date?.split('T')[0];
      const expectedDate = s.expected_arrival_date?.split('T')[0];
      return arrivalDate === today || expectedDate === today;
    });

    const delayedShipments = shipments.filter(s => {
      if (!s.expected_arrival_date || !s.arrival_date) return false;
      const expectedDate = new Date(s.expected_arrival_date);
      const arrivalDate = new Date(s.arrival_date);
      return arrivalDate > expectedDate;
    });

    const suppliers = [...new Set(shipments.map(s => s.supplier).filter(Boolean))];
    
    // This part of the code extracts specific data arrays for actionable AI recommendations (mirrors Replenishment pattern)
    const criticalArrivals = todayArrivals
      .filter(s => s.expected_quantity && s.expected_quantity > 0)
      .sort((a, b) => (b.expected_quantity * (b.unit_cost || 0)) - (a.expected_quantity * (a.unit_cost || 0)))
      .slice(0, 8)
      .map(s => ({
        shipmentId: s.shipment_id,
        supplier: s.supplier || 'Unknown',
        expectedQuantity: s.expected_quantity,
        unitCost: s.unit_cost || 0,
        totalValue: Math.round((s.expected_quantity || 0) * (s.unit_cost || 0)),
        priority: (s.expected_quantity || 0) > 50 ? 'CRITICAL' : 'STANDARD'
      }));

    const enhancedDelayedShipments = delayedShipments
      .map(s => {
        const expectedDate = new Date(s.expected_arrival_date!);
        const arrivalDate = new Date(s.arrival_date!);
        const daysOverdue = Math.ceil((arrivalDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          shipmentId: s.shipment_id,
          supplier: s.supplier || 'Unknown',
          daysOverdue,
          expectedQuantity: s.expected_quantity || 0,
          unitCost: s.unit_cost || 0,
          delayImpact: Math.round(daysOverdue * (s.expected_quantity || 0) * (s.unit_cost || 0) * 0.1),
          severity: daysOverdue > 7 ? 'CRITICAL' : daysOverdue > 3 ? 'HIGH' : 'MEDIUM'
        };
      })
      .sort((a, b) => b.delayImpact - a.delayImpact)
      .slice(0, 6);

    const receivingDiscrepancies = shipments
      .filter(s => s.expected_quantity && s.received_quantity && s.expected_quantity !== s.received_quantity)
      .map(s => ({
        shipmentId: s.shipment_id,
        supplier: s.supplier || 'Unknown',
        expectedQuantity: s.expected_quantity || 0,
        receivedQuantity: s.received_quantity || 0,
        variance: (s.expected_quantity || 0) - (s.received_quantity || 0),
        varianceValue: Math.round(Math.abs((s.expected_quantity || 0) - (s.received_quantity || 0)) * (s.unit_cost || 0)),
        varianceType: (s.expected_quantity || 0) > (s.received_quantity || 0) ? 'SHORTAGE' : 'OVERAGE'
      }))
      .sort((a, b) => b.varianceValue - a.varianceValue)
      .slice(0, 8);

    const supplierPerformanceIssues = Object.entries(
      shipments.reduce((acc: any, s) => {
        const supplier = s.supplier || 'Unknown';
        if (!acc[supplier]) {
          acc[supplier] = { 
            name: supplier,
            totalShipments: 0, 
            delayedShipments: 0, 
            discrepancies: 0, 
            totalValue: 0,
            avgDelayDays: 0
          };
        }
        acc[supplier].totalShipments += 1;
        acc[supplier].totalValue += (s.expected_quantity || 0) * (s.unit_cost || 0);
        
        if (s.expected_arrival_date && s.arrival_date) {
          const expectedDate = new Date(s.expected_arrival_date);
          const arrivalDate = new Date(s.arrival_date);
          if (arrivalDate > expectedDate) {
            acc[supplier].delayedShipments += 1;
            acc[supplier].avgDelayDays += Math.ceil((arrivalDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
        
        if (s.expected_quantity !== s.received_quantity) {
          acc[supplier].discrepancies += 1;
        }
        
        return acc;
      }, {})
    )
      .map(([name, data]: [string, any]) => ({
        ...data,
        onTimeRate: data.totalShipments > 0 ? Math.round(((data.totalShipments - data.delayedShipments) / data.totalShipments) * 100) : 100,
        accuracyRate: data.totalShipments > 0 ? Math.round(((data.totalShipments - data.discrepancies) / data.totalShipments) * 100) : 100,
        avgDelayDays: data.delayedShipments > 0 ? Math.round(data.avgDelayDays / data.delayedShipments) : 0,
        riskScore: Math.round((data.delayedShipments + data.discrepancies) / Math.max(data.totalShipments, 1) * 100)
      }))
      .filter(s => s.riskScore > 20 || s.onTimeRate < 80)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);
    
    const prompt = `You are a Senior Procurement and Inbound Operations Manager with 17+ years of experience in supplier relationship management, receiving operations, and quality control. You have successfully streamlined inbound processes that reduced receiving times by 60% and improved inventory accuracy to 99.5%.

🎯 CRITICAL INSTRUCTION: You MUST use the specific data provided below to create detailed, actionable recommendations. Do NOT provide generic advice. Every recommendation must reference actual shipment IDs, supplier names, quantities, or dollar amounts from the data.

SPECIFIC DATA FOR ACTIONABLE RECOMMENDATIONS:
===========================================

CRITICAL ARRIVALS TODAY (use these exact shipment IDs and suppliers):
${criticalArrivals.map(a => `- Shipment: ${a.shipmentId} - Supplier: ${a.supplier} - Expected: ${a.expectedQuantity} units - Value: $${a.totalValue.toLocaleString()} (${a.priority})`).join('\n')}

DELAYED SHIPMENTS (use these exact shipment IDs and delay amounts):
${enhancedDelayedShipments.map(d => `- Shipment: ${d.shipmentId} - Supplier: ${d.supplier} - ${d.daysOverdue} days overdue - Impact: $${d.delayImpact.toLocaleString()} (${d.severity})`).join('\n')}

RECEIVING DISCREPANCIES (use these exact shipment IDs and variance amounts):
${receivingDiscrepancies.map(r => `- Shipment: ${r.shipmentId} - Supplier: ${r.supplier} - Expected: ${r.expectedQuantity}, Received: ${r.receivedQuantity} - ${r.varianceType}: $${r.varianceValue.toLocaleString()}`).join('\n')}

SUPPLIER PERFORMANCE ISSUES (use these exact supplier names and performance data):
${supplierPerformanceIssues.map(s => `- ${s.name}: ${s.onTimeRate}% on-time rate, ${s.accuracyRate}% accuracy, Risk Score: ${s.riskScore}, Total Value: $${Math.round(s.totalValue).toLocaleString()}`).join('\n')}

INBOUND OPERATIONS CONTEXT:
- ${kpis.todayArrivals} arrivals requiring receiving today
- ${kpis.thisWeekExpected} shipments expected this week
- ${kpis.receivingAccuracy}% overall receiving accuracy
- ${kpis.delayedShipments} delayed shipments impacting schedule
- ${suppliers.length} active suppliers across ${[...new Set(shipments.map(s => s.ship_from_country).filter(Boolean))].length} countries

📋 STEP-BY-STEP INSTRUCTIONS:
1. Analyze the specific inbound data provided above
2. Identify 3-5 critical inbound operations issues
3. For EACH insight, create 3-5 specific recommendations that reference the actual data
4. Include exact shipment IDs, supplier names, quantities, and dollar amounts
5. Focus on actionable next steps with specific contacts and timelines

WORKFLOW RECOMMENDATION REQUIREMENTS:
- Reference specific shipment IDs from the data above with exact quantities and suppliers
- Include concrete WHO to contact and WHAT to do TODAY with deadlines
- Specify exact receiving priorities, supplier escalations, and financial impacts
- Provide detailed step-by-step workflow actions that operations can execute immediately
- Use real supplier names and shipment IDs from the data provided above

EXAMPLE HIGH-QUALITY SUGGESTED ACTIONS:
- "Escalate Shipment-12345 delay with Thompson, Griffin and Guerra: 5 days overdue, contact procurement by Wednesday to prevent $3,400 receiving disruption"
- "Review receiving workflow for Shipment-67890 from Johnson Industries: expected 100 units, received 85 units, investigate $750 shortage immediately"
- "Create delivery improvement plan for Henderson, Santana and Roberts: 65% on-time rate requires contract review by Friday for $12,400 annual volume"

❌ AVOID GENERIC RECOMMENDATIONS LIKE:
- "Implement supplier scorecards" (no specific suppliers)
- "Create receiving quality checks" (no specific shipments)
- "Set up delivery notifications" (no specific performance issues)

🎯 MANDATORY OUTPUT FORMAT:
[
  {
    "type": "warning",
    "title": "[Issue Title Based on Specific Inbound Data]",
    "description": "Analysis referencing specific shipment IDs, suppliers, quantities, and dollar amounts from the data above. Include financial impact and root cause.",
    "severity": "critical|warning|info",
    "dollarImpact": [actual_number_from_data],
    "suggestedActions": [
      "[Action 1: Reference specific shipment ID, supplier from data]",
      "[Action 2: Include actual quantities and dollar amounts]",
      "[Action 3: Name specific suppliers or receiving teams to contact]",
      "[Action 4: Use real data points, not generic terms]",
      "[Action 5: Provide concrete next steps with timelines]"
    ],
    "createdAt": "${new Date().toISOString()}",
    "source": "inbound_operations_agent"
  }
]

🚨 CRITICAL SUCCESS CRITERIA:
- Each suggestedAction MUST include specific data from above sections
- Use actual shipment IDs, supplier names, quantities, dollar amounts
- Provide concrete next steps with specific parties to contact
- Include implementation timelines and expected ROI
- Reference exact data points, not general concepts

Generate exactly 3-5 insights with 3-5 specific actions each.`;

    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    console.log('🤖 Inbound Operations Agent: Calling AI service for comprehensive dashboard insights...');
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_ADVANCED || "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';
    console.log('🤖 Raw AI response:', aiContent);

    // This part of the code uses JSON parsing like working dashboard API
    try {
      const insights = JSON.parse(aiContent);
      console.log('✅ Inbound insights parsed successfully:', insights.length);
      
      // This part of the code returns raw insights from AI (NO FALLBACK) - double mapping happens in handlers
      return insights;
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      return [];
    }

  } catch (error) {
    console.error("❌ Inbound AI analysis failed:", error);
  }
  
  // This part of the code returns empty insights when AI fails - no fallback data
  return [];
}

// This part of the code handles fast mode for quick inbound data loading without AI insights
async function handleFastMode(req: VercelRequest, res: VercelResponse) {
  console.log("⚡ Inbound Fast Mode: Loading data without AI insights...");
  
  const allShipments = await fetchShipments();
  const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
  console.log(`🔍 Fast Mode - Data filtered for Callahan-Smith: ${allShipments.length} total → ${shipments.length} Callahan-Smith shipments`);

  if (shipments.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          todayArrivals: 0,
          thisWeekExpected: 0,
          averageLeadTime: 0,
          delayedShipments: 0,
          receivingAccuracy: 0,
          onTimeDeliveryRate: 0
        },
        insights: [], // Empty for fast mode
        shipments: [],
        todayArrivals: [],
        receivingMetrics: [],
        supplierPerformance: [],
        lastUpdated: new Date().toISOString(),
      },
      message: "No inbound data available",
      timestamp: new Date().toISOString(),
    });
  }

  const kpis = calculateInboundKPIs(shipments);
  const today = new Date().toISOString().split('T')[0];
  const todayArrivals = shipments.filter(s => {
    const arrivalDate = s.arrival_date?.split('T')[0];
    const expectedDate = s.expected_arrival_date?.split('T')[0];
    return arrivalDate === today || expectedDate === today;
  });

  const inboundData = {
    kpis,
    insights: [], // Empty for fast mode
    shipments,
    todayArrivals,
    receivingMetrics: [],
    supplierPerformance: [],
    lastUpdated: new Date().toISOString(),
  };

  console.log("✅ Inbound Fast Mode: Data compiled successfully");
  res.status(200).json({
    success: true,
    data: inboundData,
    message: "Inbound fast data retrieved successfully",
    timestamp: new Date().toISOString(),
  });
}

// This part of the code handles insights mode for AI-generated inbound insights only
async function handleInsightsMode(req: VercelRequest, res: VercelResponse) {
  console.log("🤖 Inbound Insights Mode: Loading AI insights only...");
  
  const allShipments = await fetchShipments();
  const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
  console.log(`🔍 Insights Mode - Data filtered for Callahan-Smith: ${allShipments.length} total → ${shipments.length} Callahan-Smith shipments`);

  const kpis = calculateInboundKPIs(shipments);
  const rawInsights = await generateInboundInsights(shipments, kpis);

  // This part of the code maps insights to proper AIInsight format with all required properties (double mapping pattern)
  console.log('✅ Inbound Insights Mode - Raw insights from AI:', rawInsights.length, 'insights');
  if (rawInsights.length > 0) {
    console.log('✅ Sample raw insight:', JSON.stringify(rawInsights[0], null, 2));
  }

  const insights = rawInsights.map((insight, index) => ({
    id: `inbound-insight-${index + 1}`,
    title: insight.title,
    description: insight.description,
    severity: (insight.severity === 'high' || insight.severity === 'critical') ? 'critical' as const :
             (insight.severity === 'medium' || insight.severity === 'warning') ? 'warning' as const :
             'info' as const,
    dollarImpact: insight.dollarImpact || 0,
    suggestedActions: insight.suggestedActions || [],
    createdAt: new Date().toISOString(),
    source: "inbound_operations_agent" as const,
  }));

  console.log('✅ Inbound Insights Mode - Mapped insights:', insights.length, 'insights');
  if (insights.length > 0) {
    console.log('✅ Sample mapped insight:', JSON.stringify(insights[0], null, 2));
  }

  console.log("✅ Inbound Insights Mode: AI insights compiled successfully");
  res.status(200).json({
    success: true,
    data: {
      insights,
      lastUpdated: new Date().toISOString(),
    },
    message: "Inbound insights retrieved successfully",
    timestamp: new Date().toISOString(),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mode } = req.query;
    
    // This part of the code handles different loading modes for performance
    if (mode === 'fast') {
      return handleFastMode(req, res);
    } else if (mode === 'insights') {
      return handleInsightsMode(req, res);
    }
    
    // Default: full data with insights (backward compatibility)
    console.log("🚚 Building world-class inbound operations dashboard for Callahan-Smith...");

    // This part of the code fetches real shipment data for inbound analysis
    const allShipments = await fetchShipments();

    // This part of the code ensures only Callahan-Smith data is processed
    const shipments = allShipments.filter(s => s.brand_name === 'Callahan-Smith');
    
    console.log(`🔍 Inbound data filtered for Callahan-Smith: ${allShipments.length} total → ${shipments.length} Callahan-Smith shipments`);

    if (shipments.length === 0) {
      // This part of the code returns empty state when no data is available
      return res.status(200).json({
        success: true,
        data: {
          kpis: {
            todayArrivals: 0,
            thisWeekExpected: 0,
            averageLeadTime: 0,
            delayedShipments: 0,
            receivingAccuracy: 0,
            onTimeDeliveryRate: 0
          },
          insights: [],
          shipments: [],
          todayArrivals: [],
          receivingMetrics: [],
          supplierPerformance: [],
          lastUpdated: new Date().toISOString(),
        },
        message: "No inbound data available",
        timestamp: new Date().toISOString(),
      });
    }

    // This part of the code calculates inbound operations intelligence
    const kpis = calculateInboundKPIs(shipments);
    const insights = await generateInboundInsights(shipments, kpis);

    // This part of the code prepares today's arrivals for receiving planning
    const today = new Date().toISOString().split('T')[0];
    const todayArrivals = shipments.filter(s => {
      const arrivalDate = s.arrival_date?.split('T')[0];
      const expectedDate = s.expected_arrival_date?.split('T')[0];
      return arrivalDate === today || expectedDate === today;
    });

    const inboundData: InboundData = {
      kpis,
      insights,
      shipments, // Full shipment data for client-side calculations
      todayArrivals, // Today's receiving schedule
      receivingMetrics: [], // Will be populated in future iterations
      supplierPerformance: [], // Will be populated in future iterations  
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ World-class inbound operations intelligence generated:", {
      todayArrivals: kpis.todayArrivals,
      thisWeekExpected: kpis.thisWeekExpected,
      averageLeadTime: kpis.averageLeadTime,
      insights: insights.length
    });

    res.status(200).json({
      success: true,
      data: inboundData,
      message: "Inbound operations data retrieved successfully",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Inbound operations API error:", error);
    res.status(500).json({
      error: "Failed to fetch inbound operations data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
