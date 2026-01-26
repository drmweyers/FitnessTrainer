/**
 * Redis Client Singleton (Platform-Agnostic)
 *
 * Works with:
 * - Vercel: Uses Upstash Redis (HTTP API)
 * - Digital Ocean: Uses managed Redis (TCP or HTTP)
 * - Local: Uses standalone Redis or Docker
 *
 * Configuration via environment variables:
 * - REDIS_URL: Standard Redis connection string
 * - UPSTASH_REDIS_REST_URL: Upstash HTTP endpoint (Vercel)
 * - UPSTASH_REDIS_REST_TOKEN: Upstash auth token (Vercel)
 */

import { Redis } from '@upstash/redis';

// Note: Standard Redis support for Digital Ocean is disabled for Vercel deployment
// To enable for Digital Ocean: npm install redis and uncomment the relevant code

// Determine which Redis client to use based on environment
const useUpstash = !!process.env.UPSTASH_REDIS_REST_URL;

/**
 * Upstash Redis Client (for Vercel)
 * HTTP-based Redis, works with Vercel Edge Functions
 */
let upstashRedis: Redis | null = null;

// Standard Redis client types (disabled for Vercel)
// When migrating to Digital Ocean, uncomment and install redis package
// let standardRedis: RedisClientType | null = null;

/**
 * Get Redis client (Upstash for Vercel)
 */
export function getRedis() {
  // Initialize on first use
  if (!upstashRedis) {
    if (useUpstash) {
      // Upstash Redis (Vercel)
      upstashRedis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      console.log('Redis: Using Upstash (Vercel)');
    } else {
      console.warn('Redis: No UPSTASH_REDIS_REST_URL found, caching disabled');
    }
  }

  return upstashRedis;
}

/**
 * Redis operations (Upstash interface)
 */
export const redis = {
  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    const client = getRedis();
    if (!client) return null;
    return await client.get(key);
  },

  /**
   * Set a value in Redis
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = getRedis();
    if (!client) return;

    if (ttl) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  },

  /**
   * Delete a value from Redis
   */
  async del(key: string): Promise<void> {
    const client = getRedis();
    if (!client) return;
    await client.del(key);
  },

  /**
   * Increment a counter (for rate limiting)
   */
  async incr(key: string): Promise<number> {
    const client = getRedis();
    if (!client) return 0;
    return await client.incr(key);
  },

  /**
   * Set expiration time
   */
  async expire(key: string, seconds: number): Promise<void> {
    const client = getRedis();
    if (!client) return;
    await client.expire(key, seconds);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;
    const result = await client.exists(key);
    return result === 1;
  },
};

/**
 * Graceful shutdown (Upstash doesn't need explicit cleanup)
 */
// Note: Upstash Redis is HTTP-based and doesn't require connection cleanup
// For Digital Ocean migration, uncomment:
// process.on('beforeExit', async () => {
//   if (standardRedis) {
//     await standardRedis.quit();
//   }
// });

export default redis;
