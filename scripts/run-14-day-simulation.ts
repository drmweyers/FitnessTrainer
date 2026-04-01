/**
 * Run Complete 14-Day Simulation with Daily Progress
 * Shows day-by-day trainer-client interactions
 */

import { DailyClientActor } from '../__tests__/forge/phase2/stream-f/actors/DailyClientActor';
import { DailyTrainerActor } from '../__tests__/forge/phase2/stream-f/actors/DailyTrainerActor';
import { FourteenDayProgramWorkflow } from '../__tests__/forge/phase2/stream-f/workflows/FourteenDayProgramWorkflow';
import { generateWorkout, getPersonalRecords } from '../__tests__/forge/phase2/stream-f/data-generators/workout-generator';
import { generateMeasurementSeries, generateRecoveryMetrics } from '../__tests__/forge/phase2/stream-f/data-generators/measurement-generator';
import { generateDailyMessages } from '../__tests__/forge/phase2/stream-f/data-generators/message-generator';

const WORKOUT_DAYS = [1, 2, 4, 5, 8, 9, 11, 12];
const MEASUREMENT_DAYS = [1, 7, 14];

const WORKOUT_EXERCISES: Record<string, string[]> = {
  'upper_push': ['ex-bench', 'ex-press', 'ex-extension', 'ex-fly'],
  'upper_pull': ['ex-row', 'ex-curl', 'ex-deadlift'],
  'lower': ['ex-squat', 'ex-deadlift', 'ex-extension']
};

function getWorkoutType(day: number): 'upper_push' | 'upper_pull' | 'lower' {
  const types: ('upper_push' | 'upper_pull' | 'upper_push' | 'lower')[] = ['upper_push', 'upper_pull', 'upper_push', 'lower'];
  const index = WORKOUT_DAYS.indexOf(day) % 4;
  return types[index];
}

// No delays needed for simulation

