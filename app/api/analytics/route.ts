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

/**
 * POST /api/analytics
 * Body: { eventType, pageUrl, productId?, sessionId?, metadata? }
 *
 * Silent endpoint — always returns 200 so the client never retries.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, pageUrl, productId, sessionId, metadata } = body

    if (!eventType) return NextResponse.json({ ok: true })

    const customerId = getUserId()

    await sql`
      INSERT INTO website_analytics (
        event_type,
        page_url,
        product_id,
        customer_id,
        session_id,
        metadata,
        created_at
      ) VALUES (
        ${eventType},
        ${pageUrl ?? null},
        ${productId ?? null},
        ${customerId ?? null},
        ${sessionId ?? null},
        ${metadata ? JSON.stringify(metadata) : null},
        NOW()
      )
    `
  } catch {
    // Never surface analytics errors to the client
  }

  return NextResponse.json({ ok: true })
}
