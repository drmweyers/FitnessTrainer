/**
 * Goal Detail API Routes
 * GET /api/analytics/goals/[id] - Get single goal with progress history
 * PUT /api/analytics/goals/[id] - Update goal
 * DELETE /api/analytics/goals/[id] - Soft delete goal
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateGoalSchema = z.object({
  specificGoal: z.string().optional(),
  targetValue: z.number().positive().optional(),
  targetDate: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
})

/**
 * GET /api/analytics/goals/[id]
 * Get a single goal with its full progress history
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
    const { id } = params

    const goal = await prisma.userGoal.findFirst({
      where: { id, userId },
      include: {
        goalProgress: {
          orderBy: { recordedDate: 'desc' },
        },
      },
    })

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: goal })
  } catch (error) {
    console.error('Error fetching goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goal' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/analytics/goals/[id]
 * Update a goal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id
    const { id } = params
    const body = await request.json()
    const validation = updateGoalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Verify ownership
    const existing = await prisma.userGoal.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    const data = validation.data
    const goal = await prisma.userGoal.update({
      where: { id },
      data: {
        ...(data.specificGoal !== undefined && { specificGoal: data.specificGoal }),
        ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
        ...(data.targetDate !== undefined && { targetDate: new Date(data.targetDate) }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    return NextResponse.json({ success: true, data: goal })
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/analytics/goals/[id]
 * Soft delete a goal (set isActive to false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id
    const { id } = params

    const existing = await prisma.userGoal.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    await prisma.userGoal.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Goal deactivated' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
