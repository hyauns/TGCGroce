export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-guard"

/**
 * GET /api/auth/test-endpoints
 *
 * Returns an index of auth API endpoints with test payloads for local
 * development and staging verification.
 *
 * SECURITY: Disabled in production. This catalogue aids developers
 * during integration testing and must not be exposed publicly.
 */
export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  const endpoints = [
    {
      method: "POST",
      path: "/api/auth/register",
      description: "User registration with email verification",
      testPayload: {
        email: "test@example.com",
        password: "TestPassword123!",
        firstName: "Test",
        lastName: "User",
      },
    },
    {
      method: "POST",
      path: "/api/auth/verify-email",
      description: "Email verification with token",
      testPayload: {
        token: "verification_token_here",
      },
    },
    {
      method: "POST",
      path: "/api/auth/login",
      description: "User login with JWT token generation",
      testPayload: {
        email: "test@example.com",
        password: "TestPassword123!",
        rememberMe: false,
      },
    },
    {
      method: "GET",
      path: "/api/auth/session",
      description: "Session validation and user data retrieval",
      headers: {
        Cookie: "auth-token=jwt_token_here",
      },
    },
    {
      method: "POST",
      path: "/api/auth/forgot-password",
      description: "Password reset request with email",
      testPayload: {
        email: "test@example.com",
      },
    },
    {
      method: "POST",
      path: "/api/auth/reset-password",
      description: "Password reset with token",
      testPayload: {
        token: "reset_token_here",
        password: "NewPassword123!",
      },
    },
    {
      method: "POST",
      path: "/api/auth/resend-verification",
      description: "Resend email verification",
      testPayload: {
        email: "test@example.com",
      },
    },
    {
      method: "POST",
      path: "/api/auth/logout",
      description: "User logout and session cleanup",
      headers: {
        Cookie: "auth-token=jwt_token_here",
      },
    },
  ]

  return NextResponse.json({
    message: "Authentication API Endpoints (dev/staging only)",
    endpoints,
    testInstructions: {
      automated: "Run: node scripts/07-test-authentication-flow.js",
      manual: "Use the endpoints above with the provided test payloads",
      environment: "Ensure NEXT_PUBLIC_BASE_URL and DATABASE_URL are set",
    },
  })
}
