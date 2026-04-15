/**
 * Tests for app/api/bugs/route.ts
 * POST /api/bugs — submit bug report (authenticated)
 * GET  /api/bugs — list bug reports (admin only)
 */

import { NextRequest } from 'next/server'

jest.mock('@/lib/db/prisma')
jest.mock('@/lib/middleware/auth')
jest.mock('@/lib/middleware/admin')
jest.mock('@/lib/services/githubIssueService', () => ({
  createGitHubIssue: jest.fn().mockResolvedValue(null),
}))
jest.mock('@/lib/services/halBridgeService', () => ({
  appendBugToHalBridge: jest.fn().mockResolvedValue(undefined),
}))

import { POST, GET } from '@/app/api/bugs/route'
import { prisma } from '@/lib/db/prisma'
import { authenticate } from '@/lib/middleware/auth'
import { authenticateAdmin } from '@/lib/middleware/admin'
import { NextResponse } from 'next/server'

const mockedPrisma = prisma as jest.Mocked<typeof prisma>
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>
const mockedAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>

const MOCK_USER = {
  id: 'user-123',
  email: 'trainer@test.com',
  role: 'trainer' as const,
  name: 'Test Trainer',
  subscriptionTier: 'starter',
}

const MOCK_AUTH_REQ = {
  user: MOCK_USER,
} as any

const MOCK_BUG = {
  id: 'bug-uuid-123',
  reporterId: 'user-123',
  category: 'ui_issue',
  priority: 'medium',
  status: 'open',
  title: 'Button click is unresponsive on mobile',
  description: 'Button click is unresponsive on mobile',
  screenshotBase64: null,
  context: null,
  githubIssueUrl: null,
  githubIssueNumber: null,
  assignedToHal: false,
  assignedAt: null,
  resolvedAt: null,
  adminNotes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  reporter: { id: 'user-123', email: 'trainer@test.com' },
}

function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/bugs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

// ─── POST Tests ────────────────────────────────────────────────────────────────

describe('POST /api/bugs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAuthenticate.mockResolvedValue(MOCK_AUTH_REQ)
    ;(mockedPrisma.bugReport as any) = {
      create: jest.fn().mockResolvedValue(MOCK_BUG),
      update: jest.fn().mockResolvedValue(MOCK_BUG),
    }
  })

  it('returns 201 with valid payload', async () => {
    const req = makeRequest({
      category: 'ui_issue',
      description: 'Button click is unresponsive on mobile',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('bug-uuid-123')
  })

  it('returns 400 when description is too short', async () => {
    const req = makeRequest({
      category: 'ui_issue',
      description: 'Short',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/10 characters/)
  })

  it('returns 400 when category is missing', async () => {
    const req = makeRequest({
      description: 'A valid description of the issue that has enough characters',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('returns 401 when not authenticated', async () => {
    mockedAuthenticate.mockResolvedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    )

    const req = makeRequest({
      category: 'crash',
      description: 'App crashes on launch after update',
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('auto-assigns critical priority to crash category', async () => {
    const req = makeRequest({
      category: 'crash',
      description: 'App crashes every time I open the workout tracking screen',
    })

    await POST(req)

    const createCall = (mockedPrisma.bugReport as any).create.mock.calls[0][0]
    expect(createCall.data.priority).toBe('critical')
  })

  it('auto-assigns high priority to performance category', async () => {
    const req = makeRequest({
      category: 'performance',
      description: 'The dashboard takes more than 15 seconds to load every time',
    })

    await POST(req)

    const createCall = (mockedPrisma.bugReport as any).create.mock.calls[0][0]
    expect(createCall.data.priority).toBe('high')
  })

  it('auto-assigns low priority to feature_request category', async () => {
    const req = makeRequest({
      category: 'feature_request',
      description: 'It would be great if we could export workout data to CSV format',
    })

    await POST(req)

    const createCall = (mockedPrisma.bugReport as any).create.mock.calls[0][0]
    expect(createCall.data.priority).toBe('low')
  })
})

// ─── GET Tests ─────────────────────────────────────────────────────────────────

describe('GET /api/bugs', () => {
  const MOCK_ADMIN_REQ = {
    user: { ...MOCK_USER, role: 'admin' as const },
  } as any

  beforeEach(() => {
    jest.clearAllMocks()
    mockedAuthenticateAdmin.mockResolvedValue(MOCK_ADMIN_REQ)
    ;(mockedPrisma.bugReport as any) = {
      findMany: jest.fn().mockResolvedValue([MOCK_BUG]),
      count: jest.fn().mockResolvedValue(1),
    }
  })

  it('returns paginated list for admin', async () => {
    const req = new NextRequest('http://localhost:3000/api/bugs?page=1&limit=20')

    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.bugs).toHaveLength(1)
    expect(data.data.pagination.total).toBe(1)
  })

  it('returns 401 when not admin', async () => {
    mockedAuthenticateAdmin.mockResolvedValue(
      NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
    )

    const req = new NextRequest('http://localhost:3000/api/bugs')

    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('passes status filter to prisma query', async () => {
    const req = new NextRequest('http://localhost:3000/api/bugs?status=open')

    await GET(req)

    const findManyCall = (mockedPrisma.bugReport as any).findMany.mock.calls[0][0]
    expect(findManyCall.where.status).toBe('open')
  })
})
