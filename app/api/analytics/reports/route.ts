import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/reports
 * List saved analytics reports for the authenticated user
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id

    const reports = await prisma.analyticsReport.findMany({
      where: { userId },
      select: {
        id: true,
        reportType: true,
        periodStart: true,
        periodEnd: true,
        generatedAt: true,
      },
      orderBy: { generatedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: reports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest
  const userId = req.user!.id

  try {
    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Fetch workout sessions in range
    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
        clientId: userId,
        scheduledDate: { gte: start, lte: end },
      },
      select: {
        id: true,
        scheduledDate: true,
        status: true,
        totalDuration: true,
        totalVolume: true,
        totalSets: true,
        completedSets: true,
        averageRpe: true,
        effortRating: true,
      },
      orderBy: { scheduledDate: 'asc' },
    })

    // Fetch performance metrics in range
    const performanceMetrics = await prisma.performanceMetric.findMany({
      where: {
        userId,
        recordedAt: { gte: start, lte: end },
      },
      select: {
        metricType: true,
        value: true,
        unit: true,
        recordedAt: true,
      },
      orderBy: { recordedAt: 'asc' },
    })

    // Fetch measurements in range
    const measurements = await prisma.userMeasurement.findMany({
      where: {
        userId,
        recordedAt: { gte: start, lte: end },
      },
      select: {
        weight: true,
        bodyFatPercentage: true,
        muscleMass: true,
        recordedAt: true,
      },
      orderBy: { recordedAt: 'asc' },
    })

    // Fetch active goals
    const goals = await prisma.userGoal.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        goalProgress: {
          where: {
            recordedDate: { gte: start, lte: end },
          },
          orderBy: { recordedDate: 'desc' },
          take: 1,
        },
      },
    })

    // Calculate summary stats
    const completedWorkouts = workoutSessions.filter(s => s.status === 'completed')
    const totalDuration = completedWorkouts.reduce((sum, s) => sum + (s.totalDuration || 0), 0)
    const totalVolume = completedWorkouts.reduce((sum, s) => sum + (Number(s.totalVolume) || 0), 0)
    const avgRpe = completedWorkouts.length > 0
      ? completedWorkouts.reduce((sum, s) => sum + (Number(s.averageRpe) || 0), 0) / completedWorkouts.length
      : 0

    const reportData = {
      period: { startDate, endDate },
      summary: {
        totalWorkouts: workoutSessions.length,
        completedWorkouts: completedWorkouts.length,
        completionRate: workoutSessions.length > 0
          ? Math.round((completedWorkouts.length / workoutSessions.length) * 100)
          : 0,
        totalDurationMinutes: totalDuration,
        totalVolume: Math.round(totalVolume * 100) / 100,
        averageRpe: Math.round(avgRpe * 10) / 10,
      },
      workouts: workoutSessions.map(s => ({
        date: s.scheduledDate,
        status: s.status,
        duration: s.totalDuration,
        volume: s.totalVolume ? Number(s.totalVolume) : null,
        sets: s.totalSets,
        completedSets: s.completedSets,
      })),
      performance: performanceMetrics.map(m => ({
        type: m.metricType,
        value: Number(m.value),
        unit: m.unit,
        date: m.recordedAt,
      })),
      measurements: measurements.map(m => ({
        weight: m.weight ? Number(m.weight) : null,
        bodyFat: m.bodyFatPercentage ? Number(m.bodyFatPercentage) : null,
        muscleMass: m.muscleMass ? Number(m.muscleMass) : null,
        date: m.recordedAt,
      })),
      goals: goals.map(g => ({
        type: g.goalType,
        specific: g.specificGoal,
        target: g.targetValue ? Number(g.targetValue) : null,
        targetDate: g.targetDate,
        latestProgress: g.goalProgress[0]
          ? {
              value: Number(g.goalProgress[0].currentValue),
              percentage: Number(g.goalProgress[0].percentageComplete),
            }
          : null,
      })),
    }

    // Save report to DB
    const savedReport = await prisma.analyticsReport.create({
      data: {
        userId,
        reportType: 'progress_report',
        periodStart: start,
        periodEnd: end,
        reportData: reportData as any,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: savedReport.id,
        generatedAt: savedReport.generatedAt,
        ...reportData,
      },
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
