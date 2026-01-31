// Dashboard related types and interfaces

export interface DashboardStatCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

export interface ActivityFeedItem {
  id: string;
  type: 'client_signup' | 'workout_completed' | 'program_assigned' | 'milestone_reached' | 'system_event';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  badge?: string;
}

// Admin Dashboard Types
export interface SystemMetrics {
  totalUsers: number;
  totalTrainers: number;
  totalClients: number;
  totalPrograms: number;
  activeWorkouts: number;
  revenue: {
    monthly: number;
    yearly: number;
    change: number;
  };
  systemHealth: {
    status: 'excellent' | 'good' | 'warning' | 'critical';
    uptime: string;
    lastBackup: string;
  };
}

export interface UserGrowthData {
  date: string;
  totalUsers: number;
  newSignups: number;
  trainers: number;
  clients: number;
}

export interface RecentSignup {
  id: string;
  name: string;
  email: string;
  role: 'trainer' | 'client';
  signupDate: string;
  status: 'pending' | 'active' | 'inactive';
}

// Trainer Dashboard Types
export interface ClientOverview {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  newThisMonth: number;
}

export interface ProgramStats {
  totalPrograms: number;
  assignedPrograms: number;
  completionRate: number;
  averageRating: number;
}

export interface UpcomingSession {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  type: 'workout' | 'consultation' | 'check-in';
  status: 'scheduled' | 'confirmed' | 'pending';
}

export interface ClientProgress {
  clientId: string;
  clientName: string;
  avatar?: string;
  currentProgram: string;
  progressPercentage: number;
  lastWorkout: string;
  streak: number;
}

// Client Dashboard Types
export interface TodaysWorkout {
  id: string;
  name: string;
  programName: string;
  exercises: number;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
}

export interface ProgressSummary {
  currentWeight?: number;
  weightGoal?: number;
  workoutStreak: number;
  totalWorkouts: number;
  personalRecords: number;
  measurements: {
    chest?: number;
    waist?: number;
    arms?: number;
    legs?: number;
  };
}

export interface ActiveProgram {
  id: string;
  name: string;
  trainerName: string;
  startDate: string;
  duration: number; // weeks
  progress: number; // percentage
  nextWorkout?: string;
}

export interface RecentWorkout {
  id: string;
  name: string;
  date: string;
  duration: number; // minutes
  exercises: number;
  rating?: number;
  notes?: string;
}

export interface UpcomingWorkout {
  id: string;
  name: string;
  date: string;
  time?: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'rest';
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ProgressChartData {
  weight?: ChartDataPoint[];
  workouts?: ChartDataPoint[];
  measurements?: {
    chest?: ChartDataPoint[];
    waist?: ChartDataPoint[];
    arms?: ChartDataPoint[];
    legs?: ChartDataPoint[];
  };
}