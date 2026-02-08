import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest
  const userId = req.user!.id

  if (req.user!.role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: 'Only trainers can manage certifications' },
      { status: 403 }
    )
  }

  try {
    const certifications = await prisma.trainerCertification.findMany({
      where: { trainerId: userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: certifications })
  } catch (error) {
    console.error('Certifications fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest
  const userId = req.user!.id

  if (req.user!.role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: 'Only trainers can manage certifications' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { certificationName, issuingOrganization, credentialId, issueDate, expiryDate } = body

    if (!certificationName || !issuingOrganization) {
      return NextResponse.json(
        { success: false, error: 'Certification name and issuing organization are required' },
        { status: 400 }
      )
    }

    const certification = await prisma.trainerCertification.create({
      data: {
        trainerId: userId,
        certificationName,
        issuingOrganization,
        credentialId: credentialId || null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    })

    return NextResponse.json({ success: true, data: certification }, { status: 201 })
  } catch (error) {
    console.error('Certification create error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create certification' },
      { status: 500 }
    )
  }
}
