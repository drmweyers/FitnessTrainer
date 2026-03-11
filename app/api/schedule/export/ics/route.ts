import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { generateICS } from '@/lib/services/icalService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: Record<string, unknown> = {
    OR: [{ trainerId: req.user!.id }, { clientId: req.user!.id }],
  }
  if (startDate) {
    where.startDatetime = { ...(where.startDatetime as Record<string, unknown> || {}), gte: new Date(startDate) }
  }
  if (endDate) {
    where.endDatetime = { ...(where.endDatetime as Record<string, unknown> || {}), lte: new Date(endDate) }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startDatetime: 'asc' },
  })

  const icsContent = generateICS(appointments.map((a: Record<string, unknown>) => ({
    id: a.id as string,
    title: a.title as string,
    description: a.description as string | null,
    location: a.location as string | null,
    startDatetime: a.startDatetime as Date,
    endDatetime: a.endDatetime as Date,
    status: a.status as string,
  })))

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="evofit-schedule.ics"',
    },
  })
}
