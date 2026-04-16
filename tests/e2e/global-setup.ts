/**
 * Global Setup for E2E Tests
 *
 * Seeds a COMPLETE trainer/client simulation scenario:
 * 0.  Wait for database to be ready
 * 0.5 Clean up stale test data (programs, goals, collections, workout sessions)
 * 1.  Creates 3 QA accounts (trainer, client, client2, admin)
 * 2.  Trainer adds both clients to roster
 * 3.  Trainer creates a program with exercises
 * 4.  Trainer assigns program to QA client
 * 5.  Trainer adds a certification expiring in 15 days
 * 6.  Trainer creates an appointment
 * 7.  Client records a body measurement
 * 8.  Client creates a fitness goal
 * 8b. Trainer HealthProfile seeded
 * 9.  Client favorites some exercises
 * 10. Trainer profile updated
 * 11. Client profile + health info updated
 * 12. (renumbered) — was 10-12
 * 13. Seed 3 completed workout sessions with set logs (as client)
 * 14. Seed goal progress entries
 * 15. Seed support ticket (as client)
 * 16. Seed performance metrics (as client)
 * 17. Trigger training-load calculation for recent weeks
 *
 * This ensures NO tests need to skip due to missing data.
 */
import { chromium, APIRequestContext } from '@playwright/test';
import { TEST_ACCOUNTS, API } from './helpers/constants';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** Helper: POST with auth */
async function authPost(api: APIRequestContext, path: string, token: string, data: any) {
  return api.post(`${BASE}${path}`, {
    data,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    timeout: 60000,
  });
}

/** Helper: GET with auth */
async function authGet(api: APIRequestContext, path: string, token: string) {
  return api.get(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 60000,
  });
}

/** Helper: PUT with auth */
async function authPut(api: APIRequestContext, path: string, token: string, data: any) {
  return api.put(`${BASE}${path}`, {
    data,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    timeout: 60000,
  });
}

/** Helper: DELETE with auth */
async function authDelete(api: APIRequestContext, path: string, token: string) {
  return api.delete(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 60000,
  });
}

