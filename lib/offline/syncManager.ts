import { getWorkoutQueue, clearWorkoutQueue } from './indexedDB';

export async function syncOfflineData(): Promise<{ synced: number; failed: number }> {
  const queue = await getWorkoutQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) return { synced: 0, failed: queue.length };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await fetch(`/api/${item.action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item.data),
      });
      if (response.ok) synced++;
      else failed++;
    } catch {
      failed++;
    }
  }

  if (synced > 0) {
    await clearWorkoutQueue();
  }

  return { synced, failed };
}
