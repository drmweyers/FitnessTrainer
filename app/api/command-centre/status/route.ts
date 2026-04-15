import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const startTime = Date.now()

// GET /api/command-centre/status — BCI Command Centre health endpoint
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.COMMAND_CENTRE_API_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const responseStart = Date.now()

  try {
    const bugCounts = await prisma.bugReport.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const criticalCount = await prisma.bugReport.count({
      where: { priority: 'critical', status: { notIn: ['resolved', 'closed'] } },
    })

    const counts: Record<string, number> = {
      open: 0,
      triaged: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    }
    for (const row of bugCounts) {
      counts[row.status] = row._count.id
    }

    const mem = process.memoryUsage()

    return NextResponse.json({
      success: true,
      data: {
        project: 'evofittrainer',
        displayName: 'EvoFit Trainer',
        health: {
          uptime: Math.floor((Date.now() - startTime) / 1000),
          memoryMB: Math.round(mem.rss / 1024 / 1024),
          responseTimeMs: Date.now() - responseStart,
        },
        bugs: {
          open: counts.open,
          triaged: counts.triaged,
          inProgress: counts.in_progress,
          resolved: counts.resolved,
          closed: counts.closed,
          critical: criticalCount,
        },
        deploy: {
          url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://trainer.evofit.io',
          env: process.env.NODE_ENV ?? 'production',
        },
      },
    })
  } catch (err) {
    console.error('[GET /api/command-centre/status]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch status' }, { status: 500 })
  }
}
