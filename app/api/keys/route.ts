import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { withTier } from '@/lib/subscription/withTier'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const API_KEY_PREFIX = 'efk_'

/**
 * GET /api/keys
 * List all API keys for the authenticated Enterprise trainer.
 * Returns key metadata only — the raw token is never exposed after creation.
 */
async function listHandler(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const tokens = await prisma.apiToken.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        name: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: tokens })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to list API keys' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/keys
 * Create a new API key for the authenticated Enterprise trainer.
 *
 * Body:
 *   name: string           — human-readable label for the key
 *   permissions?: string[] — optional permission scopes (default: [])
 *   expiresAt?: string     — ISO date string for expiry (optional)
 *
 * Returns the raw token ONCE. It cannot be retrieved again.
 * The token is prefixed with `efk_` for easy identification.
 */
async function createHandler(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json(
      { success: false, error: 'name is required' },
      { status: 400 }
    )
  }

  if (name.length > 255) {
    return NextResponse.json(
      { success: false, error: 'name must be 255 characters or fewer' },
      { status: 400 }
    )
  }

  const permissions: string[] = Array.isArray(body.permissions)
    ? (body.permissions as unknown[]).filter((p): p is string => typeof p === 'string')
    : []

  let expiresAt: Date | null = null
  if (body.expiresAt) {
    expiresAt = new Date(body.expiresAt as string)
    if (isNaN(expiresAt.getTime())) {
      return NextResponse.json(
        { success: false, error: 'expiresAt must be a valid ISO date string' },
        { status: 400 }
      )
    }
    if (expiresAt <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'expiresAt must be in the future' },
        { status: 400 }
      )
    }
  }

  try {
    // Generate a cryptographically secure random token
    const rawToken = randomBytes(32).toString('hex')
    const displayToken = `${API_KEY_PREFIX}${rawToken}`

    // Store only the hash — the raw token is returned once and never stored
    const tokenHash = createHash('sha256').update(displayToken).digest('hex')

    const created = await prisma.apiToken.create({
      data: {
        userId: req.user!.id,
        name,
        tokenHash,
        permissions,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...created,
          // Raw token returned ONCE — save it now, it cannot be retrieved again
          token: displayToken,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}

export const GET = withTier({ minTier: 'enterprise' })(listHandler)
export const POST = withTier({ minTier: 'enterprise' })(createHandler)
