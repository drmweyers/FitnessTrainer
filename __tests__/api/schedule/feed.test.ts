/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock prisma
jest.mock('@/lib/db/prisma')

// Import after mocks
import { prisma } from '@/lib/db/prisma'
import { GET, generateFeedToken } from '@/app/api/schedule/feed/[token]/route'

const mockedPrisma = prisma as any

function makeRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`)
}

describe('GET /api/schedule/feed/[token]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_ACCESS_SECRET = 'test-secret'
  })

  it('returns ICS content for valid token', async () => {
    const userId = 'user-123'
    const token = generateFeedToken(userId)

    mockedPrisma.user.findMany.mockResolvedValueOnce([{ id: userId }])
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([
      {
        id: 'appt-1',
        title: 'Training Session',
        description: null,
        location: null,
        startDatetime: new Date('2026-04-15T10:00:00Z'),
        endDatetime: new Date('2026-04-15T11:00:00Z'),
        status: 'scheduled',
      },
    ])

    const response = await GET(makeRequest(`/api/schedule/feed/${token}`), {
      params: { token },
    })
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/calendar; charset=utf-8')
    expect(body).toContain('BEGIN:VCALENDAR')
    expect(body).toContain('SUMMARY:Training Session')
  })

  it('returns 401 for invalid token', async () => {
    const invalidToken = 'a'.repeat(32)

    mockedPrisma.user.findMany.mockResolvedValueOnce([{ id: 'user-123' }])

    const response = await GET(makeRequest(`/api/schedule/feed/${invalidToken}`), {
      params: { token: invalidToken },
    })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid token')
  })

  it('returns 401 for token with wrong length', async () => {
    const shortToken = 'abc'

    const response = await GET(makeRequest(`/api/schedule/feed/${shortToken}`), {
      params: { token: shortToken },
    })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('only includes future appointments', async () => {
    const userId = 'user-123'
    const token = generateFeedToken(userId)

    mockedPrisma.user.findMany.mockResolvedValueOnce([{ id: userId }])
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([])

    await GET(makeRequest(`/api/schedule/feed/${token}`), {
      params: { token },
    })

    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startDatetime: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      })
    )
  })

  it('returns cache-control headers', async () => {
    const userId = 'user-123'
    const token = generateFeedToken(userId)

    mockedPrisma.user.findMany.mockResolvedValueOnce([{ id: userId }])
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([])

    const response = await GET(makeRequest(`/api/schedule/feed/${token}`), {
      params: { token },
    })

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
  })
})

describe('generateFeedToken', () => {
  it('generates deterministic 32-char token', () => {
    process.env.JWT_ACCESS_SECRET = 'test-secret'
    const token1 = generateFeedToken('user-123')
    const token2 = generateFeedToken('user-123')
    expect(token1).toBe(token2)
    expect(token1.length).toBe(32)
  })

  it('generates different tokens for different users', () => {
    process.env.JWT_ACCESS_SECRET = 'test-secret'
    const token1 = generateFeedToken('user-123')
    const token2 = generateFeedToken('user-456')
    expect(token1).not.toBe(token2)
  })
})
