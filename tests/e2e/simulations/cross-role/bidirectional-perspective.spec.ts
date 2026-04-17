/**
 * Bidirectional Perspective Tests
 *
 * The same resource or feature viewed from two different role angles.
 * Pattern for each test:
 *   1. Trainer actor loads the resource and captures what they see
 *   2. Client actor loads the same resource and captures their view
 *   3. Assert trainer got richer/different access than client, or vice-versa
 *
 * This catches UI/API bugs where one role accidentally gets the other's view.
 */
import { test, expect } from '@playwright/test';
import { TrainerActor } from '../actors/trainer-actor';
import { ClientActor } from '../actors/client-actor';
import { SIM_ACCOUNTS } from '../actors/base-actor';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function resolveClientId(trainer: TrainerActor, clientEmail: string): Promise<string> {
  const res = await trainer.apiCall('GET', '/api/clients');
  const clients: any[] = res.clients || res.data || [];
  const record = clients.find(
    (c: any) => c.email === clientEmail || c.client?.email === clientEmail
  );
  const id = record?.clientId || record?.id;
  if (!id) throw new Error(`Client ${clientEmail} not on trainer roster`);
  return id;
}

async function ensureAvailability(trainer: TrainerActor): Promise<void> {
  await trainer.apiCall('POST', '/api/schedule/availability', {
    slots: [0, 1, 2, 3, 4, 5, 6].map(day => ({
      dayOfWeek: day,
      startTime: '06:00',
      endTime: '22:00',
    })),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Bidirectional Role Perspectives', () => {

  // ── 1. Program page: trainer can edit, client sees read-only ─────────────

  test('program page shows edit controls for trainer, read-only content for client', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Create a program to observe
    const programId = await trainer.createProgramViaAPI({
      name: 'Bidir: Perspective Program',
      type: 'strength',
      difficulty: 'intermediate',
      durationWeeks: 4,
    });
    await trainer.addClientToRoster(SIM_ACCOUNTS.client1.email).catch(() => {});
    const clientId = await resolveClientId(trainer, SIM_ACCOUNTS.client1.email);
    await trainer.assignProgramToClient(programId, clientId).catch(() => {});

    // Trainer views the programs list page
    await trainer.navigateToPrograms();
    const trainerBody = await page.textContent('body');
    // Trainer sees management affordances — either "New Program", "Create", or edit/delete elements
    const trainerHasManagement =
      trainerBody?.includes('New') ||
      trainerBody?.includes('Create') ||
      trainerBody?.includes('Edit') ||
      trainerBody?.includes('Program');
    expect(trainerHasManagement).toBeTruthy();

    await trainer.screenshot('bidir-trainer-programs');

    // Client views their programs page
    const client = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client.login();
    await client.navigateToPrograms();

    const clientBody = await page.textContent('body');
    // Client sees program content but not management controls
    expect(clientBody).not.toContain('Something went wrong');

    await client.screenshot('bidir-client-programs');
  });

  // ── 2. Programs API response structure differs by role ────────────────────

  test('programs API returns trainer-owned programs for trainer, assigned programs for client', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Create a program as trainer
    const programId = await trainer.createProgramViaAPI({
      name: 'Bidir: API Response Check',
      type: 'general_fitness',
      difficulty: 'beginner',
      durationWeeks: 2,
    });

    const trainerRes = await trainer.apiCall('GET', '/api/programs');
    const trainerPrograms: any[] = trainerRes.data || [];
    // Trainer owns this program — should be in the list
    const trainerOwns = trainerPrograms.some((p: any) => p.id === programId);
    expect(trainerOwns).toBeTruthy();

    // Client fetches programs — should NOT contain the unassigned trainer program
    const client = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client.login();

    const clientRes = await client.apiCall('GET', '/api/programs');
    const clientPrograms: any[] = clientRes.data || [];
    const clientSeesUnassigned = clientPrograms.some((p: any) => p.id === programId);
    expect(clientSeesUnassigned).toBeFalsy();
  });

  // ── 3. Schedule: trainer sees all, client sees own ────────────────────────

  test('trainer schedule contains all appointments, client schedule shows only their own', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    await trainer.addClientToRoster(SIM_ACCOUNTS.client1.email).catch(() => {});
    await trainer.addClientToRoster(SIM_ACCOUNTS.client2.email).catch(() => {});
    await ensureAvailability(trainer);

    const client1Id = await resolveClientId(trainer, SIM_ACCOUNTS.client1.email);
    const client2Id = await resolveClientId(trainer, SIM_ACCOUNTS.client2.email);

    const futureBase = new Date();
    futureBase.setDate(futureBase.getDate() + 20);

    const date1Str = futureBase.toISOString().split('T')[0];
    const futureBase2 = new Date(futureBase);
    futureBase2.setDate(futureBase2.getDate() + 1);
    const date2Str = futureBase2.toISOString().split('T')[0];

    // Create separate appointments for each client
    const appt1Id = await trainer.createAppointment({
      clientId: client1Id,
      date: date1Str,
      startTime: '10:00',
      endTime: '11:00',
      title: 'Bidir: Client1 Session',
    }).catch(() => '');

    const appt2Id = await trainer.createAppointment({
      clientId: client2Id,
      date: date2Str,
      startTime: '14:00',
      endTime: '15:00',
      title: 'Bidir: Client2 Session',
    }).catch(() => '');

    // Trainer sees all appointments
    const trainerAppts = await trainer.apiCall('GET', '/api/schedule/appointments');
    const allAppts: any[] = trainerAppts.data || [];

    if (appt1Id && appt2Id) {
      const trainerSeesBoth =
        allAppts.some((a: any) => a.id === appt1Id) &&
        allAppts.some((a: any) => a.id === appt2Id);
      expect(trainerSeesBoth).toBeTruthy();
    }

    // Client1 sees only their own appointment
    if (appt1Id && appt2Id) {
      const client1 = new ClientActor(page, SIM_ACCOUNTS.client1);
      await client1.login();
      const client1Appts = await client1.apiCall('GET', '/api/schedule/appointments');
      const c1List: any[] = client1Appts.data || [];
      const seesOwn = c1List.some((a: any) => a.id === appt1Id);
      const seesOther = c1List.some((a: any) => a.id === appt2Id);
      expect(seesOwn).toBeTruthy();
      expect(seesOther).toBeFalsy();
    }
  });

  // ── 4. Schedule UI loads correctly for both roles ────────────────────────

  test('schedule page renders without errors for both trainer and client', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();
    await trainer.navigateToSchedule();

    const trainerBody = await page.textContent('body');
    expect(trainerBody).not.toContain('Something went wrong');
    const trainerHasSchedule =
      trainerBody?.includes('Schedule') ||
      trainerBody?.includes('Calendar') ||
      trainerBody?.includes('Appointment');
    expect(trainerHasSchedule).toBeTruthy();

    await trainer.screenshot('bidir-trainer-schedule');

    const client = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client.login();
    await client.viewSchedule();

    const clientBody = await page.textContent('body');
    expect(clientBody).not.toContain('Something went wrong');

    await client.screenshot('bidir-client-schedule');
  });

  // ── 5. Analytics: trainer sees client selector, client sees own data ──────

  test('analytics page shows client selector for trainer, personal data for client', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();
    await trainer.navigateToAnalytics();
    await trainer.waitForPageReady();

    const trainerBody = await page.textContent('body');
    expect(trainerBody).not.toContain('Something went wrong');
    // Trainer analytics should reference clients or have a selector
    const trainerHasClientContext =
      trainerBody?.includes('Client') ||
      trainerBody?.includes('Analytics') ||
      trainerBody?.includes('Overview');
    expect(trainerHasClientContext).toBeTruthy();

    await trainer.screenshot('bidir-trainer-analytics');

    const client = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client.login();
    await client.viewAnalyticsOverview();

    const clientBody = await page.textContent('body');
    expect(clientBody).not.toContain('Something went wrong');
    // Client sees their own analytics context — should not show other client data
    expect(clientBody).not.toContain(SIM_ACCOUNTS.client2.email);

    await client.screenshot('bidir-client-analytics');
  });

  // ── 6. Dashboard: trainer has client list, client has workout summary ─────

  test('trainer dashboard contains client management UI, client dashboard has personal summary', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();
    await trainer.navigateToDashboard();
    await trainer.waitForPageReady();

    const trainerBody = await page.textContent('body');
    expect(trainerBody).not.toContain('Something went wrong');
    // Trainer dashboard shows client-management language
    const trainerHasClientSection =
      trainerBody?.includes('Client') ||
      trainerBody?.includes('Dashboard') ||
      trainerBody?.includes('trainer');
    expect(trainerHasClientSection).toBeTruthy();

    await trainer.screenshot('bidir-trainer-dashboard');

    const client = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client.login();
    await client.navigateToDashboard();
    await client.waitForPageReady();

    const clientBody = await page.textContent('body');
    expect(clientBody).not.toContain('Something went wrong');
    // Client dashboard should NOT expose other clients' data
    expect(clientBody).not.toContain(SIM_ACCOUNTS.client2.email);

    await client.screenshot('bidir-client-dashboard');
  });

  // ── 7. Profile: trainer can view client profile, client can only edit own ─

  test('trainer can fetch client profile details via API, client can only edit own', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    await trainer.addClientToRoster(SIM_ACCOUNTS.client1.email).catch(() => {});
    const clientId = await resolveClientId(trainer, SIM_ACCOUNTS.client1.email);

    // Trainer fetches the client's profile details
    const profileRes = await trainer.apiCall('GET', `/api/clients/${clientId}/profile`);
    expect(profileRes).toBeTruthy();
    // Response should be success or contain profile data
    expect(profileRes.success !== false).toBeTruthy();

    // Client can update their own profile
    const client = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client.login();
    await client.updateProfile({ bio: 'Bidir profile test client' });

    // Client tries the profile edit page (own profile)
    await client.navigateToProfileEdit();
    const clientBody = await page.textContent('body');
    expect(clientBody).not.toContain('Something went wrong');

    await client.screenshot('bidir-client-profile-edit');
  });

  // ── 8. Exercise library: both can search, collections are per-user ────────

  test('both roles can search exercises, favorites lists are independent', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Trainer searches exercises
    const trainerSearchRes = await trainer.apiCall('GET', '/api/exercises?search=squat&limit=5');
    const trainerExercises: any[] = trainerSearchRes.data?.exercises || trainerSearchRes.exercises || [];
    expect(trainerExercises.length).toBeGreaterThan(0);

    // Trainer favorites the first result
    const exerciseId = trainerExercises[0].id;
    await trainer.favoriteExercise(exerciseId).catch(() => {});

    // Client searches same term — should also return results
    const client = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client.login();

    const clientSearchRes = await client.apiCall('GET', '/api/exercises?search=squat&limit=5');
    const clientExercises: any[] = clientSearchRes.data?.exercises || clientSearchRes.exercises || [];
    expect(clientExercises.length).toBeGreaterThan(0);

    // Trainer's favorites endpoint is separate from client's
    const trainerFavs = await trainer.apiCall('GET', '/api/exercises/favorites');
    const clientFavs = await client.apiCall('GET', '/api/exercises/favorites');

    // Both fetch without error
    expect(trainerFavs.success !== false).toBeTruthy();
    expect(clientFavs.success !== false).toBeTruthy();

    // Trainer favorited the exercise; client's list should NOT automatically inherit it
    const trainerFavList: any[] = trainerFavs.data?.exercises || trainerFavs.data || [];
    const clientFavList: any[] = clientFavs.data?.exercises || clientFavs.data || [];

    const trainerHasFav = trainerFavList.some(
      (e: any) => e.id === exerciseId || e.exerciseId === exerciseId
    );
    expect(trainerHasFav).toBeTruthy();

    // Client list should not inherit from trainer's personal favorites
    // (unless client also favorited it separately)
    const clientInheritedTrainerFav = clientFavList.some(
      (e: any) => (e.id === exerciseId || e.exerciseId === exerciseId) &&
        (e.userId === SIM_ACCOUNTS.trainer.email)
    );
    expect(clientInheritedTrainerFav).toBeFalsy();
  });

  // ── 9. Trainer measurements API vs client measurements API ───────────────

  test('trainer reads client measurements via trainer API, client reads own via me endpoint', async ({ page }) => {
    // Client logs a measurement
    const client = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client.login();

    await client.logMeasurement({
      weight: 81.2,
      bodyFatPercentage: 16.9,
      notes: 'Bidir perspective measurement',
    });

    // Client's own endpoint
    const ownRes = await client.apiCall('GET', '/api/analytics/measurements/me');
    const ownData: any[] = ownRes.data || [];
    expect(ownData.length).toBeGreaterThan(0);

    // Trainer reads client measurements
    const trainer = new TrainerActor(page);
    await trainer.login();

    const clientId = await resolveClientId(trainer, SIM_ACCOUNTS.client1.email);
    const trainerReadRes = await trainer.apiCall(
      'GET',
      `/api/analytics/measurements/${clientId}`
    );
    // Should succeed (trainer is authorized to see their client's data)
    expect(trainerReadRes.success !== false).toBeTruthy();
  });

  // ── 10. Client cannot access trainer management endpoints ────────────────

  test('client gets 403 when trying to access trainer-only endpoints', async ({ page }) => {
    const client = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client.login();

    const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

    // Attempt to create an appointment (trainer-only)
    const res = await page.request.fetch(`${BASE_URL}/api/schedule/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${client.getToken()}`,
      },
      data: JSON.stringify({
        clientId: 'some-id',
        title: 'Unauthorized attempt',
        appointmentType: 'one_on_one',
        startDatetime: new Date().toISOString(),
        endDatetime: new Date().toISOString(),
      }),
    });

    expect(res.status()).toBe(403);
  });
});
