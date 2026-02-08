/**
 * Exercise Favorites API Routes
 * GET /api/exercises/favorites - List user's favorite exercises
 * POST /api/exercises/favorites - Add exercise to favorites
 * DELETE /api/exercises/favorites - Remove exercise from favorites
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const favoriteBodySchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
})

/**
 * GET /api/exercises/favorites
 * List user's favorite exercises with exercise details
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const favorites = await prisma.exerciseFavorite.findMany({
      where: { userId: req.user!.id },
      include: {
        exercise: true,
      },
      orderBy: { favoritedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: favorites,
    })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/exercises/favorites
 * Add exercise to favorites
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = favoriteBodySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { exerciseId } = validation.data

    // Verify exercise exists
    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } })
    if (!exercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Check if already favorited
    const existing = await prisma.exerciseFavorite.findUnique({
      where: {
        userId_exerciseId: {
          userId: req.user!.id,
          exerciseId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Exercise is already favorited' },
        { status: 409 }
      )
    }

    const favorite = await prisma.exerciseFavorite.create({
      data: {
        userId: req.user!.id,
        exerciseId,
      },
      include: {
        exercise: true,
      },
    })

    return NextResponse.json({ success: true, data: favorite }, { status: 201 })
  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/exercises/favorites
 * Remove exercise from favorites
 */
export async function DELETE(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = favoriteBodySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { exerciseId } = validation.data

    const existing = await prisma.exerciseFavorite.findUnique({
      where: {
        userId_exerciseId: {
          userId: req.user!.id,
          exerciseId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Favorite not found' },
        { status: 404 }
      )
    }

    await prisma.exerciseFavorite.delete({
      where: { id: existing.id },
    })

    return NextResponse.json({ success: true, message: 'Favorite removed' })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
