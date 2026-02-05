/**
 * GET /api/health - Health check endpoint
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          api: 'degraded',
        },
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 503 }
    )
  }
}
