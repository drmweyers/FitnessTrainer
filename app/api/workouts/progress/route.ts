/**
 * Workout Progress API Route
 *
 * GET /api/workouts/progress - Get progress/analytics data for charts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

// GET /api/workouts/progress - Get progress data
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'month') as
      | 'week'
      | 'month'
      | 'quarter'
      | 'year';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const clientId = searchParams.get('clientId');

    // Date range calculation
    const now = new Date();
    let startDate = startDateParam ? new Date(startDateParam) : undefined;
    let endDate = endDateParam ? new Date(endDateParam) : now;

    if (!startDate) {
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
          );
          break;
        case 'quarter':
          startDate = new Date(
            now.getFullYear(),
            now.getMonth() - 3,
            now.getDate()
          );
          break;
        case 'year':
          startDate = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            now.getDate()
          );
          break;
      }
    }

    const targetUserId =
      user.role === 'trainer' && clientId ? clientId : user.id;

    const where: any = {
      clientId: targetUserId,
      status: 'completed',
      actualEndTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get basic workout stats
    const workoutStats = await prisma.workoutSession.aggregate({
      where,
      _count: { id: true },
      _avg: {
        totalDuration: true,
        totalVolume: true,
        averageRpe: true,
        adherenceScore: true,
      },
      _sum: {
        totalVolume: true,
        completedSets: true,
      },
    });

    // Get workout frequency over time
    const workoutFrequency = await prisma.workoutSession.groupBy({
      by: ['scheduledDate'],
      where,
      _count: { id: true },
      orderBy: { scheduledDate: 'asc' },
    });

    // Get volume progression
    const volumeProgression = await prisma.workoutSession.findMany({
      where: {
        ...where,
        totalVolume: { not: null },
      },
      select: {
        scheduledDate: true,
        totalVolume: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    // Get top exercises by volume
    const topExercises = await prisma.workoutExerciseLog.groupBy({
      by: ['exerciseId'],
      where: {
        workoutSession: where,
        totalVolume: { not: null },
      },
      _sum: { totalVolume: true },
      _count: { id: true },
      orderBy: {
        _sum: { totalVolume: 'desc' },
      },
      take: 10,
    });

    // Get exercise details for top exercises
    const topExerciseDetails =
      topExercises.length > 0
        ? await prisma.exercise.findMany({
            where: {
              id: { in: topExercises.map((ex) => ex.exerciseId) },
            },
            select: {
              id: true,
              name: true,
              bodyPart: true,
            },
          })
        : [];

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: { start: startDate, end: endDate },
        totalWorkouts: workoutStats._count.id,
        averageDuration: workoutStats._avg.totalDuration,
        totalVolume: workoutStats._sum.totalVolume,
        averageRpe: workoutStats._avg.averageRpe,
        averageAdherence: workoutStats._avg.adherenceScore,
        totalSetsCompleted: workoutStats._sum.completedSets,
        workoutFrequency: workoutFrequency.map((item) => ({
          date: item.scheduledDate.toISOString().split('T')[0],
          count: item._count.id,
        })),
        volumeProgression: volumeProgression.map((item) => ({
          date: item.scheduledDate.toISOString().split('T')[0],
          volume: item.totalVolume,
        })),
        topExercises: topExercises.map((item) => {
          const exercise = topExerciseDetails.find(
            (ex) => ex.id === item.exerciseId
          );
          return {
            exerciseId: item.exerciseId,
            exerciseName: exercise?.name || 'Unknown',
            bodyPart: exercise?.bodyPart || 'Unknown',
            totalVolume: item._sum.totalVolume,
            sessionCount: item._count.id,
          };
        }),
      },
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
