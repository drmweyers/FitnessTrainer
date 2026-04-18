export interface WorkoutSummary {
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  totalDurationMinutes: number;
  totalVolume: number;
  averageRpe: number;
}

export interface MeasurementDelta {
  start: number | null;
  end: number | null;
  delta: number;
  direction: 'up' | 'down' | 'unchanged';
}

export interface MeasurementDeltas {
  weight: MeasurementDelta;
  bodyFat: MeasurementDelta;
  muscleMass: MeasurementDelta;
}

export interface GoalProgressItem {
  type: string;
  specific: string | null;
  target: number | null;
  percentage: number;
  currentValue: number | null;
}

export interface PdfTemplateData {
  sections: string[];
  clientName: string;
  trainerName: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  summary: WorkoutSummary;
  measurementDeltas: MeasurementDeltas;
  measurements: Array<{ date: string; weight: number | null; bodyFat: number | null; muscleMass: number | null }>;
  bodyCompositionBars: Array<{ label: string; weightHeight: number; bodyFatHeight: number }>;
  trainingLoadData: Array<{ week: string; acuteHeight: number; chronicHeight: number; ratioValue: number }>;
  goals: GoalProgressItem[];
  performanceMetrics: Array<{ type: string; value: number; unit: string; date: string }>;
}

export function computeWorkoutSummary(sessions: any[]): WorkoutSummary {
  if (sessions.length === 0) {
    return { totalWorkouts: 0, completedWorkouts: 0, completionRate: 0, totalDurationMinutes: 0, totalVolume: 0, averageRpe: 0 };
  }

  const completed = sessions.filter(s => s.status === 'completed');
  const totalDuration = completed.reduce((sum, s) => sum + (Number(s.totalDuration) || 0), 0);
  const totalVolume = completed.reduce((sum, s) => sum + (Number(s.totalVolume) || 0), 0);
  const avgRpe = completed.length > 0
    ? completed.reduce((sum, s) => sum + (Number(s.averageRpe) || 0), 0) / completed.length
    : 0;

  return {
    totalWorkouts: sessions.length,
    completedWorkouts: completed.length,
    completionRate: Math.round((completed.length / sessions.length) * 100),
    totalDurationMinutes: totalDuration,
    totalVolume: Math.round(totalVolume * 100) / 100,
    averageRpe: Math.round(avgRpe * 10) / 10,
  };
}

function makeDelta(start: number | null, end: number | null): MeasurementDelta {
  if (start == null || end == null) {
    return { start, end, delta: 0, direction: 'unchanged' };
  }
  const delta = Math.round((end - start) * 100) / 100;
  return {
    start,
    end,
    delta,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'unchanged',
  };
}

export function formatMeasurementDeltas(measurements: any[]): MeasurementDeltas {
  if (measurements.length < 2) {
    const single = measurements[0] || {};
    return {
      weight: { start: Number(single.weight) || null, end: Number(single.weight) || null, delta: 0, direction: 'unchanged' },
      bodyFat: { start: Number(single.bodyFatPercentage) || null, end: Number(single.bodyFatPercentage) || null, delta: 0, direction: 'unchanged' },
      muscleMass: { start: Number(single.muscleMass) || null, end: Number(single.muscleMass) || null, delta: 0, direction: 'unchanged' },
    };
  }

  const first = measurements[0];
  const last = measurements[measurements.length - 1];

  return {
    weight: makeDelta(Number(first.weight) || null, Number(last.weight) || null),
    bodyFat: makeDelta(Number(first.bodyFatPercentage) || null, Number(last.bodyFatPercentage) || null),
    muscleMass: makeDelta(Number(first.muscleMass) || null, Number(last.muscleMass) || null),
  };
}

export function computeCssBarHeights(values: number[]): number[] {
  if (values.length === 0) return [];
  const max = Math.max(...values);
  if (max === 0) return values.map(() => 0);
  return values.map(v => Math.round((v / max) * 100));
}

export function computeGoalProgress(goals: any[]): GoalProgressItem[] {
  return goals.map(g => {
    const latestProgress = g.goalProgress?.[0];
    const percentage = latestProgress
      ? Math.min(100, Math.round(Number(latestProgress.percentageComplete)))
      : 0;

    return {
      type: g.goalType,
      specific: g.specificGoal || null,
      target: g.targetValue ? Number(g.targetValue) : null,
      percentage,
      currentValue: latestProgress ? Number(latestProgress.currentValue) : null,
    };
  });
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(start)} — ${fmt(end)}`;
}

export function transformForTemplate(params: {
  sections: string[];
  clientName: string;
  trainerName: string;
  startDate: string;
  endDate: string;
  workoutSessions: any[];
  measurements: any[];
  trainingLoads: any[];
  goals: any[];
  performanceMetrics: any[];
}): PdfTemplateData {
  const summary = computeWorkoutSummary(params.workoutSessions);
  const measurementDeltas = formatMeasurementDeltas(params.measurements);

  const formattedMeasurements = params.measurements.map(m => ({
    date: new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight ? Number(m.weight) : null,
    bodyFat: m.bodyFatPercentage ? Number(m.bodyFatPercentage) : null,
    muscleMass: m.muscleMass ? Number(m.muscleMass) : null,
  }));

  const volumeValues = params.trainingLoads.map(tl => Number(tl.acuteLoad) || 0);
  const chronicValues = params.trainingLoads.map(tl => Number(tl.chronicLoad) || 0);
  const allLoadValues = [...volumeValues, ...chronicValues];
  const maxLoad = allLoadValues.length > 0 ? Math.max(...allLoadValues) : 1;

  const trainingLoadData = params.trainingLoads.map(tl => ({
    week: new Date(tl.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    acuteHeight: maxLoad > 0 ? Math.round((Number(tl.acuteLoad) / maxLoad) * 100) : 0,
    chronicHeight: maxLoad > 0 ? Math.round((Number(tl.chronicLoad) / maxLoad) * 100) : 0,
    ratioValue: Math.round(Number(tl.loadRatio) * 100) / 100,
  }));

  const weightValues = params.measurements.map(m => Number(m.weight) || 0);
  const bodyFatValues = params.measurements.map(m => Number(m.bodyFatPercentage) || 0);
  const weightHeights = computeCssBarHeights(weightValues);
  const bodyFatHeights = computeCssBarHeights(bodyFatValues);

  const bodyCompositionBars = params.measurements.map((m, i) => ({
    label: new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weightHeight: weightHeights[i] || 0,
    bodyFatHeight: bodyFatHeights[i] || 0,
  }));

  return {
    sections: params.sections,
    clientName: params.clientName,
    trainerName: params.trainerName,
    dateRange: formatDateRange(params.startDate, params.endDate),
    startDate: params.startDate,
    endDate: params.endDate,
    generatedAt: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    summary,
    measurementDeltas,
    measurements: formattedMeasurements,
    bodyCompositionBars,
    trainingLoadData,
    goals: computeGoalProgress(params.goals),
    performanceMetrics: params.performanceMetrics.map(m => ({
      type: m.metricType,
      value: Number(m.value),
      unit: m.unit,
      date: new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
  };
}
