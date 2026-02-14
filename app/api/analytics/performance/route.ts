/**
 * Performance Metrics API Routes
 * GET /api/analytics/performance - List authenticated user's performance metrics (proxy to /me)
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
 * GET /api/analytics/performance
 * Query performance metrics with filters for the authenticated user
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id
    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get('exerciseId')
    const metricType = searchParams.get('metricType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { userId }

    if (exerciseId) {
      where.exerciseId = exerciseId
    }
    if (metricType) {
      where.metricType = metricType
    }
    if (startDate || endDate) {
      where.recordedAt = {}
      if (startDate) {
        (where.recordedAt as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.recordedAt as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    const metrics = await prisma.performanceMetric.findMany({
      where,
      include: {
        exercise: { select: { id: true, name: true } },
      },
      orderBy: { recordedAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}

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
