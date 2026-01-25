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
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';

/**
 * GET /api/health
 *
 * Returns health status of all services
 */
export async function GET() {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'unknown',
    platform: process.env.VERCEL ? 'vercel' : process.env.DIGITAL_OCEAN ? 'digital-ocean' : 'unknown',
    services: {
      database: { status: 'unknown', latency: 0 },
      cache: { status: 'unknown', latency: 0 },
    },
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
    };
  } catch (error: any) {
    health.status = 'unhealthy';
    health.services.database = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // Check cache connection
  try {
    const cacheStart = Date.now();

    // Set a test key
    await redis.set('health_check', 'ok', 10);

    // Get the test key
    const result = await redis.get('health_check');

    // Clean up
    await redis.del('health_check');

    const cacheLatency = Date.now() - cacheStart;

    if (result === 'ok') {
      health.services.cache = {
        status: 'healthy',
        latency: cacheLatency,
      };
    } else {
      throw new Error('Cache read/write failed');
    }
  } catch (error: any) {
    health.status = 'degraded';
    health.services.cache = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // Calculate total response time
  health.responseTime = Date.now() - startTime;

  // Set appropriate HTTP status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

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
