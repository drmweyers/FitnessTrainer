import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

interface CountResult {
  count: bigint
}

interface StreakResult {
  streak: number
}

interface ClientRow {
  id: string
  client_id: string
  email: string
  status: string
  connected_at: string
}

interface RecentUserRow {
  id: string
  email: string
  role: string
  created_at: string
  is_active: boolean
}

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest
  const userId = req.user!.id
  const role = req.user!.role

  try {
    if (role === 'admin') {
      // Admin dashboard stats
      const [totalUsers] = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*)::bigint as count FROM users WHERE deleted_at IS NULL`
      const [totalTrainers] = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*)::bigint as count FROM users WHERE role = 'trainer' AND deleted_at IS NULL`
      const [totalClients] = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*)::bigint as count FROM users WHERE role = 'client' AND deleted_at IS NULL`

      // Recent signups
      const recentSignups = await prisma.$queryRaw<RecentUserRow[]>`
        SELECT u.id, u.email, u.role, u.created_at, u.is_active
        FROM users u
        WHERE u.deleted_at IS NULL
        ORDER BY u.created_at DESC
        LIMIT 5`

      return NextResponse.json({
        success: true,
        data: {
          role: 'admin',
          totalUsers: Number(totalUsers.count),
          totalTrainers: Number(totalTrainers.count),
          totalClients: Number(totalClients.count),
          recentSignups: recentSignups.map(u => ({
            id: u.id,
            name: u.email.split('@')[0].replace(/[._]/g, ' '),
            email: u.email,
            role: u.role,
            signupDate: u.created_at,
            status: u.is_active ? 'active' : 'inactive',
          })),
        },
      })
    }

    if (role === 'trainer') {
      // Trainer dashboard stats
      const [totalClients] = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*)::bigint as count FROM trainer_clients
        WHERE trainer_id = ${userId}::uuid AND status != 'archived'`
      const [activeClients] = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*)::bigint as count FROM trainer_clients
        WHERE trainer_id = ${userId}::uuid AND status = 'active'`
      const [newThisMonth] = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*)::bigint as count FROM trainer_clients
        WHERE trainer_id = ${userId}::uuid
        AND connected_at >= date_trunc('month', CURRENT_DATE)`

      // Client list with names and workout streaks
      const clients = await prisma.$queryRaw<ClientRow[]>`
        SELECT tc.id, tc.client_id, u.email, tc.status, tc.connected_at
        FROM trainer_clients tc
        JOIN users u ON u.id = tc.client_id
        WHERE tc.trainer_id = ${userId}::uuid AND tc.status != 'archived'
        ORDER BY tc.connected_at DESC
        LIMIT 10`

      // Calculate streak for each client
      const clientsWithStreaks = await Promise.all(
        clients.map(async (c) => {
          const streakResult = await prisma.$queryRaw<StreakResult[]>`
            WITH workout_days AS (
              SELECT DISTINCT DATE(actual_end_time) as workout_date
              FROM workout_sessions
              WHERE client_id = ${c.client_id}::uuid
                AND status = 'completed'
                AND actual_end_time IS NOT NULL
              ORDER BY workout_date DESC
            ),
            numbered AS (
              SELECT workout_date,
                ROW_NUMBER() OVER (ORDER BY workout_date DESC) as rn
              FROM workout_days
            ),
            streak AS (
              SELECT workout_date, rn,
                workout_date + (rn * INTERVAL '1 day') as grp
              FROM numbered
            )
            SELECT COALESCE(COUNT(*)::int, 0) as streak
            FROM streak
            WHERE grp = (SELECT grp FROM streak LIMIT 1)`

          return {
            id: c.id,
            name: c.email.split('@')[0].replace(/[._]/g, ' '),
            email: c.email,
            status: c.status,
            connectedAt: c.connected_at,
            workoutStreak: streakResult[0]?.streak ?? 0,
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: {
          role: 'trainer',
          clientOverview: {
            totalClients: Number(totalClients.count),
            activeClients: Number(activeClients.count),
            inactiveClients: Number(totalClients.count) - Number(activeClients.count),
            newThisMonth: Number(newThisMonth.count),
          },
          clients: clientsWithStreaks,
        },
      })
    }

    if (role === 'client') {
      // Client dashboard stats - measurements
      const latestMeasurement = await prisma.$queryRaw<any[]>`
        SELECT weight, body_fat_percentage, measurements, recorded_at
        FROM user_measurements
        WHERE user_id = ${userId}::uuid
        ORDER BY recorded_at DESC
        LIMIT 1`

      const [totalWorkouts] = await prisma.$queryRaw<CountResult[]>`
        SELECT COUNT(*)::bigint as count FROM workout_sessions
        WHERE client_id = ${userId}::uuid AND status = 'completed'`

      // Calculate workout streak: consecutive days with completed workouts ending at today or most recent workout day
      const streakResult = await prisma.$queryRaw<StreakResult[]>`
        WITH workout_days AS (
          SELECT DISTINCT DATE(actual_end_time) as workout_date
          FROM workout_sessions
          WHERE client_id = ${userId}::uuid
            AND status = 'completed'
            AND actual_end_time IS NOT NULL
          ORDER BY workout_date DESC
        ),
        numbered AS (
          SELECT workout_date,
            ROW_NUMBER() OVER (ORDER BY workout_date DESC) as rn
          FROM workout_days
        ),
        streak AS (
          SELECT workout_date, rn,
            workout_date + (rn * INTERVAL '1 day') as grp
          FROM numbered
        )
        SELECT COALESCE(COUNT(*)::int, 0) as streak
        FROM streak
        WHERE grp = (SELECT grp FROM streak LIMIT 1)`

      const workoutStreak = streakResult[0]?.streak ?? 0

      return NextResponse.json({
        success: true,
        data: {
          role: 'client',
          progressSummary: {
            currentWeight: latestMeasurement[0]?.weight || null,
            measurements: latestMeasurement[0]?.measurements || null,
            totalWorkouts: Number(totalWorkouts.count),
            workoutStreak,
          },
        },
      })
    }

    return NextResponse.json({ success: true, data: { role } })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    // Return proper error response with status 500
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch dashboard stats',
      },
      { status: 500 }
    )
  }
}
