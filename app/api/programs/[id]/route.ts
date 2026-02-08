/**
 * Program API Routes - By ID
 *
 * GET /api/programs/[id] - Get program by ID
 * PUT /api/programs/[id] - Update program
 * DELETE /api/programs/[id] - Delete program
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const updateProgramSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  programType: z.enum([
    'strength', 'hypertrophy', 'endurance', 'powerlifting',
    'bodybuilding', 'general_fitness', 'sport_specific', 'rehabilitation',
  ]).optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  durationWeeks: z.number().min(1).max(52).optional(),
  goals: z.array(z.string()).optional(),
  equipmentNeeded: z.array(z.string()).optional(),
  isTemplate: z.boolean().optional(),
});

// GET /api/programs/[id] - Get program by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID format' },
        { status: 400 }
      );
    }

    const program = await prisma.program.findFirst({
      where: {
        id,
        trainerId: user.id,
      },
      include: {
        weeks: {
          include: {
            workouts: {
              include: {
                exercises: {
                  include: {
                    exercise: true,
                    configurations: true,
                  },
                },
              },
            },
          },
          orderBy: {
            weekNumber: 'asc',
          },
        },
        assignments: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
                userProfile: {
                  select: {
                    bio: true,
                    profilePhotoUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: program });
  } catch (error: any) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

// PUT /api/programs/[id] - Update program
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;
    const body = await request.json();
    const data = updateProgramSchema.parse(body);

    // Verify ownership
    const existing = await prisma.program.findFirst({
      where: { id, trainerId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.program.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        programType: data.programType as any,
        difficultyLevel: data.difficultyLevel as any,
        durationWeeks: data.durationWeeks,
        goals: data.goals,
        equipmentNeeded: data.equipmentNeeded,
        isTemplate: data.isTemplate,
      },
      include: {
        weeks: {
          include: {
            workouts: {
              include: {
                exercises: {
                  include: {
                    exercise: true,
                    configurations: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Program updated successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating program:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update program' },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/[id] - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;

    // Verify ownership
    const existing = await prisma.program.findFirst({
      where: { id, trainerId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    await prisma.program.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete program' },
      { status: 500 }
    );
  }
}
