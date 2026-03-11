import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/middleware/admin'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

interface ActivityLogEntry {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  timestamp: string
  details?: string
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10)), 100)

    // Query recent logins
    const recentUsers = await prisma.user.findMany({
      orderBy: { lastLoginAt: 'desc' },
      take: 7,
      where: { lastLoginAt: { not: null } },
      select: { id: true, email: true, lastLoginAt: true },
    })

    // Query recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 7,
      select: {
        id: true,
        trainerId: true,
        title: true,
        status: true,
        updatedAt: true,
        trainer: { select: { email: true } },
      },
    })

    // Query recent workout sessions
    const recentWorkouts = await prisma.workoutSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 7,
      select: {
        id: true,
        clientId: true,
        status: true,
        updatedAt: true,
        client: { select: { email: true } },
      },
    })

    // Map to unified format
    const entries: ActivityLogEntry[] = []

    for (const user of recentUsers) {
      entries.push({
        id: `login-${user.id}`,
        userId: user.id,
        userName: user.email.split('@')[0].replace(/[._]/g, ' '),
        action: 'logged_in',
        resource: 'auth',
        timestamp: user.lastLoginAt!.toISOString(),
      })
    }

    for (const appt of recentAppointments) {
      entries.push({
        id: `appt-${appt.id}`,
        userId: appt.trainerId,
        userName: appt.trainer?.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'Unknown',
        action: 'updated',
        resource: 'appointment',
        timestamp: appt.updatedAt ? appt.updatedAt.toISOString() : new Date().toISOString(),
        details: `${appt.title} (${appt.status})`,
      })
    }

    for (const workout of recentWorkouts) {
      entries.push({
        id: `workout-${workout.id}`,
        userId: workout.clientId,
        userName: workout.client?.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'Unknown',
        action: workout.status === 'completed' ? 'completed' : 'updated',
        resource: 'workout',
        timestamp: workout.updatedAt ? workout.updatedAt.toISOString() : new Date().toISOString(),
        details: `Workout session (${workout.status})`,
      })
    }

    // Sort by timestamp desc and limit
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const limited = entries.slice(0, limit)

    return NextResponse.json({ success: true, data: { activities: limited } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch activity log' }, { status: 500 })
  }
}
