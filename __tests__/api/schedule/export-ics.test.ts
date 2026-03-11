/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock auth first
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}))

// Mock prisma
jest.mock('@/lib/db/prisma')

// Import after mocks
import { authenticate } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { GET } from '@/app/api/schedule/export/ics/route'

const mockedPrisma = prisma as any
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>

function makeRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`)
}

describe('GET /api/schedule/export/ics', () => {
  const mockUser = { id: 'user-123', role: 'trainer', email: 'trainer@test.com' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 with Content-Type text/calendar', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/export/ics'), { user: mockUser })
    )
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([])

    const response = await GET(makeRequest('/api/schedule/export/ics'))

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/calendar; charset=utf-8')
  })

  it('returns Content-Disposition attachment header', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/export/ics'), { user: mockUser })
    )
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([])

    const response = await GET(makeRequest('/api/schedule/export/ics'))

    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="evofit-schedule.ics"')
  })

  it('content contains VCALENDAR', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/export/ics'), { user: mockUser })
    )
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([
      {
        id: 'appt-1',
        title: 'Training Session',
        description: 'Leg day',
        location: 'Gym',
        startDatetime: new Date('2026-03-15T10:00:00Z'),
        endDatetime: new Date('2026-03-15T11:00:00Z'),
        status: 'scheduled',
      },
    ])

    const response = await GET(makeRequest('/api/schedule/export/ics'))
    const body = await response.text()

    expect(body).toContain('BEGIN:VCALENDAR')
    expect(body).toContain('END:VCALENDAR')
    expect(body).toContain('BEGIN:VEVENT')
    expect(body).toContain('SUMMARY:Training Session')
  })

  it('applies date range filtering', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(
        makeRequest('/api/schedule/export/ics?startDate=2026-03-01&endDate=2026-03-31'),
        { user: mockUser }
      )
    )
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([])

    await GET(makeRequest('/api/schedule/export/ics?startDate=2026-03-01&endDate=2026-03-31'))

    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startDatetime: expect.objectContaining({ gte: expect.any(Date) }),
          endDatetime: expect.objectContaining({ lte: expect.any(Date) }),
        }),
      })
    )
  })

  it('returns 401 when not authenticated', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    )

    const response = await GET(makeRequest('/api/schedule/export/ics'))

    expect(response.status).toBe(401)
  })
})
