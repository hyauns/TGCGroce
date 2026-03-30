import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

// Rate limiting constants
export const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
}

export const PASSWORD_RESET_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
}

export const REGISTER_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
}

// Lazy-initialize Redis client to avoid build-time errors with placeholder values
let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token || url === "your_upstash_redis_rest_url" || token === "your_upstash_redis_rest_token") {
    console.warn("[RateLimiter] Upstash Redis not configured. Rate limiting is disabled.")
    return null
  }

  redisClient = new Redis({ url, token })
  return redisClient
}

// Create rate limiters lazily
let loginRatelimit: Ratelimit | null = null
let passwordResetRatelimit: Ratelimit | null = null
let registerRatelimit: Ratelimit | null = null

function getLoginRatelimit(): Ratelimit | null {
  if (loginRatelimit) return loginRatelimit
  const redis = getRedisClient()
  if (!redis) return null

  loginRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      LOGIN_RATE_LIMIT.maxAttempts,
      `${LOGIN_RATE_LIMIT.windowMs / 1000}s`
    ),
    analytics: true,
    prefix: "ratelimit:login",
  })
  return loginRatelimit
}

function getPasswordResetRatelimit(): Ratelimit | null {
  if (passwordResetRatelimit) return passwordResetRatelimit
  const redis = getRedisClient()
  if (!redis) return null

  passwordResetRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      PASSWORD_RESET_RATE_LIMIT.maxAttempts,
      `${PASSWORD_RESET_RATE_LIMIT.windowMs / 1000}s`
    ),
    analytics: true,
    prefix: "ratelimit:password-reset",
  })
  return passwordResetRatelimit
}

function getRegisterRatelimit(): Ratelimit | null {
  if (registerRatelimit) return registerRatelimit
  const redis = getRedisClient()
  if (!redis) return null

  registerRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      REGISTER_RATE_LIMIT.maxAttempts,
      `${REGISTER_RATE_LIMIT.windowMs / 1000}s`
    ),
    analytics: true,
    prefix: "ratelimit:register",
  })
  return registerRatelimit
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limited: boolean
}

async function checkRateLimit(
  ratelimit: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  // If ratelimit is not configured (no Redis), allow all requests
  if (!ratelimit) {
    return {
      success: true,
      remaining: 999,
      reset: Date.now() + 3600000,
      limited: false,
    }
  }

  const result = await ratelimit.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limited: !result.success,
  }
}

// Export rate limit check functions
export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(getLoginRatelimit(), identifier)
}

export async function checkPasswordResetRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(getPasswordResetRatelimit(), identifier)
}

export async function checkRegisterRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(getRegisterRatelimit(), identifier)
}

// Helper to get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : null
  return ip || request.headers.get("x-real-ip") || "anonymous"
}
