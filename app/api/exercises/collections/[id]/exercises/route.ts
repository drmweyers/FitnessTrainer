import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const exerciseBodySchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = exerciseBodySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { exerciseId } = validation.data

    const collection = await prisma.exerciseCollection.findFirst({
      where: { id: params.id, userId: req.user!.id },
    })
    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 })
    }

    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } })
    if (!exercise) {
      return NextResponse.json({ success: false, error: 'Exercise not found' }, { status: 404 })
    }

    const existing = await prisma.collectionExercise.findUnique({
      where: { collectionId_exerciseId: { collectionId: params.id, exerciseId } },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Exercise already in collection' }, { status: 409 })
    }

    const maxPos = await prisma.collectionExercise.aggregate({
      where: { collectionId: params.id },
      _max: { position: true },
    })

    const entry = await prisma.collectionExercise.create({
      data: {
        collectionId: params.id,
        exerciseId,
        position: (maxPos._max.position ?? -1) + 1,
      },
      include: { exercise: true },
    })

    return NextResponse.json({ success: true, data: entry }, { status: 201 })
  } catch (error) {
    console.error('Error adding exercise to collection:', error)
    return NextResponse.json({ success: false, error: 'Failed to add exercise to collection' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = exerciseBodySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { exerciseId } = validation.data

    const collection = await prisma.exerciseCollection.findFirst({
      where: { id: params.id, userId: req.user!.id },
    })
    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 })
    }

    const existing = await prisma.collectionExercise.findUnique({
      where: { collectionId_exerciseId: { collectionId: params.id, exerciseId } },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Exercise not in collection' }, { status: 404 })
    }

    await prisma.collectionExercise.delete({ where: { id: existing.id } })

    return NextResponse.json({ success: true, message: 'Exercise removed' })
  } catch (error) {
    console.error('Error removing exercise from collection:', error)
    return NextResponse.json({ success: false, error: 'Failed to remove exercise' }, { status: 500 })
  }
}
