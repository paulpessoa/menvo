/**
 * Simple in-memory rate limiter for invitation endpoints
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request is within rate limits
 * @param key - Unique identifier for the rate limit (e.g., "org:uuid:invitations")
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // No entry or expired entry - create new
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs
    rateLimitStore.set(key, {
      count: 1,
      resetAt
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt
    }
  }

  // Entry exists and not expired
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
}

/**
 * Helper to format reset time for error messages
 */
export function formatResetTime(resetAt: number): string {
  const seconds = Math.ceil((resetAt - Date.now()) / 1000)
  if (seconds < 60) {
    return `${seconds} segundos`
  }
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minutos`
  }
  const hours = Math.ceil(minutes / 60)
  return `${hours} horas`
}
