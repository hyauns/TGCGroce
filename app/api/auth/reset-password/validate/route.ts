export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { hashToken } from "@/lib/token-utils"
import { validatePasswordResetToken } from "@/lib/auth-database"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ valid: false, error: "No token provided" }, { status: 400 })
  }

  try {
    const hashedToken = hashToken(token)

    const isValidFormat = /^[a-f0-9]{64}$/i.test(token)
    if (!isValidFormat) {
      return NextResponse.json({ valid: false, error: "Invalid token format" }, { status: 400 })
    }

    const isValidToken = await validatePasswordResetToken(hashedToken)
    if (!isValidToken) {
      return NextResponse.json({ valid: false, error: "Invalid or expired token" }, { status: 400 })
    }

    return NextResponse.json({ valid: true }, { status: 200 })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ valid: false, error: "Failed to validate token" }, { status: 500 })
  }
}
