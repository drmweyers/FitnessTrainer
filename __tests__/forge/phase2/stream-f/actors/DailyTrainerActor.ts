// __tests__/forge/phase2/stream-f/actors/DailyTrainerActor.ts

export interface Workout {
  id: string;
  name: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }>;
}

export interface Program {
  id: string;
  name: string;
  duration: number;
  workouts: Workout[];
}

export interface TrainerActorConfig {
  id: string;
  email: string;
  role: 'trainer';
  fullName: string;
}

export interface Review {
  sessionId: string;
  feedback: string;
  date: Date;
}

export interface Message {
  to: string;
  content: string;
  type: string;
  date: Date;
}

export interface Assignment {
  clientId: string;
  programId: string;
  date: Date;
}

export interface TrainerStats {
  totalPrograms: number;
  totalMessages: number;
  totalReviews: number;
  totalAssignments: number;
}

export interface AnalyticsResult {
  workoutFrequency: number;
  totalVolume: number;
  personalRecords: number;
}

export class DailyTrainerActor {
  public id: string;
  public email: string;
  public role: 'trainer';
  public fullName: string;

  // State tracking
  public programs: Program[] = [];
  public messages: Message[] = [];
  public reviews: Review[] = [];
  public assignments: Assignment[] = [];

  constructor(config: TrainerActorConfig) {
    this.id = config.id;
    this.email = config.email;
    this.role = config.role;
    this.fullName = config.fullName;
  }

  async createProgram(data: { name: string; duration: number; workouts: Workout[] }): Promise<Program> {
    // Input validation
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      throw new Error('Program name must be a non-empty string');
    }
    if (typeof data.duration !== 'number' || data.duration <= 0 || !Number.isInteger(data.duration)) {
      throw new Error('Program duration must be a positive integer');
    }

    const program: Program = {
      id: `prog-${Date.now()}`,
      name: data.name.trim(),
      duration: data.duration,
      workouts: data.workouts
    };
    this.programs.push(program);
    return program;
  }

  async assignProgram(clientId: string, programId: string): Promise<void> {
    // Input validation
    if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
      throw new Error('Client ID must be a non-empty string');
    }
    if (!programId || typeof programId !== 'string' || programId.trim() === '') {
      throw new Error('Program ID must be a non-empty string');
    }

    this.assignments.push({ clientId: clientId.trim(), programId: programId.trim(), date: new Date() });
  }

  async reviewWorkout(sessionId: string, feedback?: string): Promise<{ sessionId: string; reviewed: boolean }> {
    this.reviews.push({ sessionId, feedback: feedback || 'Reviewed', date: new Date() });
    return { sessionId, reviewed: true };
  }

  async sendFeedback(clientId: string, type: string, message: string): Promise<void> {
    this.messages.push({ to: clientId, content: message, type, date: new Date() });
  }

  async respondToClient(clientId: string, message: string): Promise<void> {
    // Input validation
    if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
      throw new Error('Client ID must be a non-empty string');
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
      throw new Error('Message must be a non-empty string');
    }

    this.messages.push({
      to: clientId.trim(),
      content: message.trim(),
      type: 'response',
      date: new Date()
    });
  }

  async sendCheckIn(clientId: string, isWorkoutDay: boolean): Promise<void> {
    const content = isWorkoutDay
      ? "How are you feeling about today's workout?"
      : "How is your recovery going?";
    this.messages.push({ to: clientId, content, type: 'checkin', date: new Date() });
  }

  async adjustProgram(programId: string, adjustments: Partial<Program>): Promise<void> {
    const program = this.programs.find(p => p.id === programId);
    if (!program) {
      throw new Error(`Program with ID "${programId}" not found`);
    }
    Object.assign(program, adjustments);
  }

  async reviewAnalytics(clientId: string): Promise<AnalyticsResult> {
    return {
      workoutFrequency: 4,
      totalVolume: 15000,
      personalRecords: 3
    };
  }

  getStats(): TrainerStats {
    return {
      totalPrograms: this.programs.length,
      totalMessages: this.messages.length,
      totalReviews: this.reviews.length,
      totalAssignments: this.assignments.length
    };
  }
}
