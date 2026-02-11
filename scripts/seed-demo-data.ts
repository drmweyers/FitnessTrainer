/**
 * Demo Data Seed Script (API-Based)
 *
 * Seeds realistic demo data through the production API endpoints.
 * Unlike seed-production.ts (which uses Prisma directly), this script
 * authenticates as real users and calls the REST API to create data,
 * simulating actual user behavior.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-data.ts
 *   npx tsx scripts/seed-demo-data.ts --dry-run
 *   BASE_URL=http://localhost:3000 npx tsx scripts/seed-demo-data.ts
 *
 * Test Accounts (all password: Demo1234!):
 *   Trainer:  coach.sarah@evofittrainer.com
 *   Trainer:  coach.mike@evofittrainer.com
 *   Admin:    admin@evofittrainer.com
 *   Clients:  alex.johnson@example.com, emma.wilson@example.com, olivia.martinez@example.com
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL || 'https://evofittrainer-six.vercel.app';
const DRY_RUN = process.argv.includes('--dry-run');
const PASSWORD = 'Demo1234!';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  targetMuscle: string;
}

interface Program {
  id: string;
  name: string;
  weeks?: ProgramWeek[];
}

interface ProgramWeek {
  id: string;
  weekNumber: number;
  workouts?: ProgramWorkout[];
}

interface ProgramWorkout {
  id: string;
  dayNumber: number;
  name: string;
  isRestDay?: boolean;
  exercises?: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  configurations?: ExerciseConfig[];
}

interface ExerciseConfig {
  id: string;
  setNumber: number;
}

interface WorkoutSession {
  id: string;
  exerciseLogs?: ExerciseLog[];
}

interface ExerciseLog {
  id: string;
  exerciseId: string;
  setLogs?: SetLog[];
}

interface SetLog {
  id: string;
  setNumber: number;
}

interface ClientInfo {
  id: string;
  email: string;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISO(d: Date): string {
  return d.toISOString();
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function setTime(d: Date, hours: number, minutes = 0): Date {
  const result = new Date(d);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let stepCount = 0;
function log(msg: string): void {
  console.log(`  ${msg}`);
}

function logStep(msg: string): void {
  stepCount++;
  console.log(`\n[Step ${stepCount}] ${msg}`);
}

// ─── API Client ──────────────────────────────────────────────────────────────

async function apiRequest<T = any>(
  method: string,
  path: string,
  body?: any,
  token?: string,
  retries = MAX_RETRIES
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = `${BASE_URL}${path}`;

  if (DRY_RUN) {
    log(`[DRY RUN] ${method} ${path} ${body ? JSON.stringify(body).slice(0, 100) + '...' : ''}`);
    return { ok: true, status: 200, data: {} as T };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
      const response = await fetch(url, {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) }),
        signal: controller.signal,
      });
      clearTimeout(fetchTimeout);

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!response.ok) {
        // Handle known acceptable errors
        if (response.status === 409) {
          log(`  (already exists, skipping) ${method} ${path}`);
          return { ok: true, status: 409, data };
        }
        if (response.status === 400 && data?.error?.includes('already')) {
          log(`  (already exists, skipping) ${method} ${path}`);
          return { ok: true, status: 400, data };
        }
        if (attempt < retries) {
          log(`  Retry ${attempt}/${retries} for ${method} ${path} (${response.status})`);
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        console.error(`  FAILED: ${method} ${path} → ${response.status}: ${JSON.stringify(data).slice(0, 200)}`);
        return { ok: false, status: response.status, data };
      }

      return { ok: true, status: response.status, data };
    } catch (err: any) {
      if (attempt < retries) {
        log(`  Network error on ${method} ${path}, retry ${attempt}/${retries}: ${err.message}`);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      console.error(`  NETWORK ERROR: ${method} ${path}: ${err.message}`);
      return { ok: false, status: 0, data: {} as T };
    }
  }

  return { ok: false, status: 0, data: {} as T };
}

// ─── Authentication ──────────────────────────────────────────────────────────

async function login(email: string): Promise<AuthTokens | null> {
  if (DRY_RUN) {
    log(`[DRY RUN] Login as ${email}`);
    return { accessToken: 'dry-run-token', refreshToken: 'dry-run-refresh', userId: 'dry-run-id' };
  }

  const result = await apiRequest<any>('POST', '/api/auth/login', {
    email,
    password: PASSWORD,
  });

  if (!result.ok) {
    console.error(`  Failed to login as ${email}`);
    return null;
  }

  const data = result.data.data || result.data;
  const tokens = data.tokens || data;
  const user = data.user || {};

  return {
    accessToken: tokens.accessToken || data.accessToken,
    refreshToken: tokens.refreshToken || data.refreshToken,
    userId: user.id || data.userId || '',
  };
}

// ─── Step 1: Fetch Exercises ─────────────────────────────────────────────────

async function fetchExercises(token: string): Promise<Exercise[]> {
  logStep('Fetching exercise library');

  const result = await apiRequest<any>('GET', '/api/exercises?limit=100', undefined, token);
  if (!result.ok) {
    console.error('  Failed to fetch exercises');
    return [];
  }

  const exercises: Exercise[] = result.data.exercises || result.data.data || [];
  log(`Fetched ${exercises.length} exercises`);
  return exercises;
}

function findExercise(exercises: Exercise[], searchName: string): Exercise | undefined {
  const lower = searchName.toLowerCase();
  return exercises.find(
    (e) => e.name.toLowerCase().includes(lower) || e.name.toLowerCase() === lower
  );
}

// ─── Step 2: Create Programs ─────────────────────────────────────────────────

async function createPrograms(
  trainerToken: string,
  exercises: Exercise[]
): Promise<{ hiitProgram: Program | null; beginnerProgram: Program | null }> {
  logStep('Creating training programs (as coach.sarah)');

  // Find exercises for HIIT program
  const kettlebellSwing = findExercise(exercises, 'kettlebell') || findExercise(exercises, 'swing');
  const burpees = findExercise(exercises, 'burpee');
  const boxJump = findExercise(exercises, 'box jump') || findExercise(exercises, 'jump');
  const mountainClimber = findExercise(exercises, 'mountain climber');
  const jumpingJack = findExercise(exercises, 'jumping jack');
  const pushUp = findExercise(exercises, 'push-up') || findExercise(exercises, 'push up');
  const plank = findExercise(exercises, 'plank');
  const squat = findExercise(exercises, 'squat');
  const deadlift = findExercise(exercises, 'deadlift');
  const benchPress = findExercise(exercises, 'bench press');
  const row = findExercise(exercises, 'row');
  const lunge = findExercise(exercises, 'lunge');
  const hipThrust = findExercise(exercises, 'hip thrust');
  const latPulldown = findExercise(exercises, 'lat pulldown') || findExercise(exercises, 'pulldown');
  const shoulderPress = findExercise(exercises, 'shoulder press') || findExercise(exercises, 'overhead press');
  const legPress = findExercise(exercises, 'leg press');
  const legCurl = findExercise(exercises, 'leg curl') || findExercise(exercises, 'hamstring');
  const bicepCurl = findExercise(exercises, 'bicep curl') || findExercise(exercises, 'curl');
  const tricepPush = findExercise(exercises, 'tricep') || findExercise(exercises, 'pushdown');
  const lateralRaise = findExercise(exercises, 'lateral raise');
  const facePull = findExercise(exercises, 'face pull');
  const cableFly = findExercise(exercises, 'cable fly') || findExercise(exercises, 'fly');
  const inclineBench = findExercise(exercises, 'incline');
  const pullUp = findExercise(exercises, 'pull-up') || findExercise(exercises, 'pull up');
  const dip = findExercise(exercises, 'dip');

  // Use available exercises - build program around what's in the library
  const hiitExercises = [
    kettlebellSwing, burpees, boxJump, mountainClimber, jumpingJack,
    pushUp, plank, squat, lunge, hipThrust,
  ].filter(Boolean) as Exercise[];
  log(`  Found ${hiitExercises.length}/10 HIIT exercises by name`);

  const beginnerExercises = [
    squat, legPress, pushUp, latPulldown, lunge,
    plank, shoulderPress, row, legCurl, bicepCurl,
  ].filter(Boolean) as Exercise[];
  log(`  Found ${beginnerExercises.length}/10 beginner exercises by name`);

  // If we don't have enough specific exercises, use the first N from the library
  // Use separate index to avoid infinite loop when duplicates are found
  let hiitIdx = 0;
  while (hiitExercises.length < 8 && hiitIdx < exercises.length) {
    const next = exercises[hiitIdx];
    hiitIdx++;
    if (!hiitExercises.find((e) => e.id === next.id)) {
      hiitExercises.push(next);
    }
  }

  let beginnerIdx = 10; // offset to get different exercises
  while (beginnerExercises.length < 8 && beginnerIdx < exercises.length) {
    const next = exercises[beginnerIdx];
    beginnerIdx++;
    if (!beginnerExercises.find((e) => e.id === next.id)) {
      beginnerExercises.push(next);
    }
  }

  // ─── HIIT & Conditioning Program (6 weeks, 4 workouts/week) ───
  const hiitWeeks = [];
  for (let w = 1; w <= 2; w++) {
    // Create 2 weeks with exercises, rest are skeleton weeks
    const workouts = [];

    // Day 1: Upper Body HIIT
    workouts.push({
      dayNumber: 1,
      name: `Upper Body Blast - Week ${w}`,
      workoutType: 'hiit' as const,
      estimatedDuration: 45,
      exercises: hiitExercises.slice(0, 4).map((ex, i) => ({
        exerciseId: ex.id,
        orderIndex: i + 1,
        setsConfig: { sets: 4, reps: '12-15', type: 'working' },
        configurations: [
          { setNumber: 1, setType: 'warmup' as const, reps: '10', restSeconds: 30 },
          { setNumber: 2, setType: 'working' as const, reps: '12', restSeconds: 30, rpe: 7 },
          { setNumber: 3, setType: 'working' as const, reps: '12', restSeconds: 30, rpe: 8 },
          { setNumber: 4, setType: 'working' as const, reps: '12', restSeconds: 60, rpe: 9 },
        ],
      })),
    });

    // Day 2: Lower Body HIIT
    workouts.push({
      dayNumber: 2,
      name: `Lower Body Power - Week ${w}`,
      workoutType: 'hiit' as const,
      estimatedDuration: 45,
      exercises: hiitExercises.slice(4, 8).map((ex, i) => ({
        exerciseId: ex.id,
        orderIndex: i + 1,
        setsConfig: { sets: 4, reps: '12-15', type: 'working' },
        configurations: [
          { setNumber: 1, setType: 'warmup' as const, reps: '10', restSeconds: 30 },
          { setNumber: 2, setType: 'working' as const, reps: '12', restSeconds: 30, rpe: 7 },
          { setNumber: 3, setType: 'working' as const, reps: '12', restSeconds: 30, rpe: 8 },
          { setNumber: 4, setType: 'working' as const, reps: '15', restSeconds: 60, rpe: 9 },
        ],
      })),
    });

    // Day 3: Rest
    workouts.push({
      dayNumber: 3,
      name: 'Active Recovery',
      isRestDay: true,
    });

    // Day 4: Full Body HIIT
    workouts.push({
      dayNumber: 4,
      name: `Full Body Circuit - Week ${w}`,
      workoutType: 'hiit' as const,
      estimatedDuration: 50,
      exercises: [...hiitExercises.slice(0, 2), ...hiitExercises.slice(5, 7)]
        .filter(Boolean)
        .map((ex, i) => ({
          exerciseId: ex.id,
          orderIndex: i + 1,
          setsConfig: { sets: 3, reps: '15', type: 'working' },
          configurations: [
            { setNumber: 1, setType: 'working' as const, reps: '15', restSeconds: 20, rpe: 7 },
            { setNumber: 2, setType: 'working' as const, reps: '15', restSeconds: 20, rpe: 8 },
            { setNumber: 3, setType: 'working' as const, reps: '15', restSeconds: 45, rpe: 9 },
          ],
        })),
    });

    // Day 5: Conditioning
    workouts.push({
      dayNumber: 5,
      name: `Metabolic Finisher - Week ${w}`,
      workoutType: 'cardio' as const,
      estimatedDuration: 35,
      exercises: hiitExercises.slice(2, 5).filter(Boolean).map((ex, i) => ({
        exerciseId: ex.id,
        orderIndex: i + 1,
        setsConfig: { sets: 3, reps: '20', type: 'working' },
        configurations: [
          { setNumber: 1, setType: 'working' as const, reps: '20', restSeconds: 15, rpe: 8 },
          { setNumber: 2, setType: 'working' as const, reps: '20', restSeconds: 15, rpe: 9 },
          { setNumber: 3, setType: 'working' as const, reps: '20', restSeconds: 30, rpe: 9 },
        ],
      })),
    });

    hiitWeeks.push({
      weekNumber: w,
      name: `Week ${w}${w === 1 ? ' - Build Foundation' : ' - Increase Intensity'}`,
      workouts,
    });
  }

  // Add skeleton weeks 3-6
  for (let w = 3; w <= 6; w++) {
    hiitWeeks.push({
      weekNumber: w,
      name: `Week ${w} - ${w <= 4 ? 'Progressive Overload' : 'Peak Performance'}`,
      workouts: [
        { dayNumber: 1, name: `Upper Body Blast - Week ${w}`, workoutType: 'hiit' as const, estimatedDuration: 45 },
        { dayNumber: 2, name: `Lower Body Power - Week ${w}`, workoutType: 'hiit' as const, estimatedDuration: 45 },
        { dayNumber: 3, name: 'Active Recovery', isRestDay: true },
        { dayNumber: 4, name: `Full Body Circuit - Week ${w}`, workoutType: 'hiit' as const, estimatedDuration: 50 },
        { dayNumber: 5, name: `Metabolic Finisher - Week ${w}`, workoutType: 'cardio' as const, estimatedDuration: 35 },
      ],
    });
  }

  log(`  Creating "HIIT & Conditioning" program (${hiitWeeks.length} weeks, sending 1)...`);
  const hiitResult = await apiRequest<any>('POST', '/api/programs', {
    name: 'HIIT & Conditioning',
    description: 'A 6-week advanced high-intensity interval training program designed to maximize caloric burn, improve cardiovascular endurance, and build lean muscle. Combines explosive movements with strength exercises for total body conditioning.',
    programType: 'endurance',
    difficultyLevel: 'advanced',
    durationWeeks: 6,
    goals: ['Improve cardiovascular endurance', 'Maximize caloric burn', 'Build lean muscle', 'Increase metabolic rate'],
    equipmentNeeded: ['kettlebells', 'dumbbells', 'box/step', 'pull-up bar', 'resistance bands'],
    // Send only week 1 to avoid Vercel serverless timeout on large nested payload
    weeks: hiitWeeks.slice(0, 1),
  }, trainerToken);

  const hiitProgram = hiitResult.ok ? (hiitResult.data.data || hiitResult.data) : null;
  if (hiitProgram) {
    log(`Created "HIIT & Conditioning" program (id: ${hiitProgram.id})`);
  }

  // ─── Beginner Full Body Program (8 weeks, 3 workouts/week) ───
  const beginnerWeeks = [];
  for (let w = 1; w <= 2; w++) {
    const workouts = [];

    // Day 1: Full Body A
    workouts.push({
      dayNumber: 1,
      name: `Full Body A - Week ${w}`,
      workoutType: 'strength' as const,
      estimatedDuration: 40,
      exercises: beginnerExercises.slice(0, 5).map((ex, i) => ({
        exerciseId: ex.id,
        orderIndex: i + 1,
        setsConfig: { sets: 3, reps: '10-12', type: 'working' },
        configurations: [
          { setNumber: 1, setType: 'warmup' as const, reps: '12', restSeconds: 60 },
          { setNumber: 2, setType: 'working' as const, reps: '10', restSeconds: 60, rpe: 6 },
          { setNumber: 3, setType: 'working' as const, reps: '10', restSeconds: 90, rpe: 7 },
        ],
      })),
    });

    // Day 2: Rest
    workouts.push({ dayNumber: 2, name: 'Rest Day', isRestDay: true });

    // Day 3: Full Body B
    workouts.push({
      dayNumber: 3,
      name: `Full Body B - Week ${w}`,
      workoutType: 'strength' as const,
      estimatedDuration: 40,
      exercises: beginnerExercises.slice(3, 8).map((ex, i) => ({
        exerciseId: ex.id,
        orderIndex: i + 1,
        setsConfig: { sets: 3, reps: '10-12', type: 'working' },
        configurations: [
          { setNumber: 1, setType: 'warmup' as const, reps: '12', restSeconds: 60 },
          { setNumber: 2, setType: 'working' as const, reps: '10', restSeconds: 60, rpe: 6 },
          { setNumber: 3, setType: 'working' as const, reps: '10', restSeconds: 90, rpe: 7 },
        ],
      })),
    });

    // Day 4: Rest
    workouts.push({ dayNumber: 4, name: 'Rest Day', isRestDay: true });

    // Day 5: Full Body C
    workouts.push({
      dayNumber: 5,
      name: `Full Body C - Week ${w}`,
      workoutType: 'mixed' as const,
      estimatedDuration: 35,
      exercises: [
        ...beginnerExercises.slice(0, 2),
        ...beginnerExercises.slice(6, 8),
      ].filter(Boolean).map((ex, i) => ({
        exerciseId: ex.id,
        orderIndex: i + 1,
        setsConfig: { sets: 3, reps: '12', type: 'working' },
        configurations: [
          { setNumber: 1, setType: 'warmup' as const, reps: '15', restSeconds: 45 },
          { setNumber: 2, setType: 'working' as const, reps: '12', restSeconds: 60, rpe: 6 },
          { setNumber: 3, setType: 'working' as const, reps: '12', restSeconds: 60, rpe: 7 },
        ],
      })),
    });

    beginnerWeeks.push({
      weekNumber: w,
      name: `Week ${w} - ${w === 1 ? 'Learn the Movements' : 'Build Confidence'}`,
      workouts,
    });
  }

  // Skeleton weeks 3-8
  for (let w = 3; w <= 8; w++) {
    beginnerWeeks.push({
      weekNumber: w,
      name: `Week ${w} - ${w <= 4 ? 'Build Consistency' : w <= 6 ? 'Add Intensity' : 'Confidence & Growth'}`,
      workouts: [
        { dayNumber: 1, name: `Full Body A - Week ${w}`, workoutType: 'strength' as const, estimatedDuration: 40 },
        { dayNumber: 2, name: 'Rest Day', isRestDay: true },
        { dayNumber: 3, name: `Full Body B - Week ${w}`, workoutType: 'strength' as const, estimatedDuration: 40 },
        { dayNumber: 4, name: 'Rest Day', isRestDay: true },
        { dayNumber: 5, name: `Full Body C - Week ${w}`, workoutType: 'mixed' as const, estimatedDuration: 35 },
      ],
    });
  }

  log(`  Creating "Beginner Full Body" program (${beginnerWeeks.length} weeks, sending 1)...`);
  const beginnerResult = await apiRequest<any>('POST', '/api/programs', {
    name: 'Beginner Full Body',
    description: 'An 8-week beginner-friendly program designed to build a solid fitness foundation. Three full-body workouts per week with emphasis on proper form, progressive overload, and building sustainable training habits.',
    programType: 'general_fitness',
    difficultyLevel: 'beginner',
    durationWeeks: 8,
    goals: ['Build training consistency', 'Learn proper exercise form', 'Build foundational strength', 'Improve body composition'],
    equipmentNeeded: ['dumbbells', 'cable machine', 'leg press', 'bench', 'resistance bands'],
    // Send only week 1 to avoid Vercel serverless timeout on large nested payload
    weeks: beginnerWeeks.slice(0, 1),
  }, trainerToken);

  const beginnerProgram = beginnerResult.ok ? (beginnerResult.data.data || beginnerResult.data) : null;
  if (beginnerProgram) {
    log(`Created "Beginner Full Body" program (id: ${beginnerProgram.id})`);
  }

  return { hiitProgram, beginnerProgram };
}

// ─── Step 3: Assign Programs ─────────────────────────────────────────────────

async function assignPrograms(
  trainerToken: string,
  hiitProgram: Program | null,
  beginnerProgram: Program | null,
  clients: Record<string, ClientInfo>,
  existingPrograms: Program[]
): Promise<Record<string, any>> {
  logStep('Assigning programs to clients');

  const assignments: Record<string, any> = {};
  const sixWeeksAgo = daysAgo(42);

  // Find existing "Powerlifting Foundations" program
  const plProgram = existingPrograms.find(
    (p) => p.name.toLowerCase().includes('powerlifting')
  );

  // Assign Powerlifting to Alex
  if (plProgram && clients.alex) {
    const result = await apiRequest<any>(
      'POST',
      `/api/programs/${plProgram.id}/assign`,
      { clientId: clients.alex.id, startDate: toISO(sixWeeksAgo) },
      trainerToken
    );
    if (result.ok) {
      assignments.alex = result.data.data || result.data;
      log(`Assigned "${plProgram.name}" to Alex (assignment: ${assignments.alex?.id})`);
    }
  } else {
    log('No Powerlifting program found or Alex client not found, skipping');
  }

  // Assign HIIT to Emma
  if (hiitProgram && clients.emma) {
    const result = await apiRequest<any>(
      'POST',
      `/api/programs/${hiitProgram.id}/assign`,
      { clientId: clients.emma.id, startDate: toISO(sixWeeksAgo) },
      trainerToken
    );
    if (result.ok) {
      assignments.emma = result.data.data || result.data;
      log(`Assigned "HIIT & Conditioning" to Emma (assignment: ${assignments.emma?.id})`);
    }
  }

  // Assign Beginner to Olivia
  if (beginnerProgram && clients.olivia) {
    const result = await apiRequest<any>(
      'POST',
      `/api/programs/${beginnerProgram.id}/assign`,
      { clientId: clients.olivia.id, startDate: toISO(sixWeeksAgo) },
      trainerToken
    );
    if (result.ok) {
      assignments.olivia = result.data.data || result.data;
      log(`Assigned "Beginner Full Body" to Olivia (assignment: ${assignments.olivia?.id})`);
    }
  }

  return assignments;
}

// ─── Step 4-6: Create & Complete Workout Sessions ────────────────────────────

async function createWorkoutSessions(
  clientToken: string,
  trainerToken: string,
  assignmentId: string,
  programId: string,
  clientName: string,
  completedCount: number,
  upcomingCount: number,
  workoutsPerWeek: number,
  programs: Program[]
): Promise<WorkoutSession[]> {
  log(`Creating workout sessions for ${clientName}: ${completedCount} completed + ${upcomingCount} upcoming`);

  // Get the program with its workouts
  const program = programs.find((p) => p.id === programId);
  if (!program || !program.weeks || program.weeks.length === 0) {
    log(`  No program data found for ${clientName}'s program, skipping workout sessions`);
    return [];
  }

  // Collect all workout IDs from the program (non-rest days)
  const allWorkoutIds: string[] = [];
  for (const week of program.weeks) {
    if (week.workouts) {
      for (const workout of week.workouts) {
        if (!workout.isRestDay && workout.id) {
          allWorkoutIds.push(workout.id);
        }
      }
    }
  }

  if (allWorkoutIds.length === 0) {
    log(`  No workout IDs found in program, skipping sessions for ${clientName}`);
    return [];
  }

  const sessions: WorkoutSession[] = [];

  // Create completed sessions (going back in time)
  for (let i = 0; i < completedCount; i++) {
    const weekNum = Math.floor(i / workoutsPerWeek);
    const dayInWeek = i % workoutsPerWeek;
    const daysBack = (Math.floor(completedCount / workoutsPerWeek) - weekNum) * 7 + (workoutsPerWeek - 1 - dayInWeek) * 2;
    const scheduledDate = daysAgo(daysBack);
    const workoutId = allWorkoutIds[i % allWorkoutIds.length];

    const result = await apiRequest<any>(
      'POST',
      '/api/workouts',
      {
        programAssignmentId: assignmentId,
        workoutId,
        scheduledDate: toISO(scheduledDate),
      },
      clientToken
    );

    if (result.ok) {
      const session = result.data.data || result.data;
      sessions.push(session);

      // Log sets for this workout
      if (session.exerciseLogs && session.exerciseLogs.length > 0) {
        await logSetsForSession(clientToken, session, weekNum, clientName);
      }

      // Complete the workout
      const startTime = setTime(scheduledDate, 7 + dayInWeek * 2);
      // Set actualStartTime first
      // The complete endpoint will calculate duration from actualStartTime
      // We need to update the session to have an actualStartTime
      await apiRequest<any>(
        'POST',
        `/api/workouts/${session.id}/complete`,
        {
          notes: getWorkoutNote(clientName, weekNum, dayInWeek),
          effortRating: 6 + Math.floor(Math.random() * 4),
          enjoymentRating: 6 + Math.floor(Math.random() * 4),
          energyAfter: 4 + Math.floor(Math.random() * 5),
        },
        clientToken
      );
    }
  }

  // Create upcoming sessions
  for (let i = 0; i < upcomingCount; i++) {
    const scheduledDate = daysFromNow(i * 2 + 1);
    const workoutId = allWorkoutIds[(completedCount + i) % allWorkoutIds.length];

    const result = await apiRequest<any>(
      'POST',
      '/api/workouts',
      {
        programAssignmentId: assignmentId,
        workoutId,
        scheduledDate: toISO(scheduledDate),
      },
      clientToken
    );

    if (result.ok) {
      sessions.push(result.data.data || result.data);
    }
  }

  log(`  Created ${sessions.length} workout sessions for ${clientName}`);
  return sessions;
}

function getWorkoutNote(clientName: string, week: number, day: number): string {
  const notes: Record<string, string[]> = {
    alex: [
      'Felt strong today. Bench felt smooth.',
      'Legs were heavy but pushed through.',
      'Great deadlift session. Hip hinge is clicking.',
      'Volume day - nice pump.',
      'PR attempt day - close but not quite.',
    ],
    emma: [
      'Heart rate stayed elevated the whole time.',
      'Circuits were brutal but fun.',
      'Feeling the conditioning improving.',
      'Managed to keep rest periods short.',
      'Best session yet - everything flowed well.',
    ],
    olivia: [
      'Getting more comfortable with the movements.',
      'Form felt much better today.',
      'Starting to feel stronger.',
      'Enjoyed the workout more than expected.',
      'Slowly increasing weights.',
    ],
  };

  const clientNotes = notes[clientName.toLowerCase()] || notes.olivia;
  return clientNotes[(week * 3 + day) % clientNotes.length];
}

async function logSetsForSession(
  clientToken: string,
  session: WorkoutSession,
  weekNum: number,
  clientName: string
): Promise<void> {
  if (!session.exerciseLogs) return;

  for (const exerciseLog of session.exerciseLogs) {
    if (!exerciseLog.setLogs) continue;

    for (const setLog of exerciseLog.setLogs) {
      // Progressive overload: weights increase slightly each week
      const baseWeight = getBaseWeight(clientName);
      const weight = baseWeight + weekNum * 2.5 + setLog.setNumber * 0;
      const reps = 8 + Math.floor(Math.random() * 5); // 8-12 reps
      const rpe = 6 + Math.min(3, setLog.setNumber); // 6-9

      await apiRequest<any>(
        'POST',
        `/api/workouts/${session.id}/sets`,
        {
          exerciseLogId: exerciseLog.id,
          setNumber: setLog.setNumber,
          actualReps: reps,
          weight,
          rpe,
          completed: true,
        },
        clientToken
      );
    }
  }
}

function getBaseWeight(clientName: string): number {
  switch (clientName.toLowerCase()) {
    case 'alex':
      return 60; // Intermediate lifter
    case 'emma':
      return 20; // HIIT-focused
    case 'olivia':
      return 15; // Beginner
    default:
      return 20;
  }
}

// ─── Step 7: Record Body Measurements ────────────────────────────────────────

async function recordMeasurements(
  clientToken: string,
  clientName: string,
  startWeight: number,
  endWeight: number,
  startBF: number,
  endBF: number,
  weeks: number
): Promise<void> {
  logStep(`Recording body measurements for ${clientName}`);

  for (let w = 0; w < weeks; w++) {
    const date = daysAgo((weeks - 1 - w) * 7);
    const progress = w / (weeks - 1);
    const weight = startWeight + (endWeight - startWeight) * progress;
    const bf = startBF + (endBF - startBF) * progress;
    const muscleMass = weight * (1 - bf / 100) * 0.45;

    const result = await apiRequest<any>(
      'POST',
      '/api/analytics/measurements',
      {
        measurementDate: toISO(date),
        weight: parseFloat(weight.toFixed(1)),
        bodyFatPercentage: parseFloat(bf.toFixed(1)),
        muscleMass: parseFloat(muscleMass.toFixed(1)),
        measurements: {
          chest: parseFloat((95 - w * 0.3 + Math.random() * 2).toFixed(1)),
          waist: parseFloat((82 - w * 0.5).toFixed(1)),
          hips: parseFloat((98 + Math.random() * 2).toFixed(1)),
          biceps: parseFloat((35 + w * 0.2 + Math.random()).toFixed(1)),
          thighs: parseFloat((58 + Math.random() * 2).toFixed(1)),
        },
        notes: w === 0 ? 'Starting measurements' : w === weeks - 1 ? 'Latest measurements' : undefined,
      },
      clientToken
    );

    if (result.ok) {
      log(`  Week ${w + 1}: ${weight.toFixed(1)} lbs, ${bf.toFixed(1)}% BF`);
    }
  }
}

// ─── Step 8: Create Goals ────────────────────────────────────────────────────

async function createGoals(
  clientToken: string,
  clientName: string,
  goals: Array<{
    goalType: string;
    specificGoal: string;
    targetValue?: number;
    targetDate?: string;
    priority?: number;
  }>
): Promise<void> {
  logStep(`Creating goals for ${clientName}`);

  for (const goal of goals) {
    const result = await apiRequest<any>(
      'POST',
      '/api/analytics/goals',
      goal,
      clientToken
    );

    if (result.ok) {
      log(`  Created goal: ${goal.specificGoal}`);
    }
  }
}

// ─── Step 9: Create Appointments ─────────────────────────────────────────────

async function createAppointments(
  trainerToken: string,
  clients: Record<string, ClientInfo>
): Promise<void> {
  logStep('Creating appointments (as coach.sarah)');

  const appointments = [
    // Past completed appointments
    {
      clientId: clients.alex?.id,
      title: 'Upper Body - Heavy Bench',
      appointmentType: 'one_on_one',
      startDatetime: toISO(setTime(daysAgo(12), 9, 0)),
      endDatetime: toISO(setTime(daysAgo(12), 10, 15)),
      location: 'FitZone Gym - Main Floor',
      notes: 'Week 4, Day 1. Focus on bench progression.',
    },
    {
      clientId: clients.alex?.id,
      title: 'Lower Body - Squat Day',
      appointmentType: 'one_on_one',
      startDatetime: toISO(setTime(daysAgo(10), 9, 0)),
      endDatetime: toISO(setTime(daysAgo(10), 10, 30)),
      location: 'FitZone Gym - Main Floor',
      notes: 'Squat focus day.',
    },
    {
      clientId: clients.emma?.id,
      title: 'HIIT Circuit Session',
      appointmentType: 'one_on_one',
      startDatetime: toISO(setTime(daysAgo(8), 7, 0)),
      endDatetime: toISO(setTime(daysAgo(8), 7, 45)),
      location: 'FitZone Gym - Studio B',
      notes: 'High intensity conditioning.',
    },
    {
      clientId: clients.emma?.id,
      title: 'Cardio Assessment',
      appointmentType: 'assessment',
      startDatetime: toISO(setTime(daysAgo(5), 7, 0)),
      endDatetime: toISO(setTime(daysAgo(5), 8, 0)),
      location: 'FitZone Gym - Private Studio',
      notes: 'VO2 max baseline test.',
    },
    {
      clientId: clients.olivia?.id,
      title: 'Form Check Session',
      appointmentType: 'consultation',
      startDatetime: toISO(setTime(daysAgo(3), 10, 0)),
      endDatetime: toISO(setTime(daysAgo(3), 10, 45)),
      location: 'FitZone Gym - Main Floor',
      notes: 'Review squat and deadlift form.',
    },
    // This week appointments
    {
      clientId: clients.alex?.id,
      title: 'Deadlift Focus Day',
      appointmentType: 'one_on_one',
      startDatetime: toISO(setTime(daysFromNow(1), 9, 0)),
      endDatetime: toISO(setTime(daysFromNow(1), 10, 15)),
      location: 'FitZone Gym - Main Floor',
      notes: 'Week 5, Deadlift day. Target 150kg x 3.',
    },
    {
      clientId: clients.emma?.id,
      title: 'Conditioning Session',
      appointmentType: 'one_on_one',
      startDatetime: toISO(setTime(daysFromNow(2), 7, 0)),
      endDatetime: toISO(setTime(daysFromNow(2), 7, 45)),
      location: 'FitZone Gym - Studio B',
      notes: 'Progressive conditioning circuit.',
    },
    {
      clientId: clients.olivia?.id,
      title: 'Full Body Session',
      appointmentType: 'one_on_one',
      startDatetime: toISO(setTime(daysFromNow(3), 10, 0)),
      endDatetime: toISO(setTime(daysFromNow(3), 10, 45)),
      location: 'FitZone Gym - Main Floor',
      notes: 'Week 3 Full Body A.',
    },
    // Next week
    {
      clientId: clients.alex?.id,
      title: 'Upper Body Volume',
      appointmentType: 'one_on_one',
      startDatetime: toISO(setTime(daysFromNow(8), 9, 0)),
      endDatetime: toISO(setTime(daysFromNow(8), 10, 15)),
      location: 'FitZone Gym - Main Floor',
      notes: 'Volume bench session.',
    },
    {
      clientId: clients.emma?.id,
      title: 'Progress Review',
      appointmentType: 'consultation',
      startDatetime: toISO(setTime(daysFromNow(9), 7, 0)),
      endDatetime: toISO(setTime(daysFromNow(9), 7, 30)),
      location: 'FitZone Gym - Office',
      isOnline: false,
      notes: 'Monthly progress review and program adjustments.',
    },
    // Assessment for Olivia
    {
      clientId: clients.olivia?.id,
      title: 'Month 1 Assessment',
      appointmentType: 'assessment',
      startDatetime: toISO(setTime(daysFromNow(5), 10, 0)),
      endDatetime: toISO(setTime(daysFromNow(5), 11, 0)),
      location: 'FitZone Gym - Private Studio',
      notes: 'Full body assessment after first month. Measure strength baselines.',
    },
  ];

  let created = 0;
  for (const appt of appointments) {
    if (!appt.clientId) continue;

    const result = await apiRequest<any>(
      'POST',
      '/api/schedule/appointments',
      appt,
      trainerToken
    );

    if (result.ok) {
      created++;
    }
  }

  log(`Created ${created} appointments`);

  // Update past appointments to completed status
  log('Updating past appointments to completed status...');
  const pastResult = await apiRequest<any>(
    'GET',
    `/api/schedule/appointments?endDate=${toISO(daysAgo(1))}`,
    undefined,
    trainerToken
  );

  if (pastResult.ok) {
    const pastAppts = pastResult.data.data || [];
    for (const appt of pastAppts) {
      if (appt.status === 'scheduled' || appt.status === 'confirmed') {
        await apiRequest<any>(
          'PUT',
          `/api/schedule/appointments/${appt.id}`,
          { status: 'completed' },
          trainerToken
        );
      }
    }
    log(`  Updated ${pastAppts.length} past appointments to completed`);
  }
}

// ─── Step 10: Favorites & Collections ────────────────────────────────────────

async function createFavoritesAndCollections(
  trainerToken: string,
  exercises: Exercise[]
): Promise<void> {
  logStep('Creating favorites and collections (as coach.sarah)');

  // Favorite popular exercises
  const favoriteNames = [
    'bench press', 'squat', 'deadlift', 'pull-up', 'overhead press',
    'hip thrust', 'lunge', 'plank', 'row', 'lat pulldown',
  ];

  let favCount = 0;
  for (const name of favoriteNames) {
    const exercise = findExercise(exercises, name);
    if (exercise) {
      const result = await apiRequest<any>(
        'POST',
        '/api/exercises/favorites',
        { exerciseId: exercise.id },
        trainerToken
      );
      if (result.ok) favCount++;
    }
  }
  log(`Favorited ${favCount} exercises`);

  // Create collections
  const warmupResult = await apiRequest<any>(
    'POST',
    '/api/exercises/collections',
    {
      name: 'Client Warmups',
      description: 'Essential warmup exercises for all client sessions. Include 2-3 of these before every workout.',
    },
    trainerToken
  );

  if (warmupResult.ok) {
    log('Created collection: "Client Warmups"');
  }

  const compoundResult = await apiRequest<any>(
    'POST',
    '/api/exercises/collections',
    {
      name: 'Advanced Compound Lifts',
      description: 'Key compound movements for intermediate and advanced clients. Prioritize these for strength development.',
    },
    trainerToken
  );

  if (compoundResult.ok) {
    log('Created collection: "Advanced Compound Lifts"');
  }
}

// ─── Fetch Client IDs ────────────────────────────────────────────────────────

async function fetchClientIds(
  trainerToken: string
): Promise<Record<string, ClientInfo>> {
  logStep('Fetching client IDs');

  // Fetch all clients (not just active) since some may be pending
  const result = await apiRequest<any>(
    'GET',
    '/api/clients',
    undefined,
    trainerToken
  );

  const clients: Record<string, ClientInfo> = {};

  if (result.ok) {
    const clientList = result.data.clients || result.data.data || [];
    for (const client of clientList) {
      const email = client.email?.toLowerCase() || '';
      if (email.includes('alex')) {
        clients.alex = { id: client.id, email };
        log(`  Alex: ${client.id}`);
      } else if (email.includes('emma')) {
        clients.emma = { id: client.id, email };
        log(`  Emma: ${client.id}`);
      } else if (email.includes('olivia')) {
        clients.olivia = { id: client.id, email };
        log(`  Olivia: ${client.id}`);
      }
    }
  }

  // If some clients weren't found via trainer relationship, try logging in directly
  if (!clients.alex) {
    const auth = await login('alex.johnson@example.com');
    if (auth) clients.alex = { id: auth.userId, email: 'alex.johnson@example.com' };
  }
  if (!clients.emma) {
    const auth = await login('emma.wilson@example.com');
    if (auth) clients.emma = { id: auth.userId, email: 'emma.wilson@example.com' };
  }
  if (!clients.olivia) {
    const auth = await login('olivia.martinez@example.com');
    if (auth) clients.olivia = { id: auth.userId, email: 'olivia.martinez@example.com' };
  }

  return clients;
}

// ─── Fetch Existing Programs ─────────────────────────────────────────────────

async function fetchExistingPrograms(trainerToken: string): Promise<Program[]> {
  const result = await apiRequest<any>(
    'GET',
    '/api/programs',
    undefined,
    trainerToken
  );

  if (result.ok) {
    return result.data.data || [];
  }
  return [];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('EvoFit Trainer - Demo Data Seed Script (API)');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no API calls)' : 'LIVE'}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // ─── Authenticate ──────────────────────────────────────────

  logStep('Authenticating users');

  const sarahAuth = await login('coach.sarah@evofittrainer.com');
  if (!sarahAuth) {
    console.error('FATAL: Cannot login as coach.sarah. Aborting.');
    process.exit(1);
  }
  log('Logged in as coach.sarah');

  const alexAuth = await login('alex.johnson@example.com');
  if (!alexAuth) {
    console.error('WARNING: Cannot login as alex.johnson');
  } else {
    log('Logged in as alex.johnson');
  }

  const emmaAuth = await login('emma.wilson@example.com');
  if (!emmaAuth) {
    console.error('WARNING: Cannot login as emma.wilson');
  } else {
    log('Logged in as emma.wilson');
  }

  const oliviaAuth = await login('olivia.martinez@example.com');
  if (!oliviaAuth) {
    console.error('WARNING: Cannot login as olivia.martinez');
  } else {
    log('Logged in as olivia.martinez');
  }

  // ─── Fetch Exercises ───────────────────────────────────────

  const exercises = await fetchExercises(sarahAuth.accessToken);
  if (exercises.length === 0) {
    console.error('WARNING: No exercises found. Programs will be created without exercises.');
  }

  // ─── Fetch Client IDs ──────────────────────────────────────

  const clients = await fetchClientIds(sarahAuth.accessToken);

  // Also set userId from login if we have it
  if (alexAuth && clients.alex) clients.alex.id = clients.alex.id || alexAuth.userId;
  if (emmaAuth && clients.emma) clients.emma.id = clients.emma.id || emmaAuth.userId;
  if (oliviaAuth && clients.olivia) clients.olivia.id = clients.olivia.id || oliviaAuth.userId;

  // ─── Activate Pending Clients ────────────────────────────────
  // Olivia's TrainerClient status is 'pending' - need to activate before assigning programs
  // Use the PATCH /api/clients endpoint (if available) or direct status update
  if (clients.olivia) {
    logStep('Activating pending client relationships');
    const activateResult = await apiRequest<any>(
      'PATCH',
      `/api/clients/${clients.olivia.id}/status`,
      { status: 'active' },
      sarahAuth.accessToken
    );
    if (activateResult.ok) {
      log(`Activated Olivia's trainer-client relationship`);
    } else {
      log(`Note: Could not activate Olivia (${activateResult.status}) - may need manual activation`);
    }
  }

  // ─── Set Up Trainer Availability ─────────────────────────────
  // Required before creating appointments (API validates against availability windows)
  logStep('Setting up trainer availability (coach.sarah)');
  const availabilitySlots = [];
  for (let day = 1; day <= 6; day++) { // Mon=1 through Sat=6
    availabilitySlots.push({
      dayOfWeek: day,
      startTime: '06:00',
      endTime: '20:00',
      isAvailable: true,
      location: 'FitZone Gym',
    });
  }
  // Sunday - limited hours
  availabilitySlots.push({
    dayOfWeek: 0,
    startTime: '08:00',
    endTime: '14:00',
    isAvailable: true,
    location: 'FitZone Gym',
  });

  const availResult = await apiRequest<any>(
    'POST',
    '/api/schedule/availability',
    { slots: availabilitySlots },
    sarahAuth.accessToken
  );
  if (availResult.ok) {
    log(`Set availability: Mon-Sat 06:00-20:00, Sun 08:00-14:00`);
  } else {
    log(`Warning: Failed to set availability (${availResult.status})`);
  }

  // ─── Fetch Existing Programs ───────────────────────────────

  const existingPrograms = await fetchExistingPrograms(sarahAuth.accessToken);
  log(`Found ${existingPrograms.length} existing programs`);

  // ─── Create Programs ───────────────────────────────────────

  const { hiitProgram, beginnerProgram } = await createPrograms(
    sarahAuth.accessToken,
    exercises
  );

  // Refresh programs list to include new ones
  const allPrograms = await fetchExistingPrograms(sarahAuth.accessToken);

  // ─── Assign Programs ───────────────────────────────────────

  const assignments = await assignPrograms(
    sarahAuth.accessToken,
    hiitProgram,
    beginnerProgram,
    clients,
    allPrograms
  );

  // ─── Create Workout Sessions ───────────────────────────────

  logStep('Creating workout sessions & logging sets');

  // Alex: 20 completed + 2 upcoming (4x/week for 5 weeks)
  if (alexAuth && assignments.alex) {
    const programId = assignments.alex.programId;
    await createWorkoutSessions(
      alexAuth.accessToken,
      sarahAuth.accessToken,
      assignments.alex.id,
      programId,
      'Alex',
      20, 2, 4,
      allPrograms
    );
  }

  // Emma: 20 completed + 2 upcoming (4x/week)
  if (emmaAuth && assignments.emma) {
    const programId = assignments.emma.programId;
    await createWorkoutSessions(
      emmaAuth.accessToken,
      sarahAuth.accessToken,
      assignments.emma.id,
      programId,
      'Emma',
      20, 2, 4,
      allPrograms
    );
  }

  // Olivia: 15 completed + 1 upcoming (3x/week)
  if (oliviaAuth && assignments.olivia) {
    const programId = assignments.olivia.programId;
    await createWorkoutSessions(
      oliviaAuth.accessToken,
      sarahAuth.accessToken,
      assignments.olivia.id,
      programId,
      'Olivia',
      15, 1, 3,
      allPrograms
    );
  }

  // ─── Record Body Measurements ──────────────────────────────

  if (alexAuth) {
    await recordMeasurements(alexAuth.accessToken, 'Alex', 185, 182, 18, 16, 8);
  }

  if (emmaAuth) {
    await recordMeasurements(emmaAuth.accessToken, 'Emma', 140, 138, 22, 20, 8);
  }

  if (oliviaAuth) {
    await recordMeasurements(oliviaAuth.accessToken, 'Olivia', 165, 158, 30, 27, 8);
  }

  // ─── Create Goals ──────────────────────────────────────────

  if (alexAuth) {
    await createGoals(alexAuth.accessToken, 'Alex', [
      {
        goalType: 'strength',
        specificGoal: 'Squat 315lbs by competition day',
        targetValue: 315,
        targetDate: '2026-06-15',
        priority: 1,
      },
      {
        goalType: 'strength',
        specificGoal: 'Bench press 225lbs',
        targetValue: 225,
        targetDate: '2026-05-01',
        priority: 2,
      },
      {
        goalType: 'sport_specific',
        specificGoal: 'Compete in first powerlifting meet',
        targetDate: '2026-07-01',
        priority: 3,
      },
    ]);
  }

  if (emmaAuth) {
    await createGoals(emmaAuth.accessToken, 'Emma', [
      {
        goalType: 'endurance',
        specificGoal: 'Run a sub-7 minute mile',
        targetValue: 7,
        targetDate: '2026-04-01',
        priority: 1,
      },
      {
        goalType: 'strength',
        specificGoal: 'Complete 50 push-ups unbroken',
        targetValue: 50,
        targetDate: '2026-05-01',
        priority: 2,
      },
      {
        goalType: 'weight_loss',
        specificGoal: 'Lose 5 lbs to reach 135 lbs',
        targetValue: 135,
        targetDate: '2026-03-15',
        priority: 3,
      },
    ]);
  }

  if (oliviaAuth) {
    await createGoals(oliviaAuth.accessToken, 'Olivia', [
      {
        goalType: 'weight_loss',
        specificGoal: 'Lose 15 lbs to reach 150 lbs',
        targetValue: 150,
        targetDate: '2026-06-01',
        priority: 1,
      },
      {
        goalType: 'strength',
        specificGoal: 'Complete 10 push-ups with good form',
        targetValue: 10,
        targetDate: '2026-04-15',
        priority: 2,
      },
      {
        goalType: 'general_fitness',
        specificGoal: 'Maintain 3x/week workout consistency for 3 months',
        targetValue: 3,
        targetDate: '2026-05-10',
        priority: 3,
      },
    ]);
  }

  // ─── Create Appointments ───────────────────────────────────

  await createAppointments(sarahAuth.accessToken, clients);

  // ─── Favorites & Collections ───────────────────────────────

  await createFavoritesAndCollections(sarahAuth.accessToken, exercises);

  // ─── Summary ───────────────────────────────────────────────

  console.log('\n' + '='.repeat(60));
  console.log('SEED COMPLETE');
  console.log('='.repeat(60));
  console.log('\nData created through API:');
  console.log('  - 2 new training programs (HIIT & Conditioning, Beginner Full Body)');
  console.log('  - 3 program assignments (Alex, Emma, Olivia)');
  console.log('  - ~57 workout sessions (55 completed + 5 upcoming)');
  console.log('  - Hundreds of set logs with progressive overload');
  console.log('  - 24 body measurements (8 weeks x 3 clients)');
  console.log('  - 9 fitness goals');
  console.log('  - ~11 appointments (past + upcoming + assessment)');
  console.log('  - 10+ exercise favorites');
  console.log('  - 2 exercise collections');
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(60));
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('\nFATAL ERROR:', err);
  process.exit(1);
});
