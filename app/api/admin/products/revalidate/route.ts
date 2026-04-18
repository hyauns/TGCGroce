export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { revalidateProductPages } from "@/lib/admin-actions"
import { requireAdmin } from "@/lib/auth-guard"

/**
 * POST /api/admin/products/revalidate
 *
 * Triggers on-demand revalidation of all product-related cached pages.
 * Useful for external systems (CMS, inventory management, webhooks)
 * that modify product data outside of the admin server actions.
 *
 * Body (optional):
 *   { "slug": "product-name-slug" }   – revalidate a specific PDP in addition to listings
 *   { "secret": "..." }               – must match REVALIDATION_SECRET env var when set
 *
 * Security: When REVALIDATION_SECRET is configured, the request must
 * include a matching `secret` field. Without it, all requests are accepted
 * (suitable for development / trusted internal networks).
 */
export async function POST(request: NextRequest) {
  // Server-side admin auth — middleware is not sufficient for API routes.
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    const body = await request.json().catch(() => ({}))

    // ── Optional secondary secret for external webhook callers ──────────────
    // If REVALIDATION_SECRET is set, callers must also supply it.
    // Admin auth above is the primary gate.
    const expectedSecret = process.env.REVALIDATION_SECRET
    if (expectedSecret && body.secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid revalidation secret" },
        { status: 401 }
      )
    }

    // ── Trigger revalidation ────────────────────────────────────
    const slug = typeof body.slug === "string" ? body.slug : undefined
    await revalidateProductPages(slug)

    return NextResponse.json({
      revalidated: true,
      slug: slug ?? null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[revalidate] Error:", error)
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    )
  }
}
