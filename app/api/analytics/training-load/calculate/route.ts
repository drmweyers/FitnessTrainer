/**
 * Training Load Calculate API Route
 * POST /api/analytics/training-load/calculate - Calculate training load for a week
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const calculateSchema = z.object({
  weekStartDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
})

/**
 * POST /api/analytics/training-load/calculate
 * Calculate and upsert training load for a specific week
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = calculateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const userId = req.user!.id
    const weekStart = new Date(validation.data.weekStartDate)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // Aggregate data from completed workout sessions in this week
    const sessionsInWeek = await prisma.workoutSession.findMany({
      where: {
        clientId: userId,
        status: 'completed',
        scheduledDate: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      include: {
        exerciseLogs: {
          include: {
            setLogs: {
              where: { completed: true },
            },
          },
        },
      },
    })

    // Calculate aggregates
    let totalSets = 0
    let totalReps = 0
    let totalVolume = 0
    const trainingDays = new Set<string>()

    for (const session of sessionsInWeek) {
      trainingDays.add(session.scheduledDate.toISOString().split('T')[0])
      for (const exerciseLog of session.exerciseLogs) {
        for (const setLog of exerciseLog.setLogs) {
          totalSets++
          if (setLog.actualReps) {
            totalReps += setLog.actualReps
          }
          if (setLog.weight && setLog.actualReps) {
            totalVolume += Number(setLog.weight) * setLog.actualReps
          }
        }
      }
    }

    // Calculate acute load (current week volume) and chronic load (4-week average)
    const fourWeeksAgo = new Date(weekStart)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const previousLoads = await prisma.trainingLoad.findMany({
      where: {
        userId,
        weekStartDate: {
          gte: fourWeeksAgo,
          lt: weekStart,
        },
      },
      orderBy: { weekStartDate: 'asc' },
    })

    const acuteLoad = totalVolume
    const allVolumes = [...previousLoads.map((l) => Number(l.totalVolume)), totalVolume]
    const chronicLoad =
      allVolumes.length > 0
        ? allVolumes.reduce((sum, v) => sum + v, 0) / allVolumes.length
        : 0
    const loadRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 0

    // Upsert the training load record
    const trainingLoad = await prisma.trainingLoad.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart,
        },
      },
      update: {
        totalVolume,
        totalSets,
        totalReps,
        trainingDays: trainingDays.size,
        acuteLoad,
        chronicLoad,
        loadRatio: Math.round(loadRatio * 100) / 100,
      },
      create: {
        userId,
        weekStartDate: weekStart,
        totalVolume,
        totalSets,
        totalReps,
        trainingDays: trainingDays.size,
        acuteLoad,
        chronicLoad,
        loadRatio: Math.round(loadRatio * 100) / 100,
      },
    })

    return NextResponse.json({ success: true, data: trainingLoad })
  } catch (error) {
    console.error('Error calculating training load:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate training load' },
      { status: 500 }
    )
  }
}
