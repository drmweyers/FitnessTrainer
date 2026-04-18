import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const closeSchema = z.object({
  reason: z.string().max(500).optional(),
})

// PATCH /api/bugs/:id/close — HAL closes a bug it has finished processing
// Idempotent: closing an already-closed bug is a no-op 200 (safe to retry).
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.HAL_API_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let reason: string | undefined
  if (request.headers.get('content-length') && request.headers.get('content-length') !== '0') {
    try {
      const body = await request.json()
      const parsed = closeSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' },
          { status: 400 },
        )
      }
      reason = parsed.data.reason
    } catch {
      // Empty or non-JSON body is fine — reason is optional
    }
  }

  try {
    const existing = await prisma.bugReport.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Bug not found' }, { status: 404 })
    }

    const adminNotes = reason
      ? `[hal-close] ${reason}${existing.adminNotes ? `\n\n${existing.adminNotes}` : ''}`
      : existing.adminNotes

    const bug = await prisma.bugReport.update({
      where: { id: params.id },
      data: {
        status: 'closed',
        resolvedAt: existing.resolvedAt ?? new Date(),
        adminNotes,
      },
    })

    return NextResponse.json({ success: true, data: bug })
  } catch (err) {
    console.error('[PATCH /api/bugs/:id/close]', err)
    return NextResponse.json({ success: false, error: 'Failed to close bug' }, { status: 500 })
  }
}
