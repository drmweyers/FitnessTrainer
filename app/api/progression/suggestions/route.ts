import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { calculateProgression } from '@/lib/services/progressionService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  const { searchParams } = new URL(request.url)
  const exerciseId = searchParams.get('exerciseId')
  const clientId = searchParams.get('clientId') || req.user!.id
  const weeks = parseInt(searchParams.get('weeks') || '4', 10)

  if (!exerciseId) {
    return NextResponse.json(
      { success: false, error: 'exerciseId is required' },
      { status: 400 }
    )
  }

  // Calculate the date range
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - weeks * 7)

  // Query workout set logs for this exercise in the time period
  const exerciseLogs = await prisma.workoutExerciseLog.findMany({
    where: {
      exerciseId,
      workoutSession: {
        clientId,
        createdAt: { gte: sinceDate },
      },
    },
    include: {
      setLogs: {
        orderBy: { setNumber: 'asc' },
      },
      exercise: {
        select: { bodyPart: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Flatten set logs into the format expected by calculateProgression
  const recentSets = exerciseLogs.flatMap(log =>
    log.setLogs
      .filter((s: any) => s.completed && !s.skipped)
      .map((s: any) => ({
        weight: s.weight ? Number(s.weight) : 0,
        reps: s.actualReps ?? 0,
        rpe: s.rpe ? Number(s.rpe) : null,
        targetReps: s.plannedReps ? parseInt(s.plannedReps, 10) || undefined : undefined,
        failed: !s.completed,
        createdAt: s.timestamp || log.createdAt,
      }))
  )

  if (recentSets.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        strategy: 'maintain',
        reason: 'No workout data found',
        confidence: 'low',
        dataPoints: 0,
        suggestedWeight: 0,
        suggestedReps: 8,
      },
    })
  }

  const bodyPart = exerciseLogs[0]?.exercise?.bodyPart || undefined

  const suggestion = calculateProgression({
    exerciseId,
    recentSets,
    bodyPart,
  })

  return NextResponse.json({
    success: true,
    data: suggestion,
  })
}
