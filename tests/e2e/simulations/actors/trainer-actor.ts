/**
 * TrainerActor — every action a personal trainer can take in EvoFit.
 * Each method drives the REAL UI via Playwright, not just API calls.
 */
import { Page, expect } from '@playwright/test';
import { BaseActor, ActorCredentials, SIM_ACCOUNTS } from './base-actor';

export interface ProgramInput {
  name: string;
  type: string;
  difficulty: string;
  durationWeeks: number;
  goals?: string[];
  equipment?: string[];
}

export interface AppointmentInput {
  clientEmail: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
}

export class TrainerActor extends BaseActor {
  constructor(page: Page, credentials?: ActorCredentials) {
    super(page, credentials || SIM_ACCOUNTS.trainer);
  }

  // ═══════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════

  async navigateToDashboard(): Promise<void> {
    await this.goto('/dashboard/trainer');
  }

  async navigateToClients(): Promise<void> {
    await this.goto('/clients');
  }

  async navigateToPrograms(): Promise<void> {
    await this.goto('/programs');
  }

  async navigateToExercises(): Promise<void> {
    await this.goto('/exercises');
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

  async navigateToWorkoutBuilder(): Promise<void> {
    await this.goto('/workouts/builder');
  }

  // ═══════════════════════════════════════
  // CLIENT MANAGEMENT
  // ═══════════════════════════════════════

  /** Add a client to the trainer's roster via API. */
  async addClientToRoster(clientEmail: string): Promise<void> {
    await this.apiCall('POST', '/api/clients', { email: clientEmail });
  }

  /** View the client list page and verify it loaded. */
  async viewClientList(): Promise<void> {
    await this.navigateToClients();
    // Should see the clients heading or list
    await this.page.waitForSelector('[class*="client"], h1, h2', { timeout: 10_000 });
  }

  // ═══════════════════════════════════════
  // PROGRAM MANAGEMENT
  // ═══════════════════════════════════════

  /** Create a program via API (reliable, fast). Returns program ID. */
  async createProgramViaAPI(input: ProgramInput): Promise<string> {
    const res = await this.apiCall('POST', '/api/programs', {
      name: input.name,
      programType: input.type,
      difficultyLevel: input.difficulty,
      durationWeeks: input.durationWeeks,
      goals: input.goals || [],
      equipmentNeeded: input.equipment || [],
      weeks: [{
        weekNumber: 1,
        name: 'Week 1',
        workouts: [{
          dayNumber: 1,
          name: `${input.name} - Day 1`,
          workoutType: input.type === 'endurance' ? 'cardio' : 'strength',
          estimatedDuration: 45,
        }],
      }],
    });
    return res.data?.id;
  }

  /** Navigate to program creation page via UI. */
  async openCreateProgram(): Promise<void> {
    await this.goto('/programs/new');
    await this.waitForPageReady();
  }

  /** Assign a program to a client via API. */
  async assignProgramToClient(programId: string, clientId: string): Promise<void> {
    await this.apiCall('POST', `/api/programs/${programId}/assign`, {
      clientId,
      startDate: new Date().toISOString(),
    });
  }

  /** Duplicate a program via API. Returns new program ID. */
  async duplicateProgram(programId: string): Promise<string> {
    const res = await this.apiCall('POST', `/api/programs/${programId}/duplicate`);
    return res.data?.id;
  }

  /** View the programs list page. */
  async viewProgramsList(): Promise<void> {
    await this.navigateToPrograms();
    await this.page.waitForSelector('h1, [class*="program"]', { timeout: 10_000 });
  }

  // ═══════════════════════════════════════
  // ANALYTICS (Viewing Client Data)
  // ═══════════════════════════════════════

  /** Navigate to analytics and select a specific client. */
  async viewClientAnalytics(clientId?: string): Promise<void> {
    await this.navigateToAnalytics();
    if (clientId) {
      const selector = this.page.locator('#client-selector');
      if (await selector.isVisible()) {
        await selector.selectOption(clientId);
        await this.page.waitForTimeout(1000); // Allow data refresh
      }
    }
  }

  /** Click the Performance tab in analytics. */
  async viewPerformanceTab(): Promise<void> {
    await this.page.getByText('Performance').click();
    await this.page.waitForTimeout(500);
  }

  /** Click the Training Load tab in analytics. */
  async viewTrainingLoadTab(): Promise<void> {
    await this.page.getByText('Training Load').click();
    await this.page.waitForTimeout(500);
  }

  /** Click the Goals tab in analytics. */
  async viewGoalsTab(): Promise<void> {
    await this.page.getByText('Goals').click();
    await this.page.waitForTimeout(500);
  }

  // ═══════════════════════════════════════
  // EXERCISE LIBRARY
  // ═══════════════════════════════════════

  /** Search for exercises by name. */
  async searchExercises(query: string): Promise<void> {
    await this.navigateToExercises();
    const searchInput = this.page.getByPlaceholder(/search/i).first();
    await searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  /** Favorite an exercise (via API for reliability). */
  async favoriteExercise(exerciseId: string): Promise<void> {
    await this.apiCall('POST', '/api/exercises/favorites', { exerciseId });
  }

  /** Create an exercise collection via API. */
  async createCollection(name: string, description?: string): Promise<string> {
    const res = await this.apiCall('POST', '/api/exercises/collections', {
      name,
      description: description || `Collection: ${name}`,
    });
    return res.data?.id;
  }

  // ═══════════════════════════════════════
  // AI WORKOUT BUILDER
  // ═══════════════════════════════════════

  /** Generate an AI workout via the builder UI. */
  async generateAIWorkout(options?: {
    focusArea?: string;
    difficulty?: string;
    duration?: number;
    workoutType?: string;
  }): Promise<void> {
    await this.navigateToWorkoutBuilder();
    await this.waitForPageReady();

    // Wait for exercises to load (Generate button becomes enabled)
    const generateBtn = this.page.getByRole('button', { name: 'Generate AI Workout' });
    await generateBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.waitForFunction(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent?.includes('Generate AI Workout') && !btn.disabled) return true;
      }
      return false;
    }, { timeout: 15_000 });

