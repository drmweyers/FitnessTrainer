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
import { createClient, RedisClientType } from 'redis';

// Determine which Redis client to use based on environment
const useUpstash = !!process.env.UPSTASH_REDIS_REST_URL;

/**
 * Upstash Redis Client (for Vercel)
 * HTTP-based Redis, works with Vercel Edge Functions
 */
let upstashRedis: Redis | null = null;

/**
 * Standard Redis Client (for Digital Ocean, local, etc.)
 * TCP-based Redis, works with traditional servers
 */
let standardRedis: RedisClientType | null = null;

/**
 * Get Redis client (auto-detects environment)
 */
export function getRedis() {
  // Initialize on first use
  if (!upstashRedis && !standardRedis) {
    if (useUpstash) {
      // Upstash Redis (Vercel)
      upstashRedis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      console.log('Redis: Using Upstash (Vercel)');
    } else if (process.env.REDIS_URL) {
      // Standard Redis (Digital Ocean, local, etc.)
      const client = createClient({
        url: process.env.REDIS_URL,
      });

      client.connect().catch((err) => {
        console.error('Redis connection error:', err);
      });

      standardRedis = client;
      console.log('Redis: Using standard client (DO/Local)');
    } else {
      console.warn('Redis: No connection URL found, caching disabled');
    }
  }

  return upstashRedis || standardRedis;
}

/**
 * Redis operations (unified interface)
 */
export const redis = {
  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    const client = getRedis();
    if (!client) return null;

    if (useUpstash) {
      return await (client as Redis).get(key);
    } else {
      return await (client as RedisClientType).get(key) as string | null;
    }
  },

  /**
   * Set a value in Redis
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = getRedis();
    if (!client) return;

    if (useUpstash) {
      if (ttl) {
        await (client as Redis).setex(key, ttl, value);
      } else {
        await (client as Redis).set(key, value);
      }
    } else {
      if (ttl) {
        await (client as RedisClientType).setEx(key, ttl, value);
      } else {
        await (client as RedisClientType).set(key, value);
      }
    }
  },

  /**
   * Delete a value from Redis
   */
  async del(key: string): Promise<void> {
    const client = getRedis();
    if (!client) return;

    if (useUpstash) {
      await (client as Redis).del(key);
    } else {
      await (client as RedisClientType).del(key);
    }
  },

  /**
   * Increment a counter (for rate limiting)
   */
  async incr(key: string): Promise<number> {
    const client = getRedis();
    if (!client) return 0;

    if (useUpstash) {
      return await (client as Redis).incr(key);
    } else {
      return await (client as RedisClientType).incr(key);
    }
  },

  /**
   * Set expiration time
   */
  async expire(key: string, seconds: number): Promise<void> {
    const client = getRedis();
    if (!client) return;

    if (useUpstash) {
      await (client as Redis).expire(key, seconds);
    } else {
      await (client as RedisClientType).expire(key, seconds);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedis();
    if (!client) return false;

    if (useUpstash) {
      const result = await (client as Redis).exists(key);
      return result === 1;
    } else {
      const result = await (client as RedisClientType).exists(key);
      return result === 1;
    }
  },
};

/**
 * Graceful shutdown
 */
process.on('beforeExit', async () => {
  if (standardRedis) {
    await standardRedis.quit();
  }
});

export default redis;
