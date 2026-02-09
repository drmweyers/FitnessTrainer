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
 * All operations use graceful degradation - they never throw errors
 */
export const redis = {
  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    const client = getRedis();
    if (!client) return null;

    try {
      return await client.get(key);
    } catch (error: any) {
      console.warn(`Redis GET failed for key "${key}":`, error.message);
      return null;
    }
  },

  /**
   * Set a value in Redis
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = getRedis();
    if (!client) return;

    try {
      if (ttl) {
        await client.setex(key, ttl, value);
      } else {
        await client.set(key, value);
      }
    } catch (error: any) {
      console.warn(`Redis SET failed for key "${key}":`, error.message);
    }
  },

  /**
   * Delete a value from Redis
   */
  async del(key: string): Promise<void> {
    const client = getRedis();
    if (!client) return;

    try {
      await client.del(key);
    } catch (error: any) {
      console.warn(`Redis DEL failed for key "${key}":`, error.message);
    }
  },

  /**
   * Increment a counter (for rate limiting)
   */
  async incr(key: string): Promise<number> {
    const client = getRedis();
    if (!client) return 0;

    try {
      return await client.incr(key);
    } catch (error: any) {
      console.warn(`Redis INCR failed for key "${key}":`, error.message);
      return 0;
    }
  },

  /**
   * Set expiration time
   */
  async expire(key: string, seconds: number): Promise<void> {
    const client = getRedis();
    if (!client) return;

    try {
      await client.expire(key, seconds);
    } catch (error: any) {
      console.warn(`Redis EXPIRE failed for key "${key}":`, error.message);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error: any) {
      console.warn(`Redis EXISTS failed for key "${key}":`, error.message);
      return false;
    }
  },

  /**
   * Test Redis connection
   * Returns true if connection is working, false otherwise
   */
  async ping(): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;

    try {
      const testKey = '__redis_health_check__';
      const testValue = 'ping';

      // Try to set and get a test value
      await client.set(testKey, testValue);
      const result = await client.get(testKey);
      await client.del(testKey);

      return result === testValue;
    } catch (error: any) {
      console.warn('Redis PING failed:', error.message);
      return false;
    }
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
