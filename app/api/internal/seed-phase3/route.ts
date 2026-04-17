/**
 * Internal Seed Phase 3 Endpoint
 *
 * POST /api/internal/seed-phase3
 *
 * Seeds the P0/P1 Prisma models that lack public POST API routes:
 *   - Activity (10 entries for qa-enterprise trainer)
 *   - TrainerSpecialization (3 specializations for qa-enterprise trainer)
 *   - MilestoneAchievement (3 milestones for qa-client)
 *   - UserInsight (3 insights for qa-client)
 *   - ClientTag (3 tags owned by qa-enterprise trainer)
 *   - ClientTagAssignment (VIP + Morning tags assigned to qa-client)
 *
 * Request body: { trainerEmail, clientEmail }
 * Protected by INTERNAL_API_SECRET — returns 404 when secret is not set.
 *
 * All operations are idempotent — existing records are skipped, not duplicated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const authHeader = request.headers.get('x-internal-secret');
  if (authHeader !== secret) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const trainerEmail: string = body.trainerEmail || 'qa-enterprise@evofit.io';
    const clientEmail: string = body.clientEmail || 'qa-client@evofit.io';

    // Resolve user IDs
    const trainer = await prisma.user.findUnique({ where: { email: trainerEmail } });
    if (!trainer) {
      return NextResponse.json(
        { success: false, error: `Trainer not found: ${trainerEmail}` },
        { status: 404 }
      );
    }

    const client = await prisma.user.findUnique({ where: { email: clientEmail } });
    if (!client) {
      return NextResponse.json(
        { success: false, error: `Client not found: ${clientEmail}` },
        { status: 404 }
      );
    }

    const results: Record<string, string | number> = {};

    // ── 1. TrainerSpecialization ────────────────────────────────────────────────
    const specializationDefs = [
      {
        specialization: 'Strength & Conditioning',
        yearsExperience: 12,
        description:
          'Olympic and powerlifting technique, periodisation, sports-specific strength programming for competitive athletes and serious lifters.',
      },
      {
        specialization: 'Body Recomposition',
        yearsExperience: 10,
        description:
          'Evidence-based body recomposition combining resistance training with precision nutrition to simultaneously reduce body fat and build lean muscle.',
      },
      {
        specialization: 'Injury Rehabilitation',
        yearsExperience: 8,
        description:
          'Return-to-sport programming following orthopedic injury. Works closely with physiotherapists and sports medicine practitioners.',
      },
    ];

    let specCreated = 0;
    for (const spec of specializationDefs) {
      const existing = await prisma.trainerSpecialization.findFirst({
        where: { trainerId: trainer.id, specialization: spec.specialization },
      });
      if (!existing) {
        await prisma.trainerSpecialization.create({
          data: { trainerId: trainer.id, ...spec },
        });
        specCreated++;
      }
    }
    results.trainerSpecializations = specCreated > 0 ? `${specCreated} created` : 'already exist';

    // ── 2. ClientTag + ClientTagAssignment ─────────────────────────────────────
    const tagDefs = [
      { name: 'VIP', color: '#F59E0B' },
      { name: 'Morning', color: '#3B82F6' },
      { name: 'Competition Prep', color: '#EF4444' },
    ];

    const tagIds: Record<string, string> = {};
    let tagsCreated = 0;
    for (const tagDef of tagDefs) {
      let tag = await prisma.clientTag.findFirst({
        where: { trainerId: trainer.id, name: tagDef.name },
      });
      if (!tag) {
        tag = await prisma.clientTag.create({
          data: { trainerId: trainer.id, name: tagDef.name, color: tagDef.color },
        });
        tagsCreated++;
      }
      tagIds[tagDef.name] = tag.id;
    }
    results.clientTags = tagsCreated > 0 ? `${tagsCreated} created` : 'already exist';

    // Assign VIP and Morning tags to the client
    let assignmentsCreated = 0;
    for (const tagName of ['VIP', 'Morning']) {
      const tagId = tagIds[tagName];
      if (!tagId) continue;
      const existing = await prisma.clientTagAssignment.findUnique({
        where: { clientId_tagId: { clientId: client.id, tagId } },
      });
      if (!existing) {
        await prisma.clientTagAssignment.create({
          data: { clientId: client.id, tagId },
        });
        assignmentsCreated++;
      }
    }
    results.clientTagAssignments =
      assignmentsCreated > 0 ? `${assignmentsCreated} created` : 'already exist';

    // ── 3. Activity (10 entries for trainer) ───────────────────────────────────
    const activityDefs = [
      {
        type: 'workout_completed',
        title: 'Client completed Upper Body Push session',
        description: 'qa-client completed Upper Body Push — Week 8, Day 1. Effort rating: 8/10.',
        metadata: { clientEmail, week: 8, day: 1, effortRating: 8 },
      },
      {
        type: 'measurement_recorded',
        title: 'New body measurements recorded',
        description: 'qa-client logged weekly measurements: 75.1 kg, 20.9% body fat.',
        metadata: { clientEmail, weight: 75.1, bodyFat: 20.9 },
      },
      {
        type: 'goal_updated',
        title: 'Goal progress updated: Bench press target',
        description: 'qa-client updated bench press 1RM progress to 65 kg (92.9% of 70 kg goal).',
        metadata: { clientEmail, goalType: 'strength', currentValue: 65, targetValue: 70 },
      },
      {
        type: 'program_assigned',
        title: 'Program assigned to client',
        description: '8-Week Strength Foundation program assigned to qa-client. Start date: 8 weeks ago.',
        metadata: { clientEmail, programName: '8-Week Strength Foundation' },
      },
      {
        type: 'workout_completed',
        title: 'Client completed Lower Body session',
        description: 'qa-client completed Lower Body — Week 8, Day 2. Squat PR achieved.',
        metadata: { clientEmail, week: 8, day: 2, personalBest: true },
      },
      {
        type: 'appointment_booked',
        title: 'Upcoming appointment: Week 2 Measurements & Program Review',
        description: 'Assessment session booked for tomorrow at 09:00.',
        metadata: { clientEmail, appointmentType: 'assessment' },
      },
      {
        type: 'workout_completed',
        title: 'Client completed Upper Body Pull session',
        description: 'qa-client completed Upper Body Pull — Week 8, Day 3. Pull-up progression: 9 reps.',
        metadata: { clientEmail, week: 8, day: 3, effortRating: 8 },
      },
      {
        type: 'goal_updated',
        title: 'Goal progress updated: Weight loss',
        description: 'qa-client updated weight loss progress to 75.1 kg (47.8% toward 72 kg goal).',
        metadata: { clientEmail, goalType: 'weight_loss', currentValue: 75.1, targetValue: 72 },
      },
      {
        type: 'measurement_recorded',
        title: 'Body fat milestone approaching',
        description: 'qa-client body fat now at 20.9% — approaching 20% milestone.',
        metadata: { clientEmail, bodyFat: 20.9, milestone: '20%' },
      },
      {
        type: 'program_completed',
        title: 'Week 8 of Strength Foundation program complete',
        description: 'qa-client has completed all 24 sessions across 8 weeks of the Strength Foundation program.',
        metadata: { clientEmail, programName: '8-Week Strength Foundation', sessionsCompleted: 24 },
      },
    ];

    let activitiesCreated = 0;
    for (const actDef of activityDefs) {
      const existing = await prisma.activity.findFirst({
        where: { userId: trainer.id, type: actDef.type, title: actDef.title },
      });
      if (!existing) {
        await prisma.activity.create({
          data: {
            userId: trainer.id,
            type: actDef.type,
            title: actDef.title,
            description: actDef.description,
            metadata: actDef.metadata,
          },
        });
        activitiesCreated++;
      }
    }
    results.activities = activitiesCreated > 0 ? `${activitiesCreated} created` : 'already exist';

    // ── 4. MilestoneAchievement (3 milestones for client) ──────────────────────
    const milestoneDefs = [
      {
        milestoneType: 'strength',
        title: 'First 100kg Squat',
        description:
          'Achieved a 100 kg squat for the first time — a significant strength milestone representing months of progressive overload training.',
        achievedValue: 100,
      },
      {
        milestoneType: 'consistency',
        title: '10 Sessions Completed',
        description:
          'Successfully completed 10 consecutive training sessions without missing a scheduled workout.',
        achievedValue: 10,
      },
      {
        milestoneType: 'body_composition',
        title: '5 kg Body Fat Lost',
        description:
          'Lost 5 kg of body fat while maintaining lean muscle mass — a significant body recomposition achievement.',
        achievedValue: 5,
      },
    ];

    let milestonesCreated = 0;
    for (const ms of milestoneDefs) {
      const existing = await prisma.milestoneAchievement.findFirst({
        where: { userId: client.id, title: ms.title },
      });
      if (!existing) {
        await prisma.milestoneAchievement.create({
          data: { userId: client.id, ...ms },
        });
        milestonesCreated++;
      }
    }
    results.milestoneAchievements =
      milestonesCreated > 0 ? `${milestonesCreated} created` : 'already exist';

    // ── 5. UserInsight (3 insights for client) ─────────────────────────────────
    const insightDefs = [
      {
        insightType: 'performance',
        title: 'Squat 1RM up 15% this month',
        description:
          'Your estimated squat 1RM has increased by 15% over the past 4 weeks, from 75 kg to 86 kg. This puts you on track to hit 100 kg by the end of the program.',
        data: { metric: 'squat_1rm', startValue: 75, currentValue: 86, change: 15 },
        priority: 'high' as const,
      },
      {
        insightType: 'recovery',
        title: 'Recovery score improving steadily',
        description:
          'Your effort ratings and enjoyment scores suggest your body is adapting well to the training stimulus. Average recovery time between sessions has decreased from 48h to 36h.',
        data: { avgRecoveryHours: 36, trend: 'improving' },
        priority: 'medium' as const,
      },
      {
        insightType: 'programming',
        title: 'Consider scheduling a deload next week',
        description:
          'After 8 consecutive weeks of progressive overload, your CNS fatigue indicators suggest a planned deload week (50-60% intensity) would maximise your long-term gains.',
        data: { weeksOfProgression: 8, recommendedAction: 'deload' },
        priority: 'low' as const,
      },
    ];

    let insightsCreated = 0;
    for (const ins of insightDefs) {
      const existing = await prisma.userInsight.findFirst({
        where: { userId: client.id, title: ins.title },
      });
      if (!existing) {
        await prisma.userInsight.create({
          data: { userId: client.id, ...ins },
        });
        insightsCreated++;
      }
    }
    results.userInsights = insightsCreated > 0 ? `${insightsCreated} created` : 'already exist';

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('[seed-phase3] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
