/**
 * Workout API Routes - Main Endpoint
 *
 * GET /api/workouts - List workout sessions
 * POST /api/workouts - Start new workout session
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const startWorkoutSchema = z.object({
  programId: z.string().uuid().optional(),
  programWorkoutId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
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

// GET /api/workouts - List workout sessions
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const backendResponse = await backendRequest(
      `/workouts${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' },
      token
    );

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

// POST /api/workouts - Start new workout session
export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = startWorkoutSchema.parse(body);

    const backendResponse = await backendRequest(
      '/workouts',
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
    console.error('Error starting workout:', error);
    return NextResponse.json({ error: 'Failed to start workout' }, { status: 500 });
  }
}
