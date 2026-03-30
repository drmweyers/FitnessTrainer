/**
 * @jest-environment jsdom
 */

import {
  cacheExercises,
  getCachedExercises,
  addToWorkoutQueue,
  getWorkoutQueue,
  clearWorkoutQueue,
  clearAllOfflineData,
} from '@/lib/offline/indexedDB';

// Mock IndexedDB using a simple in-memory store
class MockIDBRequest {
  result: any = undefined;
  error: any = null;
  onsuccess: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  _resolve(result: any) {
    this.result = result;
    if (this.onsuccess) this.onsuccess({ target: this });
  }
  _reject(error: any) {
    this.error = error;
    if (this.onerror) this.onerror({ target: this });
  }
}

class MockIDBObjectStore {
  name: string;
  private _data: Map<any, any>;
  private _autoIdRef: { value: number };
  private _indexes: Map<string, string>;

  constructor(name: string, data: Map<any, any>, autoId: { value: number }) {
    this.name = name;
    this._data = data;
    this._autoIdRef = autoId; // keep reference, not copy
    this._indexes = new Map();
  }

  put(value: any) {
    const req = new MockIDBRequest();
    const key = value.id;
    this._data.set(key, value);
    Promise.resolve().then(() => req._resolve(key));
    return req;
  }

  add(value: any) {
    const req = new MockIDBRequest();
    // Auto-increment: assign numeric id using shared reference
    const id = ++this._autoIdRef.value;
    const stored = { ...value, id };
    this._data.set(id, stored);
    Promise.resolve().then(() => req._resolve(id));
    return req;
  }

  getAll() {
    const req = new MockIDBRequest();
    Promise.resolve().then(() => req._resolve(Array.from(this._data.values())));
    return req;
  }

  clear() {
    const req = new MockIDBRequest();
    this._data.clear();
    Promise.resolve().then(() => req._resolve(undefined));
    return req;
  }

  createIndex(name: string, keyPath: string) {
    this._indexes.set(name, keyPath);
    return {};
  }
}

class MockIDBTransaction {
  oncomplete: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  error: any = null;
  private _stores: Map<string, MockIDBObjectStore>;

  constructor(stores: Map<string, MockIDBObjectStore>) {
    this._stores = stores;
    // Auto-complete after current microtasks
    Promise.resolve().then(() => Promise.resolve()).then(() => Promise.resolve()).then(() => {
      if (this.oncomplete) this.oncomplete();
    });
  }

  objectStore(name: string): MockIDBObjectStore {
    const store = this._stores.get(name);
    if (!store) throw new Error(`Store ${name} not found`);
    return store;
  }

  _fail(error: any) {
    this.error = error;
    if (this.onerror) this.onerror({ target: this });
  }
}

// Central in-memory storage
const dbStores = new Map<string, Map<any, any>>();
const autoIds = new Map<string, { value: number }>();

function getOrCreateStore(name: string) {
  if (!dbStores.has(name)) dbStores.set(name, new Map());
  if (!autoIds.has(name)) autoIds.set(name, { value: 0 });
  return { data: dbStores.get(name)!, autoId: autoIds.get(name)! };
}

const mockIDBDatabase = {
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(true),
  },
  transaction: jest.fn((storeNames: string | string[], mode: string) => {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    const storeMap = new Map<string, MockIDBObjectStore>();
    names.forEach(name => {
      const { data, autoId } = getOrCreateStore(name);
      storeMap.set(name, new MockIDBObjectStore(name, data, autoId));
    });
    return new MockIDBTransaction(storeMap);
  }),
  createObjectStore: jest.fn((name: string) => {
    const { data, autoId } = getOrCreateStore(name);
    return new MockIDBObjectStore(name, data, autoId);
  }),
};

const mockOpenRequest = {
  onerror: null as any,
  onsuccess: null as any,
  onupgradeneeded: null as any,
  result: mockIDBDatabase,
};

(global as any).indexedDB = {
  open: jest.fn(() => {
    setTimeout(() => {
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess({ target: mockOpenRequest });
      }
    }, 0);
    return mockOpenRequest;
  }),
};

