import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  
  disconnect() {}
  
  observe() {}
  
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  
  observe() {}
  
  unobserve() {}
  
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

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

// Console error suppression for known warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});