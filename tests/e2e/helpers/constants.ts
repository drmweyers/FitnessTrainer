/**
 * E2E Test Constants
 * Centralized configuration for all E2E tests
 */

export const BASE_URL = 'https://evofittrainer-six.vercel.app';

export const TEST_ACCOUNTS = {
  trainer: {
    email: 'coach.sarah@evofittrainer.com',
    password: 'Demo1234!',
    name: 'Sarah Johnson',
    role: 'trainer',
  },
  admin: {
    email: 'admin@evofittrainer.com',
    password: 'Demo1234!',
    name: 'Admin User',
    role: 'admin',
  },
  client: {
    email: 'alex.johnson@example.com',
    password: 'Demo1234!',
    name: 'Alex Johnson',
    role: 'client',
  },
} as const;

export const ROUTES = {
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  dashboard: '/dashboard',
  trainerDashboard: '/dashboard/trainer',
  clientDashboard: '/dashboard/client',
  adminDashboard: '/admin',
  adminUsers: '/admin/users',
  clients: '/clients',
  exercises: '/dashboard/exercises',
  exercisesPublic: '/exercises',
  programs: '/programs',
  programsNew: '/programs/new',
  workouts: '/workouts',
  workoutsHistory: '/workouts/history',
  workoutsBuilder: '/workouts/builder',
  workoutTracker: '/workout-tracker',
  analytics: '/analytics',
  schedule: '/schedule',
  scheduleAvailability: '/schedule/availability',
  profile: '/profile',
  profileEdit: '/profile/edit',
  profileHealth: '/profile/health',
} as const;

export const TIMEOUTS = {
  pageLoad: 30000,
  element: 10000,
  networkIdle: 15000,
  animation: 2000,
} as const;

export const SCREENSHOT_DIR = 'tests/e2e/screenshots';
