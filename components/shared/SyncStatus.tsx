'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { RefreshCw, Cloud, Loader2 } from 'lucide-react';

const LAST_SYNC_KEY = 'evofit-last-sync';

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SyncStatus() {
  const { queueLength, isSyncing, sync } = useOfflineQueue();
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [lastSyncDisplay, setLastSyncDisplay] = useState<string>('');

  // Load last sync time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) {
      setLastSyncTime(parseInt(stored, 10));
    }
  }, []);

  // Update relative time display every 30 seconds
  useEffect(() => {
    if (!lastSyncTime) return;
    setLastSyncDisplay(getRelativeTime(lastSyncTime));
    const interval = setInterval(() => {
      setLastSyncDisplay(getRelativeTime(lastSyncTime));
    }, 30000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  const handleSync = useCallback(async () => {
    await sync();
    const now = Date.now();
    localStorage.setItem(LAST_SYNC_KEY, String(now));
    setLastSyncTime(now);
  }, [sync]);

  // Render nothing when queue is empty and no recent sync
  if (queueLength === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40" data-testid="sync-status">
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 flex items-center gap-3">
        {isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" data-testid="sync-spinner" />
            <span className="text-sm text-gray-600">Syncing...</span>
          </>
        ) : (
          <>
            <div className="relative">
              <Cloud className="w-5 h-5 text-blue-600" />
              <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center" data-testid="sync-count">
                {queueLength}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">
                {queueLength} pending
              </span>
              {lastSyncDisplay && (
                <span className="text-xs text-gray-400" data-testid="last-sync-time">
                  Last synced: {lastSyncDisplay}
                </span>
              )}
            </div>
            <button
              onClick={handleSync}
              className="ml-2 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
              data-testid="sync-now-button"
            >
              <RefreshCw className="w-3 h-3" />
              Sync Now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
