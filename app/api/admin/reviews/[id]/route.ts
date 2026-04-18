import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdmin } from "@/lib/auth-guard"

function getSql() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING
  if (!url) throw new Error("No DATABASE_URL configured")
  return neon(url)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (session instanceof NextResponse) return session

  try {
    const { id } = params
    const body = await request.json()
    const { is_approved } = body

    if (typeof is_approved !== "boolean") {
      return NextResponse.json({ error: "is_approved must be a boolean" }, { status: 400 })
    }

    const sql = getSql()
    await sql`
      UPDATE product_reviews
      SET is_approved = ${is_approved}, updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin/reviews/PATCH]", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (session instanceof NextResponse) return session

  try {
    const { id } = params

    const sql = getSql()
    await sql`
      DELETE FROM product_reviews
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin/reviews/DELETE]", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
