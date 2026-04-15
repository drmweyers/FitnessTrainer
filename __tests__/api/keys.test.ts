/**
 * Tests for API Key Management routes
 * GET /api/keys   — list keys (Enterprise only)
 * POST /api/keys  — create key (Enterprise only)
 * DELETE /api/keys/[id] — revoke key (Enterprise only)
 */

import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mock Prisma — plain object to avoid hoisting issue
// ---------------------------------------------------------------------------
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    apiToken: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    trainerSubscription: { findFirst: jest.fn() },
    trainerClient: { count: jest.fn() },
    program: { count: jest.fn() },
    user: { findUnique: jest.fn() },
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
// Import routes after mocks
// ---------------------------------------------------------------------------
import { GET, POST } from '@/app/api/keys/route'
import { DELETE } from '@/app/api/keys/[id]/route'
import { authenticate } from '@/lib/middleware/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getEntitlements } from '@/lib/subscription/EntitlementsService'

const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetEntitlements = getEntitlements as jest.MockedFunction<typeof getEntitlements>

const mockTrainerUser = {
  id: 'trainer-uuid-001',
  email: 'trainer@evofit.io',
  role: 'trainer' as const,
  isActive: true,
  isVerified: true,
}

const mockApiTokenRecord = {
  id: 'token-uuid-001',
  userId: 'trainer-uuid-001',
  name: 'Test Key',
  tokenHash: 'abc123hash',
  permissions: [] as string[],
  lastUsedAt: null,
  expiresAt: null,
  createdAt: new Date('2026-01-01'),
}

