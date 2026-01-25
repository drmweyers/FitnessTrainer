/**
 * Rate Limiting Middleware (Platform-Agnostic)
 *
 * Redis-based rate limiting for API routes
 * Works with:
 * - Vercel: Uses Upstash Redis
 * - Digital Ocean: Uses managed Redis
 * - Local: Uses local Redis or falls back to in-memory
 */

import { redis } from '@/lib/db/redis';
import { NextResponse } from 'next/server';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  limit: number; // Max requests per window
  window: number; // Time window in seconds
  identifier?: string; // Custom identifier (default: IP address)
}

/**
 * Rate limit result
 */
interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Check rate limit for a request
 *
 * Uses Redis to track request counts per identifier
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Max requests allowed
 * @param window - Time window in seconds
 * @returns Rate limit result
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    // Get current count
    const currentStr = await redis.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;

    // Check if limit exceeded
    if (current >= limit) {
      // Get TTL for reset time
      const ttl = await getTTL(key);
      return {
        allowed: false,
        limit,
        remaining: 0,
        reset: now + ttl,
      };
    }

    // Increment counter
    const newCount = await redis.incr(key);

    // Set expiry on first request
    if (newCount === 1) {
      await redis.expire(key, window);
    }

    return {
      allowed: true,
      limit,
      remaining: limit - newCount,
      reset: now + window,
    };
  } catch (error) {
    // If Redis fails, allow request (fail open)
    console.error('Rate limit error:', error);
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset: now + window,
    };
  }
}

/**
 * Get TTL for a key
 */
async function getTTL(key: string): Promise<number> {
  try {
    // Note: This is a simplified version
    // In production, you'd use a TTL command if available
    // For now, return a default window
    return 900; // 15 minutes default
  } catch {
    return 900;
  }
}

/**
 * Check rate limit and return error response if exceeded
 *
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Error response if limit exceeded, null if allowed
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  // Get identifier (IP address, user ID, or custom)
  const identifier =
    config.identifier ||
    (request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown')?.split(',')[0].trim();

  // Check rate limit
  const result = await rateLimit(identifier, config.limit, config.window);

  // Add rate limit headers to all responses
  const headers = {
    'RateLimit-Limit': result.limit.toString(),
    'RateLimit-Remaining': result.remaining.toString(),
    'RateLimit-Reset': result.reset.toString(),
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  // Return error if limit exceeded
  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: 'Too many requests',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.reset - Math.floor(Date.now() / 1000),
        },
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Pre-built rate limit configurations
 */
export const RateLimits = {
  /**
   * General API rate limit (100 requests per 15 minutes)
   */
  general: async (request: Request) =>
    checkRateLimit(request, { limit: 100, window: 900 }),

  /**
   * Authentication rate limit (5 requests per 15 minutes)
   * For login, register, password reset
   */
  auth: async (request: Request) =>
    checkRateLimit(request, { limit: 5, window: 900 }),

  /**
   * Strict rate limit (3 requests per hour)
   * For sensitive operations like password reset
   */
  strict: async (request: Request) =>
    checkRateLimit(request, { limit: 3, window: 3600 }),

  /**
   * Loose rate limit (1000 requests per hour)
   * For public endpoints like exercises
   */
  loose: async (request: Request) =>
    checkRateLimit(request, { limit: 1000, window: 3600 }),
};

/**
 * Custom rate limit by user ID
 * Use for authenticated user-specific limits
 */
export async function checkUserRateLimit(
  userId: string,
  limit: number = 100,
  window: number = 900
): Promise<NextResponse | null> {
  const result = await rateLimit(`user:${userId}`, limit, window);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: 'Too many requests',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.reset - Math.floor(Date.now() / 1000),
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
        },
      }
    );
  }

  return null;
}

export default rateLimit;
