import { getWorkoutQueue, clearWorkoutQueue } from './indexedDB';

export interface SyncResult {
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];
const MAX_RETRIES = BACKOFF_DELAYS.length;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
      // Server error (5xx) - retry
      lastError = new Error(`Server error: ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    if (attempt < retries) {
      const backoffMs = BACKOFF_DELAYS[attempt] || BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];
      await delay(backoffMs);
    }
  }

  throw lastError || new Error('Failed after retries');
}

function isConflict(localItem: any, serverResponse: Response): boolean {
  // Last-write-wins: if server responded with 409 Conflict,
  // we check timestamps to decide
  if (serverResponse.status === 409) {
    return true;
  }
  return false;
}

async function resolveConflict(localItem: any, serverResponse: Response): Promise<'local' | 'server'> {
  // Last-write-wins conflict resolution: compare updatedAt timestamps
  try {
    const serverData = await serverResponse.clone().json();
    const serverUpdatedAt = serverData?.data?.updatedAt
      ? new Date(serverData.data.updatedAt).getTime()
      : 0;
    const localUpdatedAt = localItem.data?.updatedAt
      ? new Date(localItem.data.updatedAt).getTime()
      : localItem.createdAt || 0;

    return localUpdatedAt > serverUpdatedAt ? 'local' : 'server';
  } catch {
    // If we can't parse server data, server wins (safer default)
    return 'server';
  }
}

export async function syncOfflineData(): Promise<SyncResult> {
  const queue = await getWorkoutQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0, conflicts: 0, errors: [] };
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    return {
      synced: 0,
      failed: queue.length,
      conflicts: 0,
      errors: ['No authentication token available'],
    };
  }

  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  const errors: string[] = [];

  for (const item of queue) {
    try {
      const response = await fetchWithRetry(`/api/${item.action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item.data),
      });

      if (response.ok) {
        synced++;
      } else if (isConflict(item, response)) {
        const winner = await resolveConflict(item, response);
        if (winner === 'local') {
          // Force update with local data
          try {
            const forceResponse = await fetchWithRetry(`/api/${item.action}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Force-Overwrite': 'true',
              },
              body: JSON.stringify(item.data),
            });
            if (forceResponse.ok) {
              synced++;
            } else {
              failed++;
              errors.push(`Force sync failed for ${item.action}: ${forceResponse.status}`);
            }
          } catch (err) {
            failed++;
            errors.push(`Force sync error for ${item.action}: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else {
          // Server wins - skip local change
          conflicts++;
        }
      } else {
        failed++;
        errors.push(`Sync failed for ${item.action}: ${response.status}`);
      }
    } catch (err) {
      failed++;
      errors.push(
        `Sync error for ${item.action}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (synced > 0 || conflicts > 0) {
    await clearWorkoutQueue();
  }

  return { synced, failed, conflicts, errors };
}

// Re-export for backwards compatibility
export { getWorkoutQueue, clearWorkoutQueue } from './indexedDB';
