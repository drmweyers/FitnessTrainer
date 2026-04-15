/**
 * Tests for GET /api/analytics/reports/export
 * Covers CSV and Excel (Enterprise-only) format handling.
 */

import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mock XLSX before importing the route
// ---------------------------------------------------------------------------
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn((rows: unknown[][]) => ({ rows })),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => Buffer.from('mock-xlsx-content')),
}))

// ---------------------------------------------------------------------------
// Mock Prisma — use plain object so no hoisting issue
// ---------------------------------------------------------------------------
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    trainerClient: { findMany: jest.fn(), count: jest.fn() },
    user: { findUnique: jest.fn() },
    workoutSession: { findMany: jest.fn() },
    workoutExerciseLog: { count: jest.fn() },
    trainerSubscription: { findFirst: jest.fn() },
    program: { count: jest.fn() },
  },
}))

// ---------------------------------------------------------------------------
// Mock EntitlementsService to bypass cache
// ---------------------------------------------------------------------------
jest.mock('@/lib/subscription/EntitlementsService', () => ({
  getEntitlements: jest.fn(),
  checkFeatureAccess: jest.fn(),
  checkUsageLimit: jest.fn(),
  invalidateCache: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Mock auth
// ---------------------------------------------------------------------------
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}))

jest.mock('@/lib/services/tokenService', () => ({
  tokenService: {
    verifyAccessToken: jest.fn(),
    isTokenBlacklisted: jest.fn().mockResolvedValue(false),
  },
}))

// ---------------------------------------------------------------------------
// Import route and mocks AFTER jest.mock declarations
// ---------------------------------------------------------------------------
import { GET } from '@/app/api/analytics/reports/export/route'
import { authenticate } from '@/lib/middleware/auth'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/db/prisma'
import { getEntitlements } from '@/lib/subscription/EntitlementsService'

const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetEntitlements = getEntitlements as jest.MockedFunction<typeof getEntitlements>

const mockTrainerUser = {
  id: 'trainer-uuid-001',
  email: 'trainer@test.io',
  role: 'trainer' as const,
  isActive: true,
  isVerified: true,
}

const enterpriseEntitlements = {
  tier: 'enterprise' as const,
  level: 3,
  features: {} as any,
  limits: {
    clients: { max: -1, used: 0, percentage: 0 },
    programs: { max: -1, used: 0, percentage: 0 },
    exercisesCustom: { max: -1, used: 0, percentage: 0 },
  },
  usage: { clients: 0, programs: 0, exercisesCustom: 0 },
}

const starterEntitlements = {
  tier: 'starter' as const,
  level: 1,
  features: {} as any,
  limits: {
    clients: { max: 5, used: 0, percentage: 0 },
    programs: { max: 20, used: 0, percentage: 0 },
    exercisesCustom: { max: 50, used: 0, percentage: 0 },
  },
  usage: { clients: 0, programs: 0, exercisesCustom: 0 },
}

const professionalEntitlements = {
  tier: 'professional' as const,
  level: 2,
  features: {} as any,
  limits: {
    clients: { max: -1, used: 0, percentage: 0 },
    programs: { max: -1, used: 0, percentage: 0 },
    exercisesCustom: { max: 500, used: 0, percentage: 0 },
  },
  usage: { clients: 0, programs: 0, exercisesCustom: 0 },
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/analytics/reports/export')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString(), {
    headers: { Authorization: 'Bearer valid-token' },
  })
}

