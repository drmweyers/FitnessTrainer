/**
 * Milestones API Route
 * GET /api/analytics/milestones - List user's milestone achievements (proxy to /me)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/milestones
 * List the authenticated user's milestone achievements ordered by most recent
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const userId = req.user!.id

    const milestones = await prisma.milestoneAchievement.findMany({
      where: { userId },
      orderBy: { achievedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: milestones })
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}
