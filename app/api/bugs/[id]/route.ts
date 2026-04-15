import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateAdmin } from '@/lib/middleware/admin'

export const dynamic = 'force-dynamic'

// GET /api/bugs/:id — admin fetch single bug report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await authenticateAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const bug = await prisma.bugReport.findUnique({
      where: { id: params.id },
      include: {
        reporter: { select: { id: true, email: true } },
      },
    })

    if (!bug) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: bug })
  } catch (err) {
    console.error('[GET /api/bugs/:id]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch report' }, { status: 500 })
  }
}
