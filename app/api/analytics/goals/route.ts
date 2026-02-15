/**
 * Goals API Routes
 * GET /api/analytics/goals - List user's goals
 * POST /api/analytics/goals - Create a new goal
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const createGoalSchema = z.object({
  goalType: z.enum([
    'weight_loss',
    'muscle_gain',
    'endurance',
    'strength',
    'flexibility',
    'general_fitness',
    'sport_specific',
    'rehabilitation',
  ]),
  specificGoal: z.string().optional(),
  targetValue: z.number().positive().optional(),
  targetDate: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
})

/**
 * GET /api/analytics/goals
 * List goals - own goals for clients, client goals for trainers, all for admins
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id
    const userRole = req.user!.role

    let userIds: string[] = [userId]

    // Trainers see their clients' goals
    if (userRole === 'trainer') {
      const trainerClients = await prisma.trainerClient.findMany({
        where: { trainerId: userId },
        select: { clientId: true },
      })
      const clientIds = trainerClients.map(tc => tc.clientId)
      userIds = [userId, ...clientIds]
    }

    // Admins see all goals
    const whereClause = userRole === 'admin' ? {} : { userId: { in: userIds } }

    const goals = await prisma.userGoal.findMany({
      where: whereClause,
      include: {
        goalProgress: {
          orderBy: { recordedDate: 'desc' },
          take: 1,
        },
        user: {
          select: { id: true, email: true },
        },
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ success: true, data: goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analytics/goals
 * Create a new goal for the authenticated user
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = createGoalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const userId = req.user!.id

    const goal = await prisma.userGoal.create({
      data: {
        userId,
        goalType: data.goalType,
        specificGoal: data.specificGoal,
        targetValue: data.targetValue,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        priority: data.priority,
      },
    })

    return NextResponse.json({ success: true, data: goal }, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}
