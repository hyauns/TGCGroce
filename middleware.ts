import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

// Routes that require authentication
// NOTE: /checkout is intentionally excluded — it supports guest checkout
const PROTECTED_ROUTES = ["/account"]

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"]

// Routes that should redirect authenticated users away (e.g. login page)
const AUTH_ROUTES = ["/auth/login", "/auth/register"]

// Security headers applied to all responses
const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://maps.googleapis.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
  "X-XSS-Protection": "1; mode=block",
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get("auth-token")?.value

  // Helper: verify JWT and return payload, or null on failure
  const getPayload = async () => {
    if (!token) return null
    try {
      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        console.error("[middleware] JWT_SECRET environment variable is not set!")
        return null
      }
      const secret = new TextEncoder().encode(jwtSecret)
      const { payload } = await jwtVerify(token, secret)
      return payload as { userId: string; email: string; role: string }
    } catch {
      return null
    }
  }

  // --- Admin route protection ---
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    const payload = await getPayload()

    if (!payload) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (payload.role !== "admin") {
      // Authenticated but not admin — send home
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  }

  // --- Protected routes (must be logged in) ---
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const payload = await getPayload()

    if (!payload) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // --- Auth routes (redirect if already logged in) ---
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const payload = await getPayload()

    if (payload) {
      const destination = payload.role === "admin" ? "/admin/analytics" : "/account"
      return NextResponse.redirect(new URL(destination, request.url))
    }

    return NextResponse.next()
  }

  // Apply security headers to all other responses
  const response = NextResponse.next()

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    // Protected routes
    "/admin/:path*",
    "/account/:path*",
    // Auth routes
    "/auth/login",
    "/auth/register",
    // All other page routes — but explicitly EXCLUDE static assets
    // The negative lookahead (?!) must close properly: ((?!excluded).*)*
    "/((?!_next/static)(?!_next/image)(?!favicon)(?!robots\\.txt)(?!sitemap\\.xml).*)",
  ],
}
