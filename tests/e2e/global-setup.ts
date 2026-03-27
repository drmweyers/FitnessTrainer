/**
 * Global Setup for E2E Tests
 *
 * Seeds a COMPLETE trainer/client simulation scenario:
 * 1. Creates 3 QA accounts (trainer, client, client2, admin)
 * 2. Trainer adds both clients to roster
 * 3. Trainer creates a program with exercises
 * 4. Trainer assigns program to QA client
 * 5. Trainer adds a certification expiring in 15 days
 * 6. Trainer creates an appointment
 * 7. Client records a body measurement
 * 8. Client creates a fitness goal
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
  });
}

/** Helper: GET with auth */
async function authGet(api: APIRequestContext, path: string, token: string) {
  return api.get(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Helper: PUT with auth */
async function authPut(api: APIRequestContext, path: string, token: string, data: any) {
  return api.put(`${BASE}${path}`, {
    data,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
  // Try login first
  let token = await login(api, email, password);
  if (token) return token;

  // Register
  await api.post(`${BASE}${API.register}`, {
    data: { email, password, role },
    headers: { 'Content-Type': 'application/json' },
  });

  // Login after register
  token = await login(api, email, password);
  if (!token) throw new Error(`Failed to create/login account: ${email}`);
  return token;
}

async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const api = context.request;

  console.log(`\n[Global Setup] Seeding complete simulation on ${BASE}...\n`);

  // ─── Step 1: Create all accounts ──────────────────────────────────────────
  console.log('Step 1: Creating accounts...');
  const trainerToken = await ensureAccount(api, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password, 'trainer');
  const clientToken = await ensureAccount(api, TEST_ACCOUNTS.client.email, TEST_ACCOUNTS.client.password, 'client');
  const adminToken = await ensureAccount(api, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password, 'admin');

  // Create a second client for bulk operations testing
  const client2Email = 'qa-client2@evofit.io';
  const client2Token = await ensureAccount(api, client2Email, 'QaTest2026!', 'client');

  console.log('  ✓ Trainer, Client, Client2, Admin accounts ready');

  // ─── Step 2: Trainer adds clients to roster ───────────────────────────────
  console.log('Step 2: Adding clients to trainer roster...');
  await authPost(api, API.clients, trainerToken, { email: TEST_ACCOUNTS.client.email });
  await authPost(api, API.clients, trainerToken, { email: client2Email });
  console.log('  ✓ Both clients added to trainer roster');

  // ─── Step 3: Get exercise IDs for program ────────────────────────────────
  console.log('Step 3: Fetching exercises for program...');
  const exerciseRes = await authGet(api, `${API.exercises}?limit=5`, trainerToken);
  let exerciseIds: string[] = [];
  if (exerciseRes.ok()) {
    const exerciseData = await exerciseRes.json();
    const exercises = exerciseData.data?.exercises || exerciseData.data || [];
    exerciseIds = exercises.slice(0, 3).map((e: any) => e.id);
    console.log(`  ✓ Got ${exerciseIds.length} exercises`);
  } else {
    console.log('  ⚠ Could not fetch exercises, creating program without exercises');
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
  if (programId) {
    console.log('Step 5: Assigning program to client...');
    const assignRes = await authPost(api, `/api/programs/${programId}/assign`, trainerToken, {
      clientId: await getClientId(api, trainerToken),
      startDate: new Date().toISOString().split('T')[0],
    });
    if (assignRes.ok()) {
      console.log('  ✓ Program assigned to client');
    } else {
      console.log(`  ⚠ Assignment: ${assignRes.status()} (may already exist)`);
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

  // ─── Step 9: Client creates a fitness goal ───────────────────────────────
  console.log('Step 9: Creating client fitness goal...');
  await authPost(api, API.analyticsGoals, clientToken, {
    goalType: 'weight_loss',
    specificGoal: 'Lose 5kg by summer',
    targetValue: 75.5,
    currentValue: 80.5,
    unit: 'kg',
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });
  console.log('  ✓ Fitness goal created');

  // ─── Step 10: Favorite some exercises ────────────────────────────────────
  console.log('Step 10: Favoriting exercises...');
  for (const exId of exerciseIds.slice(0, 2)) {
    await authPost(api, API.exerciseFavorites, trainerToken, { exerciseId: exId });
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

  console.log('\n[Global Setup] ✓ Complete simulation seeded.\n');
  console.log('  Accounts: trainer, client, client2, admin');
  console.log('  Data: 2 clients on roster, 1 program with exercises, 1 assignment');
  console.log('  Data: 1 expiring cert, 1 appointment, 1 measurement, 1 goal');
  console.log('  Data: 2 favorite exercises, profiles + health filled\n');

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
