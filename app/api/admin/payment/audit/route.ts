export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { securePaymentDatabase } from "@/lib/payment-database"

/**
 * Admin endpoint for accessing payment audit logs
 * GET /api/admin/payment/audit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const riskThreshold = searchParams.get("riskThreshold")
    const limit = searchParams.get("limit")

    // TODO: Add admin authentication check here
    // const adminUser = await verifyAdminToken(request)
    // if (!adminUser) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    let auditLogs

    if (customerId) {
      // Get audit logs for specific customer
      auditLogs = await securePaymentDatabase.getCustomerAuditLogs(customerId, limit ? Number.parseInt(limit) : 100)
    } else if (riskThreshold) {
      // Get high-risk audit logs
      auditLogs = await securePaymentDatabase.getHighRiskAuditLogs(
        Number.parseInt(riskThreshold),
        limit ? Number.parseInt(limit) : 50,
      )
    } else {
      // Get recent audit logs
      auditLogs = await securePaymentDatabase.getRecentAuditLogs(limit ? Number.parseInt(limit) : 100)
    }

    return NextResponse.json({
      success: true,
      auditLogs,
      totalLogs: auditLogs.length,
      filters: {
        customerId,
        riskThreshold,
        limit,
      },
    })
  } catch (error) {
    console.error("Error retrieving audit logs:", error)
    return NextResponse.json({ error: "Failed to retrieve audit logs" }, { status: 500 })
  }
}

/**
 * Get payment security statistics
 * POST /api/admin/payment/audit
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const adminUser = await verifyAdminToken(request)
    // if (!adminUser) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const body = await request.json()
    const { startDate, endDate, includeStats = true } = body

    const stats = await securePaymentDatabase.getSecurityStatistics(startDate, endDate)

    return NextResponse.json({
      success: true,
      statistics: stats,
      period: {
        startDate,
        endDate,
      },
    })
  } catch (error) {
    console.error("Error retrieving security statistics:", error)
    return NextResponse.json({ error: "Failed to retrieve security statistics" }, { status: 500 })
  }
}
