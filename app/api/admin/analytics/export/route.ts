export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import {
  getRevenueReport,
  getTopSellingProducts,
  getCustomerAcquisitionTrends,
  getAverageOrderValueTrends,
  getConversionFunnelData,
  getAnalyticsSummary,
} from "@/lib/analytics"

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json()

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    // Fetch all analytics data
    const [revenueData, topProducts, customerAcquisition, aovTrends, funnelData, summary] = await Promise.all([
      getRevenueReport(startDate, endDate),
      getTopSellingProducts(10),
      getCustomerAcquisitionTrends(startDate, endDate),
      getAverageOrderValueTrends(startDate, endDate),
      getConversionFunnelData(),
      getAnalyticsSummary(),
    ])

    const reportData = {
      summary,
      revenueData,
      topProducts,
      customerAcquisition,
      aovTrends,
      funnelData,
      dateRange: {
        from: startDate,
        to: endDate,
      },
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error fetching analytics data for export:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
