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
import { GET } from '@/app/api/progression/suggestions/route'

const mockedPrisma = prisma as any
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>

function makeRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`)
}

const mockUser = {
  id: 'u1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
  role: 'trainer',
  email: 'trainer@test.com',
}

describe('GET /api/progression/suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns suggestion for exercise with data', async () => {
    const url = '/api/progression/suggestions?exerciseId=ex-1'
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest(url), { user: mockUser })
    )

    const mockExerciseLogs = [
      {
        id: 'log-1',
        exerciseId: 'ex-1',
        createdAt: new Date(),
        exercise: { bodyPart: 'chest' },
        setLogs: [
          { setNumber: 1, weight: 100, actualReps: 10, rpe: 7, completed: true, skipped: false, plannedReps: '10', timestamp: new Date() },
          { setNumber: 2, weight: 100, actualReps: 10, rpe: 7, completed: true, skipped: false, plannedReps: '10', timestamp: new Date() },
          { setNumber: 3, weight: 100, actualReps: 10, rpe: 7, completed: true, skipped: false, plannedReps: '10', timestamp: new Date() },
        ],
      },
      {
        id: 'log-2',
        exerciseId: 'ex-1',
        createdAt: new Date(),
        exercise: { bodyPart: 'chest' },
        setLogs: [
          { setNumber: 1, weight: 100, actualReps: 10, rpe: 6.5, completed: true, skipped: false, plannedReps: '10', timestamp: new Date() },
          { setNumber: 2, weight: 100, actualReps: 10, rpe: 6.5, completed: true, skipped: false, plannedReps: '10', timestamp: new Date() },
        ],
      },
    ]

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce(mockExerciseLogs)

    const request = makeRequest(url)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.strategy).toBe('increase_weight')
    expect(data.data.suggestedWeight).toBe(105) // chest = +5
    expect(data.data.dataPoints).toBe(5)
    expect(data.data.confidence).toBeDefined()
  })

  it('returns 400 for missing exerciseId', async () => {
    const url = '/api/progression/suggestions'
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest(url), { user: mockUser })
    )

    const request = makeRequest(url)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('exerciseId')
  })

  it('returns low-confidence maintain for exercise with no data', async () => {
    const url = '/api/progression/suggestions?exerciseId=ex-unknown'
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest(url), { user: mockUser })
    )

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce([])

    const request = makeRequest(url)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.strategy).toBe('maintain')
    expect(data.data.confidence).toBe('low')
    expect(data.data.dataPoints).toBe(0)
    expect(data.data.suggestedWeight).toBe(0)
    expect(data.data.suggestedReps).toBe(8)
    expect(data.data.reason).toContain('No workout data')
  })

  it('passes weeks parameter to filter correctly', async () => {
    const url = '/api/progression/suggestions?exerciseId=ex-1&weeks=2'
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest(url), { user: mockUser })
    )

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce([])

    const request = makeRequest(url)
    await GET(request)

    // Verify prisma was called with date filter
    expect(mockedPrisma.workoutExerciseLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          exerciseId: 'ex-1',
          workoutSession: expect.objectContaining({
            clientId: mockUser.id,
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      })
    )

    // Verify the date is approximately 2 weeks ago
    const callArgs = mockedPrisma.workoutExerciseLog.findMany.mock.calls[0][0]
    const sinceDate: Date = callArgs.where.workoutSession.createdAt.gte
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    // Allow 1 second tolerance
    expect(Math.abs(sinceDate.getTime() - twoWeeksAgo.getTime())).toBeLessThan(1000)
  })

  it('uses clientId parameter when provided', async () => {
    const clientId = 'client-specific-id'
    const url = `/api/progression/suggestions?exerciseId=ex-1&clientId=${clientId}`
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest(url), { user: mockUser })
    )

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce([])

    const request = makeRequest(url)
    await GET(request)

    expect(mockedPrisma.workoutExerciseLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workoutSession: expect.objectContaining({
            clientId,
          }),
        }),
      })
    )
  })

  it('returns 401 when not authenticated', async () => {
    const url = '/api/progression/suggestions?exerciseId=ex-1'
    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    )

    const request = makeRequest(url)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('filters out skipped sets from calculation', async () => {
    const url = '/api/progression/suggestions?exerciseId=ex-1'
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest(url), { user: mockUser })
    )

    const mockExerciseLogs = [
      {
        id: 'log-1',
        exerciseId: 'ex-1',
        createdAt: new Date(),
        exercise: { bodyPart: 'chest' },
        setLogs: [
          { setNumber: 1, weight: 100, actualReps: 10, rpe: 7, completed: true, skipped: false, plannedReps: '10', timestamp: new Date() },
          { setNumber: 2, weight: 100, actualReps: 10, rpe: 7, completed: true, skipped: true, plannedReps: '10', timestamp: new Date() },
          { setNumber: 3, weight: 100, actualReps: 10, rpe: 7, completed: true, skipped: false, plannedReps: '10', timestamp: new Date() },
          { setNumber: 4, weight: 100, actualReps: 10, rpe: 7, completed: true, skipped: false, plannedReps: '10', timestamp: new Date() },
        ],
      },
    ]

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce(mockExerciseLogs)

    const request = makeRequest(url)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // 3 non-skipped sets (not enough for increase_weight since <5)
    expect(data.data.dataPoints).toBe(3)
  })
})
