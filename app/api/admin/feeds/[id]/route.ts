export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-guard"
import { deleteFeedConfiguration } from "@/lib/repositories/feeds"

/**
 * DELETE /api/admin/feeds/[id]
 * Delete a feed configuration by UUID (admin only).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  const { id } = await params

  // Basic UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid feed ID" }, { status: 400 })
  }

  try {
    const deleted = await deleteFeedConfiguration(id)
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete feed" }, { status: 500 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[admin/feeds] Error deleting feed:", error)
    return NextResponse.json({ error: "Failed to delete feed" }, { status: 500 })
  }
}
