/**
 * Individual Collection API Routes
 * GET /api/exercises/collections/[id] - Get collection with exercises
 * PUT /api/exercises/collections/[id] - Update collection
 * DELETE /api/exercises/collections/[id] - Delete collection
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
})

/**
 * GET /api/exercises/collections/[id]
 * Get collection with all exercises
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const collection = await prisma.exerciseCollection.findFirst({
      where: {
        id: params.id,
        userId: req.user!.id,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: collection })
  } catch (error) {
    console.error('Error fetching collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/exercises/collections/[id]
 * Update collection name/description
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = updateCollectionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Verify ownership
    const existing = await prisma.exerciseCollection.findFirst({
      where: { id: params.id, userId: req.user!.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.exerciseCollection.update({
      where: { id: params.id },
      data: validation.data,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update collection' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/exercises/collections/[id]
 * Delete collection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    // Verify ownership
    const existing = await prisma.exerciseCollection.findFirst({
      where: { id: params.id, userId: req.user!.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    await prisma.exerciseCollection.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Collection deleted' })
  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete collection' },
      { status: 500 }
    )
  }
}
