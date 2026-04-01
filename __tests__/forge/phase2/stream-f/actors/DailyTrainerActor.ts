// __tests__/forge/phase2/stream-f/actors/DailyTrainerActor.ts
export interface Program {
  id: string;
  name: string;
  duration: number;
  workouts: any[];
}

export interface TrainerActorConfig {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export interface Review {
  sessionId: string;
  feedback: string;
  date: Date;
}

export class DailyTrainerActor {
  id: string;
  email: string;
  role: string;
  fullName: string;

  // State tracking
  programs: Program[] = [];
  messages: { to: string; content: string; type: string; date: Date }[] = [];
  reviews: Review[] = [];
  assignments: { clientId: string; programId: string; date: Date }[] = [];

  constructor(config: TrainerActorConfig) {
    this.id = config.id;
    this.email = config.email;
    this.role = config.role;
    this.fullName = config.fullName;
  }

  async createProgram(data: { name: string; duration: number; workouts: any[] }): Promise<Program> {
    const program: Program = {
      id: `prog-${Date.now()}`,
      name: data.name,
      duration: data.duration,
      workouts: data.workouts
    };
    this.programs.push(program);
    return program;
  }

  async assignProgram(clientId: string, programId: string): Promise<void> {
    this.assignments.push({ clientId, programId, date: new Date() });
  }

  async reviewWorkout(sessionId: string, feedback?: string): Promise<{ sessionId: string; reviewed: boolean }> {
    this.reviews.push({ sessionId, feedback: feedback || 'Reviewed', date: new Date() });
    return { sessionId, reviewed: true };
  }

  async sendFeedback(clientId: string, type: string, message: string): Promise<void> {
    this.messages.push({ to: clientId, content: message, type, date: new Date() });
  }

  async sendCheckIn(clientId: string, isWorkoutDay: boolean): Promise<void> {
    const content = isWorkoutDay
      ? "How are you feeling about today's workout?"
      : "How is your recovery going?";
    this.messages.push({ to: clientId, content, type: 'checkin', date: new Date() });
  }

  async adjustProgram(programId: string, adjustments: any): Promise<void> {
    const program = this.programs.find(p => p.id === programId);
    if (program) {
      Object.assign(program, adjustments);
    }
  }

  async reviewAnalytics(clientId: string): Promise<{
    workoutFrequency: number;
    totalVolume: number;
    personalRecords: number;
  }> {
    return {
      workoutFrequency: 4,
      totalVolume: 15000,
      personalRecords: 3
    };
  }

  getStats() {
    return {
      totalPrograms: this.programs.length,
      totalMessages: this.messages.length,
      totalReviews: this.reviews.length,
      totalAssignments: this.assignments.length
    };
  }
}
