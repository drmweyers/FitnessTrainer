import { NextRequest, NextResponse } from 'next/server'
import { AuthenticatedRequest } from '@/lib/middleware/auth'
import { authenticateAdmin } from '@/lib/middleware/admin'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

interface UserRow {
  id: string
  email: string
  role: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login_at: string | null
  first_name: string | null
  last_name: string | null
  profile_photo_url: string | null
}

interface CountResult {
  count: bigint
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10)), 100)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const offset = (page - 1) * limit

    // Build dynamic WHERE conditions
    const conditions: string[] = ['u.deleted_at IS NULL']
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      conditions.push(`(
        u.email ILIKE $${paramIndex}
        OR p.first_name ILIKE $${paramIndex}
        OR p.last_name ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (role && ['trainer', 'client', 'admin'].includes(role)) {
      conditions.push(`u.role = $${paramIndex}`)
      params.push(role)
      paramIndex++
    }

    if (status === 'active') {
      conditions.push('u.is_active = true')
    } else if (status === 'inactive') {
      conditions.push('u.is_active = false')
    }

    const whereClause = conditions.join(' AND ')

    // Count total
    const countQuery = `SELECT COUNT(*)::bigint as count FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE ${whereClause}`
    const [totalResult] = await prisma.$queryRawUnsafe<CountResult[]>(countQuery, ...params)
    const total = Number(totalResult.count)

    // Fetch users
    const usersQuery = `
      SELECT u.id, u.email, u.role, u.is_active, u.is_verified, u.created_at, u.last_login_at,
             p.first_name, p.last_name, p.profile_photo_url
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    const users = await prisma.$queryRawUnsafe<UserRow[]>(usersQuery, ...params, limit, offset)

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email.split('@')[0],
      role: u.role,
      isActive: u.is_active,
      isVerified: u.is_verified,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
      avatarUrl: u.profile_photo_url || null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Admin user list error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
