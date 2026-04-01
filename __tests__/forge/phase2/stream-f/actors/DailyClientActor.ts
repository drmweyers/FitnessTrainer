export interface SetLogData {
  exerciseId: string;
  workoutSessionId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
  notes?: string;
}

export interface RecoveryMetrics {
  sleep: number;      // hours
  soreness: number;   // 1-10 scale
  energy: number;     // 1-10 scale
  date: Date;
}

export interface BodyMeasurements {
  date: Date;
  weight: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
}

export interface ClientActorConfig {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export class DailyClientActor {
  id: string;
  email: string;
  role: string;
  fullName: string;

  // State tracking (public for verification)
  loggedSets: SetLogData[] = [];
  recoveryLogs: RecoveryMetrics[] = [];
  measurements: BodyMeasurements[] = [];
  messages: { to: string; content: string; date: Date }[] = [];

  constructor(config: ClientActorConfig) {
    this.id = config.id;
    this.email = config.email;
    this.role = config.role;
    this.fullName = config.fullName;
  }

  async logSet(data: SetLogData): Promise<SetLogData> {
    this.loggedSets.push(data);
    return data;
  }

  async logRecoveryMetrics(metrics: Omit<RecoveryMetrics, 'date'>): Promise<RecoveryMetrics> {
    const entry: RecoveryMetrics = {
      ...metrics,
      date: new Date()
    };
    this.recoveryLogs.push(entry);
    return entry;
  }

  async recordMeasurements(data: BodyMeasurements): Promise<BodyMeasurements> {
    this.measurements.push(data);
    return data;
  }

  async sendMessage(to: string, content: string): Promise<void> {
    this.messages.push({ to, content, date: new Date() });
  }

  async startWorkout(workoutId: string): Promise<{ id: string; status: string }> {
    return {
      id: `ws-${Date.now()}`,
      status: 'in_progress'
    };
  }

  async completeWorkout(sessionId: string, feedback?: string): Promise<void> {
    // Mark workout complete
  }

  async uploadProgressPhoto(photoType: 'front' | 'back' | 'side'): Promise<void> {
    // Simulate photo upload
  }

  async readMessages(): Promise<{ from: string; content: string }[]> {
    return [];
  }

  getStats() {
    return {
      totalSets: this.loggedSets.length,
      totalRecoveryLogs: this.recoveryLogs.length,
      totalMeasurements: this.measurements.length,
      totalMessages: this.messages.length
    };
  }
}
