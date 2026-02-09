/**
 * Health Check API Route
 *
 * Platform-agnostic health check for:
 * - Vercel (serverless functions)
 * - Digital Ocean (Express.js)
 *
 * Checks:
 * - Database connection (PostgreSQL)
 * - Cache connection (Redis)
 * - Service availability
 * - Environment configuration
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';
import { getEnvironmentSummary } from '@/lib/utils/env-check';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Returns health status of all services
 */
export async function GET() {
  const startTime = Date.now();
  const health = {
    status: 'healthy' as 'healthy' | 'unhealthy' | 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'unknown',
    platform: process.env.VERCEL ? 'vercel' : process.env.DIGITAL_OCEAN ? 'digital-ocean' : 'unknown',
    services: {
      database: { status: 'unknown' as string, latency: 0, error: undefined as string | undefined },
      cache: { status: 'unknown' as string, latency: 0, error: undefined as string | undefined, configured: false },
    },
    config: getEnvironmentSummary(),
    version: process.env.npm_package_version || '1.0.0',
    responseTime: 0,
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as result`;
    const dbLatency = Date.now() - dbStart;

    health.services.database = {
      status: 'healthy',
      latency: dbLatency,
      error: undefined,
    };
  } catch (error: any) {
    health.status = 'unhealthy';
    health.services.database = {
      status: 'unhealthy',
      latency: 0,
      error: error.message,
    };
  }

  // Check cache connection
  try {
    // Check if Redis is configured
    const isRedisConfigured =
      !!process.env.UPSTASH_REDIS_REST_URL || !!process.env.REDIS_URL;

    if (!isRedisConfigured) {
      // Redis not configured - this is OK, cache is optional
      health.services.cache = {
        status: 'disabled',
        latency: 0,
        error: 'Redis not configured (optional service)',
        configured: false,
      };
    } else {
      const cacheStart = Date.now();

      // Use the redis.ping() method for health check
      const pingSuccess = await redis.ping();

      const cacheLatency = Date.now() - cacheStart;

      if (pingSuccess) {
        health.services.cache = {
          status: 'healthy',
          latency: cacheLatency,
          error: undefined,
          configured: true,
        };
      } else {
        // Redis configured but not responding
        health.status = 'degraded';
        health.services.cache = {
          status: 'unhealthy',
          latency: cacheLatency,
          error: 'Redis configured but connection failed',
          configured: true,
        };
      }
    }
  } catch (error: any) {
    // This should never happen with graceful degradation, but just in case
    health.status = 'degraded';
    health.services.cache = {
      status: 'unhealthy',
      latency: 0,
      error: error.message,
      configured: true,
    };
  }

  // Calculate total response time
  health.responseTime = Date.now() - startTime;

  // Set appropriate HTTP status code
  // 200 for healthy or degraded (cache is optional)
  // 503 for unhealthy (database is required)
  const statusCode = health.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}

/**
 * OPTIONS /api/health
 *
 * CORS preflight support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
