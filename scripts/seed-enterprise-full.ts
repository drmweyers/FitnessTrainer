/**
 * Enterprise Full Seed Script
 *
 * Populates EVERY database field for the enterprise trainer and QA client accounts.
 * Creates 8 weeks of realistic workout history, analytics, goals, measurements,
 * programs, appointments, certifications, and collections so every Analytics tab
 * shows real charts, trends, and performance data.
 *
 * Usage:
 *   npx tsx scripts/seed-enterprise-full.ts
 *   E2E_BASE_URL=https://trainer.evofit.io npx tsx scripts/seed-enterprise-full.ts
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

const TRAINER_EMAIL = 'qa-enterprise@evofit.io';
const TRAINER_PASSWORD = 'QaTest2026!';
const CLIENT_EMAIL = 'qa-client@evofit.io';
const CLIENT_PASSWORD = 'QaTest2026!';

// ─── Utility ──────────────────────────────────────────────────────────────────

function log(symbol: string, message: string) {
  console.log(`  ${symbol} ${message}`);
}
function ok(message: string) { log('✓', message); }
function fail(message: string) { log('✗', message); }
function section(title: string) { console.log(`\n── ${title} ─────────────────────────────────────────────`); }

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry + exponential backoff (handles Neon cold starts).
 */
