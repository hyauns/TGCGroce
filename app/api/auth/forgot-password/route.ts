export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, setPasswordResetToken } from "@/lib/auth-database"
import { generateResetToken } from "@/lib/token-utils"
import { sendPasswordResetEmail } from "@/lib/email/send-email"
import { checkPasswordResetRateLimit, getClientIP } from "@/lib/rate-limiter"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Get client IP for rate limiting
    const clientIP = getClientIP(request)

    // Check rate limiting with Upstash Redis
    const rateLimitResult = await checkPasswordResetRateLimit(clientIP)
    if (rateLimitResult.limited) {
      const remainingSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      const minutes = Math.ceil(remainingSeconds / 60)
      return NextResponse.json(
        {
          error: `Too many password reset attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
          rateLimited: true,
          retryAfter: remainingSeconds,
        },
        { status: 429, headers: { "Retry-After": String(remainingSeconds) } },
      )
    }

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Find user by email
    const user = await findUserByEmail(email.toLowerCase())

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user && user.status === "active") {
      // Generate reset token
      const { token, hashedToken, expiresAt } = generateResetToken()

      // Store hashed token in database
      const tokenStored = await setPasswordResetToken(user.email, hashedToken, expiresAt)

      if (tokenStored) {
        // Send password reset email
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.BASE_URL || "http://localhost:3000"
        const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`

        const userAgent = request.headers.get("user-agent") || "unknown"

        try {
          const emailResult = await sendPasswordResetEmail(
            {
              id: user.user_id,
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email,
            },
            resetUrl,
            1, // expires in 1 hour
            clientIP,
            userAgent,
          )

          if (!emailResult.success) {
            console.error("Failed to send password reset email:", emailResult.error)
          }
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError)
        }
      }
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we've sent password reset instructions.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
