export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { adminDb } from "@/lib/database"
import { requireAdmin } from "@/lib/auth-guard"

export async function GET() {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin


  try {
    const stats = await adminDb.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
