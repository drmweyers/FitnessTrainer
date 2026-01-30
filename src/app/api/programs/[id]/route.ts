/**
 * Program API Routes - By ID
 *
 * GET /api/programs/[id] - Get program by ID
 * PUT /api/programs/[id] - Update program
 * DELETE /api/programs/[id] - Delete program
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

// GET /api/programs/[id] - Get program by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid program ID format' }, { status: 400 });
    }

    const backendResponse = await backendRequest(`/programs/${id}`, { method: 'GET' }, token);
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 });
  }
}

// PUT /api/programs/[id] - Update program
export async function PUT(
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
    const validatedData = updateProgramSchema.parse(body);

    const backendResponse = await backendRequest(
      `/programs/${id}`,
      { method: 'PUT', body: JSON.stringify(validatedData) },
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
    console.error('Error updating program:', error);
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}

// DELETE /api/programs/[id] - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;

    const backendResponse = await backendRequest(`/programs/${id}`, { method: 'DELETE' }, token);

    if (backendResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
