/**
 * Personal Bests API Route
 * GET /api/analytics/performance/me/personal-bests - Get personal bests per exercise
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/analytics/performance/me/personal-bests
 * Returns the personal best for each exercise the user has tracked, grouped by metric type
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id

    // Get all metrics for user, grouped by exercise and metric type
    // We use raw SQL for the aggregation
    const results = await prisma.$queryRaw<
      Array<{
        exercise_id: string
        exercise_name: string
        metric_type: string
        max_value: number
        recorded_at: Date
      }>
    >`
      SELECT DISTINCT ON (pm.exercise_id, pm.metric_type)
        pm.exercise_id,
        e.name AS exercise_name,
        pm.metric_type,
        pm.value AS max_value,
        pm.recorded_at
      FROM performance_metrics pm
      JOIN exercises e ON e.id = pm.exercise_id
      WHERE pm.user_id = ${userId}::uuid
        AND pm.exercise_id IS NOT NULL
      ORDER BY pm.exercise_id, pm.metric_type, pm.value DESC
    `

    const personalBests = results.map((row) => ({
      exerciseId: row.exercise_id,
      exercise: row.exercise_name,
      metric: row.metric_type,
      value: Number(row.max_value),
      date: row.recorded_at.toISOString(),
    }))

    return NextResponse.json({ success: true, data: personalBests })
  } catch (error) {
    console.error('Error fetching personal bests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch personal bests' },
      { status: 500 }
    )
  }
}
