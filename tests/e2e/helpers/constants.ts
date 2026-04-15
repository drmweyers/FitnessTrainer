/**
 * E2E Test Constants
 * Centralized configuration for all E2E tests
 */

// Dual-environment: localhost for dev, production for final verification
// Production URL: https://evofittrainer-six.vercel.app
// Note: trainer.evofit.io DNS points to a different project — use the Vercel URL for production E2E
export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export const TEST_ACCOUNTS = {
  trainer: {
    email: 'qa-trainer@evofit.io',
    password: 'QaTest2026!',
    name: 'QA Trainer',
    role: 'trainer',
  },
  admin: {
    email: 'qa-admin@evofit.io',
    password: 'QaTest2026!',
    name: 'QA Admin',
    role: 'admin',
  },
  client: {
    email: 'qa-client@evofit.io',
    password: 'QaTest2026!',
    name: 'QA Client',
    role: 'client',
  },
  client2: {
    email: 'qa-client2@evofit.io',
    password: 'QaTest2026!',
    name: 'QA Client 2',
    role: 'client',
  },
  // Tier-locked accounts — one per subscription level
  starter: {
    email: 'qa-starter@evofit.io',
    password: 'QaTest2026!',
    name: 'QA Starter Trainer',
    role: 'trainer',
  },
  professional: {
    email: 'qa-professional@evofit.io',
    password: 'QaTest2026!',
    name: 'QA Professional Trainer',
    role: 'trainer',
  },
  enterprise: {
    email: 'qa-enterprise@evofit.io',
    password: 'QaTest2026!',
    name: 'QA Enterprise Trainer',
    role: 'trainer',
  },
  // Legacy accounts (still in production DB)
  legacyTrainer: {
    email: 'coach.sarah@evofittrainer.com',
    password: 'Demo1234!',
    name: 'Sarah Johnson',
    role: 'trainer',
  },
  legacyAdmin: {
    email: 'admin@evofittrainer.com',
    password: 'Demo1234!',
    name: 'Admin User',
    role: 'admin',
  },
  legacyClient: {
    email: 'alex.johnson@example.com',
    password: 'Demo1234!',
    name: 'Alex Johnson',
    role: 'client',
  },
} as const;

export const ROUTES = {
  // Public
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',

  // Dashboards
  dashboard: '/dashboard',
  trainerDashboard: '/dashboard/trainer',
  clientDashboard: '/dashboard/client',
  adminDashboard: '/admin',

  // Client Management
  clients: '/clients',
  clientDetail: (id: string) => `/clients/${id}`,
  clientPrograms: (id: string) => `/clients/${id}/programs`,
  clientHistory: (id: string) => `/clients/${id}/history`,

  // Exercises
  exercises: '/dashboard/exercises',
  exercisesPublic: '/exercises',
  exerciseDetail: (id: string) => `/dashboard/exercises/${id}`,
  exerciseFavorites: '/dashboard/exercises/favorites',
  exerciseCollection: (id: string) => `/dashboard/exercises/collections/${id}`,

  // Programs
  programs: '/programs',
  programsNew: '/programs/new',
  programDetail: (id: string) => `/programs/${id}`,

  // Workouts
  workouts: '/workouts',
  workoutDetail: (id: string) => `/workouts/${id}`,
  workoutsHistory: '/workouts/history',
  workoutsBuilder: '/workouts/builder',
  workoutsLog: '/workouts/log',
  workoutsProgress: '/workouts/progress',
  workoutTracker: '/workout-tracker',

  // Analytics
  analytics: '/analytics',

  // Schedule
  schedule: '/schedule',
  scheduleAvailability: '/schedule/availability',

  // Profile
  profile: '/profile',
  profileEdit: '/profile/edit',
  profileHealth: '/profile/health',

  // Admin
  adminUsers: '/admin/users',
  adminUserDetail: (id: string) => `/admin/users/${id}`,
  adminSystem: '/admin/system',
} as const;

export const TIMEOUTS = {
  pageLoad: 30000,
  element: 10000,
  networkIdle: 15000,
  animation: 2000,
  apiCall: 5000,
} as const;

export const SCREENSHOT_DIR = 'tests/e2e/screenshots';

// API endpoints for test setup
export const API = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  me: '/api/auth/me',
  profileMe: '/api/profiles/me',
  profileHealth: '/api/profiles/health',
  clients: '/api/clients',
  clientsBulk: '/api/clients/bulk',
  exercises: '/api/exercises',
  exerciseSearch: '/api/exercises/search',
  exerciseFavorites: '/api/exercises/favorites',
  exerciseFavoritesExport: '/api/exercises/favorites/export',
  exerciseCollections: '/api/exercises/collections',
  exerciseAlternatives: '/api/exercises/alternatives',
  exerciseRecent: '/api/exercises/recent',
  programs: '/api/programs',
  programTemplates: '/api/programs/templates',
  workouts: '/api/workouts',
  workoutsActive: '/api/workouts/active',
  workoutsHistory: '/api/workouts/history',
  analyticsGoals: '/api/analytics/goals',
  analyticsMeasurements: '/api/analytics/measurements',
  analyticsPerformance: '/api/analytics/performance',
  analyticsTrainingLoad: '/api/analytics/training-load',
  analyticsReports: '/api/analytics/reports',
  personalBests: '/api/analytics/personal-bests',
  milestones: '/api/analytics/milestones',
  scheduleAppointments: '/api/schedule/appointments',
  scheduleAvailability: '/api/schedule/availability',
  scheduleSlots: '/api/schedule/slots',
  scheduleExportIcs: '/api/schedule/export/ics',
  adminUsers: '/api/admin/users',
  adminFeatureFlags: '/api/admin/feature-flags',
  adminActivity: '/api/admin/activity',
  adminDashboard: '/api/admin/dashboard',
  systemHealth: '/api/admin/system/health',
  supportTickets: '/api/support/tickets',
  reports: '/api/reports',
  notifications: '/api/notifications/subscribe',
  notificationsSend: '/api/notifications/send',
  progressionSuggestions: '/api/progression/suggestions',
  dashboardStats: '/api/dashboard/stats',
  certifications: '/api/profiles/certifications',
  certificationsExpiring: '/api/profiles/certifications/expiring',
} as const;
