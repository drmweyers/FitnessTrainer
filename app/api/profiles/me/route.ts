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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        userProfile: true,
        userGoals: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        userMeasurements: {
          orderBy: { recordedAt: 'desc' },
          take: 5,
        },
        profileCompletion: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
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
      bio,
      dateOfBirth,
      gender,
      phone,
      timezone,
      preferredUnits,
      isPublic,
    } = body

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: bio ?? null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender ?? null,
        phone: phone ?? null,
        timezone: timezone ?? null,
        preferredUnits: preferredUnits ?? 'metric',
        isPublic: isPublic ?? true,
      },
      update: {
        ...(bio !== undefined && { bio }),
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
        ...(gender !== undefined && { gender }),
        ...(phone !== undefined && { phone }),
        ...(timezone !== undefined && { timezone }),
        ...(preferredUnits !== undefined && { preferredUnits }),
        ...(isPublic !== undefined && { isPublic }),
      },
    })

    // Update profile completion
    await prisma.profileCompletion.upsert({
      where: { userId },
      create: {
        userId,
        basicInfo: !!(bio || phone || gender),
      },
      update: {
        basicInfo: !!(bio || phone || gender || profile.bio || profile.phone || profile.gender),
      },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
