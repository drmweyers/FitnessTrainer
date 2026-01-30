/**
 * Assign Program API Route
 *
 * POST /api/programs/[id]/assign - Assign program to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const assignProgramSchema = z.object({
  clientId: z.string().uuid(),
  startDate: z.string().datetime(),
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

// POST /api/programs/[id]/assign - Assign program to client
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
    const validatedData = assignProgramSchema.parse(body);

    const backendResponse = await backendRequest(
      `/programs/${id}/assign`,
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
    console.error('Error assigning program:', error);
    return NextResponse.json({ error: 'Failed to assign program' }, { status: 500 });
  }
}
