export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { verifyUserEmail } from "@/lib/auth-database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    const result = await verifyUserEmail(token)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: result.user?.user_id,
        email: result.user?.email,
        firstName: result.user?.first_name,
      },
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
