'use client';
import { useState, useCallback, useEffect } from 'react';
import { addToWorkoutQueue, getWorkoutQueue } from '@/lib/offline/indexedDB';
import { syncOfflineData } from '@/lib/offline/syncManager';

export function useOfflineQueue() {
  const [queueLength, setQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshQueueLength = useCallback(async () => {
    try {
      const queue = await getWorkoutQueue();
      setQueueLength(queue.length);
    } catch {
      // IndexedDB not available
    }
  }, []);

  useEffect(() => {
    refreshQueueLength();
  }, [refreshQueueLength]);

  const addToQueue = useCallback(async (action: string, data: any) => {
    await addToWorkoutQueue(action, data);
    await refreshQueueLength();
  }, [refreshQueueLength]);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncOfflineData();
      await refreshQueueLength();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [refreshQueueLength]);

  return { queueLength, isSyncing, addToQueue, sync };
}
