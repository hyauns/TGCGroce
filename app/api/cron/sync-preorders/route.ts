export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextResponse } from "next/server"
import { syncExpiredPreorders } from "@/lib/products"

/**
 * GET /api/cron/sync-preorders
 *
 * Protected cron endpoint that transitions products from
 * "Pre-Order" to "In-Stock" when their release_date has passed.
 *
 * Security:
 *   Requires `Authorization: Bearer <CRON_SECRET>` header.
 *   Vercel Cron automatically sends this when configured.
 *
 * Only flips `is_pre_order = false`. Does NOT alter price,
 * stock_quantity, or any other column.
 */
export async function GET(request: Request) {
  // ── Auth guard: verify CRON_SECRET ──────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("[cron/sync-preorders] CRON_SECRET env var is not set")
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET not set" },
      { status: 500 },
    )
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[cron/sync-preorders] Unauthorized cron attempt")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Execute sync ────────────────────────────────────────────
  try {
    const startTime = Date.now()
    const count = await syncExpiredPreorders()
    const durationMs = Date.now() - startTime

    if (count === -1) {
      return NextResponse.json(
        { error: "Database operation failed. Check server logs." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      transitioned: count,
      message: count > 0
        ? `${count} product(s) transitioned from pre-order to in-stock.`
        : "No expired pre-orders found. Nothing to update.",
      durationMs,
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[cron/sync-preorders] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
