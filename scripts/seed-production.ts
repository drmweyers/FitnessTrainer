/**
 * Production Seed Script - Comprehensive Demo Data
 *
 * Creates realistic demo data simulating a real fitness training platform:
 * - 1 Admin user
 * - 2 Trainers (with full profiles, certs, specializations)
 * - 4 Clients (with profiles, health data, measurements, goals)
 * - Trainer-client relationships
 * - 20 exercises (diverse muscle groups)
 * - 2 training programs (with weeks, workouts, exercises, configurations)
 * - Program assignments
 * - Workout sessions with exercise logs and set logs
 * - Performance metrics, training load, milestones
 * - Scheduling (availability + appointments)
 * - Activity feed
 * - Analytics reports, insights, goal progress
 *
 * Run: npx tsx scripts/seed-production.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper: random date in range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper: days ago
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('Seeding production database with comprehensive demo data...\n');

  // =============================================
  // 1. USERS
  // =============================================
  console.log('Creating users...');
  const passwordHash = await hashPassword('Demo1234!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@evofittrainer.com' },
    update: {},
    create: {
      email: 'admin@evofittrainer.com',
      passwordHash,
      role: 'admin',
      isActive: true,
      isVerified: true,
      lastLoginAt: daysAgo(0),
    },
  });

  const trainer1 = await prisma.user.upsert({
    where: { email: 'coach.sarah@evofittrainer.com' },
    update: {},
    create: {
      email: 'coach.sarah@evofittrainer.com',
      passwordHash,
      role: 'trainer',
      isActive: true,
      isVerified: true,
      lastLoginAt: daysAgo(0),
    },
  });

  const trainer2 = await prisma.user.upsert({
    where: { email: 'coach.mike@evofittrainer.com' },
    update: {},
    create: {
      email: 'coach.mike@evofittrainer.com',
      passwordHash,
      role: 'trainer',
      isActive: true,
      isVerified: true,
      lastLoginAt: daysAgo(1),
    },
  });

  const client1 = await prisma.user.upsert({
    where: { email: 'alex.johnson@example.com' },
    update: {},
    create: {
      email: 'alex.johnson@example.com',
      passwordHash,
      role: 'client',
      isActive: true,
      isVerified: true,
      lastLoginAt: daysAgo(0),
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'emma.wilson@example.com' },
    update: {},
    create: {
      email: 'emma.wilson@example.com',
      passwordHash,
      role: 'client',
      isActive: true,
      isVerified: true,
      lastLoginAt: daysAgo(1),
    },
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'james.chen@example.com' },
    update: {},
    create: {
      email: 'james.chen@example.com',
      passwordHash,
      role: 'client',
      isActive: true,
      isVerified: true,
      lastLoginAt: daysAgo(3),
    },
  });

  const client4 = await prisma.user.upsert({
    where: { email: 'olivia.martinez@example.com' },
    update: {},
    create: {
      email: 'olivia.martinez@example.com',
      passwordHash,
      role: 'client',
      isActive: true,
      isVerified: true,
      lastLoginAt: daysAgo(7),
    },
  });

  console.log(`  Created 7 users (1 admin, 2 trainers, 4 clients)`);

  // =============================================
  // 2. USER PROFILES
  // =============================================
  console.log('Creating user profiles...');

  await prisma.userProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      bio: 'Platform administrator for EvoFit Trainer.',
      gender: 'male',
      phone: '+1-555-0100',
      timezone: 'America/New_York',
      preferredUnits: 'imperial',
      isPublic: false,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: trainer1.id },
    update: {},
    create: {
      userId: trainer1.id,
      bio: 'NASM Certified Personal Trainer with 8 years of experience specializing in strength training and body transformation. Former college athlete turned fitness coach. I believe in building sustainable habits and pushing boundaries safely.',
      dateOfBirth: new Date('1990-03-15'),
      gender: 'female',
      phone: '+1-555-0201',
      timezone: 'America/New_York',
      preferredUnits: 'imperial',
      isPublic: true,
      completedAt: daysAgo(90),
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: trainer2.id },
    update: {},
    create: {
      userId: trainer2.id,
      bio: 'CSCS Strength & Conditioning Specialist. 12 years in the industry working with athletes and general population. My approach combines evidence-based programming with practical coaching.',
      dateOfBirth: new Date('1985-07-22'),
      gender: 'male',
      phone: '+1-555-0202',
      timezone: 'America/Chicago',
      preferredUnits: 'metric',
      isPublic: true,
      completedAt: daysAgo(120),
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: client1.id },
    update: {},
    create: {
      userId: client1.id,
      bio: 'Software developer by day, gym enthusiast by night. Training for my first powerlifting meet.',
      dateOfBirth: new Date('1995-11-08'),
      gender: 'male',
      phone: '+1-555-0301',
      timezone: 'America/New_York',
      preferredUnits: 'imperial',
      isPublic: true,
      completedAt: daysAgo(60),
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: client2.id },
    update: {},
    create: {
      userId: client2.id,
      bio: 'Marathon runner looking to add strength training to improve my race times and prevent injuries.',
      dateOfBirth: new Date('1992-05-20'),
      gender: 'female',
      phone: '+1-555-0302',
      timezone: 'America/Los_Angeles',
      preferredUnits: 'metric',
      isPublic: true,
      completedAt: daysAgo(45),
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: client3.id },
    update: {},
    create: {
      userId: client3.id,
      bio: 'Trying to get back in shape after a desk job took its toll. Looking for sustainable fitness.',
      dateOfBirth: new Date('1988-09-12'),
      gender: 'male',
      phone: '+1-555-0303',
      timezone: 'America/Chicago',
      preferredUnits: 'metric',
      isPublic: false,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: client4.id },
    update: {},
    create: {
      userId: client4.id,
      bio: 'New mom getting back into fitness. Love group classes and HIIT workouts.',
      dateOfBirth: new Date('1993-01-30'),
      gender: 'female',
      phone: '+1-555-0304',
      timezone: 'America/Denver',
      preferredUnits: 'imperial',
      isPublic: true,
    },
  });

  console.log('  Created 7 user profiles');

  // =============================================
  // 3. USER HEALTH
  // =============================================
  console.log('Creating user health records...');

  await prisma.userHealth.upsert({
    where: { userId: client1.id },
    update: {},
    create: {
      userId: client1.id,
      bloodType: 'O+',
      medicalConditions: [],
      medications: [],
      allergies: ['Penicillin'],
      injuries: { past: [{ type: 'Ankle sprain', year: 2022, resolved: true }] },
      lifestyle: { smoking: false, alcohol: 'occasional', sleepHours: 7, stressLevel: 'moderate' },
      emergencyContact: { name: 'Robert Johnson', phone: '+1-555-0310', relationship: 'Father' },
    },
  });

  await prisma.userHealth.upsert({
    where: { userId: client2.id },
    update: {},
    create: {
      userId: client2.id,
      bloodType: 'A+',
      medicalConditions: ['Mild asthma'],
      medications: ['Albuterol inhaler (as needed)'],
      allergies: [],
      injuries: { past: [{ type: 'IT band syndrome', year: 2023, resolved: true }] },
      lifestyle: { smoking: false, alcohol: 'rarely', sleepHours: 8, stressLevel: 'low' },
      emergencyContact: { name: 'David Wilson', phone: '+1-555-0320', relationship: 'Spouse' },
    },
  });

  await prisma.userHealth.upsert({
    where: { userId: client3.id },
    update: {},
    create: {
      userId: client3.id,
      bloodType: 'B+',
      medicalConditions: ['Mild hypertension'],
      medications: ['Lisinopril 10mg daily'],
      allergies: ['Shellfish'],
      injuries: { past: [{ type: 'Lower back strain', year: 2024, resolved: false }] },
      lifestyle: { smoking: false, alcohol: 'moderate', sleepHours: 6, stressLevel: 'high' },
      emergencyContact: { name: 'Lisa Chen', phone: '+1-555-0330', relationship: 'Wife' },
    },
  });

  await prisma.userHealth.upsert({
    where: { userId: client4.id },
    update: {},
    create: {
      userId: client4.id,
      bloodType: 'AB+',
      medicalConditions: [],
      medications: [],
      allergies: [],
      injuries: null,
      lifestyle: { smoking: false, alcohol: 'rarely', sleepHours: 6, stressLevel: 'moderate' },
      emergencyContact: { name: 'Carlos Martinez', phone: '+1-555-0340', relationship: 'Husband' },
    },
  });

  console.log('  Created 4 health records');

  // =============================================
  // 4. USER MEASUREMENTS (time series)
  // =============================================
  console.log('Creating measurements...');

  const measurementData = [
    { user: client1, weights: [88.5, 87.8, 87.0, 86.5, 86.0, 85.5], bf: [22, 21.5, 21, 20.5, 20, 19.5], height: 180 },
    { user: client2, weights: [62.0, 61.5, 61.2, 61.0, 60.8, 60.5], bf: [24, 23.5, 23.2, 23, 22.8, 22.5], height: 168 },
    { user: client3, weights: [95.0, 94.0, 93.0, 92.5, 92.0, 91.0], bf: [28, 27.5, 27, 26.5, 26, 25.5], height: 175 },
    { user: client4, weights: [68.0, 67.5, 67.0, 66.5, 66.0, 65.5], bf: [30, 29.5, 29, 28.5, 28, 27.5], height: 163 },
  ];

  for (const md of measurementData) {
    for (let i = 0; i < md.weights.length; i++) {
      await prisma.userMeasurement.create({
        data: {
          userId: md.user.id,
          height: md.height,
          weight: md.weights[i],
          bodyFatPercentage: md.bf[i],
          muscleMass: md.weights[i] * (1 - md.bf[i] / 100) * 0.45,
          measurements: {
            chest: 95 + Math.random() * 5,
            waist: 82 - i * 0.5,
            hips: 98 + Math.random() * 3,
            biceps: 35 + Math.random() * 2,
            thighs: 58 + Math.random() * 3,
          },
          recordedAt: daysAgo((md.weights.length - 1 - i) * 14),
        },
      });
    }
  }

  console.log(`  Created ${measurementData.length * 6} measurement records`);

  // =============================================
  // 5. USER GOALS
  // =============================================
  console.log('Creating user goals...');

  const goal1 = await prisma.userGoal.create({
    data: {
      userId: client1.id,
      goalType: 'strength',
      specificGoal: 'Bench press 100kg for 1 rep',
      targetValue: 100,
      targetDate: new Date('2026-06-01'),
      priority: 1,
      isActive: true,
    },
  });

  const goal2 = await prisma.userGoal.create({
    data: {
      userId: client1.id,
      goalType: 'weight_loss',
      specificGoal: 'Get to 82kg bodyweight',
      targetValue: 82,
      targetDate: new Date('2026-05-01'),
      priority: 2,
      isActive: true,
    },
  });

  await prisma.userGoal.create({
    data: {
      userId: client2.id,
      goalType: 'endurance',
      specificGoal: 'Run a sub-3:30 marathon',
      targetValue: 210,
      targetDate: new Date('2026-10-15'),
      priority: 1,
      isActive: true,
    },
  });

  await prisma.userGoal.create({
    data: {
      userId: client3.id,
      goalType: 'weight_loss',
      specificGoal: 'Lose 10kg and reach 85kg',
      targetValue: 85,
      targetDate: new Date('2026-08-01'),
      priority: 1,
      isActive: true,
    },
  });

  await prisma.userGoal.create({
    data: {
      userId: client4.id,
      goalType: 'general_fitness',
      specificGoal: 'Build a consistent 4x/week training habit',
      targetValue: 4,
      targetDate: new Date('2026-04-01'),
      priority: 1,
      isActive: true,
    },
  });

  console.log('  Created 5 goals');

  // =============================================
  // 6. GOAL PROGRESS
  // =============================================
  console.log('Creating goal progress...');

  const goalProgressEntries = [
    { goalId: goal1.id, date: daysAgo(56), value: 80, pct: 50 },
    { goalId: goal1.id, date: daysAgo(42), value: 85, pct: 62.5 },
    { goalId: goal1.id, date: daysAgo(28), value: 87.5, pct: 68.75 },
    { goalId: goal1.id, date: daysAgo(14), value: 90, pct: 75 },
    { goalId: goal1.id, date: daysAgo(7), value: 92.5, pct: 81.25 },
    { goalId: goal2.id, date: daysAgo(56), value: 87, pct: 23 },
    { goalId: goal2.id, date: daysAgo(42), value: 86.5, pct: 38 },
    { goalId: goal2.id, date: daysAgo(28), value: 86, pct: 54 },
    { goalId: goal2.id, date: daysAgo(14), value: 85.5, pct: 69 },
    { goalId: goal2.id, date: daysAgo(7), value: 85, pct: 77 },
  ];

  for (const gp of goalProgressEntries) {
    await prisma.goalProgress.create({
      data: {
        goalId: gp.goalId,
        recordedDate: gp.date,
        currentValue: gp.value,
        percentageComplete: gp.pct,
      },
    });
  }

  console.log('  Created 10 goal progress entries');

  // =============================================
  // 7. TRAINER CERTIFICATIONS & SPECIALIZATIONS
  // =============================================
  console.log('Creating trainer certifications...');

  await prisma.trainerCertification.createMany({
    data: [
      {
        trainerId: trainer1.id,
        certificationName: 'Certified Personal Trainer (CPT)',
        issuingOrganization: 'NASM',
        credentialId: 'NASM-CPT-2018-44821',
        issueDate: new Date('2018-06-15'),
        expiryDate: new Date('2027-06-15'),
        isVerified: true,
        verifiedAt: daysAgo(90),
      },
      {
        trainerId: trainer1.id,
        certificationName: 'Performance Enhancement Specialist (PES)',
        issuingOrganization: 'NASM',
        credentialId: 'NASM-PES-2020-55132',
        issueDate: new Date('2020-03-10'),
        expiryDate: new Date('2028-03-10'),
        isVerified: true,
        verifiedAt: daysAgo(90),
      },
      {
        trainerId: trainer1.id,
        certificationName: 'CPR/AED Certification',
        issuingOrganization: 'American Red Cross',
        issueDate: new Date('2025-01-20'),
        expiryDate: new Date('2027-01-20'),
        isVerified: true,
        verifiedAt: daysAgo(30),
      },
      {
        trainerId: trainer2.id,
        certificationName: 'Certified Strength and Conditioning Specialist (CSCS)',
        issuingOrganization: 'NSCA',
        credentialId: 'NSCA-CSCS-2014-31205',
        issueDate: new Date('2014-09-01'),
        expiryDate: new Date('2027-09-01'),
        isVerified: true,
        verifiedAt: daysAgo(120),
      },
      {
        trainerId: trainer2.id,
        certificationName: 'Precision Nutrition Level 1',
        issuingOrganization: 'Precision Nutrition',
        credentialId: 'PN1-2019-78432',
        issueDate: new Date('2019-11-15'),
        isVerified: true,
        verifiedAt: daysAgo(120),
      },
    ],
  });

  await prisma.trainerSpecialization.createMany({
    data: [
      { trainerId: trainer1.id, specialization: 'Strength Training', yearsExperience: 8, description: 'Powerlifting and general strength programming' },
      { trainerId: trainer1.id, specialization: 'Body Transformation', yearsExperience: 6, description: 'Fat loss and muscle building programs' },
      { trainerId: trainer1.id, specialization: 'Women\'s Fitness', yearsExperience: 5, description: 'Specialized programs for female athletes' },
      { trainerId: trainer2.id, specialization: 'Athletic Performance', yearsExperience: 12, description: 'Sports-specific conditioning and performance' },
      { trainerId: trainer2.id, specialization: 'Injury Rehabilitation', yearsExperience: 8, description: 'Return-to-sport and corrective exercise' },
      { trainerId: trainer2.id, specialization: 'Nutrition Coaching', yearsExperience: 6, description: 'Evidence-based nutrition guidance' },
    ],
  });

  console.log('  Created 5 certifications, 6 specializations');

  // =============================================
  // 8. PROFILE COMPLETION
  // =============================================
  console.log('Creating profile completion records...');

  await prisma.profileCompletion.upsert({
    where: { userId: trainer1.id },
    update: {},
    create: { userId: trainer1.id, basicInfo: true, profilePhoto: true, healthInfo: true, goalsSet: true, measurements: true, certifications: true, completionPercentage: 100 },
  });

  await prisma.profileCompletion.upsert({
    where: { userId: trainer2.id },
    update: {},
    create: { userId: trainer2.id, basicInfo: true, profilePhoto: true, healthInfo: true, goalsSet: true, measurements: true, certifications: true, completionPercentage: 100 },
  });

  await prisma.profileCompletion.upsert({
    where: { userId: client1.id },
    update: {},
    create: { userId: client1.id, basicInfo: true, profilePhoto: false, healthInfo: true, goalsSet: true, measurements: true, certifications: false, completionPercentage: 80 },
  });

  await prisma.profileCompletion.upsert({
    where: { userId: client2.id },
    update: {},
    create: { userId: client2.id, basicInfo: true, profilePhoto: false, healthInfo: true, goalsSet: true, measurements: true, certifications: false, completionPercentage: 80 },
  });

  await prisma.profileCompletion.upsert({
    where: { userId: client3.id },
    update: {},
    create: { userId: client3.id, basicInfo: true, profilePhoto: false, healthInfo: true, goalsSet: true, measurements: false, certifications: false, completionPercentage: 60 },
  });

  await prisma.profileCompletion.upsert({
    where: { userId: client4.id },
    update: {},
    create: { userId: client4.id, basicInfo: true, profilePhoto: false, healthInfo: false, goalsSet: true, measurements: false, certifications: false, completionPercentage: 40 },
  });

  console.log('  Created 6 profile completion records');

  // =============================================
  // 9. TRAINER-CLIENT RELATIONSHIPS
  // =============================================
  console.log('Creating trainer-client relationships...');

  // Trainer 1 has 3 clients
  const tc1 = await prisma.trainerClient.create({ data: { trainerId: trainer1.id, clientId: client1.id, status: 'active', connectedAt: daysAgo(60) } });
  const tc2 = await prisma.trainerClient.create({ data: { trainerId: trainer1.id, clientId: client2.id, status: 'active', connectedAt: daysAgo(45) } });
  await prisma.trainerClient.create({ data: { trainerId: trainer1.id, clientId: client4.id, status: 'pending', connectedAt: daysAgo(5) } });

  // Trainer 2 has 2 clients
  const tc3 = await prisma.trainerClient.create({ data: { trainerId: trainer2.id, clientId: client3.id, status: 'active', connectedAt: daysAgo(30) } });
  await prisma.trainerClient.create({ data: { trainerId: trainer2.id, clientId: client1.id, status: 'need_programming' } });

  console.log('  Created 5 trainer-client relationships');

  // =============================================
  // 10. CLIENT PROFILES
  // =============================================
  console.log('Creating client profiles...');

  await prisma.clientProfile.upsert({
    where: { userId: client1.id },
    update: {},
    create: {
      userId: client1.id,
      fitnessLevel: 'intermediate',
      goals: { primary: 'strength', secondary: 'body_recomposition' },
      preferences: { trainingDays: 4, sessionDuration: 75, preferredTime: 'evening' },
    },
  });

  await prisma.clientProfile.upsert({
    where: { userId: client2.id },
    update: {},
    create: {
      userId: client2.id,
      fitnessLevel: 'advanced',
      medicalConditions: ['Mild asthma'],
      goals: { primary: 'endurance', secondary: 'strength' },
      preferences: { trainingDays: 5, sessionDuration: 60, preferredTime: 'morning' },
    },
  });

  await prisma.clientProfile.upsert({
    where: { userId: client3.id },
    update: {},
    create: {
      userId: client3.id,
      fitnessLevel: 'beginner',
      medicalConditions: ['Mild hypertension'],
      medications: ['Lisinopril 10mg'],
      injuries: { current: [{ type: 'Lower back strain', severity: 'mild', since: '2024' }] },
      goals: { primary: 'weight_loss', secondary: 'general_fitness' },
      preferences: { trainingDays: 3, sessionDuration: 45, preferredTime: 'lunch' },
    },
  });

  await prisma.clientProfile.upsert({
    where: { userId: client4.id },
    update: {},
    create: {
      userId: client4.id,
      fitnessLevel: 'beginner',
      goals: { primary: 'general_fitness', secondary: 'weight_loss' },
      preferences: { trainingDays: 3, sessionDuration: 45, preferredTime: 'morning' },
    },
  });

  console.log('  Created 4 client profiles');

  // =============================================
  // 11. CLIENT NOTES & TAGS
  // =============================================
  console.log('Creating client notes and tags...');

  await prisma.clientNote.createMany({
    data: [
      { trainerId: trainer1.id, clientId: client1.id, note: 'Alex is highly motivated and consistent. Ready to start peaking for his first powerlifting meet. Watch his left shoulder on heavy pressing movements.' },
      { trainerId: trainer1.id, clientId: client1.id, note: 'Session went great today. Hit a PR on bench - 90kg x 1. Technique is improving. Next session: focus on deadlift positioning.' },
      { trainerId: trainer1.id, clientId: client2.id, note: 'Emma has good running endurance but limited upper body strength. Start with foundational compound movements at low intensity.' },
      { trainerId: trainer2.id, clientId: client3.id, note: 'James needs to build a solid foundation. Start with mobility work and light compound movements. Monitor blood pressure before heavy sets.' },
    ],
  });

  const tag1 = await prisma.clientTag.create({ data: { name: 'VIP', color: '#FFD700', trainerId: trainer1.id } });
  const tag2 = await prisma.clientTag.create({ data: { name: 'Competition', color: '#FF4444', trainerId: trainer1.id } });
  const tag3 = await prisma.clientTag.create({ data: { name: 'Injury Risk', color: '#FF8800', trainerId: trainer2.id } });
  const tag4 = await prisma.clientTag.create({ data: { name: 'New Client', color: '#44AAFF', trainerId: trainer1.id } });

  await prisma.clientTagAssignment.createMany({
    data: [
      { clientId: client1.id, tagId: tag1.id },
      { clientId: client1.id, tagId: tag2.id },
      { clientId: client3.id, tagId: tag3.id },
      { clientId: client4.id, tagId: tag4.id },
    ],
  });

  console.log('  Created 4 notes, 4 tags, 4 tag assignments');

  // =============================================
  // 12. EXERCISES
  // =============================================
  console.log('Creating exercises...');

  const exercises = await Promise.all([
    prisma.exercise.create({ data: { exerciseId: 'ex-bench-press', name: 'Barbell Bench Press', gifUrl: '/exercises/bench-press.gif', bodyPart: 'chest', equipment: 'barbell', targetMuscle: 'pectorals', secondaryMuscles: ['anterior deltoids', 'triceps'], instructions: ['Lie on bench with feet flat on floor', 'Grip bar slightly wider than shoulder width', 'Lower bar to mid-chest', 'Press bar back up to starting position'], difficulty: 'intermediate' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-squat', name: 'Barbell Back Squat', gifUrl: '/exercises/squat.gif', bodyPart: 'upper legs', equipment: 'barbell', targetMuscle: 'quadriceps', secondaryMuscles: ['glutes', 'hamstrings', 'core'], instructions: ['Place bar on upper back', 'Feet shoulder-width apart', 'Squat down until thighs parallel', 'Drive through heels to stand'], difficulty: 'intermediate' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-deadlift', name: 'Conventional Deadlift', gifUrl: '/exercises/deadlift.gif', bodyPart: 'back', equipment: 'barbell', targetMuscle: 'erector spinae', secondaryMuscles: ['glutes', 'hamstrings', 'forearms'], instructions: ['Stand with feet hip-width apart', 'Hinge at hips, grip bar outside knees', 'Brace core and lift by extending hips and knees', 'Lock out at top, lower with control'], difficulty: 'advanced' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-ohp', name: 'Overhead Press', gifUrl: '/exercises/ohp.gif', bodyPart: 'shoulders', equipment: 'barbell', targetMuscle: 'anterior deltoids', secondaryMuscles: ['lateral deltoids', 'triceps', 'upper chest'], instructions: ['Stand with bar at collar bone level', 'Press bar overhead', 'Lock out arms at top', 'Lower with control'], difficulty: 'intermediate' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-row', name: 'Barbell Bent-Over Row', gifUrl: '/exercises/row.gif', bodyPart: 'back', equipment: 'barbell', targetMuscle: 'latissimus dorsi', secondaryMuscles: ['rhomboids', 'biceps', 'rear deltoids'], instructions: ['Hinge at hips, back at 45 degrees', 'Pull bar to lower chest', 'Squeeze shoulder blades', 'Lower with control'], difficulty: 'intermediate' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-pullup', name: 'Pull-Up', gifUrl: '/exercises/pullup.gif', bodyPart: 'back', equipment: 'body weight', targetMuscle: 'latissimus dorsi', secondaryMuscles: ['biceps', 'rhomboids'], instructions: ['Hang from bar with overhand grip', 'Pull chin over bar', 'Lower with control'], difficulty: 'intermediate' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-dip', name: 'Parallel Bar Dip', gifUrl: '/exercises/dip.gif', bodyPart: 'chest', equipment: 'body weight', targetMuscle: 'pectorals', secondaryMuscles: ['triceps', 'anterior deltoids'], instructions: ['Support yourself on parallel bars', 'Lower body until upper arms parallel to floor', 'Push back up to start'], difficulty: 'intermediate' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-lunges', name: 'Dumbbell Walking Lunges', gifUrl: '/exercises/lunges.gif', bodyPart: 'upper legs', equipment: 'dumbbell', targetMuscle: 'quadriceps', secondaryMuscles: ['glutes', 'hamstrings'], instructions: ['Hold dumbbells at sides', 'Step forward into lunge', 'Lower back knee toward floor', 'Push off front foot to next step'], difficulty: 'beginner' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-rdl', name: 'Romanian Deadlift', gifUrl: '/exercises/rdl.gif', bodyPart: 'upper legs', equipment: 'barbell', targetMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'erector spinae'], instructions: ['Stand with bar at hip level', 'Push hips back, keep bar close to legs', 'Lower until stretch in hamstrings', 'Drive hips forward to stand'], difficulty: 'intermediate' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-leg-press', name: 'Leg Press', gifUrl: '/exercises/leg-press.gif', bodyPart: 'upper legs', equipment: 'machine', targetMuscle: 'quadriceps', secondaryMuscles: ['glutes', 'hamstrings'], instructions: ['Sit in machine with feet shoulder width on platform', 'Lower platform by bending knees', 'Press back up without locking knees'], difficulty: 'beginner' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-lat-pulldown', name: 'Lat Pulldown', gifUrl: '/exercises/lat-pulldown.gif', bodyPart: 'back', equipment: 'cable', targetMuscle: 'latissimus dorsi', secondaryMuscles: ['biceps', 'rhomboids'], instructions: ['Grip bar wider than shoulder width', 'Pull bar to upper chest', 'Squeeze lats at bottom', 'Return with control'], difficulty: 'beginner' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-incline-bench', name: 'Incline Dumbbell Press', gifUrl: '/exercises/incline-bench.gif', bodyPart: 'chest', equipment: 'dumbbell', targetMuscle: 'upper pectorals', secondaryMuscles: ['anterior deltoids', 'triceps'], instructions: ['Set bench to 30-45 degrees', 'Press dumbbells up from chest level', 'Lower with control to chest'], difficulty: 'intermediate' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-lateral-raise', name: 'Dumbbell Lateral Raise', gifUrl: '/exercises/lateral-raise.gif', bodyPart: 'shoulders', equipment: 'dumbbell', targetMuscle: 'lateral deltoids', secondaryMuscles: ['traps'], instructions: ['Stand with dumbbells at sides', 'Raise arms to shoulder height', 'Slight bend in elbows', 'Lower with control'], difficulty: 'beginner' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-bicep-curl', name: 'Barbell Bicep Curl', gifUrl: '/exercises/bicep-curl.gif', bodyPart: 'upper arms', equipment: 'barbell', targetMuscle: 'biceps', secondaryMuscles: ['forearms'], instructions: ['Stand with bar at arm\'s length', 'Curl bar up to shoulders', 'Keep elbows at sides', 'Lower with control'], difficulty: 'beginner' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-tricep-pushdown', name: 'Tricep Rope Pushdown', gifUrl: '/exercises/tricep-pushdown.gif', bodyPart: 'upper arms', equipment: 'cable', targetMuscle: 'triceps', secondaryMuscles: [], instructions: ['Stand at cable machine with rope attachment', 'Push rope down by extending elbows', 'Spread rope at bottom', 'Return with control'], difficulty: 'beginner' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-face-pull', name: 'Cable Face Pull', gifUrl: '/exercises/face-pull.gif', bodyPart: 'shoulders', equipment: 'cable', targetMuscle: 'rear deltoids', secondaryMuscles: ['rhomboids', 'external rotators'], instructions: ['Set cable at head height with rope', 'Pull rope toward face', 'Separate hands at end position', 'Squeeze rear delts'], difficulty: 'beginner' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-plank', name: 'Plank', gifUrl: '/exercises/plank.gif', bodyPart: 'waist', equipment: 'body weight', targetMuscle: 'abs', secondaryMuscles: ['obliques', 'transverse abdominis'], instructions: ['Support body on forearms and toes', 'Keep body in straight line', 'Brace core', 'Hold for prescribed time'], difficulty: 'beginner' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-hip-thrust', name: 'Barbell Hip Thrust', gifUrl: '/exercises/hip-thrust.gif', bodyPart: 'upper legs', equipment: 'barbell', targetMuscle: 'glutes', secondaryMuscles: ['hamstrings'], instructions: ['Sit with upper back against bench', 'Roll bar over hips', 'Drive hips up to full extension', 'Squeeze glutes at top', 'Lower with control'], difficulty: 'intermediate' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-cable-fly', name: 'Cable Chest Fly', gifUrl: '/exercises/cable-fly.gif', bodyPart: 'chest', equipment: 'cable', targetMuscle: 'pectorals', secondaryMuscles: ['anterior deltoids'], instructions: ['Stand between cable stations', 'With slight elbow bend, bring handles together', 'Squeeze chest at center', 'Return with control'], difficulty: 'beginner' } }),
    prisma.exercise.create({ data: { exerciseId: 'ex-leg-curl', name: 'Lying Leg Curl', gifUrl: '/exercises/leg-curl.gif', bodyPart: 'upper legs', equipment: 'machine', targetMuscle: 'hamstrings', secondaryMuscles: ['calves'], instructions: ['Lie face down on machine', 'Curl weight up by bending knees', 'Squeeze hamstrings at top', 'Lower with control'], difficulty: 'beginner' } }),
  ]);

  const exerciseMap: Record<string, string> = {};
  for (const e of exercises) {
    exerciseMap[e.exerciseId] = e.id;
  }

  console.log(`  Created ${exercises.length} exercises`);

  // =============================================
  // 13. EXERCISE COLLECTIONS & FAVORITES
  // =============================================
  console.log('Creating exercise collections and favorites...');

  const collection1 = await prisma.exerciseCollection.create({
    data: {
      userId: trainer1.id,
      name: 'Upper Body Essentials',
      description: 'Core upper body movements for any program',
      isPublic: true,
    },
  });

  await prisma.collectionExercise.createMany({
    data: [
      { collectionId: collection1.id, exerciseId: exerciseMap['ex-bench-press'], position: 1 },
      { collectionId: collection1.id, exerciseId: exerciseMap['ex-ohp'], position: 2 },
      { collectionId: collection1.id, exerciseId: exerciseMap['ex-row'], position: 3 },
      { collectionId: collection1.id, exerciseId: exerciseMap['ex-pullup'], position: 4 },
      { collectionId: collection1.id, exerciseId: exerciseMap['ex-dip'], position: 5 },
    ],
  });

  const collection2 = await prisma.exerciseCollection.create({
    data: {
      userId: trainer1.id,
      name: 'Leg Day Staples',
      description: 'Essential lower body exercises',
      isPublic: true,
    },
  });

  await prisma.collectionExercise.createMany({
    data: [
      { collectionId: collection2.id, exerciseId: exerciseMap['ex-squat'], position: 1 },
      { collectionId: collection2.id, exerciseId: exerciseMap['ex-rdl'], position: 2 },
      { collectionId: collection2.id, exerciseId: exerciseMap['ex-leg-press'], position: 3 },
      { collectionId: collection2.id, exerciseId: exerciseMap['ex-hip-thrust'], position: 4 },
      { collectionId: collection2.id, exerciseId: exerciseMap['ex-leg-curl'], position: 5 },
    ],
  });

  // Client favorites
  await prisma.exerciseFavorite.createMany({
    data: [
      { userId: client1.id, exerciseId: exerciseMap['ex-bench-press'] },
      { userId: client1.id, exerciseId: exerciseMap['ex-squat'] },
      { userId: client1.id, exerciseId: exerciseMap['ex-deadlift'] },
      { userId: client2.id, exerciseId: exerciseMap['ex-hip-thrust'] },
      { userId: client2.id, exerciseId: exerciseMap['ex-lunges'] },
    ],
  });

  console.log('  Created 2 collections (10 exercises), 5 favorites');

  // =============================================
  // 14. PROGRAMS
  // =============================================
  console.log('Creating training programs...');

  // Program 1: Strength (Trainer 1 for Client 1)
  const program1 = await prisma.program.create({
    data: {
      trainerId: trainer1.id,
      name: 'Powerlifting Foundations - 8 Week',
      description: 'An 8-week progressive strength program focused on the big 3 lifts. Suitable for intermediate lifters preparing for their first meet.',
      programType: 'powerlifting',
      difficultyLevel: 'intermediate',
      durationWeeks: 8,
      goals: ['Increase 1RM on bench, squat, deadlift', 'Build competition readiness', 'Improve lifting technique'],
      equipmentNeeded: ['barbell', 'power rack', 'bench', 'plates', 'dumbbells'],
      isTemplate: false,
      isPublic: false,
    },
  });

  // Program 1, Week 1
  const p1w1 = await prisma.programWeek.create({
    data: { programId: program1.id, weekNumber: 1, name: 'Foundation Week', description: 'Establish working weights and technique baseline' },
  });

  // Program 1, Week 1, Day 1 (Upper)
  const p1w1d1 = await prisma.programWorkout.create({
    data: { programWeekId: p1w1.id, dayNumber: 1, name: 'Upper Body - Heavy Bench', workoutType: 'strength', estimatedDuration: 75 },
  });

  const we_bench = await prisma.workoutExercise.create({
    data: { workoutId: p1w1d1.id, exerciseId: exerciseMap['ex-bench-press'], orderIndex: 1, setsConfig: { sets: 5, reps: '5', type: 'working' } },
  });
  const we_ohp = await prisma.workoutExercise.create({
    data: { workoutId: p1w1d1.id, exerciseId: exerciseMap['ex-ohp'], orderIndex: 2, setsConfig: { sets: 3, reps: '8', type: 'working' } },
  });
  const we_row = await prisma.workoutExercise.create({
    data: { workoutId: p1w1d1.id, exerciseId: exerciseMap['ex-row'], orderIndex: 3, setsConfig: { sets: 4, reps: '8', type: 'working' } },
  });
  const we_dip = await prisma.workoutExercise.create({
    data: { workoutId: p1w1d1.id, exerciseId: exerciseMap['ex-dip'], orderIndex: 4, setsConfig: { sets: 3, reps: '10-12', type: 'working' } },
  });
  const we_facepull = await prisma.workoutExercise.create({
    data: { workoutId: p1w1d1.id, exerciseId: exerciseMap['ex-face-pull'], orderIndex: 5, setsConfig: { sets: 3, reps: '15', type: 'working' } },
  });

  // Exercise configurations for bench
  await prisma.exerciseConfiguration.createMany({
    data: [
      { workoutExerciseId: we_bench.id, setNumber: 1, setType: 'warmup', reps: '10', weightGuidance: '40% 1RM', restSeconds: 60 },
      { workoutExerciseId: we_bench.id, setNumber: 2, setType: 'warmup', reps: '5', weightGuidance: '60% 1RM', restSeconds: 90 },
      { workoutExerciseId: we_bench.id, setNumber: 3, setType: 'working', reps: '5', weightGuidance: '75% 1RM', restSeconds: 180, rpe: 7 },
      { workoutExerciseId: we_bench.id, setNumber: 4, setType: 'working', reps: '5', weightGuidance: '77.5% 1RM', restSeconds: 180, rpe: 8 },
      { workoutExerciseId: we_bench.id, setNumber: 5, setType: 'working', reps: '5', weightGuidance: '80% 1RM', restSeconds: 180, rpe: 8 },
    ],
  });

  // Program 1, Week 1, Day 2 (Lower)
  const p1w1d2 = await prisma.programWorkout.create({
    data: { programWeekId: p1w1.id, dayNumber: 2, name: 'Lower Body - Heavy Squat', workoutType: 'strength', estimatedDuration: 80 },
  });

  const we_squat = await prisma.workoutExercise.create({
    data: { workoutId: p1w1d2.id, exerciseId: exerciseMap['ex-squat'], orderIndex: 1, setsConfig: { sets: 5, reps: '5', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d2.id, exerciseId: exerciseMap['ex-rdl'], orderIndex: 2, setsConfig: { sets: 3, reps: '8', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d2.id, exerciseId: exerciseMap['ex-leg-press'], orderIndex: 3, setsConfig: { sets: 3, reps: '10', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d2.id, exerciseId: exerciseMap['ex-leg-curl'], orderIndex: 4, setsConfig: { sets: 3, reps: '12', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d2.id, exerciseId: exerciseMap['ex-plank'], orderIndex: 5, setsConfig: { sets: 3, reps: '60s', type: 'working' } },
  });

  // Day 3 rest
  await prisma.programWorkout.create({
    data: { programWeekId: p1w1.id, dayNumber: 3, name: 'Rest Day', isRestDay: true },
  });

  // Day 4 (Upper volume)
  const p1w1d4 = await prisma.programWorkout.create({
    data: { programWeekId: p1w1.id, dayNumber: 4, name: 'Upper Body - Volume', workoutType: 'strength', estimatedDuration: 70 },
  });

  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d4.id, exerciseId: exerciseMap['ex-incline-bench'], orderIndex: 1, setsConfig: { sets: 4, reps: '8-10', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d4.id, exerciseId: exerciseMap['ex-lat-pulldown'], orderIndex: 2, setsConfig: { sets: 4, reps: '10', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d4.id, exerciseId: exerciseMap['ex-lateral-raise'], orderIndex: 3, setsConfig: { sets: 3, reps: '12-15', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d4.id, exerciseId: exerciseMap['ex-bicep-curl'], orderIndex: 4, supersetGroup: 'A', setsConfig: { sets: 3, reps: '10-12', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d4.id, exerciseId: exerciseMap['ex-tricep-pushdown'], orderIndex: 5, supersetGroup: 'A', setsConfig: { sets: 3, reps: '10-12', type: 'working' } },
  });

  // Day 5 (Lower volume)
  const p1w1d5 = await prisma.programWorkout.create({
    data: { programWeekId: p1w1.id, dayNumber: 5, name: 'Lower Body - Deadlift Focus', workoutType: 'strength', estimatedDuration: 75 },
  });

  const we_dl = await prisma.workoutExercise.create({
    data: { workoutId: p1w1d5.id, exerciseId: exerciseMap['ex-deadlift'], orderIndex: 1, setsConfig: { sets: 5, reps: '3', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d5.id, exerciseId: exerciseMap['ex-hip-thrust'], orderIndex: 2, setsConfig: { sets: 4, reps: '8', type: 'working' } },
  });
  await prisma.workoutExercise.create({
    data: { workoutId: p1w1d5.id, exerciseId: exerciseMap['ex-lunges'], orderIndex: 3, setsConfig: { sets: 3, reps: '10 each', type: 'working' } },
  });

  // Week 2
  const p1w2 = await prisma.programWeek.create({
    data: { programId: program1.id, weekNumber: 2, name: 'Progressive Overload', description: 'Increase weights by 2.5% from Week 1' },
  });

  await prisma.programWorkout.create({ data: { programWeekId: p1w2.id, dayNumber: 1, name: 'Upper Body - Heavy Bench', workoutType: 'strength', estimatedDuration: 75 } });
  await prisma.programWorkout.create({ data: { programWeekId: p1w2.id, dayNumber: 2, name: 'Lower Body - Heavy Squat', workoutType: 'strength', estimatedDuration: 80 } });
  await prisma.programWorkout.create({ data: { programWeekId: p1w2.id, dayNumber: 3, name: 'Rest Day', isRestDay: true } });
  await prisma.programWorkout.create({ data: { programWeekId: p1w2.id, dayNumber: 4, name: 'Upper Body - Volume', workoutType: 'strength', estimatedDuration: 70 } });
  await prisma.programWorkout.create({ data: { programWeekId: p1w2.id, dayNumber: 5, name: 'Lower Body - Deadlift Focus', workoutType: 'strength', estimatedDuration: 75 } });

  // Program 2: General Fitness (Trainer 2 for Client 3)
  const program2 = await prisma.program.create({
    data: {
      trainerId: trainer2.id,
      name: 'Fit Foundations - 6 Week',
      description: 'A 6-week beginner-friendly full-body program designed for general fitness and weight management. Focus on movement quality and building training habits.',
      programType: 'general_fitness',
      difficultyLevel: 'beginner',
      durationWeeks: 6,
      goals: ['Build training consistency', 'Learn proper form', 'Improve cardiovascular health', 'Lose body fat'],
      equipmentNeeded: ['dumbbells', 'cable machine', 'bench', 'resistance bands'],
      isTemplate: false,
      isPublic: false,
    },
  });

  const p2w1 = await prisma.programWeek.create({
    data: { programId: program2.id, weekNumber: 1, name: 'Getting Started', description: 'Focus on form and building habits' },
  });

  const p2w1d1 = await prisma.programWorkout.create({
    data: { programWeekId: p2w1.id, dayNumber: 1, name: 'Full Body A', workoutType: 'mixed', estimatedDuration: 45 },
  });
  await prisma.workoutExercise.create({ data: { workoutId: p2w1d1.id, exerciseId: exerciseMap['ex-leg-press'], orderIndex: 1, setsConfig: { sets: 3, reps: '12', type: 'working' } } });
  await prisma.workoutExercise.create({ data: { workoutId: p2w1d1.id, exerciseId: exerciseMap['ex-lat-pulldown'], orderIndex: 2, setsConfig: { sets: 3, reps: '12', type: 'working' } } });
  await prisma.workoutExercise.create({ data: { workoutId: p2w1d1.id, exerciseId: exerciseMap['ex-incline-bench'], orderIndex: 3, setsConfig: { sets: 3, reps: '12', type: 'working' } } });
  await prisma.workoutExercise.create({ data: { workoutId: p2w1d1.id, exerciseId: exerciseMap['ex-leg-curl'], orderIndex: 4, setsConfig: { sets: 3, reps: '12', type: 'working' } } });
  await prisma.workoutExercise.create({ data: { workoutId: p2w1d1.id, exerciseId: exerciseMap['ex-plank'], orderIndex: 5, setsConfig: { sets: 3, reps: '30s', type: 'working' } } });

  console.log('  Created 2 programs, 3 weeks, 12 workouts, 20+ workout exercises, exercise configurations');

  // =============================================
  // 15. PROGRAM ASSIGNMENTS
  // =============================================
  console.log('Creating program assignments...');

  const assignment1 = await prisma.programAssignment.create({
    data: {
      programId: program1.id,
      clientId: client1.id,
      trainerId: trainer1.id,
      startDate: daysAgo(28),
      isActive: true,
      customNotes: 'Focus on bench technique - slight arch, leg drive. Conservative weights first 2 weeks.',
      progressData: { weeksCompleted: 3, adherenceRate: 92 },
    },
  });

  const assignment2 = await prisma.programAssignment.create({
    data: {
      programId: program2.id,
      clientId: client3.id,
      trainerId: trainer2.id,
      startDate: daysAgo(14),
      isActive: true,
      customNotes: 'Monitor blood pressure. Lower back caution - avoid heavy loading on spinal exercises.',
      progressData: { weeksCompleted: 1, adherenceRate: 85 },
    },
  });

  console.log('  Created 2 program assignments');

  // =============================================
  // 16. WORKOUT SESSIONS & LOGS
  // =============================================
  console.log('Creating workout sessions and logs...');

  // Session 1: Client 1 completed upper body workout 2 weeks ago
  const session1 = await prisma.workoutSession.create({
    data: {
      programAssignmentId: assignment1.id,
      workoutId: p1w1d1.id,
      clientId: client1.id,
      trainerId: trainer1.id,
      scheduledDate: daysAgo(14),
      actualStartTime: new Date(daysAgo(14).getTime() + 17 * 3600000), // 5pm
      actualEndTime: new Date(daysAgo(14).getTime() + 18.25 * 3600000), // 6:15pm
      totalDuration: 75,
      status: 'completed',
      totalVolume: 8750,
      totalSets: 18,
      completedSets: 18,
      averageRpe: 7.5,
      adherenceScore: 100,
      effortRating: 8,
      enjoymentRating: 9,
      energyBefore: 7,
      energyAfter: 6,
      clientNotes: 'Felt strong today. Bench felt smooth.',
      trainerFeedback: 'Great session! Bench technique is improving. Keep the elbow tuck on the descent.',
    },
  });

  // Exercise log for bench in session 1
  const exLog1 = await prisma.workoutExerciseLog.create({
    data: {
      workoutSessionId: session1.id,
      workoutExerciseId: we_bench.id,
      exerciseId: exerciseMap['ex-bench-press'],
      orderIndex: 1,
      totalVolume: 3375,
      personalBest: false,
      startTime: new Date(daysAgo(14).getTime() + 17 * 3600000),
      endTime: new Date(daysAgo(14).getTime() + 17.33 * 3600000),
    },
  });

  await prisma.workoutSetLog.createMany({
    data: [
      { exerciseLogId: exLog1.id, setNumber: 1, plannedReps: '10', actualReps: 10, weight: 40, rpe: 3, completed: true, timestamp: new Date(daysAgo(14).getTime() + 17.03 * 3600000) },
      { exerciseLogId: exLog1.id, setNumber: 2, plannedReps: '5', actualReps: 5, weight: 55, rpe: 5, completed: true, timestamp: new Date(daysAgo(14).getTime() + 17.07 * 3600000) },
      { exerciseLogId: exLog1.id, setNumber: 3, plannedReps: '5', actualReps: 5, weight: 67.5, rpe: 7, completed: true, timestamp: new Date(daysAgo(14).getTime() + 17.13 * 3600000) },
      { exerciseLogId: exLog1.id, setNumber: 4, plannedReps: '5', actualReps: 5, weight: 70, rpe: 8, completed: true, timestamp: new Date(daysAgo(14).getTime() + 17.2 * 3600000) },
      { exerciseLogId: exLog1.id, setNumber: 5, plannedReps: '5', actualReps: 5, weight: 72.5, rpe: 8.5, completed: true, timestamp: new Date(daysAgo(14).getTime() + 17.27 * 3600000) },
    ],
  });

  // Exercise log for OHP
  const exLog2 = await prisma.workoutExerciseLog.create({
    data: {
      workoutSessionId: session1.id,
      workoutExerciseId: we_ohp.id,
      exerciseId: exerciseMap['ex-ohp'],
      orderIndex: 2,
      totalVolume: 1080,
      personalBest: false,
    },
  });

  await prisma.workoutSetLog.createMany({
    data: [
      { exerciseLogId: exLog2.id, setNumber: 1, plannedReps: '8', actualReps: 8, weight: 45, rpe: 7, completed: true },
      { exerciseLogId: exLog2.id, setNumber: 2, plannedReps: '8', actualReps: 8, weight: 45, rpe: 7.5, completed: true },
      { exerciseLogId: exLog2.id, setNumber: 3, plannedReps: '8', actualReps: 6, weight: 45, rpe: 9, completed: true, notes: 'Failed rep 7, stopped at 6' },
    ],
  });

  // Session 2: Client 1 lower body workout 2 weeks ago
  const session2 = await prisma.workoutSession.create({
    data: {
      programAssignmentId: assignment1.id,
      workoutId: p1w1d2.id,
      clientId: client1.id,
      trainerId: trainer1.id,
      scheduledDate: daysAgo(13),
      actualStartTime: new Date(daysAgo(13).getTime() + 17 * 3600000),
      actualEndTime: new Date(daysAgo(13).getTime() + 18.33 * 3600000),
      totalDuration: 80,
      status: 'completed',
      totalVolume: 12500,
      totalSets: 17,
      completedSets: 17,
      averageRpe: 7.8,
      adherenceScore: 100,
      effortRating: 9,
      enjoymentRating: 7,
      energyBefore: 6,
      energyAfter: 4,
      clientNotes: 'Squats were tough today. Legs were heavy from yesterday.',
    },
  });

  const exLog3 = await prisma.workoutExerciseLog.create({
    data: {
      workoutSessionId: session2.id,
      workoutExerciseId: we_squat.id,
      exerciseId: exerciseMap['ex-squat'],
      orderIndex: 1,
      totalVolume: 4250,
      personalBest: true,
      notes: 'New 5RM PR at 85kg!',
    },
  });

  await prisma.workoutSetLog.createMany({
    data: [
      { exerciseLogId: exLog3.id, setNumber: 1, plannedReps: '5', actualReps: 5, weight: 60, rpe: 4, completed: true },
      { exerciseLogId: exLog3.id, setNumber: 2, plannedReps: '5', actualReps: 5, weight: 70, rpe: 6, completed: true },
      { exerciseLogId: exLog3.id, setNumber: 3, plannedReps: '5', actualReps: 5, weight: 80, rpe: 7.5, completed: true },
      { exerciseLogId: exLog3.id, setNumber: 4, plannedReps: '5', actualReps: 5, weight: 82.5, rpe: 8, completed: true },
      { exerciseLogId: exLog3.id, setNumber: 5, plannedReps: '5', actualReps: 5, weight: 85, rpe: 9, completed: true, notes: 'PR! Grinding on last rep' },
    ],
  });

  // Session 3: Recent session (3 days ago)
  const session3 = await prisma.workoutSession.create({
    data: {
      programAssignmentId: assignment1.id,
      workoutId: p1w1d5.id,
      clientId: client1.id,
      trainerId: trainer1.id,
      scheduledDate: daysAgo(3),
      actualStartTime: new Date(daysAgo(3).getTime() + 17 * 3600000),
      actualEndTime: new Date(daysAgo(3).getTime() + 18.25 * 3600000),
      totalDuration: 75,
      status: 'completed',
      totalVolume: 6800,
      totalSets: 12,
      completedSets: 12,
      averageRpe: 8.0,
      adherenceScore: 100,
      effortRating: 8,
      enjoymentRating: 8,
      energyBefore: 8,
      energyAfter: 5,
      clientNotes: 'Deadlift felt great. Really dialing in the hip hinge.',
    },
  });

  const exLog4 = await prisma.workoutExerciseLog.create({
    data: {
      workoutSessionId: session3.id,
      workoutExerciseId: we_dl.id,
      exerciseId: exerciseMap['ex-deadlift'],
      orderIndex: 1,
      totalVolume: 3500,
      personalBest: true,
      notes: 'New 3RM PR at 140kg!',
    },
  });

  await prisma.workoutSetLog.createMany({
    data: [
      { exerciseLogId: exLog4.id, setNumber: 1, plannedReps: '3', actualReps: 3, weight: 100, rpe: 5, completed: true },
      { exerciseLogId: exLog4.id, setNumber: 2, plannedReps: '3', actualReps: 3, weight: 120, rpe: 7, completed: true },
      { exerciseLogId: exLog4.id, setNumber: 3, plannedReps: '3', actualReps: 3, weight: 130, rpe: 8, completed: true },
      { exerciseLogId: exLog4.id, setNumber: 4, plannedReps: '3', actualReps: 3, weight: 135, rpe: 8.5, completed: true },
      { exerciseLogId: exLog4.id, setNumber: 5, plannedReps: '3', actualReps: 3, weight: 140, rpe: 9.5, completed: true, notes: 'PR! Clean reps.' },
    ],
  });

  // Scheduled session (upcoming)
  await prisma.workoutSession.create({
    data: {
      programAssignmentId: assignment1.id,
      workoutId: p1w1d1.id,
      clientId: client1.id,
      trainerId: trainer1.id,
      scheduledDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      status: 'scheduled',
    },
  });

  // Client 3 session
  const session4 = await prisma.workoutSession.create({
    data: {
      programAssignmentId: assignment2.id,
      workoutId: p2w1d1.id,
      clientId: client3.id,
      trainerId: trainer2.id,
      scheduledDate: daysAgo(7),
      actualStartTime: new Date(daysAgo(7).getTime() + 12 * 3600000),
      actualEndTime: new Date(daysAgo(7).getTime() + 12.75 * 3600000),
      totalDuration: 45,
      status: 'completed',
      totalVolume: 4200,
      totalSets: 15,
      completedSets: 14,
      averageRpe: 6.5,
      adherenceScore: 93,
      effortRating: 7,
      enjoymentRating: 8,
      energyBefore: 5,
      energyAfter: 7,
      clientNotes: 'First session in a while - felt good to move!',
      trainerFeedback: 'Great first session. Form looked solid on all movements. Keep core braced on leg press.',
    },
  });

  console.log('  Created 5 workout sessions, 4 exercise logs, 18 set logs');

  // =============================================
  // 17. PERFORMANCE METRICS
  // =============================================
  console.log('Creating performance metrics...');

  const benchMetrics = [
    { date: daysAgo(56), value: 80, note: 'Starting 1RM test' },
    { date: daysAgo(42), value: 82.5, note: 'Progressing well' },
    { date: daysAgo(28), value: 85, note: 'Technique improving' },
    { date: daysAgo(14), value: 87.5, note: 'Consistent progress' },
    { date: daysAgo(3), value: 90, note: 'New PR approaching' },
  ];

  for (const m of benchMetrics) {
    await prisma.performanceMetric.create({
      data: {
        userId: client1.id,
        exerciseId: exerciseMap['ex-bench-press'],
        metricType: 'one_rm',
        value: m.value,
        unit: 'kg',
        recordedAt: m.date,
        notes: m.note,
      },
    });
  }

  const squatMetrics = [
    { date: daysAgo(56), value: 100 },
    { date: daysAgo(42), value: 105 },
    { date: daysAgo(28), value: 107.5 },
    { date: daysAgo(14), value: 110 },
    { date: daysAgo(3), value: 115 },
  ];

  for (const m of squatMetrics) {
    await prisma.performanceMetric.create({
      data: {
        userId: client1.id,
        exerciseId: exerciseMap['ex-squat'],
        metricType: 'one_rm',
        value: m.value,
        unit: 'kg',
        recordedAt: m.date,
      },
    });
  }

  const dlMetrics = [
    { date: daysAgo(56), value: 130 },
    { date: daysAgo(42), value: 135 },
    { date: daysAgo(28), value: 140 },
    { date: daysAgo(14), value: 145 },
    { date: daysAgo(3), value: 150 },
  ];

  for (const m of dlMetrics) {
    await prisma.performanceMetric.create({
      data: {
        userId: client1.id,
        exerciseId: exerciseMap['ex-deadlift'],
        metricType: 'one_rm',
        value: m.value,
        unit: 'kg',
        recordedAt: m.date,
      },
    });
  }

  // Body weight metrics for client 1
  for (let i = 0; i < 8; i++) {
    await prisma.performanceMetric.create({
      data: {
        userId: client1.id,
        metricType: 'body_weight',
        value: 88.5 - i * 0.4,
        unit: 'kg',
        recordedAt: daysAgo(56 - i * 7),
      },
    });
  }

  console.log('  Created 23 performance metrics');

  // =============================================
  // 18. TRAINING LOAD
  // =============================================
  console.log('Creating training load data...');

  for (let week = 0; week < 6; week++) {
    const weekStart = daysAgo((5 - week) * 7);
    weekStart.setHours(0, 0, 0, 0);
    // Adjust to Monday
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));

    await prisma.trainingLoad.create({
      data: {
        userId: client1.id,
        weekStartDate: weekStart,
        totalVolume: 15000 + week * 1500 + Math.random() * 2000,
        totalSets: 50 + week * 3,
        totalReps: 350 + week * 20,
        trainingDays: 4,
        averageIntensity: 72 + week * 1.5,
        bodyPartDistribution: { chest: 25, back: 25, legs: 30, shoulders: 10, arms: 10 },
        acuteLoad: 14000 + week * 1200,
        chronicLoad: 12000 + week * 800,
        loadRatio: 1.0 + week * 0.05,
      },
    });
  }

  console.log('  Created 6 training load records');

  // =============================================
  // 19. MILESTONES
  // =============================================
  console.log('Creating milestone achievements...');

  await prisma.milestoneAchievement.createMany({
    data: [
      { userId: client1.id, milestoneType: 'personal_best', title: 'New Squat PR!', description: 'Hit a 5RM of 85kg on back squat - a 5kg improvement from last month!', achievedValue: 85, achievedAt: daysAgo(13) },
      { userId: client1.id, milestoneType: 'personal_best', title: 'Deadlift 140kg x 3!', description: 'New 3RM personal record on conventional deadlift.', achievedValue: 140, achievedAt: daysAgo(3) },
      { userId: client1.id, milestoneType: 'consistency', title: '4 Weeks Streak', description: 'Completed all scheduled workouts for 4 consecutive weeks. Outstanding dedication!', achievedAt: daysAgo(7) },
      { userId: client1.id, milestoneType: 'body_composition', title: 'Under 86kg!', description: 'Reached 85.5kg bodyweight, getting closer to the 82kg goal.', achievedValue: 85.5, achievedAt: daysAgo(7) },
      { userId: client3.id, milestoneType: 'first_workout', title: 'First Workout Complete!', description: 'Completed the first full workout session. Welcome to the journey!', achievedAt: daysAgo(7) },
    ],
  });

  console.log('  Created 5 milestones');

  // =============================================
  // 20. INSIGHTS
  // =============================================
  console.log('Creating user insights...');

  await prisma.userInsight.createMany({
    data: [
      { userId: client1.id, insightType: 'strength_trend', title: 'Bench Press Trending Up', description: 'Your bench press 1RM estimate has increased by 12.5% over the last 8 weeks. At this rate, you\'ll hit your 100kg goal by April.', data: { trend: 'up', rate: 12.5, projection: '2026-04-15' }, priority: 'high', isRead: false },
      { userId: client1.id, insightType: 'recovery', title: 'Consider a Deload Week', description: 'Your training load ratio (acute:chronic) is approaching 1.3. Consider reducing volume by 40% next week to optimize recovery.', data: { loadRatio: 1.28, recommendation: 'deload' }, priority: 'medium', isRead: true, actionTaken: false },
      { userId: client1.id, insightType: 'consistency', title: 'Perfect Adherence!', description: 'You\'ve completed 100% of scheduled sessions this month. Your consistency is your biggest strength.', data: { adherenceRate: 100, streak: 4 }, priority: 'low', isRead: true },
      { userId: client3.id, insightType: 'onboarding', title: 'Welcome to EvoFit!', description: 'Great job completing your first week! Focus on consistency over intensity for the first month.', data: { sessionsCompleted: 1, weekNumber: 1 }, priority: 'medium', isRead: false },
    ],
  });

  console.log('  Created 4 insights');

  // =============================================
  // 21. ANALYTICS REPORTS
  // =============================================
  console.log('Creating analytics reports...');

  await prisma.analyticsReport.create({
    data: {
      userId: client1.id,
      trainerId: trainer1.id,
      reportType: 'monthly_progress',
      periodStart: daysAgo(30),
      periodEnd: daysAgo(0),
      reportData: {
        summary: 'Strong month of training with consistent progression across all lifts.',
        benchProgress: { start: 80, end: 90, change: '+12.5%' },
        squatProgress: { start: 100, end: 115, change: '+15%' },
        deadliftProgress: { start: 130, end: 150, change: '+15.4%' },
        bodyWeight: { start: 87, end: 85.5, change: '-1.5kg' },
        adherence: '100%',
        totalSessions: 16,
        totalVolume: 95000,
        personalBests: 3,
      },
    },
  });

  console.log('  Created 1 analytics report');

  // =============================================
  // 22. COMPARISON BASELINES
  // =============================================
  console.log('Creating comparison baselines...');

  await prisma.comparisonBaseline.create({
    data: {
      userId: client1.id,
      baselineName: 'Program Start - Jan 2026',
      baselineDate: daysAgo(56),
      measurements: { weight: 88.5, bodyFat: 22, chest: 98, waist: 84, hips: 100 },
      performanceData: { bench1RM: 80, squat1RM: 100, deadlift1RM: 130 },
      isActive: true,
    },
  });

  console.log('  Created 1 comparison baseline');

  // =============================================
  // 23. CHART PREFERENCES
  // =============================================
  console.log('Creating chart preferences...');

  await prisma.chartPreference.createMany({
    data: [
      { userId: client1.id, chartType: 'strength_progress', preferences: { colors: ['#2563eb', '#dc2626', '#16a34a'], timeRange: '3m', showTrendline: true }, isDefault: true },
      { userId: client1.id, chartType: 'body_composition', preferences: { colors: ['#6366f1', '#f59e0b'], timeRange: '3m', showGoalLine: true }, isDefault: false },
    ],
  });

  console.log('  Created 2 chart preferences');

  // =============================================
  // 24. SCHEDULING
  // =============================================
  console.log('Creating scheduling data...');

  // Trainer 1 availability (Mon-Fri, 6am-8pm)
  for (let day = 1; day <= 5; day++) {
    await prisma.trainerAvailability.create({
      data: { trainerId: trainer1.id, dayOfWeek: day, startTime: '06:00', endTime: '12:00', isAvailable: true, location: 'FitZone Gym - Main Floor' },
    });
    await prisma.trainerAvailability.create({
      data: { trainerId: trainer1.id, dayOfWeek: day, startTime: '14:00', endTime: '20:00', isAvailable: true, location: 'FitZone Gym - Main Floor' },
    });
  }

  // Trainer 2 availability (Mon-Sat, 8am-4pm)
  for (let day = 1; day <= 6; day++) {
    await prisma.trainerAvailability.create({
      data: { trainerId: trainer2.id, dayOfWeek: day, startTime: '08:00', endTime: '16:00', isAvailable: true, location: 'Peak Performance Center' },
    });
  }

  // Appointments
  await prisma.appointment.createMany({
    data: [
      {
        trainerId: trainer1.id, clientId: client1.id,
        title: 'Upper Body - Heavy Bench',
        appointmentType: 'one_on_one',
        startDatetime: new Date(new Date().setDate(new Date().getDate() + 1)),
        endDatetime: new Date(new Date().setDate(new Date().getDate() + 1)),
        durationMinutes: 75,
        location: 'FitZone Gym - Main Floor',
        status: 'confirmed',
        notes: 'Week 4, Day 1. Focus on bench progression.',
      },
      {
        trainerId: trainer1.id, clientId: client2.id,
        title: 'Initial Assessment',
        appointmentType: 'assessment',
        startDatetime: new Date(new Date().setDate(new Date().getDate() + 2)),
        endDatetime: new Date(new Date().setDate(new Date().getDate() + 2)),
        durationMinutes: 60,
        location: 'FitZone Gym - Private Studio',
        status: 'scheduled',
        notes: 'Full body assessment. Check running form and strength baseline.',
      },
      {
        trainerId: trainer2.id, clientId: client3.id,
        title: 'Full Body Workout B',
        appointmentType: 'one_on_one',
        startDatetime: new Date(new Date().setDate(new Date().getDate() + 1)),
        endDatetime: new Date(new Date().setDate(new Date().getDate() + 1)),
        durationMinutes: 45,
        location: 'Peak Performance Center',
        status: 'confirmed',
      },
      {
        trainerId: trainer1.id, clientId: client1.id,
        title: 'Lower Body - Squat Day',
        description: 'Past session - completed successfully',
        appointmentType: 'one_on_one',
        startDatetime: daysAgo(5),
        endDatetime: daysAgo(5),
        durationMinutes: 80,
        location: 'FitZone Gym - Main Floor',
        status: 'completed',
      },
    ],
  });

  console.log('  Created 16 availability slots, 4 appointments');

  // =============================================
  // 25. ACTIVITY FEED
  // =============================================
  console.log('Creating activity feed...');

  await prisma.activity.createMany({
    data: [
      { userId: client1.id, type: 'workout_completed', title: 'Completed Upper Body - Heavy Bench', description: '75 min, 18 sets, volume: 8,750kg', createdAt: daysAgo(14) },
      { userId: client1.id, type: 'workout_completed', title: 'Completed Lower Body - Heavy Squat', description: '80 min, 17 sets, volume: 12,500kg. New squat PR!', createdAt: daysAgo(13) },
      { userId: client1.id, type: 'personal_best', title: 'New PR: Back Squat 85kg x 5', description: 'Personal best on 5RM back squat!', createdAt: daysAgo(13) },
      { userId: client1.id, type: 'workout_completed', title: 'Completed Lower Body - Deadlift Focus', description: '75 min, 12 sets, volume: 6,800kg', createdAt: daysAgo(3) },
      { userId: client1.id, type: 'personal_best', title: 'New PR: Deadlift 140kg x 3', description: 'Personal best on 3RM conventional deadlift!', createdAt: daysAgo(3) },
      { userId: client1.id, type: 'milestone', title: '4 Weeks Streak!', description: 'Completed all scheduled workouts for 4 consecutive weeks.', createdAt: daysAgo(7) },
      { userId: client1.id, type: 'measurement', title: 'Updated Body Measurements', description: 'Weight: 85.5kg (-3kg since start)', createdAt: daysAgo(7) },
      { userId: client1.id, type: 'program_started', title: 'Started Powerlifting Foundations', description: '8-week powerlifting program with Coach Sarah.', createdAt: daysAgo(28) },
      { userId: client3.id, type: 'program_started', title: 'Started Fit Foundations', description: '6-week beginner program with Coach Mike.', createdAt: daysAgo(14) },
      { userId: client3.id, type: 'workout_completed', title: 'Completed Full Body A', description: '45 min, 14/15 sets completed. Great first workout!', createdAt: daysAgo(7) },
      { userId: client3.id, type: 'milestone', title: 'First Workout Complete!', description: 'Welcome to the fitness journey!', createdAt: daysAgo(7) },
      { userId: trainer1.id, type: 'client_added', title: 'New Client: Olivia Martinez', description: 'Invitation sent to olivia.martinez@example.com', createdAt: daysAgo(5) },
      { userId: trainer1.id, type: 'program_created', title: 'Created Powerlifting Foundations', description: '8-week program for Alex Johnson', createdAt: daysAgo(30) },
      { userId: trainer2.id, type: 'program_created', title: 'Created Fit Foundations', description: '6-week beginner program for James Chen', createdAt: daysAgo(15) },
    ],
  });

  console.log('  Created 14 activity feed entries');

  // =============================================
  // 26. SECURITY AUDIT LOGS
  // =============================================
  console.log('Creating security audit logs...');

  await prisma.securityAuditLog.createMany({
    data: [
      { userId: admin.id, eventType: 'login', ipAddress: '192.168.1.100', success: true, createdAt: daysAgo(0) },
      { userId: trainer1.id, eventType: 'login', ipAddress: '203.0.113.50', success: true, createdAt: daysAgo(0) },
      { userId: trainer1.id, eventType: 'login', ipAddress: '203.0.113.50', success: true, createdAt: daysAgo(1) },
      { userId: client1.id, eventType: 'login', ipAddress: '198.51.100.25', success: true, createdAt: daysAgo(0) },
      { userId: client1.id, eventType: 'login', ipAddress: '198.51.100.25', success: false, failureReason: 'Invalid password', createdAt: daysAgo(5) },
      { userId: client1.id, eventType: 'password_change', ipAddress: '198.51.100.25', success: true, createdAt: daysAgo(5) },
      { userId: client2.id, eventType: 'login', ipAddress: '172.16.0.10', success: true, createdAt: daysAgo(1) },
      { userId: client3.id, eventType: 'login', ipAddress: '10.0.0.50', success: true, createdAt: daysAgo(3) },
    ],
  });

  console.log('  Created 8 audit log entries');

  // =============================================
  // DONE
  // =============================================
  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('\nDemo Accounts (all password: Demo1234!):');
  console.log('  Admin:    admin@evofittrainer.com');
  console.log('  Trainer:  coach.sarah@evofittrainer.com');
  console.log('  Trainer:  coach.mike@evofittrainer.com');
  console.log('  Client:   alex.johnson@example.com');
  console.log('  Client:   emma.wilson@example.com');
  console.log('  Client:   james.chen@example.com');
  console.log('  Client:   olivia.martinez@example.com');
  console.log('\nData created across all epics:');
  console.log('  - 7 users with full profiles, health data, goals');
  console.log('  - 5 trainer certifications, 6 specializations');
  console.log('  - 5 trainer-client relationships');
  console.log('  - 20 exercises, 2 collections, 5 favorites');
  console.log('  - 2 training programs (8-week + 6-week)');
  console.log('  - 2 program assignments');
  console.log('  - 5 workout sessions with detailed logs');
  console.log('  - 23 performance metrics (bench/squat/deadlift/bodyweight)');
  console.log('  - 6 training load records, 10 goal progress entries');
  console.log('  - 5 milestones, 4 insights, 1 analytics report');
  console.log('  - 16 availability slots, 4 appointments');
  console.log('  - 14 activity feed entries, 8 audit logs');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
