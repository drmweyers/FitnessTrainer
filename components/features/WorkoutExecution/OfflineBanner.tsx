'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

type BannerState = 'online' | 'offline' | 'syncing';

/**
 * OfflineBanner component.
 *
 * - Hidden when online.
 * - Shows an amber warning banner when navigator.onLine is false.
 * - Shows a green "Back online — syncing..." banner briefly after reconnecting.
 */
const OfflineBanner: React.FC = () => {
  const [state, setState] = useState<BannerState>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online'
  );

  useEffect(() => {
    function handleOnline() {
      setState('syncing');
      // Revert to hidden after 3s
      const t = setTimeout(() => setState('online'), 3000);
      return () => clearTimeout(t);
    }

    function handleOffline() {
      setState('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (state === 'online') return null;

  if (state === 'offline') {
    return (
      <div
        role="alert"
        className="offline-banner w-full px-4 py-2 bg-amber-100 border-b border-amber-300 text-amber-800 flex items-center space-x-2 text-sm"
      >
        <WifiOff className="h-4 w-4 flex-shrink-0" />
        <span>
          <strong>You&apos;re offline</strong> — workouts will sync when you reconnect
        </span>
      </div>
    );
  }

  // syncing state
  return (
    <div
      role="alert"
      className="online-sync-banner w-full px-4 py-2 bg-green-100 border-b border-green-300 text-green-800 flex items-center space-x-2 text-sm"
    >
      <Wifi className="h-4 w-4 flex-shrink-0" />
      <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin" />
      <span>Back online — syncing your workouts...</span>
    </div>
  );
};

export default OfflineBanner;
