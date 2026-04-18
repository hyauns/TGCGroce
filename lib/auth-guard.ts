/**
 * Server-side authentication guard utilities.
 *
 * Use these helpers at the top of every API route handler to enforce
 * authentication and authorization *on the server*, independent of middleware.
 *
 * Middleware is a convenience layer (UI redirects, cookie inspection at the
 * edge) — it is NOT a security boundary for API routes. Every sensitive route
 * must call requireSession() or requireAdmin() directly.
 */

import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { NextResponse } from "next/server"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionPayload {
  userId: string
  email: string
  role: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Read JWT_SECRET from environment. Throws (hard failure) if missing so that
 * a misconfigured server cannot silently fall back to a weak key.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.trim().length === 0) {
    // Log once so it appears in server startup logs
    console.error(
      "[auth-guard] FATAL: JWT_SECRET environment variable is not set. " +
        "All authenticated requests will be rejected."
    )
    throw new Error("JWT_SECRET is not configured")
  }
  return secret
}

// ---------------------------------------------------------------------------
// Public guards
// ---------------------------------------------------------------------------

/**
 * Require a valid auth-token cookie.
 *
 * @returns `SessionPayload` on success.
 * @returns `NextResponse` (401) if not authenticated.
 *
 * Usage:
 * ```ts
 * const session = await requireSession()
 * if (session instanceof NextResponse) return session
 * // session is now SessionPayload
 * ```
 */
export async function requireSession(): Promise<SessionPayload | NextResponse> {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  try {
    const secret = getJwtSecret()
    const decoded = verify(token, secret) as SessionPayload
    return decoded
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    )
  }
}

/**
 * Require a valid auth-token cookie **and** `role === "admin"`.
 *
 * @returns `SessionPayload` on success.
 * @returns `NextResponse` (401) if not authenticated.
 * @returns `NextResponse` (403) if authenticated but not admin.
 *
 * Usage:
 * ```ts
 * const admin = await requireAdmin()
 * if (admin instanceof NextResponse) return admin
 * // admin is now SessionPayload with role === "admin"
 * ```
 */
export async function requireAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    )
  }

  return session
}
