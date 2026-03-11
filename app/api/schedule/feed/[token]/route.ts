import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateICS } from '@/lib/services/icalService'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export function generateFeedToken(userId: string): string {
  const secret = process.env.JWT_ACCESS_SECRET || 'dev-secret'
  return crypto.createHash('sha256').update(userId + secret).digest('hex').slice(0, 32)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  if (!token || token.length !== 32) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
  }

  // Find user by checking all users' tokens
  const users = await prisma.user.findMany({ select: { id: true } })
  const matchedUser = users.find((u: { id: string }) => generateFeedToken(u.id) === token)

  if (!matchedUser) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      OR: [{ trainerId: matchedUser.id }, { clientId: matchedUser.id }],
      startDatetime: { gte: new Date() },
    },
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
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
