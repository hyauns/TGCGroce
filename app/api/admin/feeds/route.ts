export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-guard"
import {
  listFeedConfigurations,
  createFeedConfiguration,
  countFeedProducts,
  type CreateFeedInput,
} from "@/lib/repositories/feeds"

/**
 * GET /api/admin/feeds
 * List all feed configurations (admin only).
 */
export async function GET() {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    const feeds = await listFeedConfigurations()
    
    const feedsWithCount = await Promise.all(
      feeds.map(async (feed) => {
        const count = await countFeedProducts(feed)
        return { ...feed, product_count: count }
      })
    )

    return NextResponse.json({ feeds: feedsWithCount })
  } catch (error) {
    console.error("[admin/feeds] Error listing feeds:", error)
    return NextResponse.json({ error: "Failed to list feeds" }, { status: 500 })
  }
}

/**
 * POST /api/admin/feeds
 * Create a new feed configuration (admin only).
 */
export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Feed name is required" }, { status: 400 })
    }

    if (body.name.trim().length > 100) {
      return NextResponse.json({ error: "Feed name must be 100 characters or less" }, { status: 400 })
    }

    // Validate stock_status enum
    const validStockStatuses = ["in_stock", "out_of_stock", "all"]
    if (body.stock_status && !validStockStatuses.includes(body.stock_status)) {
      return NextResponse.json({ error: "Invalid stock status" }, { status: 400 })
    }

    // Validate preorder_status enum
    const validPreorderStatuses = ["all", "exclude", "only"]
    if (body.preorder_status && !validPreorderStatuses.includes(body.preorder_status)) {
      return NextResponse.json({ error: "Invalid preorder status" }, { status: 400 })
    }

    // Validate price ranges
    if (body.min_price != null && (isNaN(Number(body.min_price)) || Number(body.min_price) < 0)) {
      return NextResponse.json({ error: "Invalid minimum price" }, { status: 400 })
    }
    if (body.max_price != null && (isNaN(Number(body.max_price)) || Number(body.max_price) < 0)) {
      return NextResponse.json({ error: "Invalid maximum price" }, { status: 400 })
    }

    const input: CreateFeedInput = {
      name: body.name.trim(),
      category_slug: body.category_slug || null,
      product_type: body.product_type || null,
      stock_status: body.stock_status || "in_stock",
      preorder_status: body.preorder_status || "all",
      min_price: body.min_price != null ? Number(body.min_price) : null,
      max_price: body.max_price != null ? Number(body.max_price) : null,
    }

    const feed = await createFeedConfiguration(input)
    if (!feed) {
      return NextResponse.json({ error: "Failed to create feed" }, { status: 500 })
    }

    return NextResponse.json({ feed }, { status: 201 })
  } catch (error) {
    console.error("[admin/feeds] Error creating feed:", error)
    return NextResponse.json({ error: "Failed to create feed" }, { status: 500 })
  }
}
