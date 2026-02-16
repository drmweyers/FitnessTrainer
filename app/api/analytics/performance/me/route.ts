/**
 * Performance Metrics (Me) API Routes
 * GET /api/analytics/performance/me - List authenticated user's performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/performance/me
 * Query performance metrics with filters
 * Supports role-aware access: trainers can view client data with clientId param
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id
    const userRole = req.user!.role
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const exerciseId = searchParams.get('exerciseId')
    const metricType = searchParams.get('metricType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Determine target userId (role-aware)
    let targetUserId = userId

    if (userRole === 'trainer' && clientId) {
      // Validate trainer owns this client
      const trainerClient = await prisma.trainerClient.findFirst({
        where: { trainerId: userId, clientId },
      })

      if (!trainerClient) {
        return NextResponse.json(
          { success: false, error: 'Access denied to client data' },
          { status: 403 }
        )
      }

      targetUserId = clientId
    }
    // Clients cannot use clientId param - always use own userId

    const where: Record<string, unknown> = { userId: targetUserId }

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
