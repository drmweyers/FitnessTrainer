/**
 * OfflineIndicator Component
 *
 * Shows online/offline status and sync queue status.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-orange-800">
            You're offline
          </span>
          {queueCount > 0 && (
            <span className="text-xs text-orange-600">
              ({queueCount} queued)
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
