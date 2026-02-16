/**
 * Training Load (Me) API Routes
 * GET /api/analytics/training-load/me - Get weekly training load history
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/training-load/me
 * Returns weekly training load history for the authenticated user
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
    const weeks = parseInt(searchParams.get('weeks') || '12', 10)
    const startDateParam = searchParams.get('startDate')

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

    let startDate: Date
    if (startDateParam) {
      startDate = new Date(startDateParam)
    } else {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - weeks * 7)
    }

    const trainingLoads = await prisma.trainingLoad.findMany({
      where: {
        userId: targetUserId,
        weekStartDate: { gte: startDate },
      },
      orderBy: { weekStartDate: 'asc' },
    })

    return NextResponse.json({ success: true, data: trainingLoads })
  } catch (error) {
    console.error('Error fetching training load:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training load' },
      { status: 500 }
    )
  }
}
