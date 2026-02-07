/**
 * Shared test utilities for EvoFitTrainer unit tests.
 * Import these in any test file for common mocks and helpers.
 */

import { NextRequest } from 'next/server';

// ─── Test User Fixtures ───

export const mockAdminUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  isVerified: true,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockTrainerUser = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'trainer@test.com',
  firstName: 'Trainer',
  lastName: 'User',
  role: 'TRAINER',
  isVerified: true,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockClientUser = {
  id: '00000000-0000-0000-0000-000000000003',
  email: 'client@test.com',
  firstName: 'Client',
  lastName: 'User',
  role: 'CLIENT',
  isVerified: true,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ─── Request Builders ───

export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options;

  const urlObj = new URL(url, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer mock-token',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(urlObj.toString(), requestInit);
}

// ─── Auth Mock Helpers ───

export function mockAuthenticateAs(user: any) {
  const { authenticate } = require('@/lib/middleware/auth');
  (authenticate as jest.Mock).mockResolvedValue(user);
}

export function mockAuthenticateFailure() {
  const { authenticate } = require('@/lib/middleware/auth');
  (authenticate as jest.Mock).mockResolvedValue(null);
}

// ─── Response Helpers ───

export async function parseJsonResponse(response: Response) {
  const json = await response.json();
  return { status: response.status, body: json };
}

// ─── Exercise Fixtures ───

export const mockExercise = {
  id: '00000000-0000-0000-0000-000000000010',
  exerciseId: 'ex_001',
  name: 'Bench Press',
  gifUrl: 'bench-press.gif',
  bodyPart: 'chest',
  equipment: 'barbell',
  targetMuscle: 'pectorals',
  secondaryMuscles: ['triceps', 'anterior deltoid'],
  instructions: ['Lie on bench', 'Lower bar to chest', 'Push up'],
  difficulty: 'intermediate',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ─── Program Fixtures ───

export const mockProgram = {
  id: '00000000-0000-0000-0000-000000000020',
  name: 'Beginner Strength',
  description: 'A basic strength program',
  trainerId: mockTrainerUser.id,
  difficulty: 'beginner',
  durationWeeks: 4,
  isTemplate: false,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ─── Workout Fixtures ───

export const mockWorkoutSession = {
  id: '00000000-0000-0000-0000-000000000030',
  userId: mockClientUser.id,
  workoutId: '00000000-0000-0000-0000-000000000031',
  status: 'in_progress',
  scheduledDate: new Date('2024-06-01'),
  startedAt: new Date('2024-06-01T10:00:00'),
  completedAt: null,
  duration: null,
  notes: null,
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
};

// ─── Activity Fixtures ───

export const mockActivity = {
  id: '00000000-0000-0000-0000-000000000040',
  userId: mockClientUser.id,
  type: 'workout_completed',
  title: 'Completed Bench Press Day',
  description: 'Finished workout session',
  relatedId: mockWorkoutSession.id,
  relatedType: 'workout',
  metadata: {},
  createdAt: new Date('2024-06-01'),
};

// ─── Measurement Fixtures ───

export const mockMeasurement = {
  id: '00000000-0000-0000-0000-000000000050',
  userId: mockClientUser.id,
  height: 180,
  weight: 80,
  bodyFatPercentage: 15,
  muscleMass: 35,
  measurements: { chest: 100, waist: 80, hips: 95 },
  recordedAt: new Date('2024-06-01'),
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
};
