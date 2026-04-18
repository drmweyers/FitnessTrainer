/**
 * Tests for app/api/bugs/[id]/close/route.ts
 * PATCH /api/bugs/:id/close — HAL closes a bug (x-api-key auth, idempotent)
 */

import { NextRequest } from 'next/server'

jest.mock('@/lib/db/prisma')

import { PATCH } from '@/app/api/bugs/[id]/close/route'
import { prisma } from '@/lib/db/prisma'

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

const MOCK_BUG = {
  id: 'bug-uuid-123',
  reporterId: 'user-123',
  category: 'ui_issue',
  priority: 'medium',
  status: 'in_progress',
  title: 'Something',
  description: 'Something broke',
  screenshotBase64: null,
  context: null,
  githubIssueUrl: null,
  githubIssueNumber: null,
  assignedToHal: true,
  assignedAt: new Date('2026-04-18T15:00:00Z'),
  resolvedAt: null,
  adminNotes: null,
  createdAt: new Date('2026-04-18T14:00:00Z'),
  updatedAt: new Date('2026-04-18T15:00:00Z'),
}

function makeRequest(
  id: string,
  body?: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  const init: RequestInit = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    ;(init.headers as Record<string, string>)['content-length'] = String(init.body.length)
  }
  return new NextRequest(`http://localhost:3000/api/bugs/${id}/close`, init)
}

describe('PATCH /api/bugs/:id/close', () => {
  const ORIGINAL_KEY = process.env.HAL_API_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.HAL_API_KEY = 'test-hal-key'
    ;(mockedPrisma.bugReport as any) = {
      findUnique: jest.fn().mockResolvedValue(MOCK_BUG),
      update: jest.fn().mockResolvedValue({ ...MOCK_BUG, status: 'closed', resolvedAt: new Date() }),
    }
  })

  afterAll(() => {
    process.env.HAL_API_KEY = ORIGINAL_KEY
  })

  it('returns 401 when x-api-key is missing', async () => {
    const req = makeRequest('bug-1')
    const res = await PATCH(req, { params: { id: 'bug-1' } })
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.success).toBe(false)
  })

  it('returns 401 when x-api-key is wrong', async () => {
    const req = makeRequest('bug-1', undefined, { 'x-api-key': 'wrong' })
    const res = await PATCH(req, { params: { id: 'bug-1' } })
    expect(res.status).toBe(401)
  })

  it('closes a bug with no body', async () => {
    const req = makeRequest('bug-uuid-123', undefined, { 'x-api-key': 'test-hal-key' })
    const res = await PATCH(req, { params: { id: 'bug-uuid-123' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('closed')
    expect((mockedPrisma.bugReport as any).update).toHaveBeenCalledTimes(1)
    const updateArgs = (mockedPrisma.bugReport as any).update.mock.calls[0][0]
    expect(updateArgs.where.id).toBe('bug-uuid-123')
    expect(updateArgs.data.status).toBe('closed')
    expect(updateArgs.data.resolvedAt).toBeInstanceOf(Date)
  })

  it('accepts an optional reason in the body and prepends it to adminNotes', async () => {
    const req = makeRequest(
      'bug-uuid-123',
      { reason: 'smoke test — plumbing verification' },
      { 'x-api-key': 'test-hal-key' },
    )
    const res = await PATCH(req, { params: { id: 'bug-uuid-123' } })
    expect(res.status).toBe(200)
    const updateArgs = (mockedPrisma.bugReport as any).update.mock.calls[0][0]
    expect(updateArgs.data.adminNotes).toContain('[hal-close]')
    expect(updateArgs.data.adminNotes).toContain('smoke test')
  })

  it('preserves existing adminNotes when appending a reason', async () => {
    ;(mockedPrisma.bugReport as any).findUnique.mockResolvedValue({
      ...MOCK_BUG,
      adminNotes: 'Original admin note',
    })
    const req = makeRequest(
      'bug-uuid-123',
      { reason: 'closing as test' },
      { 'x-api-key': 'test-hal-key' },
    )
    await PATCH(req, { params: { id: 'bug-uuid-123' } })
    const updateArgs = (mockedPrisma.bugReport as any).update.mock.calls[0][0]
    expect(updateArgs.data.adminNotes).toContain('[hal-close] closing as test')
    expect(updateArgs.data.adminNotes).toContain('Original admin note')
  })

  it('is idempotent: closing an already-closed bug is a 200 no-op that preserves resolvedAt', async () => {
    const prevResolvedAt = new Date('2026-04-15T00:00:00Z')
    ;(mockedPrisma.bugReport as any).findUnique.mockResolvedValue({
      ...MOCK_BUG,
      status: 'closed',
      resolvedAt: prevResolvedAt,
    })
    ;(mockedPrisma.bugReport as any).update.mockResolvedValue({
      ...MOCK_BUG,
      status: 'closed',
      resolvedAt: prevResolvedAt,
    })

    const req = makeRequest('bug-uuid-123', undefined, { 'x-api-key': 'test-hal-key' })
    const res = await PATCH(req, { params: { id: 'bug-uuid-123' } })
    expect(res.status).toBe(200)

    const updateArgs = (mockedPrisma.bugReport as any).update.mock.calls[0][0]
    expect(updateArgs.data.status).toBe('closed')
    expect(updateArgs.data.resolvedAt).toBe(prevResolvedAt)
  })

  it('returns 404 when bug does not exist', async () => {
    ;(mockedPrisma.bugReport as any).findUnique.mockResolvedValue(null)
    const req = makeRequest('missing', undefined, { 'x-api-key': 'test-hal-key' })
    const res = await PATCH(req, { params: { id: 'missing' } })
    expect(res.status).toBe(404)
    expect((mockedPrisma.bugReport as any).update).not.toHaveBeenCalled()
  })

  it('returns 400 when reason exceeds 500 chars', async () => {
    const req = makeRequest(
      'bug-uuid-123',
      { reason: 'x'.repeat(501) },
      { 'x-api-key': 'test-hal-key' },
    )
    const res = await PATCH(req, { params: { id: 'bug-uuid-123' } })
    expect(res.status).toBe(400)
    expect((mockedPrisma.bugReport as any).update).not.toHaveBeenCalled()
  })

  it('returns 500 when database update fails', async () => {
    ;(mockedPrisma.bugReport as any).update.mockRejectedValue(new Error('db blew up'))
    const req = makeRequest('bug-uuid-123', undefined, { 'x-api-key': 'test-hal-key' })
    const res = await PATCH(req, { params: { id: 'bug-uuid-123' } })
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.success).toBe(false)
  })
})
