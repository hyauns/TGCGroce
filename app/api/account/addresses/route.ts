export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const sql = neon(process.env.DATABASE_URL!)

async function getCustomerIdFromRequest(): Promise<string | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return null
    const decoded = verify(token, JWT_SECRET) as { userId: string }
    const [row] = await sql`SELECT id FROM customers WHERE user_id = ${decoded.userId} LIMIT 1`
    return row?.id ? String(row.id) : null
  } catch {
    return null
  }
}

export async function GET() {
  const customerId = await getCustomerIdFromRequest()
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const addresses = await sql`
      SELECT
        id, first_name, last_name, company,
        address_line1, address_line2, city, state,
        postal_code, country, phone, is_default,
        created_at
      FROM shipping_addresses
      WHERE customer_id = ${customerId}
      ORDER BY is_default DESC, created_at DESC
    `
    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("Addresses fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const customerId = await getCustomerIdFromRequest()
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const {
      first_name, last_name, company,
      address_line1, address_line2, city, state,
      postal_code, country, phone, is_default,
    } = body

    // If the new address is marked as default, clear existing defaults first
    if (is_default) {
      await sql`
        UPDATE shipping_addresses SET is_default = false WHERE customer_id = ${customerId}
      `
    }

    const [created] = await sql`
      INSERT INTO shipping_addresses (
        customer_id, first_name, last_name, company,
        address_line1, address_line2, city, state,
        postal_code, country, phone, is_default
      ) VALUES (
        ${customerId}, ${first_name}, ${last_name}, ${company ?? null},
        ${address_line1}, ${address_line2 ?? null}, ${city}, ${state},
        ${postal_code}, ${country ?? "AU"}, ${phone ?? null}, ${is_default ?? false}
      )
      RETURNING *
    `
    return NextResponse.json({ address: created }, { status: 201 })
  } catch (error) {
    console.error("Address create error:", error)
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 })
  }
}
