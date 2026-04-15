import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { withTier } from '@/lib/subscription/withTier'
import { getEntitlements } from '@/lib/subscription/EntitlementsService'
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
 * Header columns shared between CSV and Excel exports.
 */
const REPORT_HEADERS = [
  'Date Range Start',
  'Date Range End',
  'Client Name',
  'Client Email',
  'Sessions Scheduled',
  'Sessions Completed',
  'Total Volume (kg)',
  'Average Adherence (%)',
  'PRs Achieved',
] as const

type ReportRow = (string | number)[]

/**
 * Fetch analytics report data for the authenticated trainer.
 * Returns an array of rows (each row = array of values matching REPORT_HEADERS).
 */
async function fetchReportData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ReportRow[]> {
  const trainerClients = await prisma.trainerClient.findMany({
    where: { trainerId: userId, status: 'active' },
    select: { clientId: true },
  })

  const rows: ReportRow[] = []
  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  if (trainerClients.length === 0) {
    rows.push([startStr, endStr, 'No clients found', '', 0, 0, 0, 0, 0])
    return rows
  }

  for (const tc of trainerClients) {
    const clientUser = await prisma.user.findUnique({
      where: { id: tc.clientId },
      select: {
        email: true,
        userProfile: { select: { bio: true } },
      },
    })

    const clientName = clientUser?.email ?? tc.clientId
    const clientEmail = clientUser?.email ?? ''

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

    rows.push([
      startStr,
      endStr,
      clientName,
      clientEmail,
      sessions.length,
      completedSessions.length,
      Math.round(totalVolume * 100) / 100,
      Math.round(avgAdherence * 10) / 10,
      prCount,
    ])
  }

  return rows
}

/**
 * GET /api/analytics/reports/export
 * Export analytics data as CSV or Excel for the authenticated trainer's clients.
 *
 * Query params:
 *   format=csv|excel (required)
 *   reportType=weekly|monthly|quarterly (optional, informational only)
 *   startDate=YYYY-MM-DD (optional, default 30 days ago)
 *   endDate=YYYY-MM-DD   (optional, default today)
 *
 * Excel format is Enterprise-tier only.
 */
async function handler(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  if (format !== 'csv' && format !== 'excel') {
    return NextResponse.json(
      { success: false, error: 'Unsupported format. Use ?format=csv or ?format=excel' },
      { status: 400 }
    )
  }

  // Excel is Enterprise-only — check tier before fetching data
  if (format === 'excel') {
    const entitlements = await getEntitlements(req.user!.id)
    if (entitlements.tier !== 'enterprise') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEATURE_LOCKED',
            message: 'Excel export is available on Enterprise tier only',
            currentTier: entitlements.tier,
            requiredTier: 'enterprise',
            upgradeRequired: true,
          },
        },
        { status: 403 }
      )
    }
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
  const dateStr = now.toISOString().split('T')[0]

  try {
    const dataRows = await fetchReportData(userId, startDate, endDate)

    if (format === 'excel') {
      // Build Excel workbook
      const aoa: (string | number)[][] = [
        [...REPORT_HEADERS],
        ...dataRows,
      ]
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      XLSX.utils.book_append_sheet(wb, ws, 'Analytics Report')
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      const body: BodyInit = buf instanceof Uint8Array ? buf.buffer as ArrayBuffer : (buf as Buffer).buffer as ArrayBuffer

      return new NextResponse(body, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="evofit-report-${dateStr}.xlsx"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // CSV format
    const csvRows: string[] = [csvRow([...REPORT_HEADERS])]
    for (const row of dataRows) {
      csvRows.push(csvRow(row))
    }
    const csvContent = csvRows.join('\r\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="evofit-report-${dateStr}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const isExcel = format === 'excel'
    return NextResponse.json(
      { success: false, error: `Failed to generate ${isExcel ? 'Excel' : 'CSV'} export` },
      { status: 500 }
    )
  }
}

export const GET = withTier({ feature: 'analytics' })(handler)