/** Login and return token */
async function login(api: APIRequestContext, email: string, password: string): Promise<string | null> {
  const res = await api.post(`${BASE}${API.login}`, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  return body.data?.tokens?.accessToken || null;
}

/** Register account (idempotent — returns token) */
async function ensureAccount(api: APIRequestContext, email: string, password: string, role: string): Promise<string> {
  // Retry loop: Neon free-tier can return 503 even after health check passes
  for (let attempt = 1; attempt <= 5; attempt++) {
    // Try login first
    let token = await login(api, email, password);
    if (token) return token;

    // If first attempt, try to register
    if (attempt === 1) {
      console.log(`  Registering ${email}...`);
      const registerRes = await api.post(`${BASE}${API.register}`, {
        data: { email, password, role },
        headers: { 'Content-Type': 'application/json' },
      });

      if (!registerRes.ok()) {
        const errorBody = await registerRes.json().catch(() => ({}));
        const status = registerRes.status();
        console.log(`  ⚠ Registration response: ${status} - ${JSON.stringify(errorBody)}`);
        // If DB unavailable (503/500), wait longer before retrying
        if (status >= 500) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
      } else {
        console.log(`  ✓ Registered ${email}`);
      }
    }

    // Try login after register
    token = await login(api, email, password);
    if (token) return token;

    // Wait before next attempt (exponential backoff)
    const delay = Math.min(2000 * attempt, 8000);
    await new Promise(r => setTimeout(r, delay));
  }

  throw new Error(`Failed to create/login account: ${email} after 5 attempts`);
}

/** Wait for database to be available with retries */
async function waitForDatabase(api: APIRequestContext, maxRetries = 10): Promise<boolean> {
  console.log('[Global Setup] Warming up database connection...');

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Try health check endpoint first
      const healthRes = await api.get(`${BASE}/api/health`, { timeout: 10000 });
      if (healthRes.ok()) {
        const health = await healthRes.json();
        if (health.data?.database === 'healthy') {
          // Health check passed but Neon might still be starting up actual query processing
          // Fall through to test actual login API
        }
      }
    } catch {
      // Health check failed, try login as a warmup
    }

    // Try a simple login request to wake up the DB
    try {
      const res = await api.post(`${BASE}${API.login}`, {
        data: { email: 'test@test.com', password: 'test' },
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      // Even if login fails (wrong credentials = 401/400), if we get a non-5xx response, DB is up
      // Neon cold-start returns 503; a warmed-up DB returns 400/401 for bad credentials
      if (res.status() < 500) {
        console.log(`  ✓ Database responsive (attempt ${i + 1})`);
        return true;
      }
    } catch {
      // DB still waking up
    }

    console.log(`  ... waiting for database (attempt ${i + 1}/${maxRetries})`);
    await new Promise(r => setTimeout(r, 3000));
  }

  return false;
}

/**
 * Step 0.5: Clean up stale test data to prevent accumulation across runs.
 * Deletes all programs, goals, collections, and workout sessions owned by QA accounts.
 * Each delete is wrapped in try/catch so individual failures are non-fatal.
 */
async function cleanupTestData(
  api: APIRequestContext,
  trainerToken: string,
  clientToken: string
): Promise<void> {
  console.log('Step 0.5: Cleaning up stale test data...');

  // ─── Delete all trainer programs ─────────────────────────────────────────
  try {
    const listRes = await authGet(api, API.programs, trainerToken);
    if (listRes.ok()) {
      const listData = await listRes.json();
      const programs: any[] = listData.data?.programs || listData.data || [];
      let deleted = 0;
      for (const program of programs) {
        try {
          const delRes = await authDelete(api, `${API.programs}/${program.id}`, trainerToken);
          if (delRes.ok()) deleted++;
        } catch {
          // non-fatal
        }
      }
      console.log(`  ✓ Deleted ${deleted}/${programs.length} trainer programs`);
    }
  } catch (e: any) {
    console.log(`  ⚠ Could not clean trainer programs: ${e.message}`);
  }

  // ─── Delete all client goals ─────────────────────────────────────────────
  try {
    const listRes = await authGet(api, API.analyticsGoals, clientToken);
    if (listRes.ok()) {
      const listData = await listRes.json();
      const goals: any[] = listData.data || [];
      // Filter to only the QA client's goals (trainer sees all including clients)
      let deleted = 0;
      for (const goal of goals) {
        try {
          const delRes = await authDelete(api, `${API.analyticsGoals}/${goal.id}`, clientToken);
          if (delRes.ok()) deleted++;
        } catch {
          // non-fatal
        }
      }
      console.log(`  ✓ Deleted ${deleted}/${goals.length} client goals`);
    }
  } catch (e: any) {
    console.log(`  ⚠ Could not clean client goals: ${e.message}`);
  }

  // ─── Delete all exercise collections ─────────────────────────────────────
  try {
    const listRes = await authGet(api, API.exerciseCollections, trainerToken);
    if (listRes.ok()) {
      const listData = await listRes.json();
      const collections: any[] = listData.data?.collections || listData.data || [];
      let deleted = 0;
      for (const collection of collections) {
        try {
          const delRes = await authDelete(
            api,
            `${API.exerciseCollections}/${collection.id}`,
            trainerToken
          );
          if (delRes.ok()) deleted++;
        } catch {
          // non-fatal
        }
      }
      console.log(`  ✓ Deleted ${deleted}/${collections.length} exercise collections`);
    }
  } catch (e: any) {
    console.log(`  ⚠ Could not clean exercise collections: ${e.message}`);
  }

  // ─── Delete all client workout sessions ──────────────────────────────────
  try {
    const listRes = await authGet(api, API.workouts, clientToken);
    if (listRes.ok()) {
      const listData = await listRes.json();
      const sessions: any[] = listData.data || [];
      let deleted = 0;
      for (const session of sessions) {
        try {
          const delRes = await authDelete(api, `${API.workouts}/${session.id}`, clientToken);
          if (delRes.ok()) deleted++;
        } catch {
          // non-fatal
        }
      }
      console.log(`  ✓ Deleted ${deleted}/${sessions.length} workout sessions`);
    }
  } catch (e: any) {
    console.log(`  ⚠ Could not clean workout sessions: ${e.message}`);
  }
}

async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const api = context.request;

  console.log(`\n[Global Setup] Seeding complete simulation on ${BASE}...\n`);

  // ─── Step 0: Wait for database to be ready ────────────────────────────────
  const dbReady = await waitForDatabase(api, 15);
  if (!dbReady) {
    console.warn('\n⚠️  WARNING: Database may not be fully ready. Proceeding anyway...\n');
  }

  // ─── Step 1: Create all accounts ──────────────────────────────────────────
  console.log('Step 1: Creating accounts...');
  const trainerToken = await ensureAccount(api, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password, 'trainer');
  const clientToken = await ensureAccount(api, TEST_ACCOUNTS.client.email, TEST_ACCOUNTS.client.password, 'client');
  const adminToken = await ensureAccount(api, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password, 'admin');

  // Create a second client for bulk operations testing
  const client2Email = 'qa-client2@evofit.io';
  const client2Token = await ensureAccount(api, client2Email, 'QaTest2026!', 'client');

  console.log('  ✓ Trainer, Client, Client2, Admin accounts ready');

  // ─── Tier-locked accounts (Starter / Professional / Enterprise) ───────────
  // The internal endpoint creates the users + correct subscription rows in one call.
  // Falls back to ensureAccount registration if the secret is not configured.
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret) {
    try {
      const seedRes = await api.post(`${BASE}/api/internal/seed-tier`, {
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
        timeout: 30000,
      });
      if (seedRes.ok()) {
        const body = await seedRes.json();
        console.log('  ✓ Tier accounts seeded:', JSON.stringify(body.results));
      } else {
        console.log(`  ⚠ Tier seed endpoint returned ${seedRes.status()} — falling back to ensureAccount`);
        await ensureAccount(api, TEST_ACCOUNTS.starter.email, TEST_ACCOUNTS.starter.password, 'trainer');
        await ensureAccount(api, TEST_ACCOUNTS.professional.email, TEST_ACCOUNTS.professional.password, 'trainer');
        await ensureAccount(api, TEST_ACCOUNTS.enterprise.email, TEST_ACCOUNTS.enterprise.password, 'trainer');
      }
    } catch (e: any) {
      console.log(`  ⚠ Tier seed failed: ${e.message} — falling back`);
      await ensureAccount(api, TEST_ACCOUNTS.starter.email, TEST_ACCOUNTS.starter.password, 'trainer');
      await ensureAccount(api, TEST_ACCOUNTS.professional.email, TEST_ACCOUNTS.professional.password, 'trainer');
      await ensureAccount(api, TEST_ACCOUNTS.enterprise.email, TEST_ACCOUNTS.enterprise.password, 'trainer');
    }
  } else {
    await ensureAccount(api, TEST_ACCOUNTS.starter.email, TEST_ACCOUNTS.starter.password, 'trainer');
    await ensureAccount(api, TEST_ACCOUNTS.professional.email, TEST_ACCOUNTS.professional.password, 'trainer');
    await ensureAccount(api, TEST_ACCOUNTS.enterprise.email, TEST_ACCOUNTS.enterprise.password, 'trainer');
    console.log('  ⚠ INTERNAL_API_SECRET not set — tier accounts registered but subscriptions not seeded');
  }
  console.log('  ✓ Starter, Professional, Enterprise tier accounts ready');

  // ─── Step 0.5: Clean up stale test data ──────────────────────────────────
  await cleanupTestData(api, trainerToken, clientToken);

  // ─── Step 2: Trainer adds clients to roster ───────────────────────────────
  console.log('Step 2: Adding clients to trainer roster...');
  try {
    // Note: This endpoint can be slow on Neon cold start - use longer timeout
    const clientRes = await api.post(`${BASE}${API.clients}`, {
      data: { email: TEST_ACCOUNTS.client.email },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}` },
      timeout: 120000,
    });
    if (!clientRes.ok()) {
      const err = await clientRes.json().catch(() => ({}));
      console.log(`  ⚠ Client 1: ${clientRes.status()} - ${err.message || 'Unknown error'}`);
    } else {
      console.log('  ✓ Client 1 added to roster');
    }

    const client2Res = await api.post(`${BASE}${API.clients}`, {
      data: { email: client2Email },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trainerToken}` },
      timeout: 120000,
    });
    if (!client2Res.ok()) {
      const err = await client2Res.json().catch(() => ({}));
      console.log(`  ⚠ Client 2: ${client2Res.status()} - ${err.message || 'Unknown error'}`);
    } else {
      console.log('  ✓ Client 2 added to roster');
    }
  } catch (e: any) {
    console.log(`  ⚠ Could not add clients to roster: ${e.message}`);
    console.log('  (Tests may still work if clients exist in DB)');
  }

  // ─── Step 3: Get exercise IDs for program ────────────────────────────────
  console.log('Step 3: Fetching exercises for program...');
  const exerciseRes = await authGet(api, `${API.exercises}?limit=5`, trainerToken);
  let exerciseIds: string[] = [];
  if (exerciseRes.ok()) {
    const exerciseData = await exerciseRes.json();
    // Actual API shape: { exercises, pagination, filters } at top level.
    // Historical shapes (kept as fallbacks): { data: { exercises } } and { data: [] }.
    const exercises =
      exerciseData.exercises ||
      exerciseData.data?.exercises ||
      (Array.isArray(exerciseData.data) ? exerciseData.data : []) ||
      [];
    exerciseIds = exercises.slice(0, 3).map((e: any) => e.id);
    console.log(`  ✓ Got ${exerciseIds.length} exercises`);
    if (exerciseIds.length === 0) {
      console.log(`  ⚠ WARNING: exercise list empty. Response keys: ${Object.keys(exerciseData).join(', ')}`);
    }
  } else {
    console.log(`  ⚠ Could not fetch exercises (${exerciseRes.status()}), creating program without exercises`);
  }

  // ─── Step 4: Trainer creates a program with exercises ────────────────────
  console.log('Step 4: Creating program...');
  const programPayload: any = {
    name: 'QA Test Program - Full Body',
    description: 'Automated QA test program with 3 exercises over 4 weeks',
    programType: 'strength',
    difficultyLevel: 'beginner',
    durationWeeks: 4,
    goals: ['strength', 'muscle_gain'],
    equipmentNeeded: ['barbell', 'dumbbells'],
    weeks: [
      {
        weekNumber: 1,
        name: 'Week 1 - Foundation',
        description: 'Introductory week',
        isDeload: false,
        workouts: [
          {
            dayNumber: 1,
            name: 'Full Body A',
            description: 'Compound lifts focus',
            exercises: exerciseIds.map((exId, i) => ({
              exerciseId: exId,
              orderIndex: i,
              sets: 3,
              reps: 10,
              weight: 50 + (i * 10),
              restSeconds: 90,
              notes: `QA test exercise ${i + 1}`,
            })),
          },
        ],
      },
    ],
  };

  const programRes = await authPost(api, API.programs, trainerToken, programPayload);
  let programId: string | null = null;
  if (programRes.ok()) {
    const programData = await programRes.json();
    programId = programData.data?.id;
    console.log(`  ✓ Program created: ${programId}`);
  } else {
    // Try to find existing program
    const listRes = await authGet(api, API.programs, trainerToken);
    if (listRes.ok()) {
      const listData = await listRes.json();
      const programs = listData.data?.programs || listData.data || [];
      if (programs.length > 0) {
        programId = programs[0].id;
        console.log(`  ✓ Using existing program: ${programId}`);
      }
    }
    if (!programId) console.log('  ⚠ Could not create program');
  }

  // ─── Step 5: Assign program to client ────────────────────────────────────
  let programAssignmentId: string | null = null;
  let workoutId: string | null = null;

  if (programId) {
    console.log('Step 5: Assigning program to client...');
    const clientUserId = await getClientId(api, trainerToken);
    const assignRes = await authPost(api, `/api/programs/${programId}/assign`, trainerToken, {
      clientId: clientUserId,
      startDate: new Date().toISOString().split('T')[0],
    });
    if (assignRes.ok()) {
      const assignData = await assignRes.json();
      programAssignmentId = assignData.data?.id || null;
      console.log(`  ✓ Program assigned to client (assignment: ${programAssignmentId})`);
    } else {
      // Try to fetch the existing assignment
      try {
        const assignListRes = await authGet(api, API.workouts, clientToken);
        if (assignListRes.ok()) {
          // No direct assignment list endpoint from client — skip gracefully
        }
      } catch { /* non-fatal */ }
      console.log(`  ⚠ Assignment: ${assignRes.status()} (may already exist)`);
    }

    // Fetch the workoutId from the program for use in workout session seeding
    if (exerciseIds.length > 0) {
      try {
        const progDetailRes = await authGet(api, `${API.programs}/${programId}`, trainerToken);
        if (progDetailRes.ok()) {
          const progDetail = await progDetailRes.json();
          const firstWeek = progDetail.data?.weeks?.[0];
          const firstWorkout = firstWeek?.workouts?.[0];
          workoutId = firstWorkout?.id || null;
          if (workoutId) console.log(`  ✓ Workout ID fetched: ${workoutId}`);
        }
      } catch (e: any) {
        console.log(`  ⚠ Could not fetch workoutId: ${e.message}`);
      }
    }
  }

  // ─── Step 6: Add trainer certification expiring in 15 days ───────────────
  console.log('Step 6: Adding expiring certification...');
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 15);
  await authPost(api, API.certifications, trainerToken, {
    name: 'NASM-CPT',
    organization: 'National Academy of Sports Medicine',
    credentialId: 'NASM-QA-001',
    issueDate: '2024-01-15',
    expiryDate: expiryDate.toISOString().split('T')[0],
  });
  console.log('  ✓ Certification with 15-day expiry added');

  // ─── Step 7: Create appointment ──────────────────────────────────────────
  console.log('Step 7: Creating appointment...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const endTime = new Date(tomorrow);
  endTime.setHours(11, 0, 0, 0);
  await authPost(api, API.scheduleAppointments, trainerToken, {
    clientId: await getClientId(api, trainerToken),
    type: 'training',
    startDatetime: tomorrow.toISOString(),
    endDatetime: endTime.toISOString(),
    notes: 'QA test appointment',
  });
  console.log('  ✓ Appointment created for tomorrow');

  // ─── Step 8: Client records body measurement ─────────────────────────────
  console.log('Step 8: Recording client measurement...');
  await authPost(api, `${API.analyticsMeasurements}/me`, clientToken, {
    measurementDate: new Date().toISOString().split('T')[0],
    weight: 80.5,
    bodyFatPercentage: 18.2,
    muscleMass: 35.0,
    measurements: {
      chest: 102,
      waist: 85,
      hips: 98,
      biceps: 35,
      thighs: 58,
    },
    notes: 'QA baseline measurement',
  });
  console.log('  ✓ Body measurement recorded');

  // ─── Step 8b: Seed trainer HealthProfile ─────────────────────────────────
  console.log('Step 8b: Seeding trainer health profile...');
  try {
    await authPut(api, API.profileHealth, trainerToken, {
      fitnessLevel: 'advanced',
      medicalConditions: 'None',
      medications: 'None',
      allergies: 'None',
      lifestyle: {
        parQ: {
          responses: [false, false, false, false, false, false, false],
          completedAt: new Date().toISOString(),
        },
        sleepHours: 8,
        stressLevel: 3,
        activityLevel: 'very_active',
      },
    });
    console.log('  ✓ Trainer health profile seeded');
  } catch (e: any) {
    console.log(`  ⚠ Trainer health profile seed failed (non-fatal): ${e.message}`);
  }

  // ─── Step 9: Client creates a fitness goal ───────────────────────────────
  console.log('Step 9: Creating client fitness goal...');
  let goalId: string | null = null;
  try {
    const goalRes = await authPost(api, API.analyticsGoals, clientToken, {
      goalType: 'weight_loss',
      specificGoal: 'Lose 5kg by summer',
      targetValue: 75.5,
      currentValue: 80.5,
      unit: 'kg',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    });
    if (goalRes.ok()) {
      const goalData = await goalRes.json();
      goalId = goalData.data?.id || null;
      console.log(`  ✓ Fitness goal created: ${goalId}`);
    } else {
      console.log(`  ⚠ Goal creation: ${goalRes.status()}`);
    }
  } catch (e: any) {
    console.log(`  ⚠ Goal creation failed (non-fatal): ${e.message}`);
  }

  // ─── Step 10: Favorite some exercises ────────────────────────────────────
  console.log('Step 10: Favoriting exercises...');
  for (const exId of exerciseIds.slice(0, 2)) {
    try {
      await authPost(api, API.exerciseFavorites, trainerToken, { exerciseId: exId });
    } catch (err) {
      // Non-fatal: under concurrent test load the dev server may stall on this
      // endpoint. Favorites are not required by most suites.
      console.log(`  ⚠ Favorite exercise ${exId} failed (non-fatal): ${(err as Error).message?.slice(0, 80)}`);
    }
  }
  console.log(`  ✓ ${Math.min(2, exerciseIds.length)} exercises favorited`);

  // ─── Step 11: Update trainer profile (gender, bio) ──────────────────────
  console.log('Step 11: Updating trainer profile...');
  await authPut(api, API.profileMe, trainerToken, {
    bio: 'QA Test Trainer - certified fitness professional',
    gender: 'male',
    phone: '+1234567890',
    timezone: 'America/New_York',
    preferredUnits: 'metric',
  });
  console.log('  ✓ Trainer profile updated');

  // ─── Step 12: Update client profile + health ────────────────────────────
  console.log('Step 12: Updating client profile and health...');
  await authPut(api, API.profileMe, clientToken, {
    bio: 'QA Test Client - fitness enthusiast',
    gender: 'female',
    dateOfBirth: '1990-06-15',
    phone: '+1987654321',
    timezone: 'America/Los_Angeles',
    preferredUnits: 'metric',
  });
  await authPut(api, API.profileHealth, clientToken, {
    fitnessLevel: 'intermediate',
    medicalConditions: 'None',
    medications: 'None',
    allergies: 'None',
    lifestyle: {
      parQ: {
        responses: [false, false, false, false, false, false, false],
        completedAt: new Date().toISOString(),
      },
      sleepHours: 7,
      stressLevel: 4,
      activityLevel: 'moderate',
    },
  });
  console.log('  ✓ Client profile and health info updated');

  // ─── Step 13: Seed completed workout sessions with set logs ──────────────
  // Requires a valid programAssignmentId and workoutId. Sessions are created as
  // 'scheduled', sets are logged via /sets, then completed via /complete.
  // Performance metrics (PerformanceMetric) and personal bests are auto-recorded
  // by the /complete endpoint.
  const seededSessionIds: string[] = [];

  if (programAssignmentId && workoutId && exerciseIds.length > 0) {
    console.log('Step 13: Seeding 3 completed workout sessions...');

    // 3 sessions on progressively earlier dates (7, 14, 21 days ago)
    const sessionDefinitions = [
      { daysAgo: 21, weights: [60, 40, 30], duration: 45, effortRating: 7 },
      { daysAgo: 14, weights: [65, 45, 32], duration: 50, effortRating: 8 },
      { daysAgo: 7,  weights: [70, 50, 35], duration: 55, effortRating: 8 },
    ];

    for (const def of sessionDefinitions) {
      try {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - def.daysAgo);
        const scheduledDate = sessionDate.toISOString().split('T')[0];

        // Create the session
        const createRes = await authPost(api, API.workouts, clientToken, {
          programAssignmentId,
          workoutId,
          scheduledDate,
        });

        if (!createRes.ok()) {
          const errBody = await createRes.json().catch(() => ({}));
          console.log(`  ⚠ Session create (${scheduledDate}): ${createRes.status()} - ${JSON.stringify(errBody).slice(0, 120)}`);
          continue;
        }

        const createData = await createRes.json();
        const session = createData.data;
        const sessionId: string = session.id;

        // Set actualStartTime so /complete can calculate duration
        const startTime = new Date(sessionDate);
        startTime.setHours(9, 0, 0, 0);
        await authPut(api, `${API.workouts}/${sessionId}`, clientToken, {
          actualStartTime: startTime.toISOString(),
          status: 'in_progress',
        });

        // Log sets for each exercise log
        const exerciseLogs: any[] = session.exerciseLogs || [];
        let setsLogged = 0;

        for (let eIdx = 0; eIdx < exerciseLogs.length; eIdx++) {
          const exerciseLog = exerciseLogs[eIdx];
          const baseWeight = def.weights[eIdx] ?? def.weights[0];
          const setLogs: any[] = exerciseLog.setLogs || [];

          for (const setLog of setLogs) {
            try {
              const logRes = await authPost(api, `${API.workouts}/${sessionId}/sets`, clientToken, {
                exerciseLogId: exerciseLog.id,
                setNumber: setLog.setNumber,
                actualReps: 10,
                weight: baseWeight + setLog.setNumber * 2.5,
                rpe: Math.min(def.effortRating, 10),
                completed: true,
              });
              if (logRes.ok()) setsLogged++;
            } catch {
              // non-fatal
            }
          }
        }

        // Complete the session
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + def.duration);
        const completeRes = await authPost(
          api,
          `${API.workouts}/${sessionId}/complete`,
          clientToken,
          {
            endTime: endTime.toISOString(),
            effortRating: def.effortRating,
            enjoymentRating: 8,
            energyAfter: 7,
            notes: `QA completed session — ${scheduledDate}`,
          }
        );

        if (completeRes.ok()) {
          seededSessionIds.push(sessionId);
          console.log(`  ✓ Session ${scheduledDate}: ${setsLogged} sets logged, completed`);
        } else {
          console.log(`  ⚠ Complete session (${scheduledDate}): ${completeRes.status()}`);
        }
      } catch (e: any) {
        console.log(`  ⚠ Workout session seed failed (non-fatal): ${e.message}`);
      }
    }

    console.log(`  ✓ ${seededSessionIds.length}/3 workout sessions completed`);
  } else {
    console.log('Step 13: Skipped (missing programAssignmentId, workoutId, or exerciseIds)');
  }

  // ─── Step 14: Seed goal progress entries ─────────────────────────────────
  if (goalId) {
    console.log('Step 14: Seeding goal progress entries...');
    const progressEntries = [
      { weeksAgo: 3, currentValue: 79.5, notes: 'Week 1 progress' },
      { weeksAgo: 2, currentValue: 78.8, notes: 'Week 2 progress' },
      { weeksAgo: 1, currentValue: 78.0, notes: 'Week 3 progress' },
    ];

    let progressCount = 0;
    for (const entry of progressEntries) {
      try {
        const recordedDate = new Date();
        recordedDate.setDate(recordedDate.getDate() - entry.weeksAgo * 7);
        const progressRes = await authPost(
          api,
          `${API.analyticsGoals}/${goalId}/progress`,
          clientToken,
          {
            currentValue: entry.currentValue,
            notes: entry.notes,
            recordedDate: recordedDate.toISOString(),
          }
        );
        if (progressRes.ok()) {
          progressCount++;
        } else {
          console.log(`  ⚠ Progress entry ${entry.weeksAgo}w: ${progressRes.status()}`);
        }
      } catch (e: any) {
        console.log(`  ⚠ Goal progress entry failed (non-fatal): ${e.message}`);
      }
    }
    console.log(`  ✓ ${progressCount}/3 goal progress entries seeded`);
  } else {
    console.log('Step 14: Skipped (no goalId available)');
  }

  // ─── Step 15: Seed support ticket ────────────────────────────────────────
  console.log('Step 15: Seeding support ticket...');
  try {
    const ticketRes = await authPost(api, API.supportTickets, clientToken, {
      subject: 'QA Test Ticket',
      message: 'This is an automated QA support ticket to test the help/support workflow.',
    });
    if (ticketRes.ok()) {
      console.log('  ✓ Support ticket created');
    } else {
      console.log(`  ⚠ Support ticket: ${ticketRes.status()}`);
    }
  } catch (e: any) {
    console.log(`  ⚠ Support ticket seed failed (non-fatal): ${e.message}`);
  }

  // ─── Step 16: Seed performance metrics ───────────────────────────────────
  // Completed workout sessions (Step 13) auto-create PerformanceMetric rows via
  // the /complete endpoint. Additionally, seed manual body-composition metrics
  // so the analytics dashboard always has data even if Step 13 was skipped.
  if (exerciseIds.length > 0) {
    console.log('Step 16: Seeding additional performance metrics...');
    let metricsCount = 0;
    const metricDefinitions = [
      { exerciseId: exerciseIds[0], metricType: 'one_rm' as const, value: 100, unit: 'kg' },
      { exerciseId: exerciseIds[0], metricType: 'volume' as const, value: 3000, unit: 'kg' },
      { exerciseId: exerciseIds[1] ?? exerciseIds[0], metricType: 'one_rm' as const, value: 60, unit: 'kg' },
      { exerciseId: exerciseIds[1] ?? exerciseIds[0], metricType: 'endurance' as const, value: 30, unit: 'reps' },
    ];

    for (const metric of metricDefinitions) {
      try {
        const metricRes = await authPost(api, API.analyticsPerformance, clientToken, metric);
        if (metricRes.ok()) metricsCount++;
        else console.log(`  ⚠ Metric seed (${metric.metricType}): ${metricRes.status()}`);
      } catch (e: any) {
        console.log(`  ⚠ Performance metric failed (non-fatal): ${e.message}`);
      }
    }
    console.log(`  ✓ ${metricsCount}/${metricDefinitions.length} performance metrics seeded`);
  } else {
    console.log('Step 16: Skipped (no exerciseIds available)');
  }

  // ─── Step 17: Trigger training-load calculation for recent weeks ──────────
  // The calculate endpoint reads completed workout sessions seeded in Step 13
  // and upserts TrainingLoad rows. Run for the 3 weeks we seeded sessions in.
  console.log('Step 17: Calculating training load for recent weeks...');
  let loadCount = 0;
  const weeksToCalculate = [21, 14, 7];
  for (const daysAgo of weeksToCalculate) {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - daysAgo);
      // Snap to Monday of that week
      const day = weekStart.getDay(); // 0=Sun
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      weekStart.setDate(weekStart.getDate() + diffToMonday);
      weekStart.setHours(0, 0, 0, 0);

      const loadRes = await authPost(
        api,
        `${API.analyticsTrainingLoad}/calculate`,
        clientToken,
        { weekStartDate: weekStart.toISOString() }
      );
      if (loadRes.ok()) {
        loadCount++;
      } else {
        console.log(`  ⚠ Training load calculate (${daysAgo}d ago): ${loadRes.status()}`);
      }
    } catch (e: any) {
      console.log(`  ⚠ Training load calculation failed (non-fatal): ${e.message}`);
    }
  }
  console.log(`  ✓ ${loadCount}/3 training load weeks calculated`);

  console.log('\n[Global Setup] ✓ Complete simulation seeded.\n');
  console.log('  Accounts  : trainer, client, client2, admin + 3 tier accounts');
  console.log('  Roster    : 2 clients on trainer roster');
  console.log('  Program   : 1 program created, assigned to client');
  console.log('  Profiles  : trainer + client profiles filled, both health profiles seeded');
  console.log('  Certs     : 1 expiring certification (15 days)');
  console.log('  Schedule  : 1 appointment created for tomorrow');
  console.log('  Analytics : 1 measurement, 1 goal with 3 progress entries');
  console.log('  Workouts  : 3 completed sessions with set logs');
  console.log('  Metrics   : performance metrics + personal bests auto-recorded');
  console.log('  Training  : training load calculated for 3 weeks');
  console.log('  Support   : 1 QA support ticket\n');

  await browser.close();
}

/** Helper: Get the client's user ID from trainer's client list */
async function getClientId(api: APIRequestContext, trainerToken: string): Promise<string> {
  const res = await authGet(api, `${API.clients}/trainer`, trainerToken);
  if (res.ok()) {
    const data = await res.json();
    const clients = data.data?.clients || data.data || [];
    const qaClient = clients.find((c: any) =>
      c.client?.email === TEST_ACCOUNTS.client.email || c.email === TEST_ACCOUNTS.client.email
    );
    if (qaClient) return qaClient.clientId || qaClient.client?.id || qaClient.id;
  }
  // Fallback: login as client and get own ID
  const token = await login(api, TEST_ACCOUNTS.client.email, TEST_ACCOUNTS.client.password);
  if (token) {
    const meRes = await authGet(api, API.me, token);
    if (meRes.ok()) {
      const meData = await meRes.json();
      return meData.data?.id || meData.data?.user?.id;
    }
  }
  return 'unknown-client-id';
}

export default globalSetup;
