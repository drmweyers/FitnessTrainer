import '@testing-library/jest-dom';

// Polyfill for structuredClone (required by fake-indexeddb)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Setup for Node environment (service layer tests)

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: true,
      isReady: true,
      defaultLocale: 'en',
      domainLocales: [],
      isPreview: false,
    };
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
  useParams() {
    return {};
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000/api';
process.env.NEXT_PUBLIC_APP_NAME = 'EvoFit';
process.env.NEXT_PUBLIC_ENVIRONMENT = 'test';

// Global test helpers
global.testHelper = {
  mockUser: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'trainer',
  },

  mockClient: {
    id: '1',
    name: 'Test Client',
    email: 'client@example.com',
    phone: '+1234567890',
    status: 'active',
  },

  mockExercise: {
    id: '1',
    name: 'Push-up',
    category: 'strength',
    muscle_groups: ['chest', 'triceps'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    instructions: ['Start in plank position', 'Lower body', 'Push back up'],
    gif_url: 'http://example.com/pushup.gif',
  },

  mockWorkout: {
    id: '1',
    name: 'Upper Body Strength',
    description: 'A comprehensive upper body workout',
    duration: 45,
    exercises: [
      {
        exercise_id: '1',
        sets: 3,
        reps: 10,
        rest_time: 60,
        weight: null,
      },
    ],
  },
};