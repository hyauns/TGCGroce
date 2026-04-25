export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-guard"
import { deleteFeedConfiguration, updateFeedConfiguration, type UpdateFeedInput } from "@/lib/repositories/feeds"

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * PATCH /api/admin/feeds/[id]
 * Update a feed configuration's filters (admin only).
 * The UUID (public URL) remains unchanged.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  const { id } = await params

  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid feed ID" }, { status: 400 })
  }

  try {
    const body = await request.json()

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json({ error: "Feed name cannot be empty" }, { status: 400 })
      }
      if (body.name.trim().length > 100) {
        return NextResponse.json({ error: "Feed name must be 100 characters or less" }, { status: 400 })
      }
    }

    // Validate stock_status enum
    const validStockStatuses = ["in_stock", "out_of_stock", "all"]
    if (body.stock_status && !validStockStatuses.includes(body.stock_status)) {
      return NextResponse.json({ error: "Invalid stock status" }, { status: 400 })
    }

    // Validate preorder_status enum
    const validPreorderStatuses = ["all", "exclude", "only"]
    if (body.preorder_status && !validPreorderStatuses.includes(body.preorder_status)) {
      return NextResponse.json({ error: "Invalid preorder status. Must be 'all', 'exclude', or 'only'" }, { status: 400 })
    }

    // Validate price ranges
    if (body.min_price != null && (isNaN(Number(body.min_price)) || Number(body.min_price) < 0)) {
      return NextResponse.json({ error: "Invalid minimum price" }, { status: 400 })
    }
    if (body.max_price != null && (isNaN(Number(body.max_price)) || Number(body.max_price) < 0)) {
      return NextResponse.json({ error: "Invalid maximum price" }, { status: 400 })
    }

    const input: UpdateFeedInput = {
      name: body.name?.trim(),
      category_slug: body.category_slug ?? null,
      product_type: body.product_type ?? null,
      stock_status: body.stock_status || "in_stock",
      preorder_status: body.preorder_status || "all",
      min_price: body.min_price != null ? Number(body.min_price) : null,
      max_price: body.max_price != null ? Number(body.max_price) : null,
      platform: body.platform,
    }

    const feed = await updateFeedConfiguration(id, input)
    if (!feed) {
      return NextResponse.json({ error: "Feed not found or update failed" }, { status: 404 })
    }

    return NextResponse.json({ feed })
  } catch (error) {
    console.error("[admin/feeds] Error updating feed:", error)
    return NextResponse.json({ error: "Failed to update feed" }, { status: 500 })
  }
}

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
