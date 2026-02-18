/** @jest-environment node */

import { PrismaClient } from '@prisma/client';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

// Mock @prisma/client
jest.mock('@prisma/client');

import * as fs from 'fs';
import { mapExerciseData, determineDifficulty, seedExercises } from '../../scripts/seed-exercises';

// Get the mock prisma instance
const mockPrisma = new PrismaClient() as any;

describe('seed-exercises', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('determineDifficulty', () => {
    it('should return advanced for exercises with advanced keywords', () => {
      const advancedKeywords = [
        'olympic clean and press',
        'explosive push up',
        'plyometric jump squat',
        'box jump',
        'muscle-up on rings',
        'handstand push up',
        'planche hold',
        'front lever pull',
        'back lever hold',
      ];

      for (const name of advancedKeywords) {
        const exercise = {
          exerciseId: '1',
          name,
          gifUrl: 'test.gif',
          targetMuscles: ['chest'],
          bodyParts: ['upper body'],
          equipments: ['body weight'],
          secondaryMuscles: [],
          instructions: [],
        };
        expect(determineDifficulty(exercise)).toBe('advanced');
      }
    });

    it('should return beginner for exercises with beginner keywords', () => {
      const beginnerKeywords = [
        'beginner squat',
        'basic push up',
        'easy stretch',
        'wall sit',
      ];

      for (const name of beginnerKeywords) {
        const exercise = {
          exerciseId: '2',
          name,
          gifUrl: 'test.gif',
          targetMuscles: ['legs'],
          bodyParts: ['lower body'],
          equipments: ['body weight'],
          secondaryMuscles: [],
          instructions: [],
        };
        expect(determineDifficulty(exercise)).toBe('beginner');
      }
    });

    it('should return beginner for body weight static exercises', () => {
      const exercise = {
        exerciseId: '3',
        name: 'static hold',
        gifUrl: 'test.gif',
        targetMuscles: ['core'],
        bodyParts: ['waist'],
        equipments: ['body weight'],
        secondaryMuscles: [],
        instructions: [],
      };
      expect(determineDifficulty(exercise)).toBe('beginner');
    });

    it('should return intermediate as default', () => {
      const exercise = {
        exerciseId: '4',
        name: 'bench press',
        gifUrl: 'test.gif',
        targetMuscles: ['chest'],
        bodyParts: ['upper body'],
        equipments: ['barbell'],
        secondaryMuscles: ['triceps'],
        instructions: ['Step 1: Lie on bench'],
      };
      expect(determineDifficulty(exercise)).toBe('intermediate');
    });
  });

  describe('mapExerciseData', () => {
    it('should map raw JSON fields to Prisma model fields', () => {
      const raw = {
        exerciseId: 'abc123',
        name: 'Bench Press',
        gifUrl: 'abc123.gif',
        targetMuscles: ['pectorals', 'triceps'],
        bodyParts: ['chest', 'arms'],
        equipments: ['barbell', 'bench'],
        secondaryMuscles: ['anterior deltoid', 'triceps'],
        instructions: ['Step 1: Lie down', 'Step 2: Press up'],
      };

      const result = mapExerciseData(raw);

      expect(result).toEqual({
        exerciseId: 'abc123',
        name: 'Bench Press',
        gifUrl: 'abc123.gif',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        secondaryMuscles: ['anterior deltoid', 'triceps'],
        instructions: ['Step 1: Lie down', 'Step 2: Press up'],
        difficulty: 'intermediate',
        isActive: true,
      });
    });

    it('should default to "other" for missing arrays', () => {
      const raw = {
        exerciseId: 'xyz789',
        name: 'Unknown Exercise',
        gifUrl: 'xyz789.gif',
        targetMuscles: [],
        bodyParts: [],
        equipments: [],
        secondaryMuscles: [],
        instructions: [],
      };

      const result = mapExerciseData(raw);

      expect(result.bodyPart).toBe('other');
      expect(result.equipment).toBe('other');
      expect(result.targetMuscle).toBe('other');
    });

    it('should default to "other" for undefined arrays', () => {
      const raw = {
        exerciseId: 'def456',
        name: 'Partial Data Exercise',
        gifUrl: 'def456.gif',
      } as any;

      const result = mapExerciseData(raw);

      expect(result.bodyPart).toBe('other');
      expect(result.equipment).toBe('other');
      expect(result.targetMuscle).toBe('other');
      expect(result.secondaryMuscles).toEqual([]);
      expect(result.instructions).toEqual([]);
    });

    it('should assign correct difficulty based on exercise name', () => {
      const advancedExercise = {
        exerciseId: '1',
        name: 'Handstand Push Up',
        gifUrl: '1.gif',
        targetMuscles: ['shoulders'],
        bodyParts: ['upper body'],
        equipments: ['body weight'],
        secondaryMuscles: [],
        instructions: [],
      };

      const beginnerExercise = {
        exerciseId: '2',
        name: 'Basic Wall Sit',
        gifUrl: '2.gif',
        targetMuscles: ['quads'],
        bodyParts: ['legs'],
        equipments: ['body weight'],
        secondaryMuscles: [],
        instructions: [],
      };

      expect(mapExerciseData(advancedExercise).difficulty).toBe('advanced');
      expect(mapExerciseData(beginnerExercise).difficulty).toBe('beginner');
    });
  });

  describe('seedExercises', () => {
    const sampleExercises = [
      {
        exerciseId: 'ex1',
        name: 'Bench Press',
        gifUrl: 'ex1.gif',
        targetMuscles: ['pectorals'],
        bodyParts: ['chest'],
        equipments: ['barbell'],
        secondaryMuscles: ['triceps'],
        instructions: ['Lie down', 'Press up'],
      },
      {
        exerciseId: 'ex2',
        name: 'Squat',
        gifUrl: 'ex2.gif',
        targetMuscles: ['quads'],
        bodyParts: ['upper legs'],
        equipments: ['barbell'],
        secondaryMuscles: ['glutes', 'hamstrings'],
        instructions: ['Stand tall', 'Squat down'],
      },
      {
        exerciseId: 'ex3',
        name: 'Handstand Push Up',
        gifUrl: 'ex3.gif',
        targetMuscles: ['shoulders'],
        bodyParts: ['shoulders'],
        equipments: ['body weight'],
        secondaryMuscles: ['triceps'],
        instructions: ['Kick up', 'Lower down'],
      },
    ];

    beforeEach(() => {
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(sampleExercises));
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockPrisma.exercise.upsert.mockResolvedValue({});
      mockPrisma.$disconnect.mockResolvedValue(undefined);
    });

    it('should use upsert pattern for each exercise', async () => {
      const result = await seedExercises('test/path/exercises.json');

      expect(mockPrisma.exercise.upsert).toHaveBeenCalledTimes(3);

      // Check first call uses correct upsert pattern
      const firstCall = mockPrisma.exercise.upsert.mock.calls[0][0];
      expect(firstCall.where).toEqual({ exerciseId: 'ex1' });
      expect(firstCall.create).toBeDefined();
      expect(firstCall.update).toBeDefined();
      expect(firstCall.create.exerciseId).toBe('ex1');
      expect(firstCall.create.name).toBe('Bench Press');
      expect(firstCall.create.bodyPart).toBe('chest');
      expect(firstCall.create.equipment).toBe('barbell');
      expect(firstCall.create.targetMuscle).toBe('pectorals');
    });

    it('should process exercises in batches of 50', async () => {
      // Create 120 exercises to test batching
      const manyExercises = Array.from({ length: 120 }, (_, i) => ({
        exerciseId: `batch-ex-${i}`,
        name: `Exercise ${i}`,
        gifUrl: `batch-ex-${i}.gif`,
        targetMuscles: ['chest'],
        bodyParts: ['upper body'],
        equipments: ['barbell'],
        secondaryMuscles: [],
        instructions: [],
      }));

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(manyExercises));

      const result = await seedExercises('test/path/exercises.json');

      // All 120 should be processed
      expect(mockPrisma.exercise.upsert).toHaveBeenCalledTimes(120);

      // Check console.log was called with batch progress messages
      const logCalls = (console.log as jest.Mock).mock.calls.map(c => c[0]);
      const batchLogs = logCalls.filter((msg: string) => typeof msg === 'string' && msg.includes('batch'));
      // 120 exercises / 50 per batch = 3 batches
      expect(batchLogs.length).toBe(3);
    });

    it('should report statistics (imported, updated, failed counts)', async () => {
      // First call: new (create path)
      mockPrisma.exercise.upsert.mockResolvedValueOnce({ exerciseId: 'ex1', name: 'Bench Press' });
      // Second call: new
      mockPrisma.exercise.upsert.mockResolvedValueOnce({ exerciseId: 'ex2', name: 'Squat' });
      // Third call: throws error
      mockPrisma.exercise.upsert.mockRejectedValueOnce(new Error('DB connection lost'));

      const result = await seedExercises('test/path/exercises.json');

      expect(result.total).toBe(3);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should handle missing/malformed exercise data gracefully', async () => {
      const malformedExercises = [
        {
          exerciseId: 'good1',
          name: 'Good Exercise',
          gifUrl: 'good1.gif',
          targetMuscles: ['chest'],
          bodyParts: ['upper body'],
          equipments: ['barbell'],
          secondaryMuscles: ['triceps'],
          instructions: ['Step 1'],
        },
        {
          // Missing arrays - should default to 'other'
          exerciseId: 'partial1',
          name: 'Partial Exercise',
          gifUrl: 'partial1.gif',
        },
        {
          // Empty arrays - should default to 'other'
          exerciseId: 'empty1',
          name: 'Empty Arrays Exercise',
          gifUrl: 'empty1.gif',
          targetMuscles: [],
          bodyParts: [],
          equipments: [],
          secondaryMuscles: [],
          instructions: [],
        },
      ];

      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(malformedExercises));
      mockPrisma.exercise.upsert.mockResolvedValue({});

      const result = await seedExercises('test/path/exercises.json');

      expect(result.succeeded).toBe(3);
      expect(result.failed).toBe(0);

      // Check that partial exercise was mapped with defaults
      const partialCall = mockPrisma.exercise.upsert.mock.calls[1][0];
      expect(partialCall.create.bodyPart).toBe('other');
      expect(partialCall.create.equipment).toBe('other');
      expect(partialCall.create.targetMuscle).toBe('other');
    });

    it('should read from the specified data path', async () => {
      const customPath = '/custom/path/to/exercises.json';
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await seedExercises(customPath);

      expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf-8');
    });

    it('should disconnect prisma when done', async () => {
      await seedExercises('test/path/exercises.json');
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it('should disconnect prisma even on error', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(seedExercises('test/path/exercises.json')).rejects.toThrow('File not found');
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });
});