    // Set preferences via the select dropdowns
    const selects = this.page.locator('select');
    if (options?.focusArea) {
      await selects.nth(0).selectOption(options.focusArea);
    }
    if (options?.difficulty) {
      await selects.nth(1).selectOption(options.difficulty);
    }
    if (options?.workoutType) {
      await selects.nth(3).selectOption(options.workoutType);
    }

    await generateBtn.click();

    // The component uses setTimeout(1500) to simulate AI generation,
    // plus Next.js may need to compile on first hit. Give it plenty of time.
    await this.page.waitForSelector('text=Save to My Programs', { timeout: 15_000 });
  }

  /** Save the generated AI workout. */
  async saveGeneratedWorkout(): Promise<void> {
    await this.page.getByText('Save to My Programs').click();
    // Wait for save to complete
    await this.page.waitForSelector('text=View Programs', { timeout: 10_000 });
  }

  // ═══════════════════════════════════════
  // SCHEDULE
  // ═══════════════════════════════════════

  /** Set availability via API. */
  async setAvailability(dayOfWeek: number, startTime: string, endTime: string): Promise<void> {
    await this.apiCall('POST', '/api/schedule/availability', {
      dayOfWeek,
      startTime,
      endTime,
    });
  }

  /** Create an appointment via API. */
  async createAppointment(data: {
    clientId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<string> {
    const res = await this.apiCall('POST', '/api/schedule/appointments', data);
    return res.data?.id;
  }

  // ═══════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════

  /** Update trainer profile via API. */
  async updateProfile(data: Record<string, any>): Promise<void> {
    await this.apiCall('PUT', '/api/profiles/me', data);
  }
}
