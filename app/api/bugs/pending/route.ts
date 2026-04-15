import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

// GET /api/bugs/pending — HAL polling endpoint (API key auth)
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.HAL_API_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bugs = await prisma.bugReport.findMany({
      where: {
        status: 'open',
        assignedToHal: false,
      },
      include: {
        reporter: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, data: { bugs } })
  } catch (err) {
    console.error('[GET /api/bugs/pending]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch pending bugs' }, { status: 500 })
  }
}
