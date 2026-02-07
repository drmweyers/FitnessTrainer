/**
 * Active Workout Session API Route
 *
 * GET /api/workouts/active - Get current active workout session
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

// GET /api/workouts/active - Get active workout session
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const activeSession = await prisma.workoutSession.findFirst({
      where: {
        clientId: user.id,
        status: 'in_progress',
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
      orderBy: { actualStartTime: 'desc' },
    });

    if (!activeSession) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active workout session',
      });
    }

    return NextResponse.json({ success: true, data: activeSession });
  } catch (error: any) {
    console.error('Error fetching active workout:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
