/**
 * Goal Progress API Routes
 * GET /api/analytics/goals/[id]/progress - Get progress entries for a goal
 * POST /api/analytics/goals/[id]/progress - Log new progress entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const progressEntrySchema = z.object({
  currentValue: z.number(),
  notes: z.string().optional(),
  recordedDate: z.string().optional(),
})

/**
 * GET /api/analytics/goals/[id]/progress
 * Get progress entries for a specific goal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id
    const { id: goalId } = params

    // Verify the goal belongs to the user
    const goal = await prisma.userGoal.findFirst({
      where: { id: goalId, userId },
    })
    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    const progress = await prisma.goalProgress.findMany({
      where: { goalId },
      orderBy: { recordedDate: 'desc' },
    })

    return NextResponse.json({ success: true, data: progress })
  } catch (error) {
    console.error('Error fetching goal progress:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goal progress' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analytics/goals/[id]/progress
 * Log a new progress entry for a goal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id
    const { id: goalId } = params
    const body = await request.json()
    const validation = progressEntrySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Verify goal belongs to user and get targetValue
    const goal = await prisma.userGoal.findFirst({
      where: { id: goalId, userId },
    })
    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    const data = validation.data
    const recordedDate = data.recordedDate ? new Date(data.recordedDate) : new Date()

    // Auto-calculate percentage complete if targetValue exists
    let percentageComplete = 0
    if (goal.targetValue && Number(goal.targetValue) > 0) {
      percentageComplete = Math.min(
        100,
        (data.currentValue / Number(goal.targetValue)) * 100
      )
    }

    const progress = await prisma.goalProgress.create({
      data: {
        goalId,
        recordedDate,
        currentValue: data.currentValue,
        percentageComplete,
        notes: data.notes,
      },
    })

    // If goal is now 100% complete, mark it as achieved
    if (percentageComplete >= 100 && !goal.achievedAt) {
      await prisma.userGoal.update({
        where: { id: goalId },
        data: { achievedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true, data: progress }, { status: 201 })
  } catch (error) {
    console.error('Error logging goal progress:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log goal progress' },
      { status: 500 }
    )
  }
}
