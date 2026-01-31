/**
 * Active Workout Session API Route
 *
 * GET /api/workouts/active - Get current active workout session
 */

import { NextRequest, NextResponse } from 'next/server';

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

// GET /api/workouts/active - Get active workout session
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const backendResponse = await backendRequest('/workouts/active', { method: 'GET' }, token);

    if (backendResponse.status === 204) {
      return NextResponse.json(null, { status: 204 });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error fetching active workout:', error);
    return NextResponse.json({ error: 'Failed to fetch active workout' }, { status: 500 });
  }
}
