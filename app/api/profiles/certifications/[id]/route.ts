import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const existing = await prisma.trainerCertification.findFirst({
      where: { id: params.id, trainerId: userId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Certification not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { certificationName, issuingOrganization, credentialId, issueDate, expiryDate } = body

    const certification = await prisma.trainerCertification.update({
      where: { id: params.id },
      data: {
        ...(certificationName !== undefined && { certificationName }),
        ...(issuingOrganization !== undefined && { issuingOrganization }),
        ...(credentialId !== undefined && { credentialId: credentialId || null }),
        ...(issueDate !== undefined && { issueDate: issueDate ? new Date(issueDate) : null }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
      },
    })

    return NextResponse.json({ success: true, data: certification })
  } catch (error) {
    console.error('Certification update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update certification' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const existing = await prisma.trainerCertification.findFirst({
      where: { id: params.id, trainerId: userId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Certification not found' },
        { status: 404 }
      )
    }

    await prisma.trainerCertification.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Certification delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete certification' },
      { status: 500 }
    )
  }
}
