/**
 * ClientActor — every action a fitness client can take in EvoFit.
 * Drives the REAL UI via Playwright for authentic interaction testing.
 */
import { Page, expect } from '@playwright/test';
import { BaseActor, ActorCredentials, SIM_ACCOUNTS } from './base-actor';

export interface MeasurementInput {
  weight?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  height?: number;
  notes?: string;
}

export interface GoalInput {
  goalType: string;
  specificGoal?: string;
  targetValue?: number;
  targetDate: string;
}

export class ClientActor extends BaseActor {
  constructor(page: Page, credentials?: ActorCredentials) {
    super(page, credentials || SIM_ACCOUNTS.client1);
  }

  // ═══════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════

  async navigateToDashboard(): Promise<void> {
    await this.goto('/dashboard/client');
  }

  async navigateToPrograms(): Promise<void> {
    await this.goto('/programs');
  }

  async navigateToWorkouts(): Promise<void> {
    await this.goto('/workouts');
  }

  async navigateToAnalytics(): Promise<void> {
    await this.goto('/analytics');
  }

  async navigateToSchedule(): Promise<void> {
    await this.goto('/schedule');
  }

  async navigateToProfile(): Promise<void> {
    await this.goto('/profile');
  }

  async navigateToProfileEdit(): Promise<void> {
    await this.goto('/profile/edit');
  }

  async navigateToHealthProfile(): Promise<void> {
    await this.goto('/profile/health');
  }

  // ═══════════════════════════════════════
  // WORKOUT EXECUTION
  // ═══════════════════════════════════════

  /** View the workouts page and check for active/scheduled workouts. */
  async viewWorkouts(): Promise<void> {
    await this.navigateToWorkouts();
    await this.page.waitForSelector('h1, [class*="workout"]', { timeout: 10_000 });
  }

  /** Start a workout session via API. */
  async startWorkoutSession(workoutId: string): Promise<string> {
    const res = await this.apiCall('POST', '/api/workouts', {
      workoutId,
      startedAt: new Date().toISOString(),
    });
    return res.data?.id;
  }

  /** Log a set during a workout via API (simulates real logging). */
  async logWorkoutSet(sessionId: string, exerciseId: string, data: {
    setNumber: number;
    weight: number;
    reps: number;
    rpe?: number;
  }): Promise<void> {
    await this.apiCall('PUT', `/api/workouts/${sessionId}/sets`, {
      exerciseId,
      ...data,
    });
  }

  /** Complete a workout session via API. */
  async completeWorkout(sessionId: string): Promise<void> {
    await this.apiCall('POST', `/api/workouts/${sessionId}/complete`, {
      completedAt: new Date().toISOString(),
    });
  }

  // ═══════════════════════════════════════
  // PROGRESS TRACKING
  // ═══════════════════════════════════════

  /** Log a body measurement via API. */
  async logMeasurement(data: MeasurementInput): Promise<string> {
    const res = await this.apiCall('POST', '/api/analytics/measurements', {
      ...data,
      measurementDate: new Date().toISOString().split('T')[0],
    });
    return res.data?.id;
  }

  /** Log a measurement via the UI (opens tracker, fills form, submits). */
  async logMeasurementViaUI(data: MeasurementInput): Promise<void> {
    await this.navigateToAnalytics();
    await this.page.getByText('Record New Measurement').click();

    // Fill measurement form
    if (data.weight) {
      const weightInput = this.page.getByLabel(/weight/i).first();
      if (await weightInput.isVisible()) await weightInput.fill(String(data.weight));
    }
    if (data.bodyFatPercentage) {
      const bfInput = this.page.getByLabel(/body fat/i).first();
      if (await bfInput.isVisible()) await bfInput.fill(String(data.bodyFatPercentage));
    }
    if (data.muscleMass) {
      const mmInput = this.page.getByLabel(/muscle/i).first();
      if (await mmInput.isVisible()) await mmInput.fill(String(data.muscleMass));
    }

    // Submit
    const saveBtn = this.page.getByRole('button', { name: /save/i });
    if (await saveBtn.isVisible()) await saveBtn.click();
  }

  /** Create a fitness goal via API. Returns goal ID. */
  async createGoal(data: GoalInput): Promise<string> {
    // Decode JWT to get userId
    const tokenPayload = this.token ? JSON.parse(atob(this.token.split('.')[1])) : {};
    const userId = tokenPayload.userId || tokenPayload.id;

    const res = await this.apiCall('POST', '/api/analytics/goals', {
      userId,
      goalType: data.goalType,
      specificGoal: data.specificGoal,
      targetValue: data.targetValue,
      targetDate: data.targetDate,
      priority: 3,
      isActive: true,
    });
    return res.data?.id;
  }

  /** Update goal progress via API. */
  async updateGoalProgress(goalId: string, currentValue: number, notes?: string): Promise<void> {
    await this.apiCall('POST', `/api/analytics/goals/${goalId}/progress`, {
      currentValue,
      notes,
      recordedDate: new Date().toISOString().split('T')[0],
    });
  }

  // ═══════════════════════════════════════
  // ANALYTICS (Personal)
  // ═══════════════════════════════════════

  /** View the analytics overview tab. */
  async viewAnalyticsOverview(): Promise<void> {
    await this.navigateToAnalytics();
    await this.waitForPageReady();
  }

  /** View personal performance tab. */
  async viewPerformance(): Promise<void> {
    await this.navigateToAnalytics();
    await this.page.getByText('Performance').click();
    await this.page.waitForTimeout(500);
  }

  /** View training load tab. */
  async viewTrainingLoad(): Promise<void> {
    await this.navigateToAnalytics();
    await this.page.getByText('Training Load').click();
    await this.page.waitForTimeout(500);
  }

  /** View goals tab. */
  async viewGoals(): Promise<void> {
    await this.navigateToAnalytics();
    await this.page.getByText('Goals').click();
    await this.page.waitForTimeout(500);
  }

  // ═══════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════

  /** Update client profile via API. */
  async updateProfile(data: Record<string, any>): Promise<void> {
    await this.apiCall('PUT', '/api/profiles/me', data);
  }

  /** Update health info via API. */
  async updateHealthInfo(data: Record<string, any>): Promise<void> {
    await this.apiCall('PUT', '/api/profiles/health', data);
  }

  // ═══════════════════════════════════════
  // SCHEDULE
  // ═══════════════════════════════════════

  /** View the schedule page. */
  async viewSchedule(): Promise<void> {
    await this.navigateToSchedule();
    await this.waitForPageReady();
  }

  // ═══════════════════════════════════════
  // PROGRAMS (Assigned by trainer)
  // ═══════════════════════════════════════

  /** View assigned programs. */
  async viewAssignedPrograms(): Promise<void> {
    await this.navigateToPrograms();
    await this.waitForPageReady();
  }
}
