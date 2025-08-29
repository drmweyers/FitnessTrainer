// Epic 007: Progress Analytics Types

export interface BodyMeasurement {
  id?: string;
  userId: string;
  measurementDate: string;
  weight?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    biceps?: number;
    thighs?: number;
    neck?: number;
    shoulders?: number;
    forearms?: number;
    calves?: number;
  };
  notes?: string;
  photos?: string[];
  createdAt?: string;
}

export interface PerformanceMetric {
  id?: string;
  userId: string;
  exerciseId?: string;
  metricType: 'one_rm' | 'volume' | 'endurance' | 'power' | 'speed' | 'body_weight' | 'body_fat' | 'muscle_mass';
  value: number;
  unit: string;
  recordedAt: string;
  workoutLogId?: string;
  notes?: string;
}

export interface TrainingLoad {
  id?: string;
  userId: string;
  weekStartDate: string;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  trainingDays: number;
  averageIntensity?: number;
  bodyPartDistribution?: {
    [bodyPart: string]: number;
  };
  acuteLoad: number; // 7-day rolling average
  chronicLoad: number; // 28-day rolling average
  loadRatio: number; // acute:chronic ratio
  calculatedAt: string;
}

export interface GoalProgress {
  id?: string;
  goalId: string;
  recordedDate: string;
  currentValue: number;
  percentageComplete: number;
  notes?: string;
  createdAt: string;
}

export interface UserInsight {
  id?: string;
  userId: string;
  insightType: string;
  title: string;
  description: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  actionTaken: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface MilestoneAchievement {
  id?: string;
  userId: string;
  milestoneType: string;
  title: string;
  description: string;
  achievedValue?: number;
  achievedAt: string;
}

export interface ChartPreference {
  id?: string;
  userId: string;
  chartType: string;
  preferences: {
    colors?: string[];
    timeRange?: string;
    displayOptions?: {
      showGrid?: boolean;
      showLegend?: boolean;
      showTrendLine?: boolean;
    };
  };
  isDefault: boolean;
}

export interface ComparisonBaseline {
  id?: string;
  userId: string;
  baselineName: string;
  baselineDate: string;
  measurements?: BodyMeasurement['measurements'];
  performanceData?: {
    [exerciseId: string]: {
      maxWeight: number;
      maxReps: number;
      volume: number;
    };
  };
  isActive: boolean;
  createdAt: string;
}

export interface AnalyticsReport {
  id?: string;
  userId: string;
  trainerId?: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  reportData: {
    summary: {
      totalWorkouts: number;
      adherenceRate: number;
      averageRating: number;
      strengthGains: number;
    };
    charts: {
      weightProgress: Array<{ date: string; value: number }>;
      strengthProgress: Array<{ exercise: string; improvement: number }>;
      bodyComposition: Array<{ date: string; bodyFat: number; muscleMass: number }>;
    };
    insights: UserInsight[];
    milestones: MilestoneAchievement[];
  };
  fileUrl?: string;
  generatedAt: string;
}

// Dashboard data interfaces
export interface AnalyticsDashboardData {
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
  };
  summary: {
    totalWorkouts: number;
    thisWeekWorkouts: number;
    currentStreak: number;
    adherenceRate: number;
    totalVolume: number;
    strengthGains: number;
  };
  currentMeasurements?: BodyMeasurement;
  recentInsights: UserInsight[];
  upcomingMilestones: Array<{
    type: string;
    title: string;
    progress: number;
    target: number;
    estimatedDate?: string;
  }>;
  chartData: {
    weightProgress: Array<{ date: string; weight: number; bodyFat?: number }>;
    strengthProgress: Array<{ exercise: string; data: Array<{ date: string; maxWeight: number }> }>;
    volumeProgression: Array<{ date: string; volume: number }>;
    trainingLoad: Array<{ week: string; acuteLoad: number; chronicLoad: number; ratio: number }>;
  };
}

// Chart component props
export interface ProgressChartProps {
  data: Array<{ date: string; value: number; label?: string }>;
  title: string;
  unit: string;
  height?: number;
  showTrendLine?: boolean;
  color?: string;
  timeRange?: '7d' | '30d' | '3m' | '6m' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '3m' | '6m' | '1y') => void;
}

export interface MultiLineChartProps {
  data: Array<{
    name: string;
    data: Array<{ date: string; value: number }>;
    color: string;
  }>;
  title: string;
  height?: number;
  yAxisLabel?: string;
  showLegend?: boolean;
}

export interface BodyCompositionChartProps {
  data: Array<{
    date: string;
    weight: number;
    bodyFat?: number;
    muscleMass?: number;
  }>;
  height?: number;
}

// Measurement tracking interfaces
export interface MeasurementSession {
  date: string;
  measurements: BodyMeasurement['measurements'];
  weight?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  photos?: File[];
  notes?: string;
}

export interface MeasurementTrackerProps {
  userId: string;
  onSave: (measurement: BodyMeasurement) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<BodyMeasurement>;
}

// Analytics service interfaces
export interface AnalyticsService {
  // Body measurements
  getBodyMeasurements(userId: string, timeRange?: string): Promise<BodyMeasurement[]>;
  saveBodyMeasurement(measurement: BodyMeasurement): Promise<BodyMeasurement>;
  
  // Performance metrics
  getPerformanceMetrics(userId: string, exerciseId?: string): Promise<PerformanceMetric[]>;
  calculatePersonalBests(userId: string): Promise<Array<{ exercise: string; metric: string; value: number; date: string }>>;
  
  // Training load
  getTrainingLoad(userId: string, weekCount?: number): Promise<TrainingLoad[]>;
  calculateWeeklyLoad(userId: string, weekStartDate: string): Promise<TrainingLoad>;
  
  // Goal progress
  getGoalProgress(goalId: string): Promise<GoalProgress[]>;
  updateGoalProgress(goalId: string, currentValue: number): Promise<GoalProgress>;
  
  // Insights
  getUserInsights(userId: string, unreadOnly?: boolean): Promise<UserInsight[]>;
  markInsightAsRead(insightId: string): Promise<void>;
  markInsightActionTaken(insightId: string): Promise<void>;
  
  // Reports
  generateProgressReport(userId: string, reportType: string, dateRange: { start: string; end: string }): Promise<AnalyticsReport>;
  getAnalyticsReports(userId: string): Promise<AnalyticsReport[]>;
  
  // Dashboard
  getDashboardData(userId: string): Promise<AnalyticsDashboardData>;
}

// Constants
export const MEASUREMENT_TYPES = {
  WEIGHT: 'weight',
  BODY_FAT: 'body_fat_percentage',
  MUSCLE_MASS: 'muscle_mass',
  CHEST: 'chest',
  WAIST: 'waist',
  HIPS: 'hips',
  BICEPS: 'biceps',
  THIGHS: 'thighs',
} as const;

export const METRIC_TYPES = {
  ONE_RM: 'one_rm',
  VOLUME: 'volume',
  ENDURANCE: 'endurance',
  POWER: 'power',
  SPEED: 'speed',
  BODY_WEIGHT: 'body_weight',
  BODY_FAT: 'body_fat',
  MUSCLE_MASS: 'muscle_mass',
} as const;

export const TIME_RANGES = {
  WEEK: '7d',
  MONTH: '30d',
  QUARTER: '3m',
  HALF_YEAR: '6m',
  YEAR: '1y',
} as const;

export const INSIGHT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;