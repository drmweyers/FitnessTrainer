import { NextRequest, NextResponse } from 'next/server'
import { AuthenticatedRequest } from '@/lib/middleware/auth'
import { authenticateAdmin } from '@/lib/middleware/admin'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

interface CountResult {
  count: bigint
}

interface RecentUserRow {
  id: string
  email: string
  role: string
  created_at: string
  is_active: boolean
  first_name: string | null
  last_name: string | null
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    // User counts by role
    const [totalUsers] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM users WHERE deleted_at IS NULL`
    const [totalTrainers] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM users WHERE role = 'trainer' AND deleted_at IS NULL`
    const [totalClients] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM users WHERE role = 'client' AND deleted_at IS NULL`
    const [totalAdmins] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM users WHERE role = 'admin' AND deleted_at IS NULL`

    // New users this week
    const [newThisWeek] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM users
      WHERE deleted_at IS NULL
      AND created_at >= date_trunc('week', CURRENT_DATE)`

    // New users this month
    const [newThisMonth] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM users
      WHERE deleted_at IS NULL
      AND created_at >= date_trunc('month', CURRENT_DATE)`

    // New users last month (for trend comparison)
    const [newLastMonth] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM users
      WHERE deleted_at IS NULL
      AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
      AND created_at < date_trunc('month', CURRENT_DATE)`

    // Active users (logged in within 7 days)
    const [activeUsers] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM users
      WHERE deleted_at IS NULL AND is_active = true
      AND last_login_at >= CURRENT_DATE - INTERVAL '7 days'`

    // Total programs created
    const [totalPrograms] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM programs`

    // Total workouts completed
    const [totalWorkouts] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM workout_sessions
      WHERE status = 'completed'`

    // Total trainer-client connections
    const [totalConnections] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM trainer_clients
      WHERE status != 'archived'`

    // Recent signups (latest 10)
    const recentSignups = await prisma.$queryRaw<RecentUserRow[]>`
      SELECT u.id, u.email, u.role, u.created_at, u.is_active,
             p.first_name, p.last_name
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.deleted_at IS NULL
      ORDER BY u.created_at DESC
      LIMIT 10`

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalUsers: Number(totalUsers.count),
          totalTrainers: Number(totalTrainers.count),
          totalClients: Number(totalClients.count),
          totalAdmins: Number(totalAdmins.count),
          newThisWeek: Number(newThisWeek.count),
          newThisMonth: Number(newThisMonth.count),
          newLastMonth: Number(newLastMonth.count),
          activeUsers: Number(activeUsers.count),
          totalPrograms: Number(totalPrograms.count),
          totalWorkouts: Number(totalWorkouts.count),
          totalConnections: Number(totalConnections.count),
        },
        recentSignups: recentSignups.map(u => ({
          id: u.id,
          name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email.split('@')[0],
          email: u.email,
          role: u.role,
          signupDate: typeof u.created_at === 'string' ? u.created_at : new Date(u.created_at).toISOString(),
          isActive: u.is_active,
        })),
      },
    })
  } catch (error) {
    console.error('Admin dashboard metrics error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
