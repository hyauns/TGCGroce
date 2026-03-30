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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { addressId: string } },
) {
  const customerId = await getCustomerIdFromRequest()
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await sql`
      DELETE FROM shipping_addresses
      WHERE id = ${params.addressId} AND customer_id = ${customerId}
      RETURNING id
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Address delete error:", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { addressId: string } },
) {
  const customerId = await getCustomerIdFromRequest()
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const {
      first_name, last_name, company,
      address_line1, address_line2, city, state,
      postal_code, country, phone, is_default,
    } = body

    if (is_default) {
      await sql`
        UPDATE shipping_addresses SET is_default = false WHERE customer_id = ${customerId}
      `
    }

    const [updated] = await sql`
      UPDATE shipping_addresses SET
        first_name   = ${first_name},
        last_name    = ${last_name},
        company      = ${company ?? null},
        address_line1 = ${address_line1},
        address_line2 = ${address_line2 ?? null},
        city         = ${city},
        state        = ${state},
        postal_code  = ${postal_code},
        country      = ${country ?? "AU"},
        phone        = ${phone ?? null},
        is_default   = ${is_default ?? false}
      WHERE id = ${params.addressId} AND customer_id = ${customerId}
      RETURNING *
    `

    if (!updated) return NextResponse.json({ error: "Address not found" }, { status: 404 })
    return NextResponse.json({ address: updated })
  } catch (error) {
    console.error("Address update error:", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}
