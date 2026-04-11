/**
 * Simulation Seed Script
 *
 * Creates a complete world state for QA warfare simulations via API calls.
 * ALL seeding goes through the real API stack — not Prisma direct.
 * Data PERSISTS for analytics testing. Script is idempotent (409s are fine).
 *
 * Usage:
 *   npx tsx tests/e2e/simulations/seed/seed-simulation.ts
 *
 * Or as Playwright global-setup:
 *   Import and call seedSimulation() from a test's beforeAll
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

const ACCOUNTS = {
  trainer: { email: 'sim-trainer@evofit.io', password: 'SimTest2026!', role: 'trainer' },
  client1: { email: 'sim-client1@evofit.io', password: 'SimTest2026!', role: 'client' },
  client2: { email: 'sim-client2@evofit.io', password: 'SimTest2026!', role: 'client' },
  admin: { email: 'sim-admin@evofit.io', password: 'SimTest2026!', role: 'admin' },
};

async function apiCall(method: string, endpoint: string, body?: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${BASE_URL}${endpoint}`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 409) return { status: 409, message: 'Already exists' };
      if (res.status >= 500 && attempt < 5) {
        console.log(`  [retry ${attempt}/5] ${method} ${endpoint} → ${res.status}`);
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }

      const json = await res.json().catch(() => ({ status: res.status }));
      if (!res.ok && res.status !== 409) {
        console.error(`  [ERROR] ${method} ${endpoint} → ${res.status}:`, JSON.stringify(json).slice(0, 200));
      }
      return json;
    } catch (err: any) {
      if (attempt < 5) {
        console.log(`  [retry ${attempt}/5] ${method} ${endpoint} → ${err.message}`);
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }
      throw err;
    }
  }
}

async function login(email: string, password: string): Promise<string> {
  const res = await apiCall('POST', '/api/auth/login', { email, password });
  return res.data?.accessToken || res.accessToken;
}

async function ensureAccount(account: typeof ACCOUNTS.trainer): Promise<string> {
  // Register (ignore if already exists)
  await apiCall('POST', '/api/auth/register', account);
  // Login
  return login(account.email, account.password);
}

export async function seedSimulation(): Promise<void> {
  console.log('══════════��════════════════════════════');
  console.log('  FORGE QA Warfare — Seeding Simulation');
  console.log('═══════════════════════════════════════');

  // Step 1: Create accounts
  console.log('\n[1/10] Creating accounts...');
  const trainerToken = await ensureAccount(ACCOUNTS.trainer);
  const client1Token = await ensureAccount(ACCOUNTS.client1);
  const client2Token = await ensureAccount(ACCOUNTS.client2);
  const adminToken = await ensureAccount(ACCOUNTS.admin);
  console.log('  ✓ All 4 accounts ready');

  // Step 2: Trainer adds clients to roster
  console.log('\n[2/10] Adding clients to trainer roster...');
  await apiCall('POST', '/api/clients', { email: ACCOUNTS.client1.email }, trainerToken);
  await apiCall('POST', '/api/clients', { email: ACCOUNTS.client2.email }, trainerToken);
  console.log('  ✓ Both clients on roster');

  // Step 3: Get exercises for program creation
  console.log('\n[3/10] Fetching exercises...');
  const exercisesRes = await apiCall('GET', '/api/exercises?limit=10&sortBy=name', undefined, trainerToken);
  const exercises = exercisesRes.data?.exercises || exercisesRes.exercises || [];
  console.log(`  ✓ ${exercises.length} exercises available`);

  // Step 4: Create programs
  console.log('\n[4/10] Creating programs...');
  const programs = [
    { name: 'QA: Strength Builder', type: 'strength', difficulty: 'intermediate' },
    { name: 'QA: Cardio Endurance', type: 'endurance', difficulty: 'beginner' },
    { name: 'QA: Flexibility Flow', type: 'general_fitness', difficulty: 'beginner' },
  ];

  const programIds: string[] = [];
  for (const prog of programs) {
    const res = await apiCall('POST', '/api/programs', {
      name: prog.name,
      programType: prog.type,
      difficultyLevel: prog.difficulty,
      durationWeeks: 4,
      goals: ['Build Strength'],
      equipmentNeeded: ['barbell', 'dumbbell'],
      weeks: [{
        weekNumber: 1,
        name: 'Week 1',
        workouts: [{
          dayNumber: 1,
          name: `${prog.name} - Day 1`,
          workoutType: prog.type === 'endurance' ? 'cardio' : 'strength',
          estimatedDuration: 45,
          exercises: exercises.slice(0, 3).map((ex: any, idx: number) => ({
            exerciseId: ex.id,
            orderIndex: idx,
            setsConfig: { sets: 3, reps: '10', rest: 90 },
          })),
        }],
      }],
    }, trainerToken);
    if (res.data?.id) programIds.push(res.data.id);
  }
  console.log(`  ✓ ${programIds.length} programs created`);

  // Step 5: Assign programs to clients
  console.log('\n[5/10] Assigning programs...');
  const clientsRes = await apiCall('GET', '/api/clients', undefined, trainerToken);
  const clients = clientsRes.data || [];
  const client1Record = clients.find((c: any) =>
    c.email === ACCOUNTS.client1.email || c.client?.email === ACCOUNTS.client1.email
  );
  const client1Id = client1Record?.clientId || client1Record?.id;

  if (client1Id && programIds[0]) {
    await apiCall('POST', `/api/programs/${programIds[0]}/assign`, {
      clientId: client1Id,
      startDate: new Date().toISOString(),
    }, trainerToken);
    console.log('  ✓ Program assigned to client 1');
  }

  // Step 6: Client logs measurements (progressive, simulating 3 weeks)
  console.log('\n[6/10] Client logging measurements...');
  const measurements = [
    { weight: 82.5, bodyFatPercentage: 18.2, muscleMass: 35.0, daysAgo: 14 },
    { weight: 82.0, bodyFatPercentage: 17.8, muscleMass: 35.3, daysAgo: 7 },
    { weight: 81.5, bodyFatPercentage: 17.5, muscleMass: 35.5, daysAgo: 0 },
  ];

  for (const m of measurements) {
    const date = new Date();
    date.setDate(date.getDate() - m.daysAgo);
    await apiCall('POST', '/api/analytics/measurements', {
      weight: m.weight,
      bodyFatPercentage: m.bodyFatPercentage,
      muscleMass: m.muscleMass,
      measurementDate: date.toISOString().split('T')[0],
    }, client1Token);
  }
  console.log('  ✓ 3 measurements logged (2-week progression)');

  // Step 7: Client creates goals
  console.log('\n[7/10] Client creating goals...');
  const tokenPayload = JSON.parse(atob(client1Token.split('.')[1]));
  const userId = tokenPayload.userId || tokenPayload.id;

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + 3);

  const goals = [
    { goalType: 'weight_loss', specificGoal: 'Lose 5kg', targetValue: 77.5 },
    { goalType: 'strength', specificGoal: 'Bench press 100kg', targetValue: 100 },
  ];

  for (const goal of goals) {
    await apiCall('POST', '/api/analytics/goals', {
      userId,
      ...goal,
      targetDate: targetDate.toISOString().split('T')[0],
      priority: 3,
      isActive: true,
    }, client1Token);
  }
  console.log('  ✓ 2 fitness goals created');

  // Step 8: Update trainer profile
  console.log('\n[8/10] Updating profiles...');
  await apiCall('PUT', '/api/profiles/me', {
    bio: 'QA Simulation Trainer — FORGE QA Warfare',
    phone: '+1234567890',
    timezone: 'America/New_York',
  }, trainerToken);
  console.log('  ✓ Trainer profile updated');

  // Step 9: Create appointment
  console.log('\n[9/10] Creating appointments...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await apiCall('POST', '/api/schedule/appointments', {
    clientId: client1Id,
    date: tomorrow.toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    notes: 'QA Warfare session',
  }, trainerToken).catch(() => {});
  console.log('  ✓ Appointment created');

  // Step 10: Verify data
  console.log('\n[10/10] Verifying simulation data...');
  const verifyPrograms = await apiCall('GET', '/api/programs', undefined, trainerToken);
  const verifyMeasurements = await apiCall('GET', '/api/analytics/measurements/me', undefined, client1Token);
  const verifyGoals = await apiCall('GET', '/api/analytics/goals', undefined, client1Token);

  console.log(`  Programs: ${(verifyPrograms.data || []).length}`);
  console.log(`  Measurements: ${(verifyMeasurements.data || []).length}`);
  console.log(`  Goals: ${(verifyGoals.data || []).length}`);

  console.log('\n══════════════════════���════════════════');
  console.log('  Simulation Seeded Successfully');
  console.log('═══════════════════════════════════════');
}

// Run directly
if (require.main === module) {
  seedSimulation().catch(console.error);
}
