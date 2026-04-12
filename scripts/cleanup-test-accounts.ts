/**
 * Cleanup auto-generated E2E test accounts older than 24h.
 *
 * Targets emails matching dup-edge-*, profile-check-*, and other E2E-generated
 * prefixes that accumulate when Playwright suites create throwaway users.
 *
 * Usage:
 *   npx tsx scripts/cleanup-test-accounts.ts           # live
 *   npx tsx scripts/cleanup-test-accounts.ts --dry-run # preview
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_EMAIL_PREFIXES = [
  'dup-edge-',
  'profile-check-',
  'e2e-test-',
  'playwright-',
  'perm-leak-',
  'jwt-test-',
];

const MAX_AGE_HOURS = 24;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

  console.log('='.repeat(60));
  console.log('  EvoFitTrainer Test Account Cleanup');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Cutoff: accounts older than ${cutoff.toISOString()}`);
  console.log(`Prefixes: ${TEST_EMAIL_PREFIXES.join(', ')}\n`);

  const orConditions = TEST_EMAIL_PREFIXES.map((prefix) => ({
    email: { startsWith: prefix },
  }));

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { OR: orConditions },
        { createdAt: { lt: cutoff } },
      ],
    },
    select: { id: true, email: true, createdAt: true },
  });

  console.log(`Found ${users.length} test accounts to delete.\n`);

  if (users.length === 0) {
    console.log('Nothing to clean up.');
    await prisma.$disconnect();
    return;
  }

  for (const u of users) {
    console.log(`  ${dryRun ? 'WOULD DELETE' : 'DELETE'}: ${u.email} (${u.createdAt.toISOString()})`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] No changes made.');
    await prisma.$disconnect();
    return;
  }

  const ids = users.map((u) => u.id);

  // Activity FK has no cascade — wipe rows for these users first.
  const activityResult = await prisma.activity.deleteMany({
    where: { userId: { in: ids } },
  });
  if (activityResult.count > 0) {
    console.log(`\nCleared ${activityResult.count} activity rows for test users.`);
  }

  const result = await prisma.user.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`\nDeleted ${result.count} test accounts.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Cleanup failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
