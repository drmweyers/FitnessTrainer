/**
 * Grandfather policy: create a TrainerSubscription at tier_level=2 (Professional)
 * for every trainer who has no active subscription.
 *
 * Run ONLY at integration time AFTER the trainer_subscriptions table exists in the DB.
 *   npx tsx scripts/backfill-subscription-tier.ts           # live
 *   npx tsx scripts/backfill-subscription-tier.ts --dry-run # preview
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROFESSIONAL_TIER_LEVEL = 2;

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('  EvoFitTrainer Subscription Tier Backfill');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Policy: grandfather all existing trainers to Professional (level ${PROFESSIONAL_TIER_LEVEL})\n`);

  const trainers = await prisma.user.findMany({
    where: { role: 'trainer', deletedAt: null },
    select: { id: true, email: true },
  });

  console.log(`Found ${trainers.length} trainer(s) total.\n`);

  let created = 0;
  let skipped = 0;

  for (const trainer of trainers) {
    const existing = await prisma.trainerSubscription.findFirst({
      where: { trainerId: trainer.id, status: 'active' },
    });

    if (existing) {
      console.log(`  SKIP   ${trainer.email} — already has active subscription (level ${existing.tierLevel})`);
      skipped++;
      continue;
    }

    console.log(`  ${dryRun ? 'WOULD CREATE' : 'CREATE'} ${trainer.email} → Professional`);

    if (!dryRun) {
      await prisma.trainerSubscription.create({
        data: {
          trainerId: trainer.id,
          tierLevel: PROFESSIONAL_TIER_LEVEL,
          status: 'active',
          amountPaidCents: 0,
        },
      });
    }

    created++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Results`);
  console.log('='.repeat(60));
  console.log(`  Created : ${created}`);
  console.log(`  Skipped : ${skipped}`);
  if (dryRun) console.log('\n[DRY RUN] No changes made.');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Backfill failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
