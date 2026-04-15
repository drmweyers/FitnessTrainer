import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { withTier } from '@/lib/subscription/withTier'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/keys/[id]
 * Revoke (delete) an API key belonging to the authenticated Enterprise trainer.
 * Trainers can only revoke their own keys.
 */
async function revokeHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  const { id } = context.params
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Key ID is required' },
      { status: 400 }
    )
  }

  try {
    // Verify the key exists and belongs to this trainer
    const token = await prisma.apiToken.findUnique({
      where: { id },
      select: { id: true, userId: true, name: true },
    })

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'API key not found' },
        { status: 404 }
      )
    }

    if (token.userId !== req.user!.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    await prisma.apiToken.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { id, message: `API key "${token.name}" has been revoked` },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}

export const DELETE = withTier({ minTier: 'enterprise' })(
  (req: NextRequest, ctx?: unknown) => revokeHandler(req, ctx as { params: { id: string } })
)
