export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
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
    const [row] = await sql`
      SELECT
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.email_verified,
        u.created_at,
        c.id            AS customer_id,
        c.total_orders,
        c.total_spent,
        c.last_order_date
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.user_id
      WHERE u.user_id = ${userId}
      LIMIT 1
    `

    if (!row) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json({
      user_id: row.user_id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      role: row.role,
      email_verified: row.email_verified,
      created_at: row.created_at,
      customer_id: row.customer_id ?? null,
      total_orders: row.total_orders ? Number(row.total_orders) : 0,
      total_spent: row.total_spent ? Number(row.total_spent) : 0,
      last_order_date: row.last_order_date ?? null,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromRequest()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const { first_name, last_name } = body

    if (!first_name || !last_name) {
      return NextResponse.json({ error: "first_name and last_name are required" }, { status: 400 })
    }

    const [updated] = await sql`
      UPDATE users
      SET first_name = ${first_name}, last_name = ${last_name}, updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING user_id, email, first_name, last_name, role, email_verified, created_at
    `

    // Also sync to customers table if it exists
    await sql`
      UPDATE customers
      SET first_name = ${first_name}, last_name = ${last_name}
      WHERE user_id = ${userId}
    `

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
