export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/database"
import { requireAdmin } from "@/lib/auth-guard"

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin


  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || undefined

    const result = await adminDb.getCustomers(page, limit, search)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json(
      {
        customers: [],
        total: 0,
        error: "Database not configured. Please run the database setup scripts.",
      },
      { status: 200 },
    )
  }
}
