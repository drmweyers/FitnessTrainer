/**
 * Tests for frontend exercise service (services/exerciseService.ts)
 */

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

import {
  loadExercises,
  getFilterOptions,
  getExerciseById,
  searchExercises,
  getExercisesByIds,
  getExercisesByBodyPart,
  getExercisesByEquipment,
  getRandomExercises,
} from '@/services/exerciseService';

const backendExercise = {
  id: 'ex-1',
  exerciseId: 'ex_001',
  name: 'Bench Press',
  gifUrl: 'bench.gif',
  targetMuscle: 'pectorals',
  bodyPart: 'chest',
  equipment: 'barbell',
  secondaryMuscles: ['triceps'],
  instructions: ['Step 1'],
  difficulty: 'intermediate',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('loadExercises', () => {
  beforeEach(() => mockFetch.mockReset());

  it('loads and transforms exercises', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        exercises: [backendExercise],
      }),
    });

    const result = await loadExercises();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bench Press');
    expect(result[0].targetMuscles).toEqual(['pectorals']);
    expect(result[0].bodyParts).toEqual(['chest']);
    expect(result[0].equipments).toEqual(['barbell']);
    expect(result[0].isFavorited).toBe(false);
    expect(result[0].usageCount).toBe(0);
    expect(result[0].collections).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/exercises?limit=1324'));
  });

  it('returns empty array on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Server Error',
    });

    const result = await loadExercises();

    expect(result).toEqual([]);
  });

  it('returns empty array when API returns error', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ error: true, message: 'Something went wrong' }),
    });

    const result = await loadExercises();

    expect(result).toEqual([]);
  });

  it('returns empty array on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await loadExercises();

    expect(result).toEqual([]);
  });
});

describe('getFilterOptions', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns filter options from API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        bodyParts: ['chest', 'back'],
        equipments: ['barbell'],
        targetMuscles: ['pectorals'],
      }),
    });

    const result = await getFilterOptions();

    expect(result.bodyParts).toEqual(['chest', 'back']);
    expect(result.equipments).toEqual(['barbell']);
    expect(result.targetMuscles).toEqual(['pectorals']);
    expect(result.secondaryMuscles).toEqual([]);
  });

  it('returns empty arrays on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Error',
    });

    const result = await getFilterOptions();

    expect(result).toEqual({
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
      secondaryMuscles: [],
    });
  });

  it('handles missing fields in response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await getFilterOptions();

    expect(result.bodyParts).toEqual([]);
    expect(result.equipments).toEqual([]);
    expect(result.targetMuscles).toEqual([]);
  });

  it('returns empty arrays on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await getFilterOptions();

    expect(result.bodyParts).toEqual([]);
  });
});

describe('getExerciseById', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns transformed exercise', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => (backendExercise),
    });

    const result = await getExerciseById('ex-1');

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Bench Press');
    expect(result!.targetMuscles).toEqual(['pectorals']);
  });

  it('returns null for 404', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await getExerciseById('nonexistent');

    expect(result).toBeNull();
  });

  it('returns null on server error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });

    const result = await getExerciseById('ex-1');

    expect(result).toBeNull();
  });

  it('returns null when API returns error', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ error: true, message: 'Error' }),
    });

    const result = await getExerciseById('ex-1');

    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await getExerciseById('ex-1');

    expect(result).toBeNull();
  });
});

describe('searchExercises', () => {
  beforeEach(() => mockFetch.mockReset());

  it('sends correct query parameters', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        exercises: [backendExercise],
        pagination: { total: 1, page: 1, totalPages: 1, hasMore: false },
      }),
    });

    const result = await searchExercises(
      {
        search: 'bench',
        bodyParts: ['chest'],
        equipments: ['barbell'],
        targetMuscles: ['pectorals'],
        difficulty: 'intermediate',
      },
      2,
      15
    );

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('search=bench');
    expect(url).toContain('bodyPart=chest');
    expect(url).toContain('equipment=barbell');
    expect(url).toContain('targetMuscle=pectorals');
    expect(url).toContain('difficulty=intermediate');
    expect(url).toContain('limit=15');
    expect(result.exercises).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.hasNextPage).toBe(false);
  });

  it('skips empty filter arrays', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        exercises: [],
        pagination: { total: 0, page: 1, totalPages: 0, hasMore: false },
      }),
    });

    await searchExercises({
      search: '',
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
    });

    const url = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('bodyPart=');
    expect(url).not.toContain('equipment=');
    expect(url).not.toContain('targetMuscle=');
    expect(url).not.toContain('search=');
  });

  it('joins multiple filter values with comma', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        exercises: [],
        pagination: { total: 0, page: 1, totalPages: 0, hasMore: false },
      }),
    });

    await searchExercises({
      search: '',
      bodyParts: ['chest', 'back'],
      equipments: [],
      targetMuscles: [],
    });

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('bodyPart=chest%2Cback');
  });

  it('returns empty result on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Error',
    });

    const result = await searchExercises({
      search: 'test',
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
    });

    expect(result.exercises).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.hasNextPage).toBe(false);
  });

  it('returns empty result on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await searchExercises({
      search: 'test',
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
    });

    expect(result.exercises).toEqual([]);
  });
});

describe('getExercisesByIds', () => {
  beforeEach(() => mockFetch.mockReset());

  it('fetches multiple exercises by ID', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => (backendExercise),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...backendExercise, id: 'ex-2', name: 'Squat' }),
      });

    const result = await getExercisesByIds(['ex-1', 'ex-2']);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Bench Press');
    expect(result[1].name).toBe('Squat');
  });

  it('filters out null results', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => (backendExercise),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

    const result = await getExercisesByIds(['ex-1', 'nonexistent']);

    expect(result).toHaveLength(1);
  });
});

describe('getExercisesByBodyPart', () => {
  beforeEach(() => mockFetch.mockReset());

  it('fetches exercises by body part', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        exercises: [backendExercise],
        pagination: { total: 1, page: 1, totalPages: 1, hasMore: false },
      }),
    });

    const result = await getExercisesByBodyPart('chest');

    expect(result).toHaveLength(1);
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('bodyPart=chest');
  });
});

describe('getExercisesByEquipment', () => {
  beforeEach(() => mockFetch.mockReset());

  it('fetches exercises by equipment', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        exercises: [backendExercise],
        pagination: { total: 1, page: 1, totalPages: 1, hasMore: false },
      }),
    });

    const result = await getExercisesByEquipment('barbell');

    expect(result).toHaveLength(1);
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('equipment=barbell');
  });
});

describe('getRandomExercises', () => {
  beforeEach(() => mockFetch.mockReset());

  it('fetches random exercises', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        exercises: [backendExercise],
        pagination: { total: 1, page: 1, totalPages: 1, hasMore: false },
      }),
    });

    const result = await getRandomExercises(3);

    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalled();
  });
});
