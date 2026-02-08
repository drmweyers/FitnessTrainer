/**
 * Performance Metrics API Routes
 * POST /api/analytics/performance - Record a new performance metric
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const performanceMetricSchema = z.object({
  exerciseId: z.string().uuid(),
  metricType: z.enum(['one_rm', 'volume', 'endurance', 'power', 'speed', 'body_weight', 'body_fat', 'muscle_mass']),
  value: z.number().positive(),
  unit: z.string().max(20),
  workoutSessionId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

/**
 * POST /api/analytics/performance
 * Record a new performance metric for the authenticated user
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = performanceMetricSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const userId = req.user!.id

    const metric = await prisma.performanceMetric.create({
      data: {
        userId,
        exerciseId: data.exerciseId,
        metricType: data.metricType,
        value: data.value,
        unit: data.unit,
        workoutSessionId: data.workoutSessionId,
        notes: data.notes,
      },
      include: {
        exercise: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: metric }, { status: 201 })
  } catch (error) {
    console.error('Error recording performance metric:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record performance metric' },
      { status: 500 }
    )
  }
}
