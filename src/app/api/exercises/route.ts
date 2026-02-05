/**
 * Next.js API Route for Exercises
 *
 * Converted from Express.js to Next.js App Router API routes
 * Single deployment with frontend on Vercel
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { DifficultyLevel } from '@prisma/client'

// ============================================================================
// Schema Validation
// ============================================================================

const exerciseSearchSchema = z.object({
  query: z.string().optional(),
  bodyPart: z.string().optional(),
  equipment: z.string().optional(),
  targetMuscle: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  sortBy: z.enum(['name', 'difficulty', 'popularity']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// ============================================================================
// GET /api/exercises - Search and list exercises
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse and validate query parameters
    const params = exerciseSearchSchema.parse(Object.fromEntries(searchParams))

    // Build where clause
    const whereClause: any = {
      isActive: true,
    }

    if (params.query) {
      whereClause.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { searchVector: { contains: params.query, mode: 'insensitive' } },
      ]
    }

    if (params.bodyPart) {
      whereClause.bodyPart = { equals: params.bodyPart, mode: 'insensitive' }
    }

    if (params.equipment) {
      whereClause.equipment = { equals: params.equipment, mode: 'insensitive' }
    }

    if (params.targetMuscle) {
      whereClause.targetMuscle = { equals: params.targetMuscle, mode: 'insensitive' }
    }

    if (params.difficulty) {
      whereClause.difficulty = params.difficulty as DifficultyLevel
    }

    // Build order by
    const orderBy: any = {}
    if (params.sortBy === 'name') {
      orderBy.name = params.sortOrder
    } else if (params.sortBy === 'difficulty') {
      orderBy.difficulty = params.sortOrder
    } else {
      orderBy.name = params.sortOrder
    }

    // Get total count for pagination
    const total = await prisma.exercise.count({ where: whereClause })

    // Get exercises with pagination
    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      orderBy,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    })

    // Format response
    const formattedExercises = exercises.map(exercise => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      targetMuscle: exercise.targetMuscle,
      secondaryMuscles: exercise.secondaryMuscles,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      isActive: exercise.isActive,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        exercises: formattedExercises,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          pages: Math.ceil(total / params.limit),
        },
        filters: {
          query: params.query,
          bodyPart: params.bodyPart,
          equipment: params.equipment,
          targetMuscle: params.targetMuscle,
          difficulty: params.difficulty,
        },
      },
    })
  } catch (error) {
    console.error('Error getting exercises:', error)

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
        message: 'Failed to get exercises',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}
