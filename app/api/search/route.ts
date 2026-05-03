import { type NextRequest, NextResponse } from "next/server"
import { searchProducts } from "@/lib/products"

/**
 * GET /api/search?q=<query>&limit=<n>
 *
 * Returns up to `limit` (default 8) product name + category suggestions
 * from Neon Postgres using the existing ILIKE search logic.
 * Used by the Header autocomplete dropdown.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = (searchParams.get("q") ?? "").trim()
  const limit = Math.min(Number(searchParams.get("limit") ?? "8"), 20)

  // Return empty array for very short or empty queries
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [], products: [] })
  }

  // Sanitize: strip SQL wildcard characters the caller might inject
  const safeQuery = query.replace(/[%_]/g, "")

  try {
    const results = await searchProducts(safeQuery, null, null, limit * 2)

    // Build de-duplicated suggestion list: product names + unique categories
    const names   = new Set<string>()
    const cats    = new Set<string>()

    for (const p of results.slice(0, limit * 2)) {
      names.add(p.name)
      if (p.category) cats.add(p.category)
    }

    // Interleave: names first, then categories — trim to limit
    const suggestions = [
      ...Array.from(names).slice(0, limit),
      ...Array.from(cats).slice(0, Math.max(0, limit - names.size)),
    ].slice(0, limit)

    // Return the top 4 full products for the right column of the Mega Dropdown
    const products = results.slice(0, 4)

    return NextResponse.json({ suggestions, products })
  } catch {
    // Fail gracefully — never crash the header
    return NextResponse.json({ suggestions: [], products: [] })
  }
}
