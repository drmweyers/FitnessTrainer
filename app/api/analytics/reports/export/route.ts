import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * Wrap a CSV field value, quoting if necessary.
 */
function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Build a single CSV row from an array of values.
 */
function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvField).join(',')
}

/**
 * GET /api/analytics/reports/export
 * Export analytics data as CSV for the authenticated trainer's clients.
 *
 * Query params:
 *   format=csv (required)
 *   reportType=weekly|monthly|quarterly (optional, informational only)
 *   startDate=YYYY-MM-DD (optional, default 30 days ago)
 *   endDate=YYYY-MM-DD   (optional, default today)
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  if (format !== 'csv') {
    return NextResponse.json(
      { success: false, error: 'Unsupported format. Use ?format=csv' },
      { status: 400 }
    )
  }

  const now = new Date()
  const defaultStart = new Date(now)
  defaultStart.setDate(defaultStart.getDate() - 30)

  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : defaultStart
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : now

  const userId = req.user!.id

  try {
    // Get all active clients for this trainer, with their email
    const trainerClients = await prisma.trainerClient.findMany({
      where: { trainerId: userId, status: 'active' },
      select: { clientId: true },
    })

    const rows: string[] = []

    // Header row
    rows.push(
      csvRow([
        'Date Range Start',
        'Date Range End',
        'Client Name',
        'Client Email',
        'Sessions Scheduled',
        'Sessions Completed',
        'Total Volume (kg)',
        'Average Adherence (%)',
        'PRs Achieved',
      ])
    )

    if (trainerClients.length === 0) {
      // Placeholder row when trainer has no clients yet
      rows.push(
        csvRow([
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          'No clients found',
          '',
          0,
          0,
          0,
          0,
          0,
        ])
      )
    }

    // One row per client
    for (const tc of trainerClients) {
      // Fetch client user info
      const clientUser = await prisma.user.findUnique({
        where: { id: tc.clientId },
        select: {
          email: true,
          userProfile: { select: { bio: true } },
        },
      })

      const clientName = clientUser?.email ?? tc.clientId

      // Fetch workout sessions for this client in the date range
      const sessions = await prisma.workoutSession.findMany({
        where: {
          clientId: tc.clientId,
          trainerId: userId,
          scheduledDate: { gte: startDate, lte: endDate },
        },
        select: {
          status: true,
          totalVolume: true,
          adherenceScore: true,
        },
      })

      const completedSessions = sessions.filter((s) => s.status === 'completed')
      const totalVolume = completedSessions.reduce(
        (sum, s) => sum + (s.totalVolume ? Number(s.totalVolume) : 0),
        0
      )
      const avgAdherence =
        completedSessions.length > 0
          ? completedSessions.reduce(
              (sum, s) => sum + (s.adherenceScore ? Number(s.adherenceScore) : 0),
              0
            ) / completedSessions.length
          : 0

      // Count PRs (personal bests) for this client via WorkoutExerciseLog
      const prCount = await prisma.workoutExerciseLog.count({
        where: {
          personalBest: true,
          workoutSession: {
            clientId: tc.clientId,
            trainerId: userId,
            scheduledDate: { gte: startDate, lte: endDate },
          },
        },
      })

      rows.push(
        csvRow([
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          clientName,
          clientUser?.email ?? '',
          sessions.length,
          completedSessions.length,
          Math.round(totalVolume * 100) / 100,
          Math.round(avgAdherence * 10) / 10,
          prCount,
        ])
      )
    }

    const csvContent = rows.join('\r\n')
    const dateStr = now.toISOString().split('T')[0]
    const filename = `evofit-report-${dateStr}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSV export' },
      { status: 500 }
    )
  }
}