describe('GET /api/analytics/reports/export', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default: authenticate succeeds as trainer
    mockAuthenticate.mockImplementation(async (request) => {
      const req = request as any
      req.user = mockTrainerUser
      return req
    })

    // Default: Enterprise tier via mocked entitlements
    mockGetEntitlements.mockResolvedValue(enterpriseEntitlements)

    // Default: withTier feature check also needs checkFeatureAccess
    // withTier calls checkFeatureAccess for { feature: 'analytics' } — analytics is true for enterprise
    // But since we mock EntitlementsService, we mock checkFeatureAccess too
    const { checkFeatureAccess } = jest.requireMock('@/lib/subscription/EntitlementsService')
    checkFeatureAccess.mockResolvedValue({ allowed: true, currentTier: 'enterprise' })

    // Default: no clients
    ;(mockPrisma.trainerClient.findMany as jest.Mock).mockResolvedValue([])
    ;(mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.program.count as jest.Mock).mockResolvedValue(0)
  })

  // -------------------------------------------------------------------------
  // Format validation
  // -------------------------------------------------------------------------
  describe('format validation', () => {
    it('returns 400 when format param is missing', async () => {
      const req = makeRequest()
      const res = await GET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error).toContain('Unsupported format')
    })

    it('returns 400 for unsupported format', async () => {
      const req = makeRequest({ format: 'pdf' })
      const res = await GET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it('accepts format=csv', async () => {
      const req = makeRequest({ format: 'csv' })
      const res = await GET(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/csv')
    })

    it('accepts format=excel for Enterprise user', async () => {
      const req = makeRequest({ format: 'excel' })
      const res = await GET(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    })
  })

  // -------------------------------------------------------------------------
  // Enterprise tier gate for Excel
  // -------------------------------------------------------------------------
  describe('Excel tier gate', () => {
    it('returns 403 for Starter user requesting Excel', async () => {
      mockGetEntitlements.mockResolvedValueOnce(starterEntitlements)

      const req = makeRequest({ format: 'excel' })
      const res = await GET(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error?.code).toBe('FEATURE_LOCKED')
      expect(json.error?.requiredTier).toBe('enterprise')
    })

    it('returns 403 for Professional user requesting Excel', async () => {
      mockGetEntitlements.mockResolvedValueOnce(professionalEntitlements)

      const req = makeRequest({ format: 'excel' })
      const res = await GET(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error?.code).toBe('FEATURE_LOCKED')
    })

    it('allows Enterprise user to export Excel', async () => {
      const req = makeRequest({ format: 'excel' })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })
  })

  // -------------------------------------------------------------------------
  // Excel response shape
  // -------------------------------------------------------------------------
  describe('Excel response', () => {
    it('calls XLSX.write and returns buffer as response', async () => {
      const req = makeRequest({ format: 'excel' })
      const res = await GET(req)

      expect(XLSX.write).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: 'buffer', bookType: 'xlsx' })
      )
      expect(res.status).toBe(200)
    })

    it('sets correct Content-Disposition for Excel', async () => {
      const req = makeRequest({ format: 'excel' })
      const res = await GET(req)
      const disposition = res.headers.get('Content-Disposition') ?? ''
      expect(disposition).toContain('attachment')
      expect(disposition).toContain('.xlsx')
    })

    it('includes header row in worksheet via aoa_to_sheet', async () => {
      const req = makeRequest({ format: 'excel' })
      await GET(req)

      const aoa = (XLSX.utils.aoa_to_sheet as jest.Mock).mock.calls[0][0] as unknown[][]
      expect(Array.isArray(aoa)).toBe(true)
      // First row should be headers
      expect(aoa[0]).toContain('Client Name')
      expect(aoa[0]).toContain('Sessions Completed')
    })
  })

  // -------------------------------------------------------------------------
  // CSV response
  // -------------------------------------------------------------------------
  describe('CSV response', () => {
    it('returns CSV with correct Content-Type', async () => {
      const req = makeRequest({ format: 'csv' })
      const res = await GET(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/csv')
    })

    it('includes header row in CSV', async () => {
      const req = makeRequest({ format: 'csv' })
      const res = await GET(req)
      const text = await res.text()
      expect(text).toContain('Client Name')
      expect(text).toContain('Sessions Completed')
    })

    it('includes placeholder row when trainer has no clients', async () => {
      ;(mockPrisma.trainerClient.findMany as jest.Mock).mockResolvedValue([])
      const req = makeRequest({ format: 'csv' })
      const res = await GET(req)
      const text = await res.text()
      expect(text).toContain('No clients found')
    })

    it('includes one row per client', async () => {
      ;(mockPrisma.trainerClient.findMany as jest.Mock).mockResolvedValue([
        { clientId: 'client-001' },
        { clientId: 'client-002' },
      ])
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        email: 'client@test.io',
        userProfile: null,
      })
      ;(mockPrisma.workoutSession.findMany as jest.Mock).mockResolvedValue([])
      ;(mockPrisma.workoutExerciseLog.count as jest.Mock).mockResolvedValue(0)

      const req = makeRequest({ format: 'csv' })
      const res = await GET(req)
      const text = await res.text()
      const lines = text.trim().split('\r\n')
      // 1 header + 2 client rows
      expect(lines.length).toBe(3)
    })

    it('sets Cache-Control: no-store', async () => {
      const req = makeRequest({ format: 'csv' })
      const res = await GET(req)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
    })
  })

  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------
  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuthenticate.mockResolvedValueOnce(
        NextResponse.json({ success: false, error: 'MISSING_TOKEN' }, { status: 401 }) as any
      )
      const req = makeRequest({ format: 'csv' })
      const res = await GET(req)
      expect(res.status).toBe(401)
    })
  })
})
