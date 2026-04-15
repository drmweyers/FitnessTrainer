import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { authenticateAdmin } from '@/lib/middleware/admin'

export const dynamic = 'force-dynamic'

const statusSchema = z.object({
  status: z.enum(['open', 'triaged', 'in_progress', 'resolved', 'closed']),
  adminNotes: z.string().optional(),
})

// PATCH /api/bugs/:id/status — admin update status
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

  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { status, adminNotes } = parsed.data

  try {
    const bug = await prisma.bugReport.update({
      where: { id: params.id },
      data: {
        status,
        adminNotes: adminNotes ?? undefined,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
      },
    })

    return NextResponse.json({ success: true, data: bug })
  } catch (err) {
    console.error('[PATCH /api/bugs/:id/status]', err)
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 })
  }
}
