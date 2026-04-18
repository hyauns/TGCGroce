export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireSession } from "@/lib/auth-guard"
import { assertSameOrigin } from "@/lib/csrf"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Resolve customers.id (integer) from users.user_id (uuid).
 * The check_customer_or_session constraint requires customer_id OR session_id to be non-null.
 */
async function getCustomerId(userId: string): Promise<number | null> {
  const [row] = await sql`
    SELECT id FROM customers WHERE user_id = ${userId}::uuid LIMIT 1
  `
  return row ? Number(row.id) : null
}

/** GET /api/cart — Return all cart rows for the authenticated user. */
export async function GET() {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  const userId = session.userId

  const rows = await sql`
    SELECT
      sc.product_id AS id,
      sc.quantity,
      sc.added_at,
      p.name,
      p.price,
      p.original_price  AS "originalPrice",
      p.category,
      p.stock_quantity  > 0 AS "inStock"
    FROM shopping_carts sc
    JOIN products p ON p.id = sc.product_id
    WHERE sc.user_id = ${userId}::uuid
    ORDER BY sc.added_at ASC
  `
  return NextResponse.json({ items: rows })
}

/** POST /api/cart — Upsert a product into the cart (add or increment). */
export async function POST(request: NextRequest) {
  const csrfError = assertSameOrigin(request)
  if (csrfError) return csrfError

  const session = await requireSession()
  if (session instanceof NextResponse) return session
  const userId = session.userId

  const { productId, quantity = 1 } = await request.json()
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  const customerId = await getCustomerId(userId)

  // shopping_carts has no unique constraint on (user_id, product_id),
  // so we cannot use ON CONFLICT — check-then-update/insert instead.
  const [existing] = await sql`
    SELECT id, quantity FROM shopping_carts
    WHERE user_id = ${userId}::uuid AND product_id = ${Number(productId)}
    LIMIT 1
  `
  if (existing) {
    await sql`
      UPDATE shopping_carts
      SET quantity = quantity + ${Number(quantity)}, updated_at = NOW()
      WHERE id = ${existing.id}
    `
  } else {
    await sql`
      INSERT INTO shopping_carts (user_id, customer_id, session_id, product_id, quantity, added_at, updated_at)
      VALUES (
        ${userId}::uuid,
        ${customerId},
        ${customerId ? null : `guest_${userId}`},
        ${Number(productId)},
        ${Number(quantity)},
        NOW(), NOW()
      )
    `
  }
  return NextResponse.json({ success: true })
}

/** PATCH /api/cart — Set an exact quantity (0 = remove). */
export async function PATCH(request: NextRequest) {
  const csrfError = assertSameOrigin(request)
  if (csrfError) return csrfError

  const session = await requireSession()
  if (session instanceof NextResponse) return session
  const userId = session.userId

  const { productId, quantity } = await request.json()
  if (!productId || quantity === undefined) return NextResponse.json({ error: "productId and quantity required" }, { status: 400 })

  const customerId = await getCustomerId(userId)

  if (quantity <= 0) {
    await sql`DELETE FROM shopping_carts WHERE user_id = ${userId}::uuid AND product_id = ${Number(productId)}`
  } else {
    const [existing] = await sql`
      SELECT id FROM shopping_carts
      WHERE user_id = ${userId}::uuid AND product_id = ${Number(productId)}
      LIMIT 1
    `
    if (existing) {
      await sql`UPDATE shopping_carts SET quantity = ${Number(quantity)}, updated_at = NOW() WHERE id = ${existing.id}`
    } else {
      await sql`
        INSERT INTO shopping_carts (user_id, customer_id, session_id, product_id, quantity, added_at, updated_at)
        VALUES (
          ${userId}::uuid,
          ${customerId},
          ${customerId ? null : `guest_${userId}`},
          ${Number(productId)},
          ${Number(quantity)},
          NOW(), NOW()
        )
      `
    }
  }
  return NextResponse.json({ success: true })
}

/** DELETE /api/cart — Remove a single item, or pass clearAll=true to wipe the cart. */
export async function DELETE(request: NextRequest) {
  const csrfError = assertSameOrigin(request)
  if (csrfError) return csrfError

  const session = await requireSession()
  if (session instanceof NextResponse) return session
  const userId = session.userId

  const { productId, clearAll } = await request.json()

  if (clearAll) {
    await sql`DELETE FROM shopping_carts WHERE user_id = ${userId}`
  } else if (productId) {
    await sql`DELETE FROM shopping_carts WHERE user_id = ${userId} AND product_id = ${productId}`
  } else {
    return NextResponse.json({ error: "productId or clearAll required" }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
