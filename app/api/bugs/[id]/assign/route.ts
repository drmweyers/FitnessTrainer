import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/bugs/:id/assign — HAL claims a bug (race-safe)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.HAL_API_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Race-safe: only update if not already assigned
    const result = await prisma.bugReport.updateMany({
      where: { id: params.id, assignedToHal: false },
      data: { assignedToHal: true, assignedAt: new Date() },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Bug already claimed or not found' },
        { status: 409 },
      )
    }

    const bug = await prisma.bugReport.findUnique({ where: { id: params.id } })
    return NextResponse.json({ success: true, data: bug })
  } catch (err) {
    console.error('[PATCH /api/bugs/:id/assign]', err)
    return NextResponse.json({ success: false, error: 'Failed to assign bug' }, { status: 500 })
  }
}
