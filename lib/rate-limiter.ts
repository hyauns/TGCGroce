import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

export const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
}

export const PASSWORD_RESET_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000,
}

export const REGISTER_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
}

export const CONTACT_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000,
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limited: boolean
  backendAvailable: boolean
}

type LimitConfig = {
  maxAttempts: number
  windowMs: number
  prefix: string
}

const redisConfigInvalid = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  return (
    !url ||
    !token ||
    url === "your_upstash_redis_rest_url" ||
    token === "your_upstash_redis_rest_token"
  )
}

const isProduction = process.env.NODE_ENV === "production"

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient
  if (redisConfigInvalid()) return null

  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  return redisClient
}

const fallbackStore = new Map<string, { count: number; reset: number }>()

function checkMemoryRateLimit(identifier: string, config: LimitConfig): RateLimitResult {
  const now = Date.now()
  const key = `${config.prefix}:${identifier}`
  const existing = fallbackStore.get(key)

  if (!existing || existing.reset <= now) {
    fallbackStore.set(key, { count: 1, reset: now + config.windowMs })
    return {
      success: true,
      remaining: Math.max(config.maxAttempts - 1, 0),
      reset: now + config.windowMs,
      limited: false,
      backendAvailable: true,
    }
  }

  existing.count += 1
  fallbackStore.set(key, existing)

  const limited = existing.count > config.maxAttempts
  return {
    success: !limited,
    remaining: Math.max(config.maxAttempts - existing.count, 0),
    reset: existing.reset,
    limited,
    backendAvailable: true,
  }
}

const ratelimitCache = new Map<string, Ratelimit>()

function getRatelimit(config: LimitConfig): Ratelimit | null {
  const cached = ratelimitCache.get(config.prefix)
  if (cached) return cached

  const redis = getRedisClient()
  if (!redis) return null

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxAttempts, `${config.windowMs / 1000}s`),
    analytics: true,
    prefix: config.prefix,
  })

  ratelimitCache.set(config.prefix, ratelimit)
  return ratelimit
}

async function checkRateLimit(config: LimitConfig, identifier: string): Promise<RateLimitResult> {
  const ratelimit = getRatelimit(config)

  if (!ratelimit) {
    if (isProduction) {
      console.error(`[RateLimiter] ${config.prefix} backend unavailable in production`)
      return {
        success: false,
        remaining: 0,
        reset: Date.now() + config.windowMs,
        limited: true,
        backendAvailable: false,
      }
    }

    return checkMemoryRateLimit(identifier, config)
  }

  const result = await ratelimit.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limited: !result.success,
    backendAvailable: true,
  }
}

export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(
    { ...LOGIN_RATE_LIMIT, prefix: "ratelimit:login" },
    identifier,
  )
}

export async function checkPasswordResetRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(
    { ...PASSWORD_RESET_RATE_LIMIT, prefix: "ratelimit:password-reset" },
    identifier,
  )
}

export async function checkRegisterRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(
    { ...REGISTER_RATE_LIMIT, prefix: "ratelimit:register" },
    identifier,
  )
}

export async function checkContactRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(
    { ...CONTACT_RATE_LIMIT, prefix: "ratelimit:contact" },
    identifier,
  )
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : null
  return ip || request.headers.get("x-real-ip") || "anonymous"
}
