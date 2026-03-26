/**
 * Favorites Export API Route
 * GET /api/exercises/favorites/export - Export user's favorites as CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * Escape a CSV field value — wraps in quotes when it contains commas, quotes, or newlines.
 */
function csvEscape(value: string | null | undefined): string {
  const str = value ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * GET /api/exercises/favorites/export
 * Returns the authenticated user's favorited exercises as a CSV download.
 * Query params:
 *   format=csv (default, only supported format)
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const req = authResult as AuthenticatedRequest

  try {
    const favorites = await prisma.exerciseFavorite.findMany({
      where: { userId: req.user!.id },
      include: { exercise: true },
      orderBy: { favoritedAt: 'desc' },
    })

    const header = 'name,bodyPart,equipment,targetMuscle,difficulty'
    const rows = favorites.map((fav) => {
      const ex = fav.exercise as any
      return [
        csvEscape(ex.name),
        csvEscape(ex.bodyPart),
        csvEscape(ex.equipment),
        csvEscape(ex.target),
        csvEscape(ex.difficulty),
      ].join(',')
    })

    const csv = [header, ...rows].join('\n')
    const filename = `favorites-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting favorites:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export favorites' },
      { status: 500 }
    )
  }
}
