import { NextRequest, NextResponse } from 'next/server'
import { AuthenticatedRequest } from '@/lib/middleware/auth'
import { authenticateAdmin } from '@/lib/middleware/admin'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

interface CountResult {
  count: bigint
}

interface UserDetailRow {
  id: string
  email: string
  role: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string | null
  last_login_at: string | null
  bio: string | null
  phone: string | null
  profile_photo_url: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const userId = params.id

  try {
    // Fetch user with profile
    const users = await prisma.$queryRaw<UserDetailRow[]>`
      SELECT u.id, u.email, u.role, u.is_active, u.is_verified,
             u.created_at, u.updated_at, u.last_login_at,
             p.bio, p.phone, p.profile_photo_url
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = ${userId}::uuid AND u.deleted_at IS NULL
      LIMIT 1`

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]

    // Fetch activity stats
    const [programCount] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM programs WHERE trainer_id = ${userId}::uuid`

    const [workoutCount] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM workout_sessions
      WHERE (client_id = ${userId}::uuid OR trainer_id = ${userId}::uuid)
      AND status = 'completed'`

    const [clientCount] = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*)::bigint as count FROM trainer_clients
      WHERE (trainer_id = ${userId}::uuid OR client_id = ${userId}::uuid)
      AND status != 'archived'`

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.email.split('@')[0].replace(/[._]/g, ' '),
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        createdAt: typeof user.created_at === 'string' ? user.created_at : new Date(user.created_at).toISOString(),
        updatedAt: user.updated_at ? (typeof user.updated_at === 'string' ? user.updated_at : new Date(user.updated_at).toISOString()) : null,
        lastLoginAt: user.last_login_at ? (typeof user.last_login_at === 'string' ? user.last_login_at : new Date(user.last_login_at).toISOString()) : null,
        bio: user.bio,
        phone: user.phone,
        avatarUrl: user.profile_photo_url,
        stats: {
          programsCreated: Number(programCount.count),
          workoutsCompleted: Number(workoutCount.count),
          connections: Number(clientCount.count),
        },
      },
    })
  } catch (error) {
    console.error('Admin user detail error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const userId = params.id

  try {
    const body = await request.json()
    const { isActive, isVerified, role } = body

    // Validate role if provided
    if (role && !['trainer', 'client', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be trainer, client, or admin.' },
        { status: 400 }
      )
    }

    // Check user exists
    const existingUser = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (isVerified !== undefined) updateData.isVerified = isVerified
    if (role !== undefined) updateData.role = role

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Admin user update error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}