function makeRequest(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown
) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: {
      Authorization: 'Bearer valid-token',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
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

function setupEnterprise() {
  mockGetEntitlements.mockResolvedValue(enterpriseEntitlements)
  ;(mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(0)
  ;(mockPrisma.program.count as jest.Mock).mockResolvedValue(0)
}

describe('API Key Management Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockAuthenticate.mockImplementation(async (request) => {
      const req = request as any
      req.user = mockTrainerUser
      return req
    })

    setupEnterprise()
  })

  // =========================================================================
  // GET /api/keys
  // =========================================================================
  describe('GET /api/keys', () => {
    it('returns list of API keys for Enterprise trainer', async () => {
      ;(mockPrisma.apiToken.findMany as jest.Mock).mockResolvedValue([mockApiTokenRecord])

      const req = makeRequest('GET', '/api/keys')
      const res = await GET(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data[0].id).toBe(mockApiTokenRecord.id)
      expect(json.data[0].name).toBe('Test Key')
    })

    it('returns empty array when no keys exist', async () => {
      ;(mockPrisma.apiToken.findMany as jest.Mock).mockResolvedValue([])

      const req = makeRequest('GET', '/api/keys')
      const res = await GET(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.data).toEqual([])
    })

    it('does not expose tokenHash in response', async () => {
      // Simulate what Prisma select returns — no tokenHash
      const selectedFields = {
        id: mockApiTokenRecord.id,
        name: mockApiTokenRecord.name,
        permissions: mockApiTokenRecord.permissions,
        lastUsedAt: mockApiTokenRecord.lastUsedAt,
        expiresAt: mockApiTokenRecord.expiresAt,
        createdAt: mockApiTokenRecord.createdAt,
      }
      ;(mockPrisma.apiToken.findMany as jest.Mock).mockResolvedValue([selectedFields])

      const req = makeRequest('GET', '/api/keys')
      const res = await GET(req)
      const json = await res.json()

      expect(json.data[0]).not.toHaveProperty('tokenHash')
    })

    it('returns 403 for non-Enterprise user', async () => {
      mockGetEntitlements.mockResolvedValueOnce(starterEntitlements)

      const req = makeRequest('GET', '/api/keys')
      const res = await GET(req)

      expect(res.status).toBe(403)
    })

    it('returns 401 when unauthenticated', async () => {
      mockAuthenticate.mockResolvedValueOnce(
        NextResponse.json({ success: false }, { status: 401 }) as any
      )
      const req = makeRequest('GET', '/api/keys')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })
  })

  // =========================================================================
  // POST /api/keys
  // =========================================================================
  describe('POST /api/keys', () => {
    it('creates an API key and returns raw token once', async () => {
      ;(mockPrisma.apiToken.create as jest.Mock).mockResolvedValue({
        id: 'new-key-uuid',
        name: 'My Integration',
        permissions: [],
        expiresAt: null,
        createdAt: new Date(),
      })

      const req = makeRequest('POST', '/api/keys', { name: 'My Integration' })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.token).toBeDefined()
      expect(typeof json.data.token).toBe('string')
      expect(json.data.token).toMatch(/^efk_/)
    })

    it('stores only the hash (not the raw token) in DB', async () => {
      ;(mockPrisma.apiToken.create as jest.Mock).mockResolvedValue({
        id: 'new-key-uuid',
        name: 'Hashed Key',
        permissions: [],
        expiresAt: null,
        createdAt: new Date(),
      })

      const req = makeRequest('POST', '/api/keys', { name: 'Hashed Key' })
      await POST(req)

      const createCall = (mockPrisma.apiToken.create as jest.Mock).mock.calls[0][0]
      const storedHash = createCall.data.tokenHash
      // SHA-256 hex = 64 chars
      expect(storedHash).toMatch(/^[a-f0-9]{64}$/)
      // Raw efk_ token should NOT be stored
      expect(JSON.stringify(createCall.data)).not.toContain('efk_')
    })

    it('returns 400 when name is missing', async () => {
      const req = makeRequest('POST', '/api/keys', {})
      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('name')
    })

    it('returns 400 for invalid expiry date', async () => {
      const req = makeRequest('POST', '/api/keys', {
        name: 'Bad Date Key',
        expiresAt: 'not-a-date',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 when expiry is in the past', async () => {
      const req = makeRequest('POST', '/api/keys', {
        name: 'Past Date Key',
        expiresAt: '2020-01-01',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('future')
    })

    it('accepts optional expiresAt in the future', async () => {
      ;(mockPrisma.apiToken.create as jest.Mock).mockResolvedValue({
        id: 'expiry-key-uuid',
        name: 'Expiring Key',
        permissions: [],
        expiresAt: new Date('2030-12-31'),
        createdAt: new Date(),
      })

      const req = makeRequest('POST', '/api/keys', {
        name: 'Expiring Key',
        expiresAt: '2030-12-31',
      })
      const res = await POST(req)
      expect(res.status).toBe(201)

      const createCall = (mockPrisma.apiToken.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.expiresAt).toBeInstanceOf(Date)
    })

    it('returns 403 for non-Enterprise user', async () => {
      mockGetEntitlements.mockResolvedValueOnce(starterEntitlements)

      const req = makeRequest('POST', '/api/keys', { name: 'Blocked Key' })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })
  })

  // =========================================================================
  // DELETE /api/keys/[id]
  // =========================================================================
  describe('DELETE /api/keys/[id]', () => {
    it('revokes an existing key owned by the trainer', async () => {
      ;(mockPrisma.apiToken.findUnique as jest.Mock).mockResolvedValue(mockApiTokenRecord)
      ;(mockPrisma.apiToken.delete as jest.Mock).mockResolvedValue(mockApiTokenRecord)

      const req = makeRequest('DELETE', '/api/keys/token-uuid-001')
      const res = await DELETE(req, { params: { id: 'token-uuid-001' } })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(mockPrisma.apiToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-uuid-001' },
      })
    })

    it('returns 404 when key does not exist', async () => {
      ;(mockPrisma.apiToken.findUnique as jest.Mock).mockResolvedValue(null)

      const req = makeRequest('DELETE', '/api/keys/nonexistent-id')
      const res = await DELETE(req, { params: { id: 'nonexistent-id' } })

      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.success).toBe(false)
    })

    it('returns 403 when key belongs to a different user', async () => {
      ;(mockPrisma.apiToken.findUnique as jest.Mock).mockResolvedValue({
        ...mockApiTokenRecord,
        userId: 'different-trainer-uuid',
      })

      const req = makeRequest('DELETE', '/api/keys/token-uuid-001')
      const res = await DELETE(req, { params: { id: 'token-uuid-001' } })

      expect(res.status).toBe(403)
      expect(mockPrisma.apiToken.delete).not.toHaveBeenCalled()
    })

    it('returns 403 for non-Enterprise user', async () => {
      mockGetEntitlements.mockResolvedValueOnce(starterEntitlements)

      const req = makeRequest('DELETE', '/api/keys/token-uuid-001')
      const res = await DELETE(req, { params: { id: 'token-uuid-001' } })

      expect(res.status).toBe(403)
    })
  })

  // =========================================================================
  // API key token format validation
  // =========================================================================
  describe('API key token format', () => {
    it('generated token matches efk_ prefix with 64-char hex body', async () => {
      ;(mockPrisma.apiToken.create as jest.Mock).mockResolvedValue({
        id: 'format-key-uuid',
        name: 'Format Test',
        permissions: [],
        expiresAt: null,
        createdAt: new Date(),
      })

      const req = makeRequest('POST', '/api/keys', { name: 'Format Test' })
      const res = await POST(req)
      const json = await res.json()

      // efk_ + 64 hex chars (32 random bytes as hex)
      expect(json.data.token).toMatch(/^efk_[a-f0-9]{64}$/)
    })

    it('each generated token is unique', async () => {
      ;(mockPrisma.apiToken.create as jest.Mock).mockResolvedValue({
        id: 'unique-key-uuid',
        name: 'Unique Test',
        permissions: [],
        expiresAt: null,
        createdAt: new Date(),
      })

      const req1 = makeRequest('POST', '/api/keys', { name: 'Unique Test' })
      const req2 = makeRequest('POST', '/api/keys', { name: 'Unique Test' })

      const [res1, res2] = await Promise.all([POST(req1), POST(req2)])
      const [json1, json2] = await Promise.all([res1.json(), res2.json()])

      expect(json1.data.token).not.toBe(json2.data.token)
    })

    it('SHA-256 hash of token is stored, not the token itself', async () => {
      const { createHash } = await import('crypto')

      ;(mockPrisma.apiToken.create as jest.Mock).mockResolvedValue({
        id: 'hash-verify-uuid',
        name: 'Hash Verify',
        permissions: [],
        expiresAt: null,
        createdAt: new Date(),
      })

      const req = makeRequest('POST', '/api/keys', { name: 'Hash Verify' })
      const res = await POST(req)
      const json = await res.json()

      const rawToken: string = json.data.token
      const expectedHash = createHash('sha256').update(rawToken).digest('hex')

      const createCall = (mockPrisma.apiToken.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data.tokenHash).toBe(expectedHash)
    })
  })
})
