/**
 * GET /api/exercises/categories - Get exercise categories
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const categoriesSchema = z.object({
  type: z.enum(['bodyParts', 'equipment', 'targetMuscles']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const { type } = categoriesSchema.parse(Object.fromEntries(searchParams))

    const categories = {
      bodyParts: [] as string[],
      equipment: [] as string[],
      targetMuscles: [] as string[],
      difficulties: ['beginner', 'intermediate', 'advanced'],
    }

    if (!type || type === 'bodyParts') {
      const bodyParts = await prisma.exercise.findMany({
        where: { isActive: true },
        select: { bodyPart: true },
        distinct: ['bodyPart'],
        orderBy: { bodyPart: 'asc' },
      })
      categories.bodyParts = bodyParts.map(bp => bp.bodyPart)
    }

    if (!type || type === 'equipment') {
      const equipment = await prisma.exercise.findMany({
        where: { isActive: true },
        select: { equipment: true },
        distinct: ['equipment'],
        orderBy: { equipment: 'asc' },
      })
      categories.equipment = equipment.map(eq => eq.equipment)
    }

    if (!type || type === 'targetMuscles') {
      const targetMuscles = await prisma.exercise.findMany({
        where: { isActive: true },
        select: { targetMuscle: true },
        distinct: ['targetMuscle'],
        orderBy: { targetMuscle: 'asc' },
      })
      categories.targetMuscles = targetMuscles.map(tm => tm.targetMuscle)
    }

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Error getting exercise categories:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get exercise categories',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}
