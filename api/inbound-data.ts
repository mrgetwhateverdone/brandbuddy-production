import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ShipmentData } from "@/types/api";
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
    const arrivalDate = new Date(s.arrival_date);
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
    const arrivalDate = new Date(s.arrival_date);
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
 */
async function generateInboundInsights(
  shipments: ShipmentData[],
  kpis: InboundKPIs
): Promise<any[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 OpenAI API key check: hasApiKey:', !!apiKey, 'length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.log('❌ No OpenAI API key found - returning empty insights');
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
    
    const prompt = `You are a Senior Procurement and Inbound Operations Manager with 17+ years of experience in supplier relationship management, receiving operations, and quality control. You have successfully streamlined inbound processes that reduced receiving times by 60% and improved inventory accuracy to 99.5%.

Evaluate inbound operations including supplier performance, receiving accuracy, and processing times. Identify bottlenecks in the inbound supply chain. Recommend workflows such as 'Implement supplier scorecards with performance metrics', 'Create automated receiving quality checks', or 'Set up advance shipping notification processing'. Draw from your proven experience in vendor management and inbound logistics optimization.

INBOUND OPERATIONS DASHBOARD:
=============================

ARRIVAL PLANNING METRICS:
- Today's Arrivals: ${kpis.todayArrivals} shipments requiring receiving
- This Week Expected: ${kpis.thisWeekExpected} shipments for capacity planning
- Average Lead Time: ${kpis.averageLeadTime} days (shipping to arrival)
- Delayed Shipments: ${kpis.delayedShipments} shipments behind schedule

RECEIVING PERFORMANCE:
- Receiving Accuracy: ${kpis.receivingAccuracy}% (expected vs received quantities)
- On-Time Delivery Rate: ${kpis.onTimeDeliveryRate}% (supplier performance)
- Total Inbound Shipments: ${shipments.length}
- Active Suppliers: ${suppliers.length} delivery partners

OPERATIONAL ANALYSIS:
- Today's Receiving Workload: ${todayArrivals.length} shipments
- Quality Issues: ${shipments.filter(s => s.expected_quantity !== s.received_quantity).length} quantity discrepancies
- Geographic Sources: ${[...new Set(shipments.map(s => s.ship_from_country).filter(Boolean))].length} countries
- Delivery Performance Gaps: ${delayedShipments.length} late arrivals

INBOUND DASHBOARD SECTIONS:
- Today's Arrivals: Real-time receiving schedule for ${kpis.todayArrivals} shipments
- Receiving Performance: Quality and efficiency metrics
- Supplier Delivery: On-time performance tracking across ${suppliers.length} suppliers

Based on your extensive experience in streamlining inbound processes and improving inventory accuracy to 99.5%, provide strategic insights focused on inbound operations covering receiving optimization, delivery performance, and arrival planning. Reference specific data from all dashboard sections and apply your proven methodologies in vendor management and quality control.

Format as JSON array with 3-5 strategic insights:
[
  {
    "type": "warning",
    "title": "Strategic inbound operations insight based on proven methodologies",
    "description": "Expert analysis referencing dashboard data with specific numbers and actionable recommendations drawing from your 17+ years of experience in inbound logistics optimization",
    "severity": "critical|warning|info",
    "dollarImpact": calculated_financial_impact,
    "suggestedActions": ["Implement supplier scorecards with performance metrics", "Create automated receiving quality checks", "Set up advance shipping notification processing"],
    "createdAt": "${new Date().toISOString()}",
    "source": "inbound_operations_agent"
  }
]

Focus on immediate receiving priorities, delivery optimization, and operational efficiency improvements based on your track record of reducing receiving times by 60%.`;

    const openaiUrl = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    console.log('🤖 Inbound Operations Agent: Calling OpenAI for comprehensive dashboard insights...');
    
    const response = await fetch(openaiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
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
    console.log('🤖 Raw OpenAI response:', aiContent);

    // This part of the code uses JSON parsing like working dashboard API
    try {
      const insights = JSON.parse(aiContent);
      console.log('✅ Inbound insights parsed successfully:', insights.length);
      
      // This part of the code ensures proper structure for client consumption
      return insights.map((insight: any, index: number) => ({
        id: insight.id || `inbound-insight-${index}`,
        title: insight.title || `Inbound Operations Alert ${index + 1}`,
        description: insight.description || insight.content || 'Analysis pending',
        severity: insight.severity || 'warning',
        dollarImpact: insight.dollarImpact || Math.round(kpis.thisWeekExpected * 1000), // Estimated impact
        suggestedActions: insight.suggestedActions || ["Review receiving schedule", "Contact suppliers", "Optimize warehouse capacity"],
        createdAt: insight.createdAt || new Date().toISOString(),
        source: insight.source || "inbound_operations_agent",
      }));
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
  const insights = await generateInboundInsights(shipments, kpis);

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
