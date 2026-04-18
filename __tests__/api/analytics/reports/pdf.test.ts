import { NextRequest } from 'next/server';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    workoutSession: { findMany: jest.fn().mockResolvedValue([]) },
    performanceMetric: { findMany: jest.fn().mockResolvedValue([]) },
    userMeasurement: { findMany: jest.fn().mockResolvedValue([]) },
    userGoal: { findMany: jest.fn().mockResolvedValue([]) },
    trainingLoad: { findMany: jest.fn().mockResolvedValue([]) },
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', firstName: 'Test', lastName: 'User', role: 'trainer' }) },
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

jest.mock('@/lib/pdf/pdfRenderer', () => ({
  renderPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 test')),
}));

import { POST } from '@/app/api/analytics/reports/pdf/route';
import { authenticate } from '@/lib/middleware/auth';

const mockAuth = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/analytics/reports/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analytics/reports/pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without auth token', async () => {
    const { NextResponse } = await import('next/server');
    mockAuth.mockResolvedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );
    const req = makeRequest({ clientId: 'abc', startDate: '2026-01-01', endDate: '2026-03-31' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 with invalid request body', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'trainer' } } as any);
    const req = makeRequest({ startDate: '2026-01-01' }); // missing clientId and endDate
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid PDF content-type headers', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'trainer' } } as any);
    const req = makeRequest({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
  });

  it('returns PDF with correct Content-Disposition filename', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'trainer' } } as any);
    const req = makeRequest({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });
    const res = await POST(req);
    const disposition = res.headers.get('content-disposition');
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('evofit-report');
    expect(disposition).toContain('.pdf');
  });

  it('includes only requested sections in output', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'trainer' } } as any);
    const { renderPdf } = require('@/lib/pdf/pdfRenderer');
    const req = makeRequest({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      sections: ['cover', 'workoutSummary'],
    });
    await POST(req);
    expect(renderPdf).toHaveBeenCalled();
    const callArgs = renderPdf.mock.calls[0];
    expect(callArgs[0].sections).toEqual(['cover', 'workoutSummary']);
  });
});
