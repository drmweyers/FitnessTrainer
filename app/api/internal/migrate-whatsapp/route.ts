/**
 * One-time migration: add whatsapp_link column to user_profiles.
 * Call once after deploying the whatsappLink schema change.
 * DELETE this endpoint after the migration succeeds.
 *
 * POST /api/internal/migrate-whatsapp
 * Header: x-internal-secret: <INTERNAL_API_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return NextResponse.json({ success: false }, { status: 404 })

  const authHeader = request.headers.get('x-internal-secret')
  if (authHeader !== secret) return NextResponse.json({ success: false }, { status: 403 })

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS whatsapp_link VARCHAR(255)`
    )
    return NextResponse.json({ success: true, message: 'whatsapp_link column ensured' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
