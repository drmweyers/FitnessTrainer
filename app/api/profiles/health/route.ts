import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest
  const userId = req.user!.id

  try {
    const health = await prisma.userHealth.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      data: health,
    })
  } catch (error) {
    console.error('Health fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch health data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest
  const userId = req.user!.id

  try {
    const body = await request.json()
    const {
      bloodType,
      medicalConditions,
      medications,
      allergies,
      injuries,
    } = body

    const health = await prisma.userHealth.upsert({
      where: { userId },
      create: {
        userId,
        bloodType: bloodType ?? null,
        medicalConditions: medicalConditions ?? [],
        medications: medications ?? [],
        allergies: allergies ?? [],
        injuries: injuries ?? null,
      },
      update: {
        ...(bloodType !== undefined && { bloodType }),
        ...(medicalConditions !== undefined && { medicalConditions }),
        ...(medications !== undefined && { medications }),
        ...(allergies !== undefined && { allergies }),
        ...(injuries !== undefined && { injuries }),
      },
    })

    // Update profile completion
    await prisma.profileCompletion.upsert({
      where: { userId },
      create: {
        userId,
        healthInfo: true,
      },
      update: {
        healthInfo: true,
      },
    })

    return NextResponse.json({ success: true, data: health })
  } catch (error) {
    console.error('Health update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update health data' },
      { status: 500 }
    )
  }
}
