#!/usr/bin/env tsx
/**
 * Analytics Demo Data Seed Script
 *
 * Populates realistic analytics data for customer presentations
 *
 * Targets 3 clients assigned to coach.sarah@evofittrainer.com:
 * - Alex Johnson (intermediate, Powerlifting Foundations)
 * - Emma Wilson (advanced, HIIT & Conditioning)
 * - Olivia Martinez (beginner, Beginner Full Body)
 *
 * Seeds:
 * - 8 weeks of body measurements with realistic progress
 * - Fitness goals with current/target values
 * - Performance metrics (personal bests over time)
 * - Milestone achievements
 *
 * Usage:
 *   npx tsx scripts/seed-analytics.ts              # Seed data
 *   npx tsx scripts/seed-analytics.ts --dry-run    # Preview without writing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run');

// Client configurations
const CLIENT_EMAILS = {
  alex: 'alex.johnson@example.com',
  emma: 'emma.wilson@example.com',
  olivia: 'olivia.martinez@example.com',
};

// Helper to get dates for the last 8 weeks
function getWeeklyDates(weeksBack: number = 8): Date[] {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = weeksBack - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 7));
    dates.push(date);
  }

  return dates;
}

// Interpolate between start and end values
function interpolate(start: number, end: number, step: number, total: number): number {
  const progress = step / (total - 1);
  return start + (end - start) * progress;
}

async function seedAlexAnalytics(userId: string) {
  console.log('\n📊 Seeding analytics for Alex Johnson (Powerlifting focus)...');

  const dates = getWeeklyDates(8);

  // 1. Body Measurements (8 weeks)
  console.log('  → Creating body measurements...');
  const measurements = dates.map((date, i) => ({
    userId,
    weight: interpolate(185, 182, i, 8),
    bodyFatPercentage: interpolate(18, 15, i, 8),
    measurements: {
      chest: interpolate(42, 43, i, 8),
      waist: interpolate(34, 32, i, 8),
      hips: 38,
      leftArm: interpolate(15, 15.5, i, 8),
      rightArm: interpolate(15, 15.5, i, 8),
      leftThigh: interpolate(24, 24.5, i, 8),
      rightThigh: interpolate(24, 24.5, i, 8),
    },
    recordedAt: date,
  }));

  if (!isDryRun) {
    await prisma.userMeasurement.createMany({ data: measurements });
    console.log(`  ✓ Created ${measurements.length} measurements`);
  } else {
    console.log(`  [DRY RUN] Would create ${measurements.length} measurements`);
  }

  // 2. Fitness Goals
  console.log('  → Creating fitness goals...');
  const goals = [
    {
      userId,
      goalType: 'strength',
      specificGoal: 'Squat 315 lbs',
      targetValue: 315,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days out
      priority: 1,
      isActive: true,
    },
    {
      userId,
      goalType: 'strength',
      specificGoal: 'Bench Press 225 lbs',
      targetValue: 225,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      priority: 2,
      isActive: true,
    },
    {
      userId,
      goalType: 'weight_loss',
      specificGoal: 'Lose 5 lbs body fat',
      targetValue: 5,
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      priority: 3,
      isActive: true,
    },
  ];

  if (!isDryRun) {
    for (const goal of goals) {
      await prisma.userGoal.create({ data: goal });
    }
    console.log(`  ✓ Created ${goals.length} goals`);
  } else {
    console.log(`  [DRY RUN] Would create ${goals.length} goals`);
  }

  // 3. Performance Metrics (Squat, Bench, Deadlift progression)
  console.log('  → Creating performance metrics...');
  const squatProgress = [245, 255, 265, 275]; // Every 2 weeks
  const benchProgress = [185, 190, 195, 195];
  const deadliftProgress = [285, 295, 305, 315];

  const performanceMetrics = [];

  for (let i = 0; i < 4; i++) {
    const date = dates[i * 2]; // Every 2 weeks

    performanceMetrics.push(
      {
        userId,
        metricType: 'one_rm',
        value: squatProgress[i],
        unit: 'lbs',
        recordedAt: date,
        notes: 'Squat 1RM',
      },
      {
        userId,
        metricType: 'one_rm',
        value: benchProgress[i],
        unit: 'lbs',
        recordedAt: date,
        notes: 'Bench Press 1RM',
      },
      {
        userId,
        metricType: 'one_rm',
        value: deadliftProgress[i],
        unit: 'lbs',
        recordedAt: date,
        notes: 'Deadlift 1RM',
      }
    );
  }

  if (!isDryRun) {
    await prisma.performanceMetric.createMany({ data: performanceMetrics });
    console.log(`  ✓ Created ${performanceMetrics.length} performance metrics`);
  } else {
    console.log(`  [DRY RUN] Would create ${performanceMetrics.length} performance metrics`);
  }

  // 4. Milestones
  console.log('  → Creating milestones...');
  const milestones = [
    {
      userId,
      milestoneType: 'strength',
      title: 'First 300lb Deadlift',
      description: 'Pulled 305 lbs for a new personal record!',
      achievedValue: 305,
      achievedAt: dates[4],
    },
    {
      userId,
      milestoneType: 'consistency',
      title: '8 Weeks Consistent Training',
      description: 'Completed 8 weeks of training without missing a session',
      achievedAt: dates[7],
    },
    {
      userId,
      milestoneType: 'strength',
      title: 'Bench Press 195 lbs',
      description: 'Hit 195 lbs on bench press, closing in on 225!',
      achievedValue: 195,
      achievedAt: dates[6],
    },
  ];

  if (!isDryRun) {
    for (const milestone of milestones) {
      await prisma.milestoneAchievement.create({ data: milestone });
    }
    console.log(`  ✓ Created ${milestones.length} milestones`);
  } else {
    console.log(`  [DRY RUN] Would create ${milestones.length} milestones`);
  }
}

async function seedEmmaAnalytics(userId: string) {
  console.log('\n📊 Seeding analytics for Emma Wilson (HIIT/Conditioning focus)...');

  const dates = getWeeklyDates(8);

  // 1. Body Measurements
  console.log('  → Creating body measurements...');
  const measurements = dates.map((date, i) => ({
    userId,
    weight: interpolate(140, 136, i, 8),
    bodyFatPercentage: interpolate(22, 19, i, 8),
    measurements: {
      chest: 34,
      waist: interpolate(28, 26, i, 8),
      hips: interpolate(36, 35, i, 8),
      leftArm: 11,
      rightArm: 11,
      leftThigh: interpolate(21, 20.5, i, 8),
      rightThigh: interpolate(21, 20.5, i, 8),
    },
    recordedAt: date,
  }));

  if (!isDryRun) {
    await prisma.userMeasurement.createMany({ data: measurements });
    console.log(`  ✓ Created ${measurements.length} measurements`);
  } else {
    console.log(`  [DRY RUN] Would create ${measurements.length} measurements`);
  }

  // 2. Fitness Goals
  console.log('  → Creating fitness goals...');
  const goals = [
    {
      userId,
      goalType: 'endurance',
      specificGoal: 'Run 5K under 22 minutes',
      targetValue: 22,
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      priority: 1,
      isActive: true,
    },
    {
      userId,
      goalType: 'strength',
      specificGoal: '10 unassisted pull-ups',
      targetValue: 10,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      priority: 2,
      isActive: true,
    },
    {
      userId,
      goalType: 'weight_loss',
      specificGoal: 'Reach 135 lbs',
      targetValue: 135,
      targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      priority: 3,
      isActive: true,
    },
  ];

  if (!isDryRun) {
    for (const goal of goals) {
      await prisma.userGoal.create({ data: goal });
    }
    console.log(`  ✓ Created ${goals.length} goals`);
  } else {
    console.log(`  [DRY RUN] Would create ${goals.length} goals`);
  }

  // 3. Performance Metrics (5K time, pull-ups)
  console.log('  → Creating performance metrics...');
  const fiveKTimes = [26.0, 25.0, 24.5, 24.0]; // minutes (every 2 weeks)
  const pullupMax = [4, 5, 6, 7];

  const performanceMetrics = [];

  for (let i = 0; i < 4; i++) {
    const date = dates[i * 2];

    performanceMetrics.push(
      {
        userId,
        metricType: 'endurance',
        value: fiveKTimes[i],
        unit: 'minutes',
        recordedAt: date,
        notes: '5K run time',
      },
      {
        userId,
        metricType: 'endurance',
        value: pullupMax[i],
        unit: 'reps',
        recordedAt: date,
        notes: 'Max pull-ups',
      }
    );
  }

  if (!isDryRun) {
    await prisma.performanceMetric.createMany({ data: performanceMetrics });
    console.log(`  ✓ Created ${performanceMetrics.length} performance metrics`);
  } else {
    console.log(`  [DRY RUN] Would create ${performanceMetrics.length} performance metrics`);
  }

  // 4. Milestones
  console.log('  → Creating milestones...');
  const milestones = [
    {
      userId,
      milestoneType: 'endurance',
      title: 'Sub-25 Minute 5K',
      description: 'Broke the 25-minute barrier with 24:30!',
      achievedValue: 24.5,
      achievedAt: dates[4],
    },
    {
      userId,
      milestoneType: 'strength',
      title: 'First Muscle-Up Attempt',
      description: 'Successfully attempted first muscle-up on the bar!',
      achievedAt: dates[5],
    },
    {
      userId,
      milestoneType: 'body_composition',
      title: 'Lost 4 lbs',
      description: 'Down to 136 lbs, feeling stronger and faster!',
      achievedValue: 4,
      achievedAt: dates[7],
    },
  ];

  if (!isDryRun) {
    for (const milestone of milestones) {
      await prisma.milestoneAchievement.create({ data: milestone });
    }
    console.log(`  ✓ Created ${milestones.length} milestones`);
  } else {
    console.log(`  [DRY RUN] Would create ${milestones.length} milestones`);
  }
}

async function seedOliviaAnalytics(userId: string) {
  console.log('\n📊 Seeding analytics for Olivia Martinez (Beginner focus)...');

  const dates = getWeeklyDates(8);

  // 1. Body Measurements
  console.log('  → Creating body measurements...');
  const measurements = dates.map((date, i) => ({
    userId,
    weight: interpolate(155, 150, i, 8),
    bodyFatPercentage: interpolate(25, 22, i, 8),
    measurements: {
      chest: 36,
      waist: interpolate(30, 28, i, 8),
      hips: interpolate(38, 37, i, 8),
      leftArm: 12,
      rightArm: 12,
      leftThigh: interpolate(23, 22.5, i, 8),
      rightThigh: interpolate(23, 22.5, i, 8),
    },
    recordedAt: date,
  }));

  if (!isDryRun) {
    await prisma.userMeasurement.createMany({ data: measurements });
    console.log(`  ✓ Created ${measurements.length} measurements`);
  } else {
    console.log(`  [DRY RUN] Would create ${measurements.length} measurements`);
  }

  // 2. Fitness Goals
  console.log('  → Creating fitness goals...');
  const goals = [
    {
      userId,
      goalType: 'weight_loss',
      specificGoal: 'Lose 10 lbs',
      targetValue: 10,
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      priority: 1,
      isActive: true,
    },
    {
      userId,
      goalType: 'strength',
      specificGoal: 'Do 1 unassisted pull-up',
      targetValue: 1,
      targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      priority: 2,
      isActive: true,
    },
    {
      userId,
      goalType: 'flexibility',
      specificGoal: 'Touch toes without bending knees',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      priority: 3,
      isActive: true,
    },
  ];

  if (!isDryRun) {
    for (const goal of goals) {
      await prisma.userGoal.create({ data: goal });
    }
    console.log(`  ✓ Created ${goals.length} goals`);
  } else {
    console.log(`  [DRY RUN] Would create ${goals.length} goals`);
  }

  // 3. Performance Metrics (Squat, Deadlift, Plank)
  console.log('  → Creating performance metrics...');
  const squatProgress = [65, 75, 85, 95]; // Every 2 weeks
  const deadliftProgress = [95, 105, 115, 135];
  const plankProgress = [30, 45, 60, 75]; // seconds

  const performanceMetrics = [];

  for (let i = 0; i < 4; i++) {
    const date = dates[i * 2];

    performanceMetrics.push(
      {
        userId,
        metricType: 'one_rm',
        value: squatProgress[i],
        unit: 'lbs',
        recordedAt: date,
        notes: 'Squat working weight',
      },
      {
        userId,
        metricType: 'one_rm',
        value: deadliftProgress[i],
        unit: 'lbs',
        recordedAt: date,
        notes: 'Deadlift working weight',
      },
      {
        userId,
        metricType: 'endurance',
        value: plankProgress[i],
        unit: 'seconds',
        recordedAt: date,
        notes: 'Plank hold time',
      }
    );
  }

  if (!isDryRun) {
    await prisma.performanceMetric.createMany({ data: performanceMetrics });
    console.log(`  ✓ Created ${performanceMetrics.length} performance metrics`);
  } else {
    console.log(`  [DRY RUN] Would create ${performanceMetrics.length} performance metrics`);
  }

  // 4. Milestones
  console.log('  → Creating milestones...');
  const milestones = [
    {
      userId,
      milestoneType: 'strength',
      title: 'First Full Push-Up',
      description: 'Completed first unassisted push-up with perfect form!',
      achievedAt: dates[2],
    },
    {
      userId,
      milestoneType: 'consistency',
      title: 'Completed First Program Week',
      description: 'Finished all 3 workouts in first week!',
      achievedAt: dates[1],
    },
    {
      userId,
      milestoneType: 'body_composition',
      title: 'Lost First 5 lbs',
      description: 'Down to 150 lbs - halfway to goal!',
      achievedValue: 5,
      achievedAt: dates[7],
    },
    {
      userId,
      milestoneType: 'strength',
      title: '1 Minute Plank',
      description: 'Held plank for 60 seconds straight!',
      achievedValue: 60,
      achievedAt: dates[5],
    },
  ];

  if (!isDryRun) {
    for (const milestone of milestones) {
      await prisma.milestoneAchievement.create({ data: milestone });
    }
    console.log(`  ✓ Created ${milestones.length} milestones`);
  } else {
    console.log(`  [DRY RUN] Would create ${milestones.length} milestones`);
  }
}

async function main() {
  console.log('🌱 Analytics Demo Data Seeding Script');
  console.log('=====================================\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No data will be written\n');
  }

  // Look up users by email
  console.log('📧 Looking up users...');
  const alex = await prisma.user.findUnique({
    where: { email: CLIENT_EMAILS.alex },
  });
  const emma = await prisma.user.findUnique({
    where: { email: CLIENT_EMAILS.emma },
  });
  const olivia = await prisma.user.findUnique({
    where: { email: CLIENT_EMAILS.olivia },
  });

  if (!alex || !emma || !olivia) {
    console.error('❌ Error: Could not find all required users');
    console.error('  Missing:', [
      !alex && 'Alex Johnson',
      !emma && 'Emma Wilson',
      !olivia && 'Olivia Martinez',
    ].filter(Boolean).join(', '));
    console.error('\n  Make sure to run the production seed script first:');
    console.error('  DATABASE_URL="..." npx tsx scripts/seed-production.ts');
    process.exit(1);
  }

  console.log('  ✓ Found Alex Johnson:', alex.id);
  console.log('  ✓ Found Emma Wilson:', emma.id);
  console.log('  ✓ Found Olivia Martinez:', olivia.id);

  // Seed analytics for each client
  await seedAlexAnalytics(alex.id);
  await seedEmmaAnalytics(emma.id);
  await seedOliviaAnalytics(olivia.id);

  console.log('\n✅ Analytics seeding complete!\n');

  if (isDryRun) {
    console.log('ℹ️  This was a dry run. Run without --dry-run to actually seed data.\n');
  } else {
    console.log('📊 Summary:');
    console.log('  - 24 body measurement records (8 weeks × 3 clients)');
    console.log('  - 9 fitness goals (3 per client)');
    console.log('  - 36 performance metrics (12 per client)');
    console.log('  - 10 milestone achievements (varied per client)');
    console.log('  - Total: 79 analytics records created\n');
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