async function apiFetch(
  path: string,
  options: RequestInit = {},
  retries = 5,
): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      // Treat 5xx as transient on first attempts
      if (response.status >= 500 && attempt < retries) {
        const delay = attempt * 1500;
        console.log(`    [retry ${attempt}/${retries}] ${response.status} on ${path} — waiting ${delay}ms`);
        await sleep(delay);
        continue;
      }
      return response;
    } catch (err: any) {
      if (attempt === retries) throw err;
      const delay = attempt * 1500;
      console.log(`    [retry ${attempt}/${retries}] network error on ${path} — waiting ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new Error(`All retries exhausted for ${path}`);
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Returns a date string YYYY-MM-DD for N weeks ago.
 */
function weeksAgo(n: number, dayOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7 + dayOffset);
  return d.toISOString().split('T')[0];
}

/**
 * Returns an ISO datetime string for N weeks ago at a specific hour.
 */
function weeksAgoDatetime(n: number, dayOffset: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7 + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── Step 1: Auth ─────────────────────────────────────────────────────────────

async function ensureAccount(email: string, password: string, role: string): Promise<void> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
  if (res.status === 409) {
    ok(`${email} already registered`);
    return;
  }
  if (res.status === 201) {
    // Force-verify the account so login works
    const json = await res.json();
    ok(`${email} registered (id: ${json.data?.user?.id})`);
    return;
  }
  const body = await res.text();
  throw new Error(`Register failed for ${email}: ${res.status} ${body}`);
}

async function forceVerifyAccount(email: string): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.log(`    [warn] INTERNAL_API_SECRET not set — cannot force-verify ${email}`);
    console.log(`    [info] Set INTERNAL_API_SECRET env var or manually verify via Prisma`);
    return;
  }
  const res = await apiFetch('/api/internal/force-verify', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'x-internal-secret': secret },
  });
  if (res.ok) {
    ok(`Force-verified ${email}`);
  } else {
    fail(`Force-verify ${email}: ${res.status}`);
  }
}

async function login(email: string, password: string): Promise<string> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const json = await res.json();
      const token = json.data?.tokens?.accessToken;
      if (!token) throw new Error(`No token in login response for ${email}`);
      ok(`Logged in as ${email}`);
      return token;
    }
    if (res.status === 403) {
      // Email not verified — try the internal force-verify endpoint
      ok(`Email not verified for ${email} — attempting force-verify...`);
      await forceVerifyAccount(email);
      await sleep(1000);
      continue;
    }
    const body = await res.text();
    throw new Error(`Login failed for ${email}: ${res.status} ${body}`);
  }
  throw new Error(`Could not log in as ${email} after 4 attempts`);
}

// ─── Step 2: Enterprise subscription ─────────────────────────────────────────

/**
 * Ensures the enterprise trainer has an active tier_level=3 subscription.
 * Uses the internal seed-tier endpoint if INTERNAL_API_SECRET is set,
 * otherwise falls back to the entitlements API to verify current tier.
 */
async function ensureEnterpriseSubscription(trainerToken: string): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;

  if (secret) {
    // Preferred path: call the internal seed-tier endpoint (creates subscription via Prisma)
    const res = await apiFetch('/api/internal/seed-tier', {
      method: 'POST',
      headers: { 'x-internal-secret': secret },
    });
    if (res.ok) {
      const json = await res.json();
      ok(`Seed-tier endpoint succeeded: ${JSON.stringify(json.results || {})}`);
      return;
    }
    fail(`Seed-tier endpoint returned ${res.status} — checking entitlements instead`);
  } else {
    console.log('    [info] INTERNAL_API_SECRET not set — checking entitlements to verify tier');
  }

  // Fallback: check current entitlements to see if subscription already exists
  const entRes = await apiFetch('/api/entitlements', {
    headers: authHeaders(trainerToken),
  });
  if (entRes.ok) {
    const entJson = await entRes.json();
    const tier = entJson.data?.tier;
    const level = entJson.data?.level;
    if (level >= 3) {
      ok(`Trainer already at ${tier} (level ${level}) — subscription OK`);
    } else {
      fail(`Trainer is at ${tier} (level ${level}) — expected enterprise (level 3)`);
      fail('Set INTERNAL_API_SECRET env var and re-run, or run: npx tsx scripts/seed-tier-accounts.ts');
    }
  } else {
    fail(`Entitlements check failed: ${entRes.status}`);
    fail('Analytics page will show "Analytics Unavailable" without an enterprise subscription');
    fail('Fix: set INTERNAL_API_SECRET env var, or run: npx tsx scripts/seed-tier-accounts.ts');
  }
}

// ─── Step 3: Client roster ────────────────────────────────────────────────────

async function addClientToRoster(trainerToken: string, clientEmail: string): Promise<string> {
  const res = await apiFetch('/api/clients', {
    method: 'POST',
    headers: authHeaders(trainerToken),
    body: JSON.stringify({ email: clientEmail }),
  });
  if (res.status === 409) {
    ok(`Client ${clientEmail} already on roster`);
    // Fetch client id
    const listRes = await apiFetch('/api/clients', {
      headers: authHeaders(trainerToken),
    });
    const listJson = await listRes.json();
    const client = listJson.clients?.find((c: any) => c.email === clientEmail);
    return client?.id || '';
  }
  if (res.status === 201) {
    const json = await res.json();
    ok(`Added ${clientEmail} to roster`);
    return json.id || '';
  }
  const body = await res.text();
  throw new Error(`Add client failed: ${res.status} ${body}`);
}

// ─── Step 4: Trainer profile ──────────────────────────────────────────────────

async function seedTrainerProfile(token: string): Promise<void> {
  const res = await apiFetch('/api/profiles/me', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({
      bio: 'NASM-certified personal trainer and CSCS with 12+ years of elite coaching experience. Specialising in strength and conditioning, body recomposition, and injury rehabilitation for competitive athletes and motivated everyday clients.',
      dateOfBirth: '1985-06-15',
      gender: 'male',
      phone: '+27821234567',
      whatsappNumber: '+27821234567',
      whatsappLink: 'https://wa.me/27821234567',
      timezone: 'Africa/Johannesburg',
      preferredUnits: 'metric',
      isPublic: true,
      emergencyContactName: 'Jane Enterprise',
      emergencyContactPhone: '+27829876543',
      emergencyContactRelationship: 'Spouse',
    }),
  });
  if (res.ok) { ok('Trainer profile updated'); } else { fail(`Trainer profile: ${res.status}`); }
}

// ─── Step 4b: Certifications ──────────────────────────────────────────────────

async function seedCertifications(token: string): Promise<void> {
  const certs = [
    {
      certificationName: 'NASM Certified Personal Trainer (CPT)',
      issuingOrganization: 'National Academy of Sports Medicine',
      credentialId: 'NASM-CPT-20200342',
      issueDate: '2020-03-15',
      expiryDate: '2027-03-15',
    },
    {
      certificationName: 'Certified Strength and Conditioning Specialist (CSCS)',
      issuingOrganization: 'National Strength and Conditioning Association',
      credentialId: 'NSCA-CSCS-20190887',
      issueDate: '2019-07-01',
      expiryDate: '2026-07-01',
    },
    {
      certificationName: 'Precision Nutrition Level 1 Coach',
      issuingOrganization: 'Precision Nutrition',
      credentialId: 'PN1-20210156',
      issueDate: '2021-11-20',
      expiryDate: null,
    },
  ];

  for (const cert of certs) {
    const res = await apiFetch('/api/profiles/certifications', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(cert),
    });
    if (res.ok || res.status === 201) {
      ok(`Certification: ${cert.certificationName}`);
    } else {
      fail(`Certification ${cert.certificationName}: ${res.status}`);
    }
  }
}

// ─── Step 5: Client profile ───────────────────────────────────────────────────

async function seedClientProfile(token: string): Promise<void> {
  const res = await apiFetch('/api/profiles/me', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({
      bio: 'Former recreational runner looking to build strength and improve body composition. Working with my trainer to drop body fat and build lean muscle over the next 6 months.',
      dateOfBirth: '1992-03-22',
      gender: 'female',
      phone: '+27831122334',
      timezone: 'Africa/Johannesburg',
      preferredUnits: 'metric',
      isPublic: false,
      emergencyContactName: 'David Patel',
      emergencyContactPhone: '+27839988776',
      emergencyContactRelationship: 'Partner',
    }),
  });
  if (res.ok) { ok('Client profile updated'); } else { fail(`Client profile: ${res.status}`); }
}

// ─── Step 6: Client health info ───────────────────────────────────────────────

async function seedClientHealth(token: string): Promise<void> {
  const res = await apiFetch('/api/profiles/health', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({
      bloodType: 'O+',
      medicalConditions: ['mild asthma'],
      medications: ['Ventolin inhaler (as needed)'],
      allergies: ['penicillin'],
      injuries: {
        past: [{ type: 'ACL sprain', date: '2023-06', recovered: true }],
        current: [],
      },
      parQResponses: {
        heartCondition: false,
        chestPainActivity: false,
        chestPainRest: false,
        dizziness: false,
        boneJoint: false,
        heartMedication: false,
        otherReason: false,
      },
    }),
  });
  if (res.ok) { ok('Client health info updated'); } else { fail(`Client health: ${res.status}`); }
}

// ─── Step 7: Measurements ─────────────────────────────────────────────────────

interface MeasurementData {
  week: number;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  chest: number;
  waist: number;
  hips: number;
  arms: number;
  thighs: number;
}

async function seedMeasurements(token: string): Promise<void> {
  const data: MeasurementData[] = [
    { week: 8, weight: 78.0, bodyFat: 24.0, muscleMass: 31.0, chest: 94, waist: 78, hips: 100, arms: 28, thighs: 55 },
    { week: 7, weight: 77.5, bodyFat: 23.5, muscleMass: 31.2, chest: 93.5, waist: 77, hips: 99.5, arms: 28.2, thighs: 54.8 },
    { week: 6, weight: 77.2, bodyFat: 23.1, muscleMass: 31.5, chest: 93, waist: 76.5, hips: 99, arms: 28.5, thighs: 54.5 },
    { week: 5, weight: 76.8, bodyFat: 22.6, muscleMass: 31.8, chest: 92.5, waist: 76, hips: 98.5, arms: 28.7, thighs: 54.2 },
    { week: 4, weight: 76.3, bodyFat: 22.1, muscleMass: 32.0, chest: 92, waist: 75, hips: 98, arms: 29.0, thighs: 54.0 },
    { week: 3, weight: 75.9, bodyFat: 21.7, muscleMass: 32.3, chest: 91.5, waist: 74.5, hips: 97.5, arms: 29.2, thighs: 53.8 },
    { week: 2, weight: 75.5, bodyFat: 21.3, muscleMass: 32.5, chest: 91, waist: 74, hips: 97, arms: 29.5, thighs: 53.5 },
    { week: 1, weight: 75.1, bodyFat: 20.9, muscleMass: 32.8, chest: 90.5, waist: 73.5, hips: 96.5, arms: 29.8, thighs: 53.2 },
  ];

  for (const m of data) {
    const dateStr = weeksAgo(m.week - 1);
    const res = await apiFetch('/api/analytics/measurements', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        measurementDate: dateStr,
        weight: m.weight,
        height: 168,
        bodyFatPercentage: m.bodyFat,
        muscleMass: m.muscleMass,
        measurements: {
          chest: m.chest,
          waist: m.waist,
          hips: m.hips,
          biceps: m.arms,
          thighs: m.thighs,
          neck: 34,
          shoulders: 112,
          forearms: 24,
          calves: 36,
        },
        notes: `Week ${9 - m.week} check-in measurement. Progress tracking on target.`,
      }),
    });
    if (res.ok || res.status === 201) {
      ok(`Measurement week ${9 - m.week}: ${m.weight}kg / ${m.bodyFat}% BF`);
    } else {
      const body = await res.text();
      fail(`Measurement week ${9 - m.week}: ${res.status} ${body}`);
    }
  }
}

// ─── Step 8: Fetch exercises ──────────────────────────────────────────────────

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
}

async function fetchExercises(token: string): Promise<Exercise[]> {
  const res = await apiFetch('/api/exercises?limit=100&page=1', {
    headers: authHeaders(token),
  });
  const json = await res.json();
  return json.data || json.exercises || [];
}

function findExercise(exercises: Exercise[], name: string): Exercise | undefined {
  const lower = name.toLowerCase();
  return exercises.find(e => e.name.toLowerCase().includes(lower));
}

function pickExercise(exercises: Exercise[], name: string, fallbackIndex: number): Exercise {
  return findExercise(exercises, name) || exercises[fallbackIndex % exercises.length];
}

// ─── Step 9: Programs ─────────────────────────────────────────────────────────

interface ProgramIds {
  strengthId: string;
  hiitId: string;
  flexibilityId: string;
}

function buildSetsConfig(sets: number, reps: string, rest: number, weight: string) {
  return { sets, reps, rest, weightGuidance: weight, tempo: '2-1-2-0' };
}

function buildConfigurations(sets: number, reps: string, rest: number, weight: string) {
  return Array.from({ length: sets }, (_, i) => ({
    setNumber: i + 1,
    setType: 'working' as const,
    reps,
    weightGuidance: weight,
    restSeconds: rest,
    tempo: '2-1-2-0',
  }));
}

async function findExistingProgram(token: string, name: string): Promise<string | null> {
  const res = await apiFetch('/api/programs', { headers: authHeaders(token) });
  if (!res.ok) return null;
  const json = await res.json();
  const match = json.data?.find((p: any) => p.name === name);
  return match?.id || null;
}

async function seedPrograms(token: string, exercises: Exercise[]): Promise<ProgramIds> {
  // Exercise lookups — use specific names, fall back gracefully
  const benchPress = pickExercise(exercises, 'barbell bench press', 0);
  const ohp = pickExercise(exercises, 'overhead press', 1);
  const dips = pickExercise(exercises, 'dip', 2);
  const lateralRaise = pickExercise(exercises, 'lateral raise', 3);
  const squat = pickExercise(exercises, 'barbell squat', 4);
  const rdl = pickExercise(exercises, 'romanian deadlift', 5);
  const legPress = pickExercise(exercises, 'leg press', 6);
  const calfRaise = pickExercise(exercises, 'calf raise', 7);
  const pullUp = pickExercise(exercises, 'pull-up', 8);
  const row = pickExercise(exercises, 'barbell row', 9);
  const facePull = pickExercise(exercises, 'face pull', 10);
  const bicepCurl = pickExercise(exercises, 'bicep curl', 11);

  // HIIT exercises
  const jumpSquat = pickExercise(exercises, 'jump squat', 12);
  const burpee = pickExercise(exercises, 'burpee', 13);
  const mountainClimber = pickExercise(exercises, 'mountain climber', 14);
  const highKnees = pickExercise(exercises, 'high knees', 15);
  const pushUp = pickExercise(exercises, 'push-up', 16);
  const plank = pickExercise(exercises, 'plank', 17);

  // Flexibility exercises
  const hipFlexor = pickExercise(exercises, 'hip flexor', 18);
  const hamstringStretch = pickExercise(exercises, 'hamstring stretch', 19);
  const shoulderStretch = pickExercise(exercises, 'shoulder stretch', 20);
  const childPose = pickExercise(exercises, 'child', 21);

  // ── Program A: 8-Week Strength Foundation ─────────────────────────────────
  const strengthWeeks = [];
  for (let w = 1; w <= 8; w++) {
    const isPhaseTwo = w > 4;
    const sets = isPhaseTwo ? 4 : 3;
    const reps = isPhaseTwo ? '6-8' : '8-12';
    const rest = isPhaseTwo ? 120 : 90;
    const weight = isPhaseTwo ? 'Increase 2.5-5kg from last week' : 'Moderate — RPE 7-8';

    strengthWeeks.push({
      weekNumber: w,
      name: `Week ${w}${isPhaseTwo ? ' — Progressive Overload Phase' : ' — Foundation Phase'}`,
      description: isPhaseTwo
        ? 'Increase intensity — add weight, reduce reps, maintain volume.'
        : 'Establish baseline, focus on form and full range of motion.',
      isDeload: false,
      workouts: [
        {
          dayNumber: 1,
          name: 'Upper Body Push',
          description: 'Chest, shoulders, triceps. Compound movements first.',
          workoutType: 'strength',
          estimatedDuration: 55,
          isRestDay: false,
          exercises: [
            {
              exerciseId: benchPress.id,
              orderIndex: 0,
              setsConfig: buildSetsConfig(sets, reps, rest, weight),
              configurations: buildConfigurations(sets, reps, rest, weight),
            },
            {
              exerciseId: ohp.id,
              orderIndex: 1,
              setsConfig: buildSetsConfig(sets, reps, rest, weight),
              configurations: buildConfigurations(sets, reps, rest, weight),
            },
            {
              exerciseId: dips.id,
              orderIndex: 2,
              setsConfig: buildSetsConfig(sets, '8-10', 90, 'Bodyweight or +weight'),
              configurations: buildConfigurations(sets, '8-10', 90, 'Bodyweight or +weight'),
            },
            {
              exerciseId: lateralRaise.id,
              orderIndex: 3,
              setsConfig: buildSetsConfig(sets, '12-15', 60, 'Light — focus on control'),
              configurations: buildConfigurations(sets, '12-15', 60, 'Light — focus on control'),
            },
          ],
        },
        {
          dayNumber: 2,
          name: 'Lower Body',
          description: 'Quads, hamstrings, glutes, calves. Drive leg strength.',
          workoutType: 'strength',
          estimatedDuration: 60,
          isRestDay: false,
          exercises: [
            {
              exerciseId: squat.id,
              orderIndex: 0,
              setsConfig: buildSetsConfig(sets, reps, rest + 30, weight),
              configurations: buildConfigurations(sets, reps, rest + 30, weight),
            },
            {
              exerciseId: rdl.id,
              orderIndex: 1,
              setsConfig: buildSetsConfig(sets, reps, rest, weight),
              configurations: buildConfigurations(sets, reps, rest, weight),
            },
            {
              exerciseId: legPress.id,
              orderIndex: 2,
              setsConfig: buildSetsConfig(sets, '10-12', 90, 'Moderate-heavy'),
              configurations: buildConfigurations(sets, '10-12', 90, 'Moderate-heavy'),
            },
            {
              exerciseId: calfRaise.id,
              orderIndex: 3,
              setsConfig: buildSetsConfig(sets, '15-20', 60, 'Moderate'),
              configurations: buildConfigurations(sets, '15-20', 60, 'Moderate'),
            },
          ],
        },
        {
          dayNumber: 3,
          name: 'Upper Body Pull',
          description: 'Back, biceps, rear delts. Balance the push days.',
          workoutType: 'strength',
          estimatedDuration: 55,
          isRestDay: false,
          exercises: [
            {
              exerciseId: pullUp.id,
              orderIndex: 0,
              setsConfig: buildSetsConfig(sets, '6-10', rest, 'Bodyweight or assisted'),
              configurations: buildConfigurations(sets, '6-10', rest, 'Bodyweight or assisted'),
            },
            {
              exerciseId: row.id,
              orderIndex: 1,
              setsConfig: buildSetsConfig(sets, reps, rest, weight),
              configurations: buildConfigurations(sets, reps, rest, weight),
            },
            {
              exerciseId: facePull.id,
              orderIndex: 2,
              setsConfig: buildSetsConfig(sets, '15-20', 60, 'Light cable'),
              configurations: buildConfigurations(sets, '15-20', 60, 'Light cable'),
            },
            {
              exerciseId: bicepCurl.id,
              orderIndex: 3,
              setsConfig: buildSetsConfig(sets, '10-12', 60, 'Moderate dumbbell'),
              configurations: buildConfigurations(sets, '10-12', 60, 'Moderate dumbbell'),
            },
          ],
        },
      ],
    });
  }

  let strengthId = await findExistingProgram(token, '8-Week Strength Foundation');
  if (strengthId) {
    ok(`Program A (Strength Foundation) already exists: ${strengthId}`);
  } else {
    const strengthRes = await apiFetch('/api/programs', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        name: '8-Week Strength Foundation',
        description: 'Progressive strength program targeting all major muscle groups. 3 days per week with upper/lower split. Weeks 1-4 establish baseline, weeks 5-8 drive progressive overload.',
        programType: 'strength',
        difficultyLevel: 'intermediate',
        durationWeeks: 8,
        goals: ['Build foundational strength', 'Improve movement patterns', 'Establish training habit'],
        equipmentNeeded: ['Barbell', 'Dumbbells', 'Cable machine', 'Pull-up bar'],
        isTemplate: false,
        weeks: strengthWeeks,
      }),
    });

    if (!strengthRes.ok && strengthRes.status !== 201) {
      const body = await strengthRes.text();
      throw new Error(`Create strength program failed: ${strengthRes.status} ${body.slice(0, 300)}`);
    }
    const strengthJson = await strengthRes.json();
    strengthId = strengthJson.data?.id;
    ok(`Program A (Strength Foundation) created: ${strengthId}`);
  }

  // Let Neon connection pool recover before next large transaction
  await sleep(5000);

  // ── Program B: HIIT Fat Burner ─────────────────────────────────────────────
  let hiitId = await findExistingProgram(token, 'HIIT Fat Burner — 4 Week Blast');
  if (hiitId) {
    ok(`Program B (HIIT Fat Burner) already exists: ${hiitId}`);
  } else {
  const hiitRes = await apiFetch('/api/programs', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      name: 'HIIT Fat Burner — 4 Week Blast',
      description: 'High-intensity interval training for maximum calorie burn. 2 days/week circuit format, 6 exercises per session. Best combined with strength training.',
      programType: 'endurance',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
      goals: ['Burn body fat', 'Improve cardiovascular fitness', 'Boost metabolic rate'],
      equipmentNeeded: ['Bodyweight', 'Timer'],
      isTemplate: false,
      weeks: Array.from({ length: 4 }, (_, wi) => ({
        weekNumber: wi + 1,
        name: `Week ${wi + 1}`,
        description: 'Circuit training — 40 seconds work / 20 seconds rest',
        workouts: [
          {
            dayNumber: 1,
            name: 'HIIT Circuit A',
            workoutType: 'hiit',
            estimatedDuration: 30,
            exercises: [
              { exerciseId: jumpSquat.id, orderIndex: 0, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: pushUp.id, orderIndex: 1, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: mountainClimber.id, orderIndex: 2, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: highKnees.id, orderIndex: 3, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: burpee.id, orderIndex: 4, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: plank.id, orderIndex: 5, setsConfig: { sets: 3, duration: 40, rest: 20 } },
            ],
          },
          {
            dayNumber: 2,
            name: 'HIIT Circuit B',
            workoutType: 'hiit',
            estimatedDuration: 30,
            exercises: [
              { exerciseId: highKnees.id, orderIndex: 0, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: burpee.id, orderIndex: 1, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: jumpSquat.id, orderIndex: 2, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: mountainClimber.id, orderIndex: 3, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: plank.id, orderIndex: 4, setsConfig: { sets: 3, duration: 40, rest: 20 } },
              { exerciseId: pushUp.id, orderIndex: 5, setsConfig: { sets: 3, duration: 40, rest: 20 } },
            ],
          },
        ],
      })),
    }),
  });

  if (!hiitRes.ok && hiitRes.status !== 201) {
    const body = await hiitRes.text();
    fail(`Program B (HIIT) failed: ${hiitRes.status} ${body.slice(0, 200)}`);
  }
  const hiitJson = hiitRes.ok || hiitRes.status === 201 ? await hiitRes.json() : { data: null };
  hiitId = hiitJson.data?.id;
  if (hiitId) ok(`Program B (HIIT Fat Burner) created: ${hiitId}`);
  }

  // Let Neon connection pool recover
  await sleep(5000);

  // ── Program C: Flexibility & Recovery ─────────────────────────────────────
  let flexibilityId = await findExistingProgram(token, 'Flexibility & Recovery Protocol');
  if (flexibilityId) {
    ok(`Program C (Flexibility) already exists: ${flexibilityId}`);
  } else {
  const flexRes = await apiFetch('/api/programs', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      name: 'Flexibility & Recovery Protocol',
      description: 'Mobility-focused program to complement strength training. Reduces injury risk, improves posture, and accelerates recovery between strength sessions.',
      programType: 'rehabilitation',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
      goals: ['Improve flexibility', 'Reduce DOMS', 'Enhance posture'],
      equipmentNeeded: ['Yoga mat', 'Foam roller'],
      isTemplate: false,
      weeks: Array.from({ length: 4 }, (_, wi) => ({
        weekNumber: wi + 1,
        name: `Week ${wi + 1}`,
        workouts: [
          {
            dayNumber: 1,
            name: 'Full Body Mobility',
            workoutType: 'flexibility',
            estimatedDuration: 40,
            exercises: [
              { exerciseId: hipFlexor.id, orderIndex: 0, setsConfig: { sets: 2, duration: 60, rest: 30 } },
              { exerciseId: hamstringStretch.id, orderIndex: 1, setsConfig: { sets: 2, duration: 60, rest: 30 } },
              { exerciseId: shoulderStretch.id, orderIndex: 2, setsConfig: { sets: 2, duration: 45, rest: 20 } },
              { exerciseId: childPose.id, orderIndex: 3, setsConfig: { sets: 2, duration: 90, rest: 30 } },
            ],
          },
          {
            dayNumber: 2,
            name: 'Lower Body Mobility',
            workoutType: 'flexibility',
            estimatedDuration: 35,
            exercises: [
              { exerciseId: hamstringStretch.id, orderIndex: 0, setsConfig: { sets: 3, duration: 60, rest: 30 } },
              { exerciseId: hipFlexor.id, orderIndex: 1, setsConfig: { sets: 3, duration: 60, rest: 30 } },
              { exerciseId: childPose.id, orderIndex: 2, setsConfig: { sets: 2, duration: 90, rest: 30 } },
            ],
          },
        ],
      })),
    }),
  });

  if (!flexRes.ok && flexRes.status !== 201) {
    const body = await flexRes.text();
    fail(`Program C (Flexibility) failed: ${flexRes.status} ${body.slice(0, 200)}`);
  }
  const flexJson = flexRes.ok || flexRes.status === 201 ? await flexRes.json() : { data: null };
  flexibilityId = flexJson.data?.id;
  if (flexibilityId) ok(`Program C (Flexibility) created: ${flexibilityId}`);
  }

  return { strengthId: strengthId!, hiitId: hiitId!, flexibilityId: flexibilityId! };
}

// ─── Step 10: Assign programs ─────────────────────────────────────────────────

async function assignProgram(
  token: string,
  programId: string,
  clientId: string,
  startDate: string,
): Promise<string> {
  const res = await apiFetch(`/api/programs/${programId}/assign`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ clientId, startDate }),
  });
  if (res.status === 409) {
    // The 409 response includes the existing assignment record in data
    const json = await res.json();
    const existingId = json.data?.id;
    ok(`Program already assigned (assignment id: ${existingId})`);
    if (existingId) return existingId;
    // Fallback: fetch via program detail
    const detailRes = await apiFetch(`/api/programs/${programId}`, { headers: authHeaders(token) });
    const detailJson = await detailRes.json();
    const assignment = detailJson.data?.assignments?.find((a: any) => a.clientId === clientId || a.client?.id === clientId);
    return assignment?.id || '';
  }
  if (res.ok || res.status === 201) {
    const json = await res.json();
    ok(`Program assigned (assignment id: ${json.data?.id})`);
    return json.data?.id || '';
  }
  const body = await res.text();
  throw new Error(`Assign program failed: ${res.status} ${body}`);
}

// ─── Step 11: Workout sessions & logs ────────────────────────────────────────

interface SessionWeightData {
  benchStart: number; benchEnd: number;
  squatStart: number; squatEnd: number;
  rdlStart: number; rdlEnd: number;
  ohpStart: number; ohpEnd: number;
  rowStart: number; rowEnd: number;
}

// Progressive weight over 8 weeks
const progressionWeights: SessionWeightData = {
  benchStart: 40, benchEnd: 55,
  squatStart: 60, squatEnd: 80,
  rdlStart: 70, rdlEnd: 95,
  ohpStart: 25, ohpEnd: 37.5,
  rowStart: 45, rowEnd: 65,
};

function getWeight(start: number, end: number, week: number): number {
  const t = (week - 1) / 7;
  return Math.round((start + (end - start) * t) * 2) / 2; // nearest 0.5kg
}

async function seedWorkoutSessions(
  _trainerToken: string,
  _clientToken: string,
  clientId: string,
  strengthProgramId: string,
  assignmentId: string,
): Promise<void> {
  // Re-authenticate to get fresh tokens for this long-running section
  let trainerToken = await login(TRAINER_EMAIL, TRAINER_PASSWORD);
  let clientToken = await login(CLIENT_EMAIL, CLIENT_PASSWORD);

  // Fetch the program to get workout IDs
  const progRes = await apiFetch(`/api/programs/${strengthProgramId}`, {
    headers: authHeaders(trainerToken),
  });
  const progJson = await progRes.json();
  const program = progJson.data;

  if (!program?.weeks?.length) {
    fail('Could not fetch program weeks — skipping workout sessions');
    return;
  }

  // Build a map: weekNumber -> dayNumber -> workoutId
  const workoutMap: Record<number, Record<number, string>> = {};
  for (const week of program.weeks) {
    workoutMap[week.weekNumber] = {};
    for (const workout of week.workouts || []) {
      workoutMap[week.weekNumber][workout.dayNumber] = workout.id;
    }
  }

  // 3 sessions per week × 8 weeks = 24 sessions
  // Days: Mon(dayOffset=0), Wed(dayOffset=2), Fri(dayOffset=4)
  const sessionDayOffsets = [0, 2, 4];
  const dayNumbers = [1, 2, 3]; // Upper Push, Lower, Upper Pull

  const sessionNotes = [
    'Felt great today, form was solid throughout.',
    'A bit tired but pushed through. Good session.',
    'Personal best on squats — very happy.',
    'Focused on tempo today, every rep controlled.',
    'Slight shoulder tightness, avoided heavy OH pressing.',
    'Strong session. Energy levels high.',
    'Really dialled in the mind-muscle connection.',
    'New rep PR on bench press.',
    'Nailed the pull-up progression.',
    'Excellent session overall.',
    'Could feel the progressive overload kicking in.',
    'Tough workout but completed all planned sets.',
    'Best lower body session yet.',
    'Fatigue managed well, recovery on track.',
    'Peaked RPE 8 on all main lifts.',
    'Felt strong and confident throughout.',
    'Good energy, completed with 2 RIR on main sets.',
    'Row weight increased — back is getting stronger.',
    'Perfect form day — every rep by the book.',
    'Volume increased, recovery is solid.',
    'Pushing the boundary on squat depth.',
    'Final week intensity is up. Feeling the gains.',
    'Last push day of the program — all PRs.',
    'Final session complete. 8 weeks done!',
  ];

  let sessionCount = 0;

  for (let weekNum = 1; weekNum <= 8; weekNum++) {
    // Refresh tokens every 2 weeks to avoid JWT expiration during long seeding
    if (weekNum === 3 || weekNum === 5 || weekNum === 7) {
      clientToken = await login(CLIENT_EMAIL, CLIENT_PASSWORD);
    }

    const weeksFromNow = 8 - weekNum; // week 1 = 8 weeks ago, week 8 = current week

    for (let dayIdx = 0; dayIdx < 3; dayIdx++) {
      const dayNumber = dayNumbers[dayIdx];
      const workoutId = workoutMap[weekNum]?.[dayNumber];

      if (!workoutId) {
        fail(`No workoutId for week ${weekNum} day ${dayNumber}`);
        continue;
      }

      const dayOffset = sessionDayOffsets[dayIdx];
      const scheduledDate = weeksAgo(weeksFromNow, dayOffset);
      const startHour = 7; // 7am sessions
      const startTime = weeksAgoDatetime(weeksFromNow, dayOffset, startHour);
      const endTime = weeksAgoDatetime(weeksFromNow, dayOffset, startHour + 1);

      // Create session via client token (complete endpoint requires clientId == user.id)
      const sessionRes = await apiFetch('/api/workouts', {
        method: 'POST',
        headers: authHeaders(clientToken),
        body: JSON.stringify({
          programAssignmentId: assignmentId,
          workoutId,
          scheduledDate,
        }),
      });

      if (!sessionRes.ok && sessionRes.status !== 200) {
        const body = await sessionRes.text();
        fail(`Session creation week ${weekNum} day ${dayNumber}: ${sessionRes.status} ${body}`);
        continue;
      }

      const sessionJson = await sessionRes.json();
      const sessionId = sessionJson.data?.id;

      if (!sessionId) {
        fail(`No session ID returned for week ${weekNum} day ${dayNumber}`);
        continue;
      }

      // Update the session with actual start time
      await apiFetch(`/api/workouts/${sessionId}`, {
        method: 'PUT',
        headers: authHeaders(clientToken),
        body: JSON.stringify({ actualStartTime: startTime }),
      });

      // Log sets for each exercise in the session
      const exerciseLogs = sessionJson.data?.exerciseLogs || [];

      for (const exerciseLog of exerciseLogs) {
        const exerciseName = exerciseLog.exercise?.name?.toLowerCase() || '';
        let baseWeight = 30;

        if (exerciseName.includes('bench')) {
          baseWeight = getWeight(progressionWeights.benchStart, progressionWeights.benchEnd, weekNum);
        } else if (exerciseName.includes('squat')) {
          baseWeight = getWeight(progressionWeights.squatStart, progressionWeights.squatEnd, weekNum);
        } else if (exerciseName.includes('romanian') || exerciseName.includes('rdl') || exerciseName.includes('deadlift')) {
          baseWeight = getWeight(progressionWeights.rdlStart, progressionWeights.rdlEnd, weekNum);
        } else if (exerciseName.includes('overhead') || exerciseName.includes('press') && !exerciseName.includes('bench')) {
          baseWeight = getWeight(progressionWeights.ohpStart, progressionWeights.ohpEnd, weekNum);
        } else if (exerciseName.includes('row')) {
          baseWeight = getWeight(progressionWeights.rowStart, progressionWeights.rowEnd, weekNum);
        } else if (exerciseName.includes('pull')) {
          baseWeight = 0; // bodyweight
        } else if (exerciseName.includes('lateral') || exerciseName.includes('curl') || exerciseName.includes('face')) {
          baseWeight = 10 + weekNum;
        } else if (exerciseName.includes('leg press')) {
          baseWeight = getWeight(80, 120, weekNum);
        } else if (exerciseName.includes('calf')) {
          baseWeight = 40 + weekNum * 2;
        } else if (exerciseName.includes('dip')) {
          baseWeight = 0;
        }

        const setLogs = exerciseLog.setLogs || [];
        const rpe = 6.5 + (weekNum - 1) * 0.25; // increases from 6.5 to 8.25

        for (const setLog of setLogs) {
          // Add slight variation per set
          const setVariation = setLog.setNumber === 1 ? 0 : setLog.setNumber === 2 ? 0 : -2.5;
          const actualWeight = Math.max(0, baseWeight + setVariation);
          const actualReps = dayNumber === 2 ? 10 : 10; // 10 reps across all

          await apiFetch(`/api/workouts/${sessionId}/sets`, {
            method: 'POST',
            headers: authHeaders(clientToken),
            body: JSON.stringify({
              exerciseLogId: exerciseLog.id,
              setNumber: setLog.setNumber,
              actualReps,
              weight: actualWeight,
              rpe: Math.min(10, Math.round(rpe * 10) / 10),
              restTime: 90,
              tempo: '2-1-2-0',
              completed: true,
            }),
          });
        }
      }

      // Complete the session
      const effortRating = Math.min(9, Math.round(6 + weekNum * 0.35));
      const completeRes = await apiFetch(`/api/workouts/${sessionId}/complete`, {
        method: 'POST',
        headers: authHeaders(clientToken),
        body: JSON.stringify({
          notes: sessionNotes[sessionCount % sessionNotes.length],
          endTime,
          effortRating,
          enjoymentRating: Math.min(9, Math.round(7 + weekNum * 0.2)),
          energyAfter: Math.min(9, Math.round(7 + weekNum * 0.15)),
        }),
      });

      if (completeRes.ok) {
        ok(`Session week ${weekNum} day ${dayNumber} completed (${scheduledDate})`);
      } else {
        const body = await completeRes.text();
        fail(`Complete session week ${weekNum} day ${dayNumber}: ${completeRes.status} ${body}`);
      }

      sessionCount++;
    }
  }
}

// ─── Step 12: Training load calculation ───────────────────────────────────────

async function seedTrainingLoad(clientToken: string): Promise<void> {
  // Trigger training load calculation for each of the 8 past weeks
  for (let weekNum = 1; weekNum <= 8; weekNum++) {
    const weeksFromNow = 8 - weekNum;
    // Find the Monday of this week
    const d = new Date();
    d.setDate(d.getDate() - weeksFromNow * 7);
    // Rewind to Monday
    const dayOfWeek = d.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    d.setDate(d.getDate() + mondayOffset);
    const weekStartDate = d.toISOString().split('T')[0];

    const res = await apiFetch('/api/analytics/training-load/calculate', {
      method: 'POST',
      headers: authHeaders(clientToken),
      body: JSON.stringify({ weekStartDate }),
    });

    if (res.ok) {
      const json = await res.json();
      const vol = json.data?.totalVolume;
      const sets = json.data?.totalSets;
      ok(`Training load week ${weekNum}: volume=${typeof vol === 'number' ? vol.toFixed(0) : vol}kg sets=${sets}`);
    } else {
      const body = await res.text();
      fail(`Training load week ${weekNum}: ${res.status} ${body.slice(0, 200)}`);
    }
  }
}

// ─── Step 13: Goals with progress ─────────────────────────────────────────────

async function seedGoals(clientToken: string): Promise<void> {
  const today = new Date();
  const in2months = new Date(today); in2months.setMonth(today.getMonth() + 2);
  const in3months = new Date(today); in3months.setMonth(today.getMonth() + 3);
  const in4months = new Date(today); in4months.setMonth(today.getMonth() + 4);

  const goals = [
    {
      goalType: 'weight_loss',
      specificGoal: 'Reach target weight of 72kg through strength training and nutrition',
      targetValue: 72,
      targetDate: in3months.toISOString().split('T')[0],
      priority: 1,
      // Progress: started at 78, now at 75.1 — show weekly check-ins
      progressEntries: [
        { week: 7, value: 78.0, pct: 0, note: 'Starting weight — baseline measurement' },
        { week: 6, value: 77.5, pct: 8.3, note: 'Good start, 0.5kg lost' },
        { week: 5, value: 77.2, pct: 13.3, note: 'Consistent progress' },
        { week: 4, value: 76.8, pct: 20, note: 'On track with nutrition and training' },
        { week: 3, value: 76.3, pct: 28.3, note: 'Momentum building' },
        { week: 2, value: 75.9, pct: 35, note: 'Stronger every week' },
        { week: 1, value: 75.5, pct: 41.7, note: 'Feeling great, visible changes' },
        { week: 0, value: 75.1, pct: 47.8, note: 'Current — 2.9kg lost in 8 weeks' },
      ],
    },
    {
      goalType: 'strength',
      specificGoal: 'Achieve a 70kg bench press for 1 rep',
      targetValue: 70,
      targetDate: in2months.toISOString().split('T')[0],
      priority: 2,
      // Progress: started ~40kg working weight, estimated 1RM climbs toward 70kg
      progressEntries: [
        { week: 7, value: 50, pct: 71.4, note: 'Week 1 estimated 1RM' },
        { week: 6, value: 52, pct: 74.3, note: 'Form improved significantly' },
        { week: 5, value: 54, pct: 77.1, note: 'New working weight record' },
        { week: 4, value: 56, pct: 80, note: 'Hitting 80% of target' },
        { week: 3, value: 58, pct: 82.9, note: 'Shoulder health excellent' },
        { week: 2, value: 60, pct: 85.7, note: 'Confidence is high' },
        { week: 1, value: 63, pct: 90, note: 'Very close to target' },
        { week: 0, value: 65, pct: 92.9, note: 'Current estimated 1RM' },
      ],
    },
    {
      goalType: 'general_fitness',
      specificGoal: 'Reduce body fat percentage to 18%',
      targetValue: 18,
      targetDate: in4months.toISOString().split('T')[0],
      priority: 3,
      // Progress: started at 24%, now at 20.9%
      progressEntries: [
        { week: 7, value: 24, pct: 0, note: 'Baseline body fat' },
        { week: 6, value: 23.5, pct: 8.3, note: 'Initial drop — water and inflammation' },
        { week: 5, value: 23.1, pct: 15, note: 'True fat loss beginning' },
        { week: 4, value: 22.6, pct: 23.3, note: 'Consistent caloric deficit' },
        { week: 3, value: 22.1, pct: 31.7, note: 'Muscle mass protecting BMR' },
        { week: 2, value: 21.7, pct: 38.3, note: 'Getting leaner, staying strong' },
        { week: 1, value: 21.3, pct: 45, note: 'Visible mid-section changes' },
        { week: 0, value: 20.9, pct: 51.7, note: 'Current — 3.1% dropped so far' },
      ],
    },
    {
      goalType: 'endurance',
      specificGoal: 'Complete all 3 scheduled training sessions per week for 12 consecutive weeks',
      targetValue: 36,
      targetDate: in3months.toISOString().split('T')[0],
      priority: 4,
      // Progress: sessions completed so far
      progressEntries: [
        { week: 7, value: 3, pct: 8.3, note: 'Week 1 complete — 3/36 sessions' },
        { week: 6, value: 6, pct: 16.7, note: 'Week 2 — perfect attendance' },
        { week: 5, value: 9, pct: 25, note: 'Week 3 — on a roll' },
        { week: 4, value: 12, pct: 33.3, note: 'Week 4 — one month of consistency' },
        { week: 3, value: 15, pct: 41.7, note: 'Week 5 — building the habit' },
        { week: 2, value: 18, pct: 50, note: 'Week 6 — halfway to goal' },
        { week: 1, value: 21, pct: 58.3, note: 'Week 7 — not missed a session' },
        { week: 0, value: 24, pct: 66.7, note: 'Week 8 — 24 sessions completed' },
      ],
    },
  ];

  for (const goalDef of goals) {
    const res = await apiFetch('/api/analytics/goals', {
      method: 'POST',
      headers: authHeaders(clientToken),
      body: JSON.stringify({
        goalType: goalDef.goalType,
        specificGoal: goalDef.specificGoal,
        targetValue: goalDef.targetValue,
        targetDate: goalDef.targetDate,
        priority: goalDef.priority,
      }),
    });

    if (!res.ok && res.status !== 201) {
      const body = await res.text();
      fail(`Goal ${goalDef.goalType}: ${res.status} ${body}`);
      continue;
    }

    const goalJson = await res.json();
    const goalId = goalJson.data?.id;
    ok(`Goal created: ${goalDef.specificGoal.substring(0, 50)}...`);

    // Add progress entries
    for (const entry of goalDef.progressEntries) {
      const progressDate = weeksAgo(entry.week);
      const progressRes = await apiFetch(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        headers: authHeaders(clientToken),
        body: JSON.stringify({
          currentValue: entry.value,
          notes: entry.note,
          recordedDate: progressDate,
        }),
      });
      if (!progressRes.ok && progressRes.status !== 201) {
        const body = await progressRes.text();
        fail(`Goal progress: ${progressRes.status} ${body}`);
      }
    }
    ok(`Goal progress: ${goalDef.progressEntries.length} entries added`);
  }
}

// ─── Step 14: Availability + appointments ────────────────────────────────────

async function seedAvailability(trainerToken: string): Promise<void> {
  // Mon=1, Tue=2, Wed=3, Thu=4, Fri=5
  const slots = [1, 2, 3, 4, 5].map(day => ({
    dayOfWeek: day,
    startTime: '06:00',
    endTime: '20:00',
    isAvailable: true,
    location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
  }));

  const res = await apiFetch('/api/schedule/availability', {
    method: 'POST',
    headers: authHeaders(trainerToken),
    body: JSON.stringify({ slots }),
  });

  if (res.ok) {
    ok('Availability set for Mon-Fri 06:00-20:00');
  } else {
    fail(`Availability: ${res.status}`);
  }
}

async function seedAppointments(
  trainerToken: string,
  clientId: string,
): Promise<void> {
  // 12-day continuous schedule: Day 1-12 covering past training + upcoming sessions
  // This creates a realistic day-by-day calendar view showing trainer-client interaction
  const appointmentDefs = [
    // Day 1 — Initial Assessment
    {
      title: 'Day 1 — Initial Fitness Assessment',
      description: 'Comprehensive baseline: movement screening, body composition (DEXA), 1RM estimates, PAR-Q review, goal setting session.',
      appointmentType: 'assessment',
      daysAgo: 11,
      hour: 9,
      durationHours: 1.5,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'Baseline: 78kg, 24% BF. Movement screen: mild anterior pelvic tilt, tight hip flexors (noted ACL history). Goals: 72kg target weight, bench 70kg 1RM. PAR-Q cleared. Nutrition consult booked for Day 3.',
    },
    // Day 2 — First Training Session
    {
      title: 'Day 2 — Upper Body Push (Week 1)',
      description: 'Bench press 3×10 @ 40kg, OHP 3×10 @ 20kg, dips 3×8 BW, lateral raises 3×12 @ 6kg. Focus on form and ROM.',
      appointmentType: 'one_on_one',
      daysAgo: 10,
      hour: 7,
      durationHours: 1,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'Excellent first session. Client showed good mind-muscle connection. Bench form needs cue: "pull shoulder blades together". All sets completed. RPE 6-7.',
    },
    // Day 3 — Nutrition Consultation (online)
    {
      title: 'Day 3 — Nutrition Strategy Consultation',
      description: 'Caloric targets, macronutrient breakdown, meal timing, hydration, supplement review. Online session via Zoom.',
      appointmentType: 'consultation',
      daysAgo: 9,
      hour: 11,
      durationHours: 1,
      location: 'Online — Zoom',
      isOnline: true,
      meetingLink: 'https://zoom.us/j/1234567890',
      notes: 'Set 1,800kcal/day target (500kcal deficit). Macros: 145g protein, 135g carbs, 60g fat. Meal prep Sunday + Wednesday. Creatine 5g/day, vitamin D 2000IU. Hydration target 2.5L.',
    },
    // Day 4 — Lower Body
    {
      title: 'Day 4 — Lower Body (Week 1)',
      description: 'Squats 3×10 @ 60kg, Romanian deadlift 3×10 @ 50kg, leg press 3×12, calf raises 3×15. Focus on depth and bracing.',
      appointmentType: 'one_on_one',
      daysAgo: 8,
      hour: 7,
      durationHours: 1,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'Squat depth improving with ankle mobility drill warm-up. RDL hamstring engagement excellent. Noted mild DOMS from Day 2 push session — normal adaptation. RPE 7.',
    },
    // Day 5 — Rest/Recovery Check-in
    {
      title: 'Day 5 — Active Recovery & Mobility Check-in',
      description: 'Light stretching, foam rolling protocol, recovery assessment. Quick 30-min session.',
      appointmentType: 'one_on_one',
      daysAgo: 7,
      hour: 8,
      durationHours: 0.5,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'DOMS subsiding well. Hip flexor stretching protocol reviewed (3×30s each side daily). Foam roll IT band and quads. Sleep improved to 7.5hrs — keep it up. Hydration on target.',
    },
    // Day 6 — Upper Body Pull
    {
      title: 'Day 6 — Upper Body Pull (Week 1)',
      description: 'Assisted pull-ups 3×8, barbell rows 3×10 @ 35kg, face pulls 3×15, bicep curls 3×12. Back width focus.',
      appointmentType: 'one_on_one',
      daysAgo: 6,
      hour: 7,
      durationHours: 1,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'Pull-up progression: band-assisted, 3 sets of 8. Rows: focused on squeeze at top. Face pulls excellent for rear delt activation. Client enjoying training — energy levels increasing. RPE 7.',
    },
    // Day 7 — Progress Photos + Measurements
    {
      title: 'Day 7 — Weekly Measurements & Progress Photos',
      description: 'Week 1 check-in: body measurements (9-site), progress photos (front/side/back), weight, body fat caliper test.',
      appointmentType: 'assessment',
      daysAgo: 5,
      hour: 8,
      durationHours: 0.5,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'Week 1 results: 77.5kg (-0.5kg), BF 23.5% (-0.5%). Waist down 1cm. Excellent first week response to training + nutrition. Client motivated. Adjusted next week volume slightly up.',
    },
    // Day 8 — Upper Body Push (Week 2)
    {
      title: 'Day 8 — Upper Body Push (Week 2 — Progressive Overload)',
      description: 'Bench press 3×10 @ 42.5kg (+2.5kg), OHP 3×10 @ 22.5kg, dips 3×10 BW, lateral raises 3×12 @ 7kg.',
      appointmentType: 'one_on_one',
      daysAgo: 4,
      hour: 7,
      durationHours: 1,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'First progressive overload session. Bench at 42.5kg — all reps clean. OHP up 2.5kg. Dips progressed to 10 reps per set. Client self-correcting shoulder blade retraction cue. RPE 7.5.',
    },
    // Day 9 — Lower Body (Week 2)
    {
      title: 'Day 9 — Lower Body (Week 2 — Progressive Overload)',
      description: 'Squats 3×10 @ 65kg (+5kg), RDL 3×10 @ 55kg, leg press 3×12 heavier, calf raises 3×15 loaded.',
      appointmentType: 'one_on_one',
      daysAgo: 3,
      hour: 7,
      durationHours: 1,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'Squat jumped 5kg to 65kg — excellent depth maintained with new ankle mobility. RDL form dialled in. Leg press: 3 plates per side. Client reporting better energy throughout the day. RPE 7.5.',
    },
    // Day 10 — Online Check-in
    {
      title: 'Day 10 — Mid-Week Online Check-in',
      description: 'Nutrition diary review, sleep and recovery tracking, mental wellbeing check, next session prep.',
      appointmentType: 'online_session',
      daysAgo: 2,
      hour: 18,
      durationHours: 0.5,
      location: 'Online — Zoom',
      isOnline: true,
      meetingLink: 'https://zoom.us/j/1234567890',
      notes: 'Nutrition compliance 90% this week. Missed protein target Tuesday (work lunch). Sleep averaging 7.2hrs. Stress moderate — work deadline Friday. Advised lighter session if fatigue spikes. Protein shake at desk for backup.',
    },
    // Day 11 — Upper Body Pull (Week 2)
    {
      title: 'Day 11 — Upper Body Pull (Week 2)',
      description: 'Assisted pull-ups 3×9, barbell rows 3×10 @ 37.5kg, face pulls 3×15, bicep curls 3×12 @ 10kg.',
      appointmentType: 'one_on_one',
      daysAgo: 1,
      hour: 7,
      durationHours: 1,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'Pull-ups: progressed to 9 reps per set (from 8 last week). Rows up 2.5kg. Client reported feeling strongest yet in pulling movements. Post-session stretch focused on lats and thoracic spine. RPE 7.5.',
    },
    // Day 12 — Upcoming: Week 2 Measurements + Program Review
    {
      title: 'Day 12 — Week 2 Measurements & Program Review',
      description: 'Body measurements, progress photos, 2-week performance review, program adjustments for weeks 3-4.',
      appointmentType: 'assessment',
      daysAgo: -1, // tomorrow
      hour: 9,
      durationHours: 1,
      location: 'EvoFit Training Studio, 14 Fitness Avenue, Cape Town',
      isOnline: false,
      notes: 'Planned: full 9-site measurements, compare to baseline. Review all lift progressions. Discuss increasing training to 4 days/week if recovery supports it. Photo comparison with Day 1.',
    },
  ];

  for (const appt of appointmentDefs) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - appt.daysAgo);
    startDate.setHours(appt.hour, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + appt.durationHours * 60);

    // Ensure we land on a weekday (trainer availability is Mon-Fri)
    const dow = startDate.getDay();
    if (dow === 0 || dow === 6) {
      startDate.setDate(startDate.getDate() + (dow === 0 ? 1 : 2));
      endDate.setDate(endDate.getDate() + (dow === 0 ? 1 : 2));
    }

    const body: Record<string, any> = {
      clientId,
      title: appt.title,
      description: appt.description,
      appointmentType: appt.appointmentType,
      startDatetime: startDate.toISOString(),
      endDatetime: endDate.toISOString(),
      location: appt.location,
      isOnline: appt.isOnline || false,
      notes: appt.notes,
    };
    if ((appt as any).meetingLink) body.meetingLink = (appt as any).meetingLink;

    const res = await apiFetch('/api/schedule/appointments', {
      method: 'POST',
      headers: authHeaders(trainerToken),
      body: JSON.stringify(body),
    });

    if (res.ok || res.status === 201) {
      const dayLabel = appt.daysAgo >= 0 ? `${appt.daysAgo} days ago` : `in ${-appt.daysAgo} day(s)`;
      ok(`Day ${12 - appt.daysAgo}: ${appt.title.substring(0, 45)} (${dayLabel})`);
    } else if (res.status === 409) {
      ok(`Already exists: ${appt.title.substring(0, 40)}`);
    } else {
      const errBody = await res.text();
      fail(`${appt.title}: ${res.status} ${errBody}`);
    }
  }
}

// ─── Step 15: Exercise favorites & collections ────────────────────────────────

async function seedFavoritesAndCollections(
  trainerToken: string,
  clientToken: string,
  exercises: Exercise[],
): Promise<void> {
  // Trainer favorites: 10 exercises
  const trainerFavs = exercises.slice(0, 10);
  for (const ex of trainerFavs) {
    const res = await apiFetch('/api/exercises/favorites', {
      method: 'POST',
      headers: authHeaders(trainerToken),
      body: JSON.stringify({ exerciseId: ex.id }),
    });
    if (res.ok || res.status === 201 || res.status === 409) {
      // 409 = already favorited, fine
    } else {
      fail(`Trainer fav ${ex.name}: ${res.status}`);
    }
  }
  ok(`Trainer favorites: ${trainerFavs.length} exercises added`);

  // Client favorites: 5 exercises
  const clientFavs = exercises.slice(0, 5);
  for (const ex of clientFavs) {
    const res = await apiFetch('/api/exercises/favorites', {
      method: 'POST',
      headers: authHeaders(clientToken),
      body: JSON.stringify({ exerciseId: ex.id }),
    });
    if (res.ok || res.status === 201 || res.status === 409) {
      // fine
    } else {
      fail(`Client fav ${ex.name}: ${res.status}`);
    }
  }
  ok(`Client favorites: ${clientFavs.length} exercises added`);

  // Trainer collections
  const collections = [
    {
      name: 'Client Program A — Upper Body',
      description: 'Push and pull exercises for upper body strength. Used in the 8-week foundation program.',
      exerciseSlice: exercises.slice(0, 6),
    },
    {
      name: 'Client Program A — Lower Body',
      description: 'Leg day exercises — squats, hinges, single-leg work, and accessories.',
      exerciseSlice: exercises.slice(6, 12),
    },
  ];

  for (const coll of collections) {
    const createRes = await apiFetch('/api/exercises/collections', {
      method: 'POST',
      headers: authHeaders(trainerToken),
      body: JSON.stringify({ name: coll.name, description: coll.description }),
    });

    if (!createRes.ok && createRes.status !== 201) {
      fail(`Collection ${coll.name}: ${createRes.status}`);
      continue;
    }

    const collJson = await createRes.json();
    const collId = collJson.data?.id;
    ok(`Collection created: ${coll.name}`);

    for (const ex of coll.exerciseSlice) {
      const addRes = await apiFetch(`/api/exercises/collections/${collId}/exercises`, {
        method: 'POST',
        headers: authHeaders(trainerToken),
        body: JSON.stringify({ exerciseId: ex.id }),
      });
      if (!addRes.ok && addRes.status !== 201 && addRes.status !== 409) {
        fail(`Add to collection ${ex.name}: ${addRes.status}`);
      }
    }
    ok(`Collection exercises: ${coll.exerciseSlice.length} added to "${coll.name}"`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║    EvoFit Enterprise Full Seed Script              ║');
  console.log('║    Target:', BASE_URL.padEnd(40), '║');
  console.log('╚════════════════════════════════════════════════════╝');

  // ─ 1: Ensure accounts exist ────────────────────────────────────────────────
  section('1. Account Setup');
  await ensureAccount(TRAINER_EMAIL, TRAINER_PASSWORD, 'trainer');
  await ensureAccount(CLIENT_EMAIL, CLIENT_PASSWORD, 'client');

  // ─ 2: Login ────────────────────────────────────────────────────────────────
  section('2. Authentication');
  let trainerToken = await login(TRAINER_EMAIL, TRAINER_PASSWORD);
  let clientToken = await login(CLIENT_EMAIL, CLIENT_PASSWORD);

  // ─ 3: Enterprise subscription ───────────────────────────────────────────────
  section('3. Enterprise Subscription');
  await ensureEnterpriseSubscription(trainerToken);

  // ─ 4: Client roster ────────────────────────────────────────────────────────
  section('4. Trainer-Client Relationship');
  const clientId = await addClientToRoster(trainerToken, CLIENT_EMAIL);
  ok(`Client ID: ${clientId}`);

  // ─ 5: Trainer profile ──────────────────────────────────────────────────────
  section('5. Trainer Profile');
  await seedTrainerProfile(trainerToken);
  await seedCertifications(trainerToken);

  // ─ 6: Client profile & health ──────────────────────────────────────────────
  section('6. Client Profile & Health');
  await seedClientProfile(clientToken);
  await seedClientHealth(clientToken);

  // ─ 7: Measurements ─────────────────────────────────────────────────────────
  section('7. Body Measurements (8 weeks)');
  await seedMeasurements(clientToken);

  // ─ 8: Fetch exercises ──────────────────────────────────────────────────────
  section('8. Exercise Library');
  const exercises = await fetchExercises(trainerToken);
  ok(`Fetched ${exercises.length} exercises`);

  if (exercises.length < 20) {
    fail('Not enough exercises in DB — ensure exercise library is seeded first');
    fail('Run: npx tsx scripts/seed-exercises.ts (or check prisma seed)');
    process.exit(1);
  }

  // ─ 9: Programs ─────────────────────────────────────────────────────────────
  section('9. Programs (3 programs)');
  const { strengthId, hiitId, flexibilityId } = await seedPrograms(trainerToken, exercises);

  const programIds = [strengthId, hiitId, flexibilityId].filter(Boolean);
  if (programIds.length === 0) {
    fail('All programs failed to create — aborting');
    process.exit(1);
  }
  if (programIds.length < 3) {
    fail(`Only ${programIds.length}/3 programs created — continuing with what we have`);
  }

  // ─ 10: Assign programs ─────────────────────────────────────────────────────
  section('10. Program Assignments');
  if (!clientId) {
    fail('No client ID — cannot assign programs');
    process.exit(1);
  }

  const strengthStart = weeksAgo(8);
  const hiitStart = weeksAgo(4);
  const flexStart = weeksAgo(4);

  let strengthAssignmentId = '';
  if (strengthId) strengthAssignmentId = await assignProgram(trainerToken, strengthId, clientId, strengthStart);
  if (hiitId) await assignProgram(trainerToken, hiitId, clientId, hiitStart);
  if (flexibilityId) await assignProgram(trainerToken, flexibilityId, clientId, flexStart);

  // ─ 11: Workout sessions ────────────────────────────────────────────────────
  // Re-authenticate — workout session seeding takes several minutes
  trainerToken = await login(TRAINER_EMAIL, TRAINER_PASSWORD);
  clientToken = await login(CLIENT_EMAIL, CLIENT_PASSWORD);

  section('11. Workout Sessions & Logs (24 sessions × 8 weeks)');
  if (strengthAssignmentId) {
    await seedWorkoutSessions(trainerToken, clientToken, clientId, strengthId, strengthAssignmentId);
  } else {
    fail('No assignment ID — skipping workout sessions');
  }

  // ─ 12: Training load ───────────────────────────────────────────────────────
  // Re-authenticate after long workout session seeding
  clientToken = await login(CLIENT_EMAIL, CLIENT_PASSWORD);

  section('12. Training Load (8 weeks ACWR data)');
  await seedTrainingLoad(clientToken);

  // ─ 13: Goals & progress ────────────────────────────────────────────────────
  section('13. Goals & Progress Tracking');
  await seedGoals(clientToken);

  // ─ 14: Availability & appointments ────────────────────────────────────────
  // Re-authenticate before final sections
  trainerToken = await login(TRAINER_EMAIL, TRAINER_PASSWORD);
  clientToken = await login(CLIENT_EMAIL, CLIENT_PASSWORD);

  section('14. Availability & Appointments');
  await seedAvailability(trainerToken);
  await seedAppointments(trainerToken, clientId);

  // ─ 15: Favorites & collections ─────────────────────────────────────────────
  section('15. Exercise Favorites & Collections');
  await seedFavoritesAndCollections(trainerToken, clientToken, exercises);

  // ─ Summary ─────────────────────────────────────────────────────────────────
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Seed Complete!                                    ║');
  console.log('║                                                    ║');
  console.log('║  Trainer: qa-enterprise@evofit.io                  ║');
  console.log('║  Client:  qa-client@evofit.io                      ║');
  console.log('║  Password: QaTest2026!                             ║');
  console.log('║                                                    ║');
  console.log('║  Seeded:                                           ║');
  console.log('║  - Enterprise subscription (tier_level=3)          ║');
  console.log('║  - Full trainer & client profiles (every field)    ║');
  console.log('║  - 3 trainer certifications                        ║');
  console.log('║  - Client health info + PAR-Q responses            ║');
  console.log('║  - 8 weeks of body measurements                    ║');
  console.log('║  - 3 training programs (strength/HIIT/flex)        ║');
  console.log('║  - 24 completed workout sessions + set logs        ║');
  console.log('║  - 8 weeks ACWR training load data                 ║');
  console.log('║  - 4 goals with 8-entry progress histories         ║');
  console.log('║  - Trainer availability (Mon-Fri 06:00-20:00)      ║');
  console.log('║  - 12 appointments (Day 1-12 schedule)             ║');
  console.log('║  - 10 trainer + 5 client exercise favorites        ║');
  console.log('║  - 2 exercise collections with exercises           ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
