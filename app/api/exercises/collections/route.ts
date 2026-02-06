/**
 * Exercise Collections API Routes
 * GET /api/exercises/collections - List user's collections
 * POST /api/exercises/collections - Create new collection
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
})

/**
 * GET /api/exercises/collections
 * List user's collections with exercise count
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const collections = await prisma.exerciseCollection.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: { exercises: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      isPublic: c.isPublic,
      exerciseCount: c._count.exercises,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/exercises/collections
 * Create new collection
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const body = await request.json()
    const validation = createCollectionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, description } = validation.data

    const collection = await prisma.exerciseCollection.create({
      data: {
        userId: req.user!.id,
        name,
        description: description || null,
      },
    })

    return NextResponse.json(
      { success: true, data: collection },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create collection' },
      { status: 500 }
    )
  }
}
