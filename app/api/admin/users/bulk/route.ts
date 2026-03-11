import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/middleware/admin'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { userIds, action } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, error: 'userIds must be a non-empty array' }, { status: 400 })
    }
    if (!['suspend', 'activate'].includes(action)) {
      return NextResponse.json({ success: false, error: 'action must be "suspend" or "activate"' }, { status: 400 })
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isActive: action === 'activate' },
    })

    return NextResponse.json({ success: true, data: { updated: result.count } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update users' }, { status: 500 })
  }
}
