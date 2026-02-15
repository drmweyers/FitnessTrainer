// Simple IndexedDB wrapper for offline caching
const DB_NAME = 'evofit-offline';
const DB_VERSION = 1;

interface OfflineStore {
  exercises: { id: string; data: any; cachedAt: number };
  workoutQueue: { id: string; action: string; data: any; createdAt: number };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('exercises')) {
        db.createObjectStore('exercises', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('workoutQueue')) {
        const store = db.createObjectStore('workoutQueue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt');
      }
    };
  });
}

export async function cacheExercises(exercises: any[]): Promise<void> {
  // Store exercises in IndexedDB for offline access
  const db = await openDB();
  const tx = db.transaction('exercises', 'readwrite');
  const store = tx.objectStore('exercises');
  const now = Date.now();
  for (const exercise of exercises) {
    store.put({ id: exercise.id || exercise.exerciseId, data: exercise, cachedAt: now });
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedExercises(): Promise<any[]> {
  // Retrieve cached exercises from IndexedDB
  const db = await openDB();
  const tx = db.transaction('exercises', 'readonly');
  const store = tx.objectStore('exercises');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.map(r => r.data));
    request.onerror = () => reject(request.error);
  });
}

export async function addToWorkoutQueue(action: string, data: any): Promise<void> {
  // Queue a workout action for later sync
  const db = await openDB();
  const tx = db.transaction('workoutQueue', 'readwrite');
  const store = tx.objectStore('workoutQueue');
  store.add({ action, data, createdAt: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getWorkoutQueue(): Promise<any[]> {
  const db = await openDB();
  const tx = db.transaction('workoutQueue', 'readonly');
  const store = tx.objectStore('workoutQueue');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearWorkoutQueue(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('workoutQueue', 'readwrite');
  const store = tx.objectStore('workoutQueue');
  store.clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllOfflineData(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['exercises', 'workoutQueue'], 'readwrite');
  tx.objectStore('exercises').clear();
  tx.objectStore('workoutQueue').clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
