export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const sql = neon(process.env.DATABASE_URL!)

async function getUserIdFromRequest(): Promise<string | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return null
    const decoded = verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET() {
  const userId = await getUserIdFromRequest()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Resolve the customers.id for this user (the FK used in orders.customer_id)
    const [customerRow] = await sql`
      SELECT id FROM customers WHERE user_id = ${userId} LIMIT 1
    `

    if (!customerRow) {
      // No customer record yet — no orders possible
      return NextResponse.json({ orders: [] })
    }

    const customerId = customerRow.id

    // Fetch orders with aggregated items as JSON
    const orders = await sql`
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.payment_status,
        o.subtotal,
        o.tax_amount,
        o.shipping_amount,
        o.total_amount,
        o.shipping_address,
        o.billing_address,
        o.tracking_number,
        o.order_date,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',           oi.id,
              'product_id',   oi.product_id,
              'product_name', oi.product_name,
              'quantity',     oi.quantity,
              'unit_price',   oi.unit_price,
              'total_price',  oi.total_price
            )
            ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_id = ${String(customerId)}
      GROUP BY o.id
      ORDER BY o.order_date DESC
    `

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: String(o.id),
        order_number: o.order_number,
        status: o.status,
        payment_status: o.payment_status,
        subtotal: Number(o.subtotal),
        tax_amount: Number(o.tax_amount),
        shipping_amount: Number(o.shipping_amount),
        total_amount: Number(o.total_amount),
        shipping_address: o.shipping_address,
        billing_address: o.billing_address,
        tracking_number: o.tracking_number,
        order_date: o.order_date,
        created_at: o.created_at,
        items: o.items || [],
      })),
    })
  } catch (error) {
    console.error("Account orders fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
