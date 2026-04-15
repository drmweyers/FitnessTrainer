/**
 * Seed Tier Test Accounts
 *
 * Creates (or updates) 3 dedicated trainer accounts — one per subscription tier:
 *   qa-starter@evofit.io      — no subscription (defaults to Starter / tier_level=1)
 *   qa-professional@evofit.io — active subscription tier_level=2
 *   qa-enterprise@evofit.io   — active subscription tier_level=3
 *
 * Safe to re-run: upserts subscriptions, never deletes users.
 *
 * Run: npx tsx scripts/seed-tier-accounts.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PASSWORD = 'QaTest2026!'
const FAR_FUTURE = new Date('2099-12-31')

const ACCOUNTS = [
  { email: 'qa-starter@evofit.io',      name: 'QA Starter Trainer',      tierLevel: 1 },
  { email: 'qa-professional@evofit.io', name: 'QA Professional Trainer',  tierLevel: 2 },
  { email: 'qa-enterprise@evofit.io',   name: 'QA Enterprise Trainer',    tierLevel: 3 },
] as const

async function main() {
  console.log('\n[Tier Account Seeder] Starting...\n')

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  for (const account of ACCOUNTS) {
    const tierName = ['', 'Starter', 'Professional', 'Enterprise'][account.tierLevel]
    console.log(`Processing ${account.email} (${tierName})...`)

    // 1. Upsert user
    let user = await prisma.user.findUnique({ where: { email: account.email } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: account.email,
          passwordHash,
          role: 'trainer',
        },
      })
      console.log(`  ✓ Created user ${user.id}`)
    } else {
      console.log(`  ✓ User exists ${user.id}`)
    }

    // 2. Starter has no subscription (entitlements default to tier 1)
    if (account.tierLevel === 1) {
      // Remove any accidental subscription rows so the account stays at Starter
      const deleted = await prisma.trainerSubscription.deleteMany({
        where: { trainerId: user.id },
      })
      if (deleted.count > 0) {
        console.log(`  ✓ Removed ${deleted.count} subscription row(s) — Starter has no subscription`)
      } else {
        console.log(`  ✓ No subscription (correct for Starter tier)`)
      }
      continue
    }

    // 3. Pro / Enterprise — upsert a permanent active subscription
    const existing = await prisma.trainerSubscription.findFirst({
      where: { trainerId: user.id, status: 'active', tierLevel: account.tierLevel },
    })

    if (existing) {
      console.log(`  ✓ Active tier_level=${account.tierLevel} subscription already exists`)
    } else {
      // Remove any stale subscriptions at a different level first
      await prisma.trainerSubscription.deleteMany({
        where: { trainerId: user.id },
      })

      await prisma.trainerSubscription.create({
        data: {
          trainerId: user.id,
          tierLevel: account.tierLevel,
          status: 'active',
          amountPaidCents: account.tierLevel === 2 ? 29900 : 39900,
          stripePaymentIntentId: `qa_seed_tier${account.tierLevel}`,
        },
      })
      console.log(`  ✓ Created active subscription tier_level=${account.tierLevel}`)
    }
  }

  console.log('\n[Tier Account Seeder] Done.\n')
  console.log('Accounts:')
  console.log('  qa-starter@evofit.io        / QaTest2026!  →  Starter')
  console.log('  qa-professional@evofit.io   / QaTest2026!  →  Professional')
  console.log('  qa-enterprise@evofit.io     / QaTest2026!  →  Enterprise')
  console.log('')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
