import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const EXPIRY_WINDOW_DAYS = 30

/**
 * GET /api/profiles/certifications/expiring
 * Returns all trainer certifications that expire within the next 30 days.
 * Each record includes a computed `daysUntilExpiry` field.
 * Only accessible by users with the trainer role.
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest
  const userId = req.user!.id

  if (req.user!.role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: 'Only trainers can view certification expiration alerts' },
      { status: 403 }
    )
  }

  try {
    const now = new Date()
    const windowEnd = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    const certifications = await prisma.trainerCertification.findMany({
      where: {
        trainerId: userId,
        expiryDate: {
          not: null,
          lte: windowEnd,
        },
      },
      orderBy: { expiryDate: 'asc' },
    })

    const enriched = certifications.map((cert) => {
      const expiry = cert.expiryDate as Date
      const diffMs = expiry.getTime() - now.getTime()
      const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return { ...cert, daysUntilExpiry }
    })

    return NextResponse.json({ success: true, data: enriched })
  } catch (error) {
    console.error('Expiring certifications fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expiring certifications' },
      { status: 500 }
    )
  }
}
