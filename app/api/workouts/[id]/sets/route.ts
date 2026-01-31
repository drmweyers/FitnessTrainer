/**
 * Workout Set Logging API Route
 *
 * POST /api/workouts/[id]/sets - Log exercise set
 * PUT /api/workouts/[id]/sets/[setId] - Update logged set
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const logSetSchema = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.number(),
  setType: z.enum(['warmup', 'working', 'drop', 'pyramid', 'amrap', 'cluster', 'rest_pause']),
  targetReps: z.string(),
  targetWeight: z.string().optional(),
  actualReps: z.number(),
  actualWeight: z.number().optional(),
  rpe: z.number().min(1).max(10).optional(),
  rir: z.number().min(0).max(10).optional(),
  restSeconds: z.number().optional(),
  notes: z.string().optional(),
});

const BACKEND_API = process.env.BACKEND_URL || 'http://localhost:4000/api';

function getAuthToken(request: NextRequest): string | null {
  const tokenFromCookie = request.cookies.get('auth-token')?.value;
  if (tokenFromCookie) return tokenFromCookie;

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function backendRequest(endpoint: string, options: RequestInit, token: string): Promise<Response> {
  const url = `${BACKEND_API}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

// POST /api/workouts/[id]/sets - Log exercise set
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = logSetSchema.parse(body);

    const backendResponse = await backendRequest(
      `/workouts/${id}/sets`,
      { method: 'POST', body: JSON.stringify(validatedData) },
      token
    );

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error logging set:', error);
    return NextResponse.json({ error: 'Failed to log set' }, { status: 500 });
  }
}