describe('indexedDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear all stored data between tests
    dbStores.clear();
    autoIds.clear();
    // Re-setup the mock
    (global as any).indexedDB.open.mockImplementation(() => {
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess({ target: mockOpenRequest });
        }
      }, 0);
      return mockOpenRequest;
    });
  });

  describe('cacheExercises', () => {
    it('caches an array of exercises', async () => {
      const exercises = [
        { id: 'ex-1', name: 'Squat', category: 'legs' },
        { id: 'ex-2', name: 'Bench Press', category: 'chest' },
      ];
      await cacheExercises(exercises);

      const { data } = getOrCreateStore('exercises');
      expect(data.size).toBe(2);
      expect(data.get('ex-1').data.name).toBe('Squat');
    });

    it('uses exerciseId as fallback when id not present', async () => {
      const exercises = [{ exerciseId: 'ex-10', name: 'Deadlift' }];
      await cacheExercises(exercises);

      const { data } = getOrCreateStore('exercises');
      expect(data.has('ex-10')).toBe(true);
    });

    it('stores cachedAt timestamp', async () => {
      const before = Date.now();
      await cacheExercises([{ id: 'ex-1', name: 'Squat' }]);
      const after = Date.now();

      const { data } = getOrCreateStore('exercises');
      const stored = data.get('ex-1');
      expect(stored.cachedAt).toBeGreaterThanOrEqual(before);
      expect(stored.cachedAt).toBeLessThanOrEqual(after);
    });

    it('handles empty array', async () => {
      await expect(cacheExercises([])).resolves.toBeUndefined();
    });
  });

  describe('getCachedExercises', () => {
    it('returns cached exercise data', async () => {
      const { data } = getOrCreateStore('exercises');
      data.set('ex-1', { id: 'ex-1', data: { name: 'Squat' }, cachedAt: Date.now() });

      const result = await getCachedExercises();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Squat');
    });

    it('returns empty array when no exercises cached', async () => {
      const result = await getCachedExercises();
      expect(result).toEqual([]);
    });

    it('returns the data property of each cached item', async () => {
      const { data } = getOrCreateStore('exercises');
      data.set('ex-1', { id: 'ex-1', data: { name: 'Row', reps: 10 }, cachedAt: 1000 });
      data.set('ex-2', { id: 'ex-2', data: { name: 'Press', reps: 8 }, cachedAt: 1000 });

      const result = await getCachedExercises();
      expect(result).toHaveLength(2);
      const names = result.map((r: any) => r.name).sort();
      expect(names).toEqual(['Press', 'Row']);
    });
  });

  describe('addToWorkoutQueue', () => {
    it('adds an action to the workout queue', async () => {
      await addToWorkoutQueue('workouts/complete', { workoutId: 'w-1' });

      const { data } = getOrCreateStore('workoutQueue');
      expect(data.size).toBe(1);
      const item = Array.from(data.values())[0];
      expect(item.action).toBe('workouts/complete');
      expect(item.data.workoutId).toBe('w-1');
    });

    it('stores createdAt timestamp', async () => {
      const before = Date.now();
      await addToWorkoutQueue('workouts/log', { sets: [] });
      const after = Date.now();

      const { data } = getOrCreateStore('workoutQueue');
      const item = Array.from(data.values())[0];
      expect(item.createdAt).toBeGreaterThanOrEqual(before);
      expect(item.createdAt).toBeLessThanOrEqual(after);
    });

    it('adds multiple items independently', async () => {
      await addToWorkoutQueue('action-1', { x: 1 });
      await addToWorkoutQueue('action-2', { x: 2 });

      const { data } = getOrCreateStore('workoutQueue');
      expect(data.size).toBe(2);
    });
  });

  describe('getWorkoutQueue', () => {
    it('returns all queued items', async () => {
      const { data, autoId } = getOrCreateStore('workoutQueue');
      data.set(1, { id: 1, action: 'a1', data: {}, createdAt: 1000 });
      data.set(2, { id: 2, action: 'a2', data: {}, createdAt: 2000 });

      const result = await getWorkoutQueue();
      expect(result).toHaveLength(2);
    });

    it('returns empty array when queue is empty', async () => {
      const result = await getWorkoutQueue();
      expect(result).toEqual([]);
    });
  });

  describe('clearWorkoutQueue', () => {
    it('clears all items from the queue', async () => {
      const { data } = getOrCreateStore('workoutQueue');
      data.set(1, { id: 1, action: 'test', data: {} });
      data.set(2, { id: 2, action: 'test2', data: {} });

      await clearWorkoutQueue();

      expect(data.size).toBe(0);
    });

    it('succeeds on empty queue', async () => {
      await expect(clearWorkoutQueue()).resolves.toBeUndefined();
    });
  });

  describe('clearAllOfflineData', () => {
    it('clears both exercises and workoutQueue stores', async () => {
      const { data: exerciseData } = getOrCreateStore('exercises');
      const { data: queueData } = getOrCreateStore('workoutQueue');
      exerciseData.set('e1', { id: 'e1', data: {}, cachedAt: 0 });
      queueData.set(1, { id: 1, action: 'test', data: {} });

      await clearAllOfflineData();

      expect(exerciseData.size).toBe(0);
      expect(queueData.size).toBe(0);
    });
  });
});
