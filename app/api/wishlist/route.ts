export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const sql = neon(process.env.DATABASE_URL!)

function getUserId(): string | null {
  try {
    const token = cookies().get("auth-token")?.value
    if (!token) return null
    const decoded = verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

/** GET /api/wishlist — Return all wishlist items for the authenticated user. */
export async function GET() {
  const userId = getUserId()
  if (!userId) return NextResponse.json({ items: [] })

  const rows = await sql`
    SELECT
      w.product_id    AS id,
      w.added_at,
      w.notes,
      p.name,
      p.price,
      p.original_price  AS "originalPrice",
      p.category,
      p.stock_quantity  > 0 AS "inStock"
    FROM wishlists w
    JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ${userId}
    ORDER BY w.added_at DESC
  `
  return NextResponse.json({ items: rows })
}

/** POST /api/wishlist — Add a product to the wishlist (idempotent). */
export async function POST(request: NextRequest) {
  const userId = getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { productId, notes } = await request.json()
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  await sql`
    INSERT INTO wishlists (user_id, product_id, notes, added_at)
    VALUES (${userId}, ${productId}, ${notes ?? null}, NOW())
    ON CONFLICT (user_id, product_id) DO NOTHING
  `
  return NextResponse.json({ success: true })
}

/** DELETE /api/wishlist — Remove a product from the wishlist. */
export async function DELETE(request: NextRequest) {
  const userId = getUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { productId } = await request.json()
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  await sql`DELETE FROM wishlists WHERE user_id = ${userId} AND product_id = ${productId}`
  return NextResponse.json({ success: true })
}
