export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdmin } from "@/lib/auth-guard"

/**
 * DEBUG ENDPOINT — Queries raw DB state for an order to diagnose the webhook disconnect.
 * Usage: GET /api/debug/order-status?orderNumber=ORD-XXXXX
 * 
 * This should be REMOVED after debugging is complete.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get("orderNumber")

  if (!orderNumber) {
    return NextResponse.json({ error: "orderNumber query param required" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)

    // 1. Query the orders table directly
    const orderRows = await sql`
      SELECT id, order_number, status, payment_status, created_at
      FROM orders
      WHERE order_number = ${orderNumber}
      LIMIT 1
    `

    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found in DB", orderNumber }, { status: 404 })
    }

    const order = orderRows[0]

    // 2. Query payment_transactions for this order
    const txRows = await sql`
      SELECT id, order_id, transaction_id, status, amount, processed_at
      FROM payment_transactions
      WHERE order_id = ${String(order.id)}
      ORDER BY processed_at DESC
      LIMIT 5
    `

    // 3. Check webhook_deliveries if the table exists
    let webhookRows: any[] = []
    try {
      webhookRows = await sql`
        SELECT id, event, status, target_url, created_at, response_code
        FROM webhook_deliveries
        ORDER BY created_at DESC
        LIMIT 5
      `
    } catch {
      // Table may not exist
    }

    return NextResponse.json({
      diagnosis: {
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,
          created_at: order.created_at,
        },
        payment_transactions: txRows.map((tx: any) => ({
          id: tx.id,
          order_id: tx.order_id,
          transaction_id: tx.transaction_id,
          status: tx.status,
          amount: tx.amount,
          processed_at: tx.processed_at,
        })),
        recent_webhooks: webhookRows,
        analysis: {
          order_still_pending: order.payment_status === 'PENDING',
          has_transactions: txRows.length > 0,
          transaction_id_synced: txRows.length > 0 ? !txRows[0].transaction_id?.startsWith('txn_') : 'N/A',
          transaction_status: txRows.length > 0 ? txRows[0].status : 'NO_TRANSACTION',
        }
      }
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    console.error("[debug/order-status] Error")
    return NextResponse.json({ error: "Failed to inspect order status" }, { status: 500 })
  }
}
