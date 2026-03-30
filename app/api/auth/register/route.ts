export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { validatePassword, hashPassword } from "@/lib/password-utils"
import { generateVerificationToken } from "@/lib/token-utils"
import { createUser, findUserByEmail } from "@/lib/auth-database"
import { sendVerificationEmail } from "@/lib/email/send-email"
import { checkRegisterRateLimit, getClientIP } from "@/lib/rate-limiter"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone } = body

    // Get client IP for rate limiting
    const clientIP = getClientIP(request)

    // Check rate limiting with Upstash Redis
    const rateLimitResult = await checkRegisterRateLimit(clientIP)
    if (rateLimitResult.limited) {
      const remainingSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      const minutes = Math.ceil(remainingSeconds / 60)
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
          rateLimited: true,
          retryAfter: remainingSeconds,
        },
        { status: 429, headers: { "Retry-After": String(remainingSeconds) } },
      )
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "Password validation failed", details: passwordValidation.errors },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email.toLowerCase())
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Create user in database
    const user = await createUser({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email_verification_token: verificationToken,
    })

    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`

    try {
      const emailResult = await sendVerificationEmail(
        {
          id: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
        },
        verificationUrl,
        24, // expires in 24 hours
      )

      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error)
        // Don't fail registration if email fails - user can request resend
      }
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      // Don't fail registration if email fails - user can request resend
    }

    // Return success response (don't include sensitive data)
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. Please check your email to verify your account.",
        user: {
          id: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.email_verified,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
