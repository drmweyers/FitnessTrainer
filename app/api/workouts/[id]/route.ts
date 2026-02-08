/**
 * Workout API Routes - Individual Session
 *
 * GET /api/workouts/[id] - Get workout session details
 * PUT /api/workouts/[id] - Update workout session
 * DELETE /api/workouts/[id] - Delete workout session
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/workouts/[id] - Get workout session details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;

    const session = await prisma.workoutSession.findFirst({
      where: {
        id,
        OR: [
          { clientId: user.id },
          ...(user.role === 'trainer' ? [{ trainerId: user.id }] : []),
        ],
      },
      include: {
        exerciseLogs: {
          include: {
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
            exercise: true,
            workoutExercise: {
              include: {
                configurations: {
                  orderBy: { setNumber: 'asc' },
                },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        workout: {
          include: {
            exercises: {
              include: {
                exercise: true,
                configurations: true,
              },
            },
          },
        },
        programAssignment: {
          include: { program: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Workout session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    console.error('Error fetching workout:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/workouts/[id] - Update workout session
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

    // Verify session exists and user has access
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        id,
        OR: [
          { clientId: user.id },
          ...(user.role === 'trainer' ? [{ trainerId: user.id }] : []),
        ],
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Workout session not found' },
        { status: 404 }
      );
    }

    // Build update data, parsing dates if present
    const updateData: any = {
      ...body,
      ...(body.actualStartTime && {
        actualStartTime: new Date(body.actualStartTime),
      }),
      ...(body.actualEndTime && {
        actualEndTime: new Date(body.actualEndTime),
      }),
    };

    // Remove fields that shouldn't be directly updated
    delete updateData.id;
    delete updateData.clientId;
    delete updateData.trainerId;
    delete updateData.programAssignmentId;
    delete updateData.workoutId;

    const session = await prisma.workoutSession.update({
      where: { id },
      data: updateData,
      include: {
        exerciseLogs: {
          include: {
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
            exercise: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Workout session updated successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error updating workout:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/workouts/[id] - Delete workout session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;

    // Verify session exists and user has access
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        id,
        OR: [
          { clientId: user.id },
          ...(user.role === 'trainer' ? [{ trainerId: user.id }] : []),
        ],
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Workout session not found' },
        { status: 404 }
      );
    }

    // Cascade delete will handle exercise logs and set logs
    await prisma.workoutSession.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Workout session deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting workout:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