async function runSimulation() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           14-DAY TRAINER-CLIENT SIMULATION                     ║');
  console.log('║     Following the journey from Day 1 to Day 14                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new DailyClientActor({
    id: 'client-alex-001',
    email: 'alex.trainee@email.com',
    role: 'client',
    fullName: 'Alex Johnson'
  });

  const trainer = new DailyTrainerActor({
    id: 'trainer-mike-001',
    email: 'mike.coach@evofit.io',
    role: 'trainer',
    fullName: 'Coach Mike'
  });

  // Setup
  console.log('🏋️  INITIAL SETUP\n');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('👤 Client: Alex Johnson (alex.trainee@email.com)');
  console.log('👨‍🏫 Trainer: Coach Mike (mike.coach@evofit.io)');
  console.log('');

  const program = await trainer.createProgram({
    name: '14-Day Strength Foundation',
    duration: 14,
    workouts: [{
      id: 'wk-1',
      name: 'Upper Push',
      exercises: [{ name: 'Bench Press', sets: 4, reps: 10, weight: 135 }]
    }]
  });
  console.log(`📋 Program Created: "${program.name}" (ID: ${program.id})`);

  await trainer.assignProgram(client.id, program.id);
  console.log(`📎 Program assigned to Alex\n`);

  const measurements = generateMeasurementSeries({
    startWeight: 185,
    startBodyFat: 20,
    measurementDays: MEASUREMENT_DAYS
  });

  // Run 14 days
  for (let day = 1; day <= 14; day++) {
    const isWorkoutDay = WORKOUT_DAYS.includes(day);
    const weekNumber = day <= 7 ? 1 : 2;

    console.log(`\n═══════════════════════════════════════════════════════════════════`);
    console.log(`  DAY ${day} - ${isWorkoutDay ? '💪 WORKOUT DAY' : '😴 REST DAY'} (Week ${weekNumber})`);
    console.log(`═══════════════════════════════════════════════════════════════════\n`);

    // Measurements on Days 1, 7, 14
    if (MEASUREMENT_DAYS.includes(day)) {
      const measurement = measurements.find(m => m.day === day)!;
      await client.recordMeasurements(measurement as any);
      await client.uploadProgressPhoto('front');
      console.log(`📸 Progress Photo: Front view uploaded`);
      console.log(`📏 Measurements: Weight ${measurement.weight} lbs | Body Fat ${measurement.bodyFat}% | Waist ${measurement.waist}" | Arms ${measurement.arms}"\n`);
    }

    if (isWorkoutDay) {
      const workoutType = getWorkoutType(day);
      const exercises = WORKOUT_EXERCISES[workoutType];
      const workoutSessionId = `ws-${day}`;

      console.log(`🎯 Workout Type: ${workoutType.replace('_', ' ').toUpperCase()}`);
      console.log(`   Exercises: ${exercises.join(', ')}\n`);

      await client.startWorkout(workoutSessionId);
      console.log(`▶️  Workout Started (Session: ${workoutSessionId})\n`);

      let daySets = 0;
      let dayPRs = 0;

      for (const exerciseId of exercises) {
        const sets = generateWorkout(workoutSessionId, [exerciseId], weekNumber, day);

        for (const set of sets) {
          await client.logSet(set);
          daySets++;
        }

        const prs = getPersonalRecords(sets);
        dayPRs += prs.length;

        // Show sample sets
        console.log(`   🏋️  ${exerciseId.replace('ex-', '').toUpperCase()}:`);
        sets.slice(0, 3).forEach((set, idx) => {
          const prBadge = set.isPR ? ' 🔥 PR!' : '';
          console.log(`      Set ${idx + 1}: ${set.weight} lbs × ${set.reps} reps @ RPE ${set.rpe}${prBadge}`);
        });
        if (sets.length > 3) {
          console.log(`      ... and ${sets.length - 3} more sets`);
        }
      }

      await client.completeWorkout(workoutSessionId, 'Felt strong today!');
      await trainer.reviewWorkout(workoutSessionId);

      console.log(`\n✅ Workout Completed`);
      console.log(`   Total Sets: ${daySets}`);
      console.log(`   Personal Records: ${dayPRs}`);
    } else {
      // Rest day
      const recovery = generateRecoveryMetrics(day);
      await client.logRecoveryMetrics(recovery);

      console.log(`🛌 Recovery Log:`);
      console.log(`   Sleep: ${recovery.sleep} hours`);
      console.log(`   Soreness: ${recovery.soreness}/10`);
      console.log(`   Energy: ${recovery.energy}/10`);
      console.log(`   Notes: ${recovery.notes || 'None'}\n`);
    }

    // Daily messages
    const hasPR = day === 4 || day === 9; // Simulated PR days
    const exerciseName = hasPR ? (day === 4 ? 'Bench Press' : 'Squat') : undefined;
    const isProgramAdjusted = day === 7;

    const messages = generateDailyMessages({
      day,
      isWorkoutDay,
      trainerName: trainer.fullName,
      clientName: client.fullName,
      hasPR,
      exerciseName,
      isProgramAdjusted
    });

    console.log(`💬 Messages (${messages.length}):`);
    for (const message of messages) {
      const sender = message.sender === 'trainer' ? '👨‍🏫 Coach Mike' : '👤 Alex';
      console.log(`   ${sender}: "${message.content.substring(0, 60)}${message.content.length > 60 ? '...' : ''}"`);

      if (message.sender === 'trainer') {
        await trainer.sendFeedback(client.id, message.type, message.content);
      } else {
        await client.sendMessage(trainer.id, message.content);
      }
    }

    // Program adjustments
    if (day === 7) {
      await trainer.adjustProgram(program.id, { name: '14-Day Strength Foundation (Adjusted)' });
      console.log(`\n📝 PROGRAM ADJUSTED: Added volume for Week 2`);
    }

    if (day === 7 || day === 14) {
      await trainer.reviewAnalytics(client.id);
      console.log(`📊 Weekly analytics review completed`);
    }

    // Day complete
  }

  // Final Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    14-DAY JOURNEY COMPLETE                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const clientStats = client.getStats();
  const trainerStats = trainer.getStats();

  console.log('📊 FINAL STATISTICS:');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`   Total Days Completed:      14/14 ✅`);
  console.log(`   Workout Sessions:          8`);
  console.log(`   Rest Days:                 6`);
  console.log(`   Exercise Sets Logged:      ${clientStats.totalSets}`);
  console.log(`   Messages Exchanged:        ${clientStats.totalMessages + trainerStats.totalMessages}`);
  console.log(`   Body Measurements:         ${clientStats.totalMeasurements}`);
  console.log(`   Progress Photos:           ${clientStats.totalPhotos}`);
  console.log(`   Recovery Logs:             ${clientStats.totalRecoveryLogs}`);
  console.log(`   Workout Reviews:           ${trainerStats.totalReviews}`);
  console.log(`   Program Adjustments:       2`);
  console.log('');

  console.log('🏋️  BODY COMPOSITION PROGRESS:');
  console.log('─────────────────────────────────────────────────────────────────');
  client.measurements.forEach((m, i) => {
    const day = i === 0 ? 1 : i === 1 ? 7 : 14;
    const change = i === 0 ? '' : `(${m.weight - client.measurements[0].weight > 0 ? '+' : ''}${(m.weight - client.measurements[0].weight).toFixed(1)} lbs)`;
    console.log(`   Day ${day}: ${m.weight} lbs | ${m.bodyFat}% BF | Waist ${m.waist}" | Arms ${m.arms}" ${change}`);
  });
  console.log('');

  console.log('📈 PROGRESSIVE OVERLOAD SUMMARY:');
  console.log('─────────────────────────────────────────────────────────────────');
  const sets = client.loggedSets;
  const exercises = ['ex-bench', 'ex-squat', 'ex-deadlift'];
  exercises.forEach(exId => {
    const week1Sets = sets.filter(s => s.exerciseId === exId && parseInt(s.workoutSessionId.split('-')[1]) <= 7);
    const week2Sets = sets.filter(s => s.exerciseId === exId && parseInt(s.workoutSessionId.split('-')[1]) > 7);
    if (week1Sets.length > 0 && week2Sets.length > 0) {
      const w1Avg = week1Sets.reduce((sum, s) => sum + s.weight, 0) / week1Sets.length;
      const w2Avg = week2Sets.reduce((sum, s) => sum + s.weight, 0) / week2Sets.length;
      const increase = ((w2Avg - w1Avg) / w1Avg * 100).toFixed(1);
      console.log(`   ${exId.replace('ex-', '').toUpperCase().padEnd(10)}: ${w1Avg.toFixed(0)} → ${w2Avg.toFixed(0)} lbs (+${increase}%)`);
    }
  });
  console.log('');

  console.log('✅ SIMULATION COMPLETE!');
  console.log('   Alex has completed the 14-day strength foundation program.');
  console.log('   Coach Mike has provided daily guidance and adjusted the program.');
  console.log('   Analytics dashboard now has rich data for visualization.\n');
}

runSimulation().catch(console.error);
