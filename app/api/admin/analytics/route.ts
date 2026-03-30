export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import {
  getRevenueReport,
  getTopSellingProducts,
  getCustomerAcquisitionTrends,
  getAverageOrderValueTrends,
  getConversionFunnelData,
  getAnalyticsSummary,
} from "@/lib/analytics"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate =
      searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0]

    const [revenueData, topProducts, customerAcquisition, aovTrends, funnelData, summary] = await Promise.all([
      getRevenueReport(startDate, endDate),
      getTopSellingProducts(10),
      getCustomerAcquisitionTrends(startDate, endDate),
      getAverageOrderValueTrends(startDate, endDate),
      getConversionFunnelData(),
      getAnalyticsSummary(),
    ])

    return NextResponse.json({ revenueData, topProducts, customerAcquisition, aovTrends, funnelData, summary })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        revenueData: [],
        topProducts: [],
        customerAcquisition: [],
        aovTrends: [],
        funnelData: [],
        summary: {
          ordersLast30Days: 0,
          revenueLast30Days: 0,
          newCustomersLast30Days: 0,
          avgOrderValueLast30Days: 0,
        },
      },
      { status: 500 },
    )
  }
}
