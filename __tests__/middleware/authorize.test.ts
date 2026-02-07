/**
 * Tests for lib/middleware/authorize.ts
 * authorize(), trainerOnly(), clientOnly(), adminOnly(), etc.
 */

import { NextResponse } from 'next/server';
import {
  authorize,
  trainerOnly,
  clientOnly,
  adminOnly,
  trainerOrAdmin,
  clientOrAdmin,
  authenticated,
} from '@/lib/middleware/authorize';
import type { AuthenticatedRequest } from '@/lib/middleware/auth';

function makeAuthRequest(role?: string): AuthenticatedRequest {
  const req = {} as AuthenticatedRequest;
  if (role) {
    req.user = {
      id: 'user-1',
      email: 'user@test.com',
      role: role as 'trainer' | 'client' | 'admin',
      isActive: true,
      isVerified: true,
    };
  }
  return req;
}

describe('authorize', () => {
  it('returns 401 when no user on request', async () => {
    const req = makeAuthRequest();
    const result = authorize(req, 'trainer');

    expect(result).toBeInstanceOf(NextResponse);
    const body = await result!.json();
    expect(body.error.code).toBe('AUTH_REQUIRED');
  });

  it('returns 403 when user lacks required role', async () => {
    const req = makeAuthRequest('client');
    const result = authorize(req, 'trainer');

    expect(result).toBeInstanceOf(NextResponse);
    const body = await result!.json();
    expect(body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    expect(body.message).toContain('trainer');
  });

  it('returns null when user has required role', () => {
    const req = makeAuthRequest('trainer');
    const result = authorize(req, 'trainer');
    expect(result).toBeNull();
  });

  it('returns null when user has one of multiple allowed roles', () => {
    const req = makeAuthRequest('admin');
    const result = authorize(req, 'trainer', 'admin');
    expect(result).toBeNull();
  });

  it('returns 403 message listing multiple roles', async () => {
    const req = makeAuthRequest('client');
    const result = authorize(req, 'trainer', 'admin');

    expect(result).toBeInstanceOf(NextResponse);
    const body = await result!.json();
    expect(body.message).toContain('trainer or admin');
  });
});

describe('trainerOnly', () => {
  it('allows trainer', () => {
    expect(trainerOnly(makeAuthRequest('trainer'))).toBeNull();
  });

  it('rejects client', () => {
    expect(trainerOnly(makeAuthRequest('client'))).toBeInstanceOf(NextResponse);
  });

  it('rejects admin', () => {
    expect(trainerOnly(makeAuthRequest('admin'))).toBeInstanceOf(NextResponse);
  });
});

describe('clientOnly', () => {
  it('allows client', () => {
    expect(clientOnly(makeAuthRequest('client'))).toBeNull();
  });

  it('rejects trainer', () => {
    expect(clientOnly(makeAuthRequest('trainer'))).toBeInstanceOf(NextResponse);
  });
});

describe('adminOnly', () => {
  it('allows admin', () => {
    expect(adminOnly(makeAuthRequest('admin'))).toBeNull();
  });

  it('rejects trainer', () => {
    expect(adminOnly(makeAuthRequest('trainer'))).toBeInstanceOf(NextResponse);
  });

  it('rejects client', () => {
    expect(adminOnly(makeAuthRequest('client'))).toBeInstanceOf(NextResponse);
  });
});

describe('trainerOrAdmin', () => {
  it('allows trainer', () => {
    expect(trainerOrAdmin(makeAuthRequest('trainer'))).toBeNull();
  });

  it('allows admin', () => {
    expect(trainerOrAdmin(makeAuthRequest('admin'))).toBeNull();
  });

  it('rejects client', () => {
    expect(trainerOrAdmin(makeAuthRequest('client'))).toBeInstanceOf(NextResponse);
  });
});

describe('clientOrAdmin', () => {
  it('allows client', () => {
    expect(clientOrAdmin(makeAuthRequest('client'))).toBeNull();
  });

  it('allows admin', () => {
    expect(clientOrAdmin(makeAuthRequest('admin'))).toBeNull();
  });

  it('rejects trainer', () => {
    expect(clientOrAdmin(makeAuthRequest('trainer'))).toBeInstanceOf(NextResponse);
  });
});

describe('authenticated', () => {
  it('returns null when user is present', () => {
    expect(authenticated(makeAuthRequest('client'))).toBeNull();
  });

  it('returns 401 when no user', async () => {
    const result = authenticated(makeAuthRequest());
    expect(result).toBeInstanceOf(NextResponse);
    const body = await result!.json();
    expect(body.error.code).toBe('AUTH_REQUIRED');
  });
});
