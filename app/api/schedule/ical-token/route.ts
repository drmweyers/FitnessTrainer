import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { generateFeedToken } from '@/app/api/schedule/feed/[token]/route'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedule/ical-token
 * Returns the authenticated user's stable iCal subscription URL.
 * Alias for /api/schedule/feed-token that matches the story spec endpoint name.
 *
 * Response: { success: true, data: { url: string, token: string } }
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  const userId = req.user!.id
  const token = generateFeedToken(userId)

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get('origin') ||
    'https://trainer.evofit.io'

  const url = `${baseUrl}/api/schedule/feed/${token}`

  return NextResponse.json({
    success: true,
    data: { url, token },
  })
}
