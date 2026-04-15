/**
 * Internal Seed-Tier Endpoint
 *
 * POST /api/internal/seed-tier
 *
 * Creates (or updates) the 3 tier-locked QA trainer accounts:
 *   qa-starter@evofit.io        — no subscription → defaults to Starter tier
 *   qa-professional@evofit.io   — active TrainerSubscription tier_level=2
 *   qa-enterprise@evofit.io     — active TrainerSubscription tier_level=3
 *
 * Called from E2E global-setup so all tier-gated tests have accounts ready.
 * Protected by INTERNAL_API_SECRET — returns 404 when secret is not set.
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const PASSWORD = 'QaTest2026!'

const ACCOUNTS = [
  { email: 'qa-starter@evofit.io',      name: 'QA Starter Trainer',     tierLevel: 1 },
  { email: 'qa-professional@evofit.io', name: 'QA Professional Trainer', tierLevel: 2 },
  { email: 'qa-enterprise@evofit.io',   name: 'QA Enterprise Trainer',   tierLevel: 3 },
] as const

export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) {
    return NextResponse.json({ success: false }, { status: 404 })
  }

  const authHeader = request.headers.get('x-internal-secret')
  if (authHeader !== secret) {
    return NextResponse.json({ success: false }, { status: 403 })
  }

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 10)
    const results: Record<string, string> = {}

    for (const account of ACCOUNTS) {
      // 1. Get or create user
      let user = await prisma.user.findUnique({ where: { email: account.email } })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: account.email,
            passwordHash,
            role: 'trainer',
            isVerified: true,
          },
        })
        results[account.email] = 'created'
      } else {
        results[account.email] = 'exists'
      }

      // 2. Starter — ensure no subscription row (entitlements default to tier 1)
      if (account.tierLevel === 1) {
        await prisma.trainerSubscription.deleteMany({ where: { trainerId: user.id } })
        continue
      }

      // 3. Pro / Enterprise — upsert active subscription
      const existing = await prisma.trainerSubscription.findFirst({
        where: { trainerId: user.id, status: 'active', tierLevel: account.tierLevel },
      })

      if (!existing) {
        // Remove stale subscriptions at a different level first
        await prisma.trainerSubscription.deleteMany({ where: { trainerId: user.id } })

        await prisma.trainerSubscription.create({
          data: {
            trainerId: user.id,
            tierLevel: account.tierLevel,
            status: 'active',
            amountPaidCents: account.tierLevel === 2 ? 29900 : 39900,
            stripePaymentIntentId: `qa_seed_tier${account.tierLevel}`,
          },
        })
        results[account.email] += '+subscription'
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    )
  }
}
