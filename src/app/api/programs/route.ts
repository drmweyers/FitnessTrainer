/**
 * Program API Routes - Main Endpoint
 *
 * GET /api/programs - List all programs with filters
 * POST /api/programs - Create new program
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas (matching backend)
const createProgramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  programType: z.enum([
    'strength', 'hypertrophy', 'endurance', 'powerlifting',
    'bodybuilding', 'general_fitness', 'sport_specific', 'rehabilitation',
  ]),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  durationWeeks: z.number().min(1).max(52),
  goals: z.array(z.string()).optional(),
  equipmentNeeded: z.array(z.string()).optional(),
  isTemplate: z.boolean().optional(),
  weeks: z.array(z.object({
    weekNumber: z.number(),
    name: z.string(),
    description: z.string().optional(),
    isDeload: z.boolean().optional(),
    workouts: z.array(z.object({
      dayNumber: z.number(),
      name: z.string(),
      description: z.string().optional(),
      workoutType: z.enum(['strength', 'cardio', 'hiit', 'flexibility', 'mixed', 'recovery']).optional(),
      estimatedDuration: z.number().optional(),
      isRestDay: z.boolean().optional(),
      exercises: z.array(z.object({
        exerciseId: z.string().uuid(),
        orderIndex: z.number(),
        supersetGroup: z.string().optional(),
        setsConfig: z.any(),
        notes: z.string().optional(),
        configurations: z.array(z.object({
          setNumber: z.number(),
          setType: z.enum(['warmup', 'working', 'drop', 'pyramid', 'amrap', 'cluster', 'rest_pause']),
          reps: z.string(),
          weightGuidance: z.string().optional(),
          restSeconds: z.number().optional(),
          tempo: z.string().optional(),
          rpe: z.number().min(1).max(10).optional(),
          rir: z.number().min(0).max(10).optional(),
          notes: z.string().optional(),
        })).optional(),
      })).optional(),
    })).optional(),
  })).optional(),
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

// GET /api/programs - List all programs
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const backendResponse = await backendRequest(
      `/programs${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' },
      token
    );

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}

// POST /api/programs - Create new program
export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProgramSchema.parse(body);

    const backendResponse = await backendRequest(
      '/programs',
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
    console.error('Error creating program:', error);
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  }
}
