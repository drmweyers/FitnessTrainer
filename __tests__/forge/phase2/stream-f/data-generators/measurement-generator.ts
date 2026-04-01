export interface BodyMeasurement {
  day: number;
  date: Date;
  weight: number;
  bodyFat: number;
  chest: number;
  waist: number;
  hips: number;
  arms: number;
  thighs: number;
}

export interface MeasurementOptions {
  startWeight: number;
  startBodyFat: number;
  measurementDays: number[];
}

const DEFAULT_STARTING_MEASUREMENTS = {
  chest: 42,
  waist: 36,
  hips: 40,
  arms: 14,
  thighs: 24
};

const CHANGE_RATES = {
  weight: { perWeek: -1.0, variance: 0.5 },
  bodyFat: { perWeek: -0.35, variance: 0.15 },
  waist: { perWeek: -0.375, variance: 0.125 },
  arms: { perWeek: 0.175, variance: 0.075 },
  chest: { perWeek: 0, variance: 0.1 },
  hips: { perWeek: -0.1, variance: 0.1 },
  thighs: { perWeek: 0.05, variance: 0.05 }
};

function calculateChange(rate: { perWeek: number; variance: number }, weeks: number): number {
  const totalChange = rate.perWeek * weeks;
  const variance = rate.variance * weeks * (Math.random() * 2 - 1);
  return totalChange + variance;
}

export function generateMeasurementSeries(options: MeasurementOptions): BodyMeasurement[] {
  const { startWeight, startBodyFat, measurementDays } = options;
  const start = DEFAULT_STARTING_MEASUREMENTS;

  return measurementDays.map(day => {
    const weeks = (day - 1) / 7;

    return {
      day,
      date: new Date(Date.now() - (14 - day) * 24 * 60 * 60 * 1000),
      weight: Math.round((startWeight + calculateChange(CHANGE_RATES.weight, weeks)) * 10) / 10,
      bodyFat: Math.round((startBodyFat + calculateChange(CHANGE_RATES.bodyFat, weeks)) * 10) / 10,
      chest: Math.round((start.chest + calculateChange(CHANGE_RATES.chest, weeks)) * 10) / 10,
      waist: Math.round((start.waist + calculateChange(CHANGE_RATES.waist, weeks)) * 10) / 10,
      hips: Math.round((start.hips + calculateChange(CHANGE_RATES.hips, weeks)) * 10) / 10,
      arms: Math.round((start.arms + calculateChange(CHANGE_RATES.arms, weeks)) * 10) / 10,
      thighs: Math.round((start.thighs + calculateChange(CHANGE_RATES.thighs, weeks)) * 10) / 10
    };
  });
}

export function generateRecoveryMetrics(day: number): {
  sleep: number;
  soreness: number;
  energy: number;
} {
  const isPostWorkout = [1, 2, 4, 5, 8, 9, 11, 12].includes(day);

  const sleep = 6.5 + Math.random() * 2;
  const soreness = isPostWorkout
    ? 3 + Math.random() * 4
    : 1 + Math.random() * 3;
  const energy = Math.min(10, Math.max(5, 10 - (soreness * 0.5) + (Math.random() * 2 - 1)));

  return {
    sleep: Math.round(sleep * 10) / 10,
    soreness: Math.round(soreness),
    energy: Math.round(energy)
  };
}
