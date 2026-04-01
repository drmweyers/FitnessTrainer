import { DailyClientActor } from '../actors/DailyClientActor';
import { DailyTrainerActor } from '../actors/DailyTrainerActor';
import { generateWorkout, getPersonalRecords } from '../data-generators/workout-generator';
import { generateMeasurementSeries, generateRecoveryMetrics } from '../data-generators/measurement-generator';
import { generateDailyMessages } from '../data-generators/message-generator';

export interface DayResult {
  day: number;
  isWorkoutDay: boolean;
  setsLogged: number;
  messagesExchanged: number;
  prs: number;
}

export interface SimulationResult {
  completed: boolean;
  daysCompleted: number;
  totalSets: number;
  totalMessages: number;
  totalPRs: number;
  workoutDays: number[];
  restDays: number[];
  measurements: number;
  dayResults: DayResult[];
}

const WORKOUT_DAYS = [1, 2, 4, 5, 8, 9, 11, 12];
const MEASUREMENT_DAYS = [1, 7, 14];

const WORKOUT_EXERCISES = {
  'upper_push': ['ex-bench', 'ex-press', 'ex-extension', 'ex-fly'],
  'upper_pull': ['ex-row', 'ex-curl', 'ex-deadlift'],
  'lower': ['ex-squat', 'ex-deadlift', 'ex-extension']
};

export class FourteenDayProgramWorkflow {
  private client: DailyClientActor;
  private trainer: DailyTrainerActor;
  private dayResults: DayResult[] = [];
  private totalPRs = 0;

  constructor(client: DailyClientActor, trainer: DailyTrainerActor) {
    this.client = client;
    this.trainer = trainer;
  }

  async execute(): Promise<SimulationResult> {
    const program = await this.trainer.createProgram({
      name: '14-Day Strength Foundation',
      duration: 14,
      workouts: Object.values(WORKOUT_EXERCISES)
    });

    await this.trainer.assignProgram(this.client.id, program.id);

    const measurements = generateMeasurementSeries({
      startWeight: 180,
      startBodyFat: 18,
      measurementDays: MEASUREMENT_DAYS
    });

    for (let day = 1; day <= 14; day++) {
      const dayResult = await this.executeDay(day, program.id, measurements);
      this.dayResults.push(dayResult);
    }

    return {
      completed: true,
      daysCompleted: 14,
      totalSets: this.client.getStats().totalSets,
      totalMessages: this.client.getStats().totalMessages + this.trainer.getStats().totalMessages,
      totalPRs: this.totalPRs,
      workoutDays: WORKOUT_DAYS,
      restDays: [3, 6, 10, 13],
      measurements: measurements.length,
      dayResults: this.dayResults
    };
  }

  private async executeDay(day: number, programId: string, measurements: { day: number }[]): Promise<DayResult> {
    const isWorkoutDay = WORKOUT_DAYS.includes(day);
    const weekNumber = day <= 7 ? 1 : 2;
    let setsLogged = 0;
    let prsToday = 0;

    if (MEASUREMENT_DAYS.includes(day)) {
      const measurement = measurements.find(m => m.day === day)!;
      await this.client.recordMeasurements(measurement as any);
      await this.client.uploadProgressPhoto('front');
    }

    if (isWorkoutDay) {
      const workoutType = this.getWorkoutType(day);
      const exercises = WORKOUT_EXERCISES[workoutType];
      const workoutSessionId = `ws-${day}`;

      await this.client.startWorkout(workoutSessionId);

      for (const exerciseId of exercises) {
        const sets = generateWorkout(
          workoutSessionId,
          [exerciseId],
          weekNumber,
          day
        );

        for (const set of sets) {
          await this.client.logSet(set);
          setsLogged++;
        }

        const prs = getPersonalRecords(sets);
        prsToday += prs.length;
        this.totalPRs += prs.length;
      }

      await this.client.completeWorkout(workoutSessionId, 'Good session today');
      await this.trainer.reviewWorkout(workoutSessionId);
    } else {
      const recovery = generateRecoveryMetrics(day);
      await this.client.logRecoveryMetrics(recovery);
    }

    const hasPR = prsToday > 0;
    const exerciseName = hasPR ? 'Bench Press' : undefined;
    const isProgramAdjusted = day === 7;

    const messages = generateDailyMessages({
      day,
      isWorkoutDay,
      trainerName: this.trainer.fullName,
      clientName: this.client.fullName,
      hasPR,
      exerciseName,
      isProgramAdjusted
    });

    for (const message of messages) {
      if (message.sender === 'trainer') {
        await this.trainer.sendFeedback(this.client.id, message.type, message.content);
      } else {
        await this.client.sendMessage(this.trainer.id, message.content);
      }
    }

    if (day === 7) {
      await this.trainer.adjustProgram(programId, { volume: 'slight_increase' });
    }

    if (day === 7 || day === 14) {
      await this.trainer.reviewAnalytics(this.client.id);
    }

    return {
      day,
      isWorkoutDay,
      setsLogged,
      messagesExchanged: messages.length,
      prs: prsToday
    };
  }

  private getWorkoutType(day: number): 'upper_push' | 'upper_pull' | 'lower' {
    const types: ('upper_push' | 'upper_pull' | 'upper_push' | 'lower')[] = ['upper_push', 'upper_pull', 'upper_push', 'lower'];
    const index = WORKOUT_DAYS.indexOf(day) % 4;
    return types[index];
  }
}
