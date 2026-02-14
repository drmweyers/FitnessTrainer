/**
 * Tests for app/api/auth/me/route.ts
 * GET /api/auth/me
 */

import { NextResponse } from 'next/server';
import { GET } from '@/app/api/auth/me/route';
import { createMockRequest, mockTrainerUser, mockClientUser, parseJsonResponse } from '@/tests/helpers/test-utils';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const { authenticate } = require('@/lib/middleware/auth');

function mockAuthSuccess(user: any) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFailure() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/auth/me');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns current user profile for trainer', async () => {
    mockAuthSuccess({
      id: mockTrainerUser.id,
      email: mockTrainerUser.email,
      role: mockTrainerUser.role,
      isActive: true,
      isVerified: true,
    });

    const request = createMockRequest('/api/auth/me');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.id).toBe(mockTrainerUser.id);
    expect(body.data.user.email).toBe(mockTrainerUser.email);
    expect(body.data.user.role).toBe(mockTrainerUser.role);
    expect(body.data.user.isActive).toBe(true);
    expect(body.data.user.isVerified).toBe(true);
  });

  it('returns current user profile for client', async () => {
    mockAuthSuccess({
      id: mockClientUser.id,
      email: mockClientUser.email,
      role: mockClientUser.role,
      isActive: true,
      isVerified: true,
    });

    const request = createMockRequest('/api/auth/me');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.id).toBe(mockClientUser.id);
    expect(body.data.user.email).toBe(mockClientUser.email);
    expect(body.data.user.role).toBe(mockClientUser.role);
  });

  it('includes all required user fields', async () => {
    mockAuthSuccess({
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'TRAINER',
      isActive: true,
      isVerified: false,
    });

    const request = createMockRequest('/api/auth/me');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.data.user).toEqual({
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'TRAINER',
      isActive: true,
      isVerified: false,
    });
  });

  it('handles inactive user', async () => {
    mockAuthSuccess({
      id: 'inactive-user',
      email: 'inactive@example.com',
      role: 'CLIENT',
      isActive: false,
      isVerified: true,
    });

    const request = createMockRequest('/api/auth/me');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.isActive).toBe(false);
  });

  it('handles unverified user', async () => {
    mockAuthSuccess({
      id: 'unverified-user',
      email: 'unverified@example.com',
      role: 'CLIENT',
      isActive: true,
      isVerified: false,
    });

    const request = createMockRequest('/api/auth/me');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.isVerified).toBe(false);
  });

  it('handles server errors gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    authenticate.mockRejectedValue(new Error('Auth service down'));

    const request = createMockRequest('/api/auth/me');
    const response = await GET(request);

    expect(response.status).toBe(500);
    (console.error as jest.Mock).mockRestore();
  });
});
