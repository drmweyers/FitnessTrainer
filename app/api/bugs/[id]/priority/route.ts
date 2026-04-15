import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { authenticateAdmin } from '@/lib/middleware/admin'

export const dynamic = 'force-dynamic'

const prioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'critical']),
})

// PATCH /api/bugs/:id/priority — admin update priority
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = prioritySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  try {
    const bug = await prisma.bugReport.update({
      where: { id: params.id },
      data: { priority: parsed.data.priority },
    })

    return NextResponse.json({ success: true, data: bug })
  } catch (err) {
    console.error('[PATCH /api/bugs/:id/priority]', err)
    return NextResponse.json({ success: false, error: 'Failed to update priority' }, { status: 500 })
  }
}
