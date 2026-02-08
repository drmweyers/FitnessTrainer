import { NextRequest, NextResponse } from 'next/server'
import { AuthenticatedRequest } from '@/lib/middleware/auth'
import { authenticateAdmin } from '@/lib/middleware/admin'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const startTime = Date.now()

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    // Database connectivity check
    let dbStatus = 'disconnected'
    let dbLatencyMs = 0
    try {
      const dbStart = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbLatencyMs = Date.now() - dbStart
      dbStatus = 'connected'
    } catch {
      dbStatus = 'disconnected'
    }

    // Uptime calculation
    const uptimeMs = Date.now() - startTime
    const uptimeSeconds = Math.floor(uptimeMs / 1000)
    const uptimeMinutes = Math.floor(uptimeSeconds / 60)
    const uptimeHours = Math.floor(uptimeMinutes / 60)
    const uptimeDays = Math.floor(uptimeHours / 24)

    const uptimeFormatted = uptimeDays > 0
      ? `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m`
      : uptimeHours > 0
        ? `${uptimeHours}h ${uptimeMinutes % 60}m`
        : `${uptimeMinutes}m ${uptimeSeconds % 60}s`

    // Memory usage
    const memUsage = process.memoryUsage()

    return NextResponse.json({
      success: true,
      data: {
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        server: {
          uptime: uptimeFormatted,
          uptimeMs,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          platform: process.platform,
        },
        memory: {
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memUsage.rss / 1024 / 1024),
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('System health check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
