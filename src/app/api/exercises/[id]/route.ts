/**
 * GET /api/exercises/[id] - Get single exercise by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Exercise ID is required',
        },
        { status: 400 }
      )
    }

    // Check if the id is a valid UUID format
    const isUUID =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        id
      )

    const exercise = await prisma.exercise.findFirst({
      where: {
        ...(isUUID ? { OR: [{ id }, { exerciseId: id }] } : { exerciseId: id }),
        isActive: true,
      },
    })

    if (!exercise) {
      return NextResponse.json(
        {
          success: false,
          message: 'Exercise not found',
        },
        { status: 404 }
      )
    }

    const formattedExercise = {
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
    }

    return NextResponse.json({
      success: true,
      data: formattedExercise,
    })
  } catch (error) {
    console.error('Error getting exercise:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get exercise',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}
