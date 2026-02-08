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
    const photos = await prisma.progressPhoto.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: photos })
  } catch (error) {
    console.error('Progress photos fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress photos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest
  const userId = req.user!.id

  try {
    const body = await request.json()
    const { photoUrl, thumbnailUrl, photoType, notes, isPrivate, takenAt } = body

    if (!photoUrl) {
      return NextResponse.json(
        { success: false, error: 'Photo URL is required' },
        { status: 400 }
      )
    }

    const photo = await prisma.progressPhoto.create({
      data: {
        userId,
        photoUrl,
        thumbnailUrl: thumbnailUrl || null,
        photoType: photoType || 'front',
        notes: notes || null,
        isPrivate: isPrivate ?? true,
        takenAt: takenAt ? new Date(takenAt) : new Date(),
      },
    })

    return NextResponse.json({ success: true, data: photo }, { status: 201 })
  } catch (error) {
    console.error('Progress photo create error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save progress photo' },
      { status: 500 }
    )
  }
}
